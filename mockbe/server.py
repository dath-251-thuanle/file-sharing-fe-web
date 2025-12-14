from flask import Flask, jsonify, request, send_file
from flask_cors import CORS

from datetime import datetime, timezone, timedelta
import uuid
import base64
import io
from werkzeug.utils import secure_filename

app = Flask(__name__)

# cors for localhost:3000 make request
CORS(
    app,
    resources={r"/api/*": {"origins": "*"}},
    supports_credentials=True,
)

# Mock "database"

# Users stored in memory:
users = {
    "jitensha@hcmut.edu.vn": {
        "id": str(uuid.uuid4()),
        "username": "jitensha",
        "email": "jitensha@hcmut.edu.vn",
        "password": "jitensha@123",
        "role": "admin",
        "totp_enabled": False,
        "totp_secret": None,
    },
    "eenose@hcmut.edu.vn": {
        "id": str(uuid.uuid4()),
        "username": "eenose",
        "email": "eenose@hcmut.edu.vn",
        "password": "eenose@123",
        "role": "user",
        "totp_enabled": True,
        "totp_secret": None,
    },
    "bigbluewhale@hcmut.edu.vn": {
        "id": str(uuid.uuid4()),
        "username": "bigbluewhale",
        "email": "bigbluewhale@hcmut.edu.vn",
        "password": "bigbluewhale@123",
        "role": "user",
        "totp_enabled": False,
        "totp_secret": None,
    },
}

# Active sessions:
# sessions[token] = email
sessions = {}

# Temp sessions waiting for TOTP:
# totp_temp_sessions[cid] = email
totp_temp_sessions = {}

# Very simple TOTP code for all users in this mock
MOCK_TOTP_CODE = "123456"


# In-memory file store for uploaded files (mock)
# files[file_id] = { id, filename, size, ownerEmail, isPublic, passwordProtected, password, availableFrom, availableTo, sharedWith, shareLink, totpEnabled }
files = {}

# Statistics
# file_stats[file_id] = { downloadCount: int, uniqueDownloaders: set(emails), lastDownloadedAt: datetime }
file_stats = {}

# Download History
# download_history[file_id] = [ { id, downloader: {username, email} | null, downloadedAt, downloadCompleted } ]
download_history = {}


# Helper functions
def create_token(prefix: str = "token") -> str:
    return f"{prefix}-{uuid.uuid4().hex}"


def get_current_user():
    """
    Read Authorization: Bearer <token> and return (token, user_dict) or (None, None)
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None, None

    token = auth_header.split(" ", 1)[1].strip()
    email = sessions.get(token)
    if not email:
        return None, None

    user = users.get(email)
    if not user:
        return None, None

    return token, user


def serialize_user(user: dict) -> dict:
    return {
        "id": user["id"],
        "username": user["username"],
        "email": user["email"],
        "role": user.get("role", "user"),
        "totpEnabled": bool(user.get("totp_enabled", False)),
    }


def get_file_status(file_meta: dict) -> str:
    """
    Determines the status of a file based on its availableFrom and availableTo dates.
    """
    now = datetime.now(timezone.utc)
    available_from_str = file_meta.get("availableFrom")
    available_to_str = file_meta.get("availableTo")

    available_from = None
    available_to = None

    if available_from_str:
        available_from = datetime.fromisoformat(
            available_from_str.replace("Z", "+00:00")
        )
    if available_to_str:
        available_to = datetime.fromisoformat(available_to_str.replace("Z", "+00:00"))

    if available_from and now < available_from:
        return "pending"
    if available_to and now > available_to:
        return "expired"

    return "active"


def validate_file_access(file_meta: dict, user: dict, password_header: str):
    """
    Validates access to a file based on status, whitelist, and password.
    Returns (error_response, status_code) if access is denied, otherwise (None, None).
    """
    status = get_file_status(file_meta)
    is_owner = user and user["email"] == file_meta.get("ownerEmail")

    if status == "expired":
        return jsonify(
            {
                "error": "File expired",
                "expiredAt": file_meta.get("availableTo"),
                "message": "File has expired",
            }
        ), 410

    if status == "pending" and not is_owner:
        hours_until = 0
        if file_meta.get("availableFrom"):
            frm = datetime.fromisoformat(file_meta["availableFrom"])
            diff = frm - datetime.now(timezone.utc)
            hours_until = max(0, diff.total_seconds() / 3600)
        return jsonify(
            {
                "error": "File not yet available",
                "availableFrom": file_meta.get("availableFrom"),
                "hoursUntilAvailable": hours_until,
                "message": "File not yet available",
            }
        ), 423

    shared_with = file_meta.get("sharedWith", [])
    if not file_meta["isPublic"] or shared_with:
        if not user:
            return jsonify(
                {
                    "error": "Unauthorized",
                    "message": "Authentication required for private file",
                }
            ), 401

        if shared_with:
            if user["email"] not in shared_with and not is_owner:
                return jsonify(
                    {
                        "error": "Access denied",
                        "message": "You are not in the shared list",
                    }
                ), 403
        elif not file_meta["isPublic"] and not is_owner:
            return jsonify({"error": "Access denied", "message": "Private file"}), 403

    if file_meta["passwordProtected"]:
        if not password_header:
            return jsonify(
                {
                    "error": "Password required",
                    "message": "This file is password-protected. Please provide the password parameter",
                }
            ), 403
        if password_header != file_meta.get("password"):
            return jsonify(
                {
                    "error": "Incorrect password",
                    "message": "The file password is incorrect",
                }
            ), 403

    return None, None


# temporary /auth endpoints
@app.post("/api/auth/register")
def register():
    """
    Mock user registration.
    Body: { "username": string, "email": string, "password": string }
    """
    data = request.get_json(silent=True) or {}
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return jsonify(
            {
                "error": "Validation error",
                "message": "username, email and password are required",
            }
        ), 400

    if email in users:
        return jsonify({"error": "Conflict", "message": "Email already exists"}), 409

    for u in users.values():
        if u["username"] == username:
            return jsonify(
                {"error": "Conflict", "message": "Username already exists"}
            ), 409

    user_id = str(uuid.uuid4())
    users[email] = {
        "id": user_id,
        "email": email,
        "username": username,
        "password": password,
        "role": "user",
        "totp_enabled": False,
        "totp_secret": None,
    }

    return jsonify(
        {
            "message": "User registered successfully",
            "userId": user_id,
        }
    ), 200


@app.post("/api/auth/login")
def login():
    """
    Mock login.
    Body: { "email": string, "password": string }
    """
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    password = data.get("password")

    user = users.get(email)
    if not user or user["password"] != password:
        return jsonify(
            {"error": "Unauthorized", "message": "Invalid email or password"}
        ), 401

    global totp_temp_sessions
    if user["totp_enabled"]:
        cid = str(uuid.uuid4())
        totp_temp_sessions[cid] = email
        return jsonify(
            {
                "requireTOTP": True,
                "cid": cid,
                "message": "TOTP verification required",
            }
        ), 200
    else:
        token = create_token("token")
        sessions[token] = email
        return jsonify(
            {
                "accessToken": token,
                "user": serialize_user(user),
                "message": "Login successful",
            }
        ), 200


@app.post("/api/auth/login/totp")
def login_totp():
    """
    Mock TOTP validation after /auth/login.
    """
    data = request.get_json(silent=True) or {}
    cid = data.get("cid")
    code = data.get("code")

    if not cid or not code:
        return jsonify(
            {"error": "Validation error", "message": "cid and code are required"}
        ), 400

    email = totp_temp_sessions.get(cid)
    if not email:
        return jsonify(
            {
                "error": "Unauthorized",
                "message": "Login session expired. Please restart the login flow.",
            }
        ), 401

    if code != MOCK_TOTP_CODE:
        return jsonify(
            {"error": "Unauthorized", "message": "Invalid or expired TOTP code"}
        ), 401

    token = create_token("token")
    sessions[token] = email
    del totp_temp_sessions[cid]

    user = users.get(email)

    return jsonify(
        {
            "accessToken": token,
            "user": serialize_user(user),
            "message": "TOTP verified successfully",
        }
    ), 200


@app.post("/api/auth/totp/setup")
def totp_setup():
    token, user = get_current_user()
    if not user:
        return jsonify(
            {"error": "Unauthorized", "message": "Bearer token is required"}
        ), 401

    secret = "NB2W45DFOIZA===="  # Match example for consistency or keep random
    qr_code = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPoAAAD6CAYAAACI7Fo9AAAQAElEQVR4Aeydi3XcNhOFedSF0kZchqIypDJilSGXIbsMpYwkZeT3l5i/9VjOHS2GWJC8PhmvxQHm8YF342NguVe//vrrP0eyp6enf9SvCh7Pz89hmj///FNyf3x8DGNknNTR2s/NzY1MRa2tee7u7mSeigHcA621bm3+1eRfJmACuydgoe9+id2gCUyThe67wAQOQGBNoR8An1s0gW0QsNC3sU6u0gSaCFjoTfg82QS2QcBC38Y6uUoTaCIghX59fT1930cdzRbraaLxY3JFv3/99df09evXRfv27dtiD3P+73u1Pypa94U8c85Tr7/99ttiH3OP9Htq7strmS7meC2vmTxqjGLysq9L/xmNqn6k0Gn48+fP0+cNGDekajjjr+gVIT88PExLxo2s8sA+U2/rmLu7u3B9uZGX+piv//LLL2EMelU35B9//LHIa86TeW3lwXzFhH5Gscx9IoVO0zYTMIFtE7DQt71+rt4EUgQs9PeYfMUEdkfAQt/dkrohE3hPwEJ/z8RXTGB3BCz03S2pGzKB9wQs9PdM1rzi2CZwEQIlQv/y5ct0f3+/unEo4yKU3iRlv1f1y5g301b5kb3cqBb8qyQ+Iyi1PD4+Tkv2+++/y6jsby/Nn6/LIEUDIu5VPphVlFsidG7qHlbRcEUM3nBUvxV5MjFUHX///XcmTJcxHOyIjEM3qhAO3UQx8KkYFf7MPaDWJuOvWr8SoVeAcwwTMIH1CFjo67HtHdn5TGCRgIW+iMYOE9gPAQt9P2vpTkxgkYCFvojGDhPYDwELfT9ruWYnjr1xAhb6GQvINhDbPJGdEfbdFLZwlL2bdKELqk78FaWx3USsyCry7C2GhX7GirJXy4MjImPMGaFfTeHhFbe3t1Nk3PivJl3oh0ytiLO1PA5nRTzwtebY43wLfY+r6p5M4A0BC/0NEP/YnYATdiBgoXeA7BQmcGkCFvqlV8D5TaADAQu9A2SnMIFLE7DQL70Czr8mAcf+QcBC/wHCLyawZwIW+kqry5ce8JCEyNgTjozSovn4GNNqnAeI6sDXmqNqfoZrVa49xbHQV1pNvjUGIS4ZB2oQUGSUtjR/vs7pPMa1GIddojrwt8SvnAu3ufel18p8e4lloe9lJd1HbwKbymehb2q5XKwJnEfAQj+Pm2eZwKYIWOibWi4XawLnEbDQz+PmWSawJoHy2BZ6OVIHNIHxCFjo462JKzKBcgIlQucbNp6enqa1jSe7lBM4IyAP3mefPDLGnBH61RQOskQ58PFNHhF3vr3kVdATP/Rav4eHh4mal0z1Qp88aGNp/nz9RIurXKKetS2zfpnmSoSOAHtYpqEeY3hSCjdcZBV1RPFnHwdmIvaZOqL5lT7FLZNLxYBLpufWMZlaK8a01jnPfyH0+ZJfTcAE9kbAQt/birofEzhBwEI/AcWXTGBvBCz0va2o+zGBEwQ6Cf1EZl8yARPoRsBC74baiUzgcgSk0NmuYE94K1aBUvVKDj4XHRljVJxoPj62zogzgqle2PYaoc6qGuhH9TyKH42qvqXQaeb+/n7agvHwBNVwxq96hQkHGSKjligO/mg+Pg6AZOpdeww3fdQLvpEeTlHBg8M99LUF435UPUuhqwCX97sCEzABRcBCV4TsN4EdELDQd7CIbsEEFAELXRGy3wR2QMBCDxfRThPYBwELfR/r6C5MICRgoYd47DSBfRC44qEDRzIOorQuHfuWPCQhMg67RFyjubOPB0+oWtmPn8efeiVGVAc+9slPzZ2vsaes6tiSn3uAvo9kVxzKOJLxMIDWm5KTSBwQiUwxvb6+nqL5+MijamVcZMRQtUTz8fHGpurYkp97QDHZm99/dd/SHepaTeBMAhb6meA8zQS2RMBC39JquVYTOJOAhX4muLGnuToTeE3AQn/Nwz+... [truncated]"

    user["totp_secret"] = secret

    return jsonify(
        {
            "totpSetup": {
                "secret": secret,
                "qrCode": qr_code,
            },
            "message": "TOTP secret generated",
        }
    ), 200


@app.post("/api/auth/totp/verify")
def totp_verify():
    token, user = get_current_user()
    if not user:
        return jsonify(
            {"error": "Unauthorized", "message": "Bearer token is required"}
        ), 401

    data = request.get_json(silent=True) or {}
    code = data.get("code")

    if not code:
        return jsonify(
            {"error": "Validation error", "message": "code is required"}
        ), 400

    if code != MOCK_TOTP_CODE:
        return jsonify(
            {
                "error": "Invalid TOTP code",
                "message": "The provided code is incorrect or expired",
            }
        ), 400

    user["totp_enabled"] = True

    return jsonify(
        {
            "message": "TOTP verified successfully",
            "totpEnabled": True,
        }
    ), 200


@app.post("/api/auth/totp/disable")
def totp_disable():
    token, user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json(silent=True) or {}
    code = data.get("code")

    if not code:
        return jsonify({"error": "code is required"}), 400

    if not user.get("totp_enabled"):
        return jsonify({"error": "TOTP not enabled for this account"}), 400

    if code != MOCK_TOTP_CODE:
        return jsonify({"error": "Invalid TOTP code"}), 400

    user["totp_enabled"] = False
    user["totp_secret"] = None

    return jsonify(
        {
            "message": "TOTP disabled successfully (mock)",
            "totpEnabled": False,
        }
    ), 200


@app.post("/api/auth/logout")
def logout():
    token, user = get_current_user()
    if not user:
        return jsonify(
            {
                "error": "Unauthorized",
                "message": "No token found",
            }
        ), 401

    if token in sessions:
        del sessions[token]

    return jsonify(
        {
            "message": "User logged out",
        }
    ), 200


@app.get("/api/files/my")
def get_user_files():
    token, user = get_current_user()
    if not user:
        return jsonify({"message": "Unauthorized"}), 401

    user_email = user["email"]

    status_filter = request.args.get("status", "all")
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 20))
    sort_by = request.args.get("sortBy", "createdAt")
    order = request.args.get("order", "desc")

    user_files_with_status = [
        (file_meta, get_file_status(file_meta))
        for file_meta in files.values()
        if file_meta.get("ownerEmail") == user_email
    ]

    if status_filter != "all":
        user_files_with_status = [
            (file, status)
            for file, status in user_files_with_status
            if status == status_filter
        ]

    reverse_order = order == "desc"
    if sort_by == "fileName":
        user_files_with_status.sort(
            key=lambda item: item[0].get("filename", "").lower(), reverse=reverse_order
        )
    else:
        user_files_with_status.sort(
            key=lambda item: item[0]["createdAt"], reverse=reverse_order
        )

    total_files = len(user_files_with_status)
    start_index = (page - 1) * limit
    end_index = start_index + limit
    paginated_files_with_status = user_files_with_status[start_index:end_index]

    serialized_files = []
    summary = {
        "activeFiles": 0,
        "pendingFiles": 0,
        "expiredFiles": 0,
        "deletedFiles": 0,
    }

    for _, status in user_files_with_status:
        if status == "active":
            summary["activeFiles"] += 1
        elif status == "pending":
            summary["pendingFiles"] += 1
        elif status == "expired":
            summary["expiredFiles"] += 1

    for file_meta, status in paginated_files_with_status:
        serialized_files.append(
            {
                "id": file_meta["id"],
                "fileName": file_meta.get("filename", "N/A"),
                "status": status,
                "createdAt": file_meta["createdAt"],
                "shareToken": file_meta.get("shareToken"),
            }
        )

    total_pages = (total_files + limit - 1) // limit
    pagination = {
        "currentPage": page,
        "totalPages": total_pages,
        "totalFiles": total_files,
        "limit": limit,
    }

    return jsonify(
        {
            "files": serialized_files,
            "pagination": pagination,
            "summary": summary,
        }
    ), 200


@app.get("/api/files/available")
def get_available_files():
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 10))

    # Filter public and active files
    active_public_files = []
    for file_meta in files.values():
        if get_file_status(file_meta) == "active":
            active_public_files.append(file_meta)

    # Sort by createdAt desc
    active_public_files.sort(key=lambda x: x["createdAt"], reverse=True)

    total_files = len(active_public_files)
    start = (page - 1) * limit
    end = start + limit
    paginated = active_public_files[start:end]

    serialized = []
    for f in paginated:
        serialized.append(
            {
                "fileid": f["id"],
                "filename": f["filename"],
                "owner": f["ownerEmail"],
                "haspassword": f["passwordProtected"],
                "sharetoken": f["shareToken"],
            }
        )

    return jsonify(
        {
            "files": serialized,
            "pagination": {
                "currentPage": page,
                "limit": limit,
                "totalFiles": total_files,
                "totalPages": (total_files + limit - 1) // limit,
            },
        }
    ), 200


@app.get("/api/user")
def get_user_profile():
    token, user = get_current_user()
    if not user:
        return jsonify({"message": "Unauthorized"}), 401

    return jsonify(
        {
            "user": serialize_user(user),
        }
    ), 200


# /admin endpoints
policy = {
    "id": 1,
    "maxFileSizeMB": 50,
    "minValidityHours": 1,
    "maxValidityDays": 30,
    "defaultValidityDays": 7,
    "requirePasswordMinLength": 6,
}

UPDATABLE_FIELDS = {
    "maxFileSizeMB",
    "minValidityHours",
    "maxValidityDays",
    "defaultValidityDays",
    "requirePasswordMinLength",
}


@app.get("/api/admin/policy")
def get_policy():
    return jsonify(policy), 200


@app.patch("/api/admin/policy")
def update_policy():
    data = request.get_json(silent=True) or {}
    token, user = get_current_user()
    if not user or user.get("role") != "admin":
        return jsonify({"error": "Forbidden"}), 403

    for key in UPDATABLE_FIELDS:
        if key in data:
            policy[key] = data[key]

    return jsonify(
        {
            "message": "Policy updated",
            "policy": policy,
        }
    ), 200


@app.post("/api/admin/cleanup")
def admin_cleanup():
    # Mock cleanup: remove expired files from 'files' dict
    token, user = get_current_user()

    # Simple admin check (in prod check X-Cron-Secret too)
    if not user or user.get("role") != "admin":
        return jsonify(
            {
                "error": "Forbidden",
                "message": "You don't have permission to perform cleanup",
            }
        ), 403

    deleted_count = 0
    files_to_remove = []
    now = datetime.now(timezone.utc)

    for fid, file_meta in files.items():
        status = get_file_status(file_meta)
        if status == "expired":
            files_to_remove.append(fid)

    for fid in files_to_remove:
        del files[fid]
        deleted_count += 1

    return jsonify(
        {
            "message": "Expired files removed",
            "deletedFiles": deleted_count,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
    ), 200


@app.post("/api/files/upload")
def upload_file():
    token, user = get_current_user()

    upload_file = request.files.get("file")
    if not upload_file:
        return jsonify(
            {"error": "Validation error", "message": "File is required"}
        ), 400

    filename = secure_filename(upload_file.filename or f"upload-{uuid.uuid4().hex}")
    data = upload_file.read()
    size = len(data)

    max_bytes = policy.get("maxFileSizeMB", 50) * 1024 * 1024
    if size > max_bytes:
        return (
            jsonify(
                {
                    "error": "Payload too large",
                    "message": "File size exceeds the system limit",
                    "maxFileSizeMB": policy.get("maxFileSizeMB"),
                }
            ),
            413,
        )

    is_public = str(request.form.get("isPublic", "false")).lower() in (
        "1",
        "true",
        "yes",
        "on",
    )
    password = request.form.get("password") or None
    if password and len(password) < policy.get("requirePasswordMinLength", 6):
        return (
            jsonify(
                {
                    "error": "Validation error",
                    "message": "Password too short",
                    "minLength": policy.get("requirePasswordMinLength"),
                }
            ),
            400,
        )

    available_from_raw = request.form.get("availableFrom")
    available_to_raw = request.form.get("availableTo")
    available_from = None
    available_to = None

    try:
        if available_from_raw:
            available_from = datetime.fromisoformat(
                available_from_raw.replace("Z", "+00:00")
            )
        else:
            available_from = datetime.now(timezone.utc)

        if available_to_raw:
            available_to = datetime.fromisoformat(
                available_to_raw.replace("Z", "+00:00")
            )
        else:
            available_to = available_from + timedelta(
                days=policy.get("defaultValidityDays", 7)
            )

        if available_from >= available_to:
            return jsonify(
                {
                    "error": "Validation error",
                    "message": "availableFrom must be before availableTo and within allowed policy window",
                }
            ), 400
    except Exception:
        return jsonify(
            {
                "error": "Validation error",
                "message": "Invalid datetime format, use ISO format",
            }
        ), 400

    shared_with = request.form.getlist("sharedWith") or []
    # enable_totp is NOT in spec but implemented in mock. We'll keep it as "hidden feature" or extension.

    # Auth check for private
    if not is_public and not user:
        return jsonify(
            {
                "error": "Unauthorized",
                "message": "Private uploads (isPublic=false/sharedWith) require authentication",
            }
        ), 401

    file_id = str(uuid.uuid4())
    share_token = file_id
    owner_email = user.get("email") if user else None
    share_link = f"http://localhost:3000/f/{share_token}"

    owner_info = None
    if user:
        owner_info = serialize_user(user)

    file_meta = {
        "id": file_id,
        "filename": filename,
        "size": size,
        "mimeType": "application/octet-stream",  # simplistic mock
        "shareToken": share_token,
        "ownerEmail": owner_email,
        "owner": owner_info,
        "isPublic": bool(is_public),
        "passwordProtected": bool(password),
        "password": password,  # Store password for verification
        "availableFrom": available_from.isoformat(),
        "availableTo": available_to.isoformat(),
        "sharedWith": shared_with,
        "shareLink": share_link,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        # "totpEnabled": bool(enable_totp), # remove extra field
    }

    files[file_id] = file_meta

    # Initialize stats
    file_stats[file_id] = {
        "downloadCount": 0,
        "uniqueDownloaders": set(),
        "lastDownloadedAt": None,
    }
    download_history[file_id] = []

    return jsonify(
        {"success": True, "message": "File uploaded successfully", "file": file_meta}
    ), 201


@app.delete("/api/files/info/<string:file_id>")
def delete_file(file_id: str):
    token, user = get_current_user()
    if not user:
        return jsonify({"message": "Unauthorized"}), 401

    if file_id not in files:
        return jsonify({"message": "File not found"}), 404

    file_to_delete = files[file_id]

    if (
        file_to_delete.get("ownerEmail") != user["email"]
        and user.get("role") != "admin"
    ):
        return jsonify({"message": "Forbidden"}), 403

    del files[file_id]
    if file_id in file_stats:
        del file_stats[file_id]
    if file_id in download_history:
        del download_history[file_id]

    return jsonify({"message": "File deleted successfully", "fileId": file_id}), 200


@app.get("/api/files/info/<string:file_id>")
def get_file_info_detailed(file_id: str):
    """
    Get detailed file info for owner/admin (authenticated).
    """
    token, user = get_current_user()
    if not user:
        return jsonify({"message": "Unauthorized"}), 401

    if file_id not in files:
        return jsonify({"message": "File not found"}), 404

    file_meta = files[file_id]

    # Check permission
    if file_meta.get("ownerEmail") != user["email"] and user.get("role") != "admin":
        return jsonify({"message": "Forbidden"}), 403

    # Calculate hours remaining
    status = get_file_status(file_meta)
    hours_remaining = 0
    if file_meta.get("availableTo"):
        to_date = datetime.fromisoformat(file_meta["availableTo"])
        now = datetime.now(timezone.utc)
        diff = to_date - now
        hours_remaining = max(0, diff.total_seconds() / 3600)

    # Copy and enhance
    response_file = file_meta.copy()
    response_file["status"] = status
    response_file["hoursRemaining"] = hours_remaining
    # Don't show password in response even to owner? Spec doesn't say. Usually no.
    if "password" in response_file:
        del response_file["password"]

    return jsonify({"file": response_file}), 200


@app.get("/api/files/<string:share_token>")
def get_file_info_public(share_token: str):
    """
    Get basic file info via share token (public).
    """
    # In our mock, share_token == file_id
    file_id = share_token

    if file_id not in files:
        return jsonify({"error": "Not found", "message": "File not found"}), 404

    file_meta = files[file_id]
    status = get_file_status(file_meta)

    if status == "expired":
        return jsonify({"error": "File expired", "message": "File has expired"}), 410

    # Only return basic info
    response_file = {
        "id": file_meta["id"],
        "fileName": file_meta["filename"],
        "shareToken": file_meta["shareToken"],
        "status": status,
        "isPublic": file_meta["isPublic"],
        "hasPassword": file_meta["passwordProtected"],
        "fileSize": file_meta["size"],
        "mimeType": file_meta.get("mimeType"),
        "availableFrom": file_meta.get("availableFrom"),
        "availableTo": file_meta.get("availableTo"),
    }

    return jsonify({"file": response_file}), 200


@app.get("/api/files/<string:share_token>/download")
def download_file(share_token: str):
    file_id = share_token

    if file_id not in files:
        return jsonify({"error": "Not found", "message": "File not found"}), 404

    file_meta = files[file_id]
    token, user = get_current_user()
    pwd_header = request.headers.get("X-File-Password")

    error_response, status_code = validate_file_access(file_meta, user, pwd_header)
    if error_response:
        return error_response, status_code

    # Log stats
    if file_id in file_stats:
        file_stats[file_id]["downloadCount"] += 1
        file_stats[file_id]["lastDownloadedAt"] = datetime.now(timezone.utc).isoformat()
        if user:
            file_stats[file_id]["uniqueDownloaders"].add(user["email"])

    # Log history
    if file_id in download_history:
        downloader_info = None
        if user:
            downloader_info = {"username": user["username"], "email": user["email"]}

        download_history[file_id].insert(
            0,
            {
                "id": str(uuid.uuid4()),
                "downloader": downloader_info,
                "downloadedAt": datetime.now(timezone.utc).isoformat(),
                "downloadCompleted": True,
            },
        )

    # Return dummy file content
    dummy_content = f"This is the content of file {file_meta['filename']}".encode(
        "utf-8"
    )
    return send_file(
        io.BytesIO(dummy_content),
        mimetype="application/octet-stream",
        as_attachment=True,
        download_name=file_meta["filename"],
    )


@app.get("/api/files/<string:share_token>/preview")
def preview_file(share_token: str):
    file_id = share_token

    if file_id not in files:
        return jsonify({"error": "Not found", "message": "File not found"}), 404

    file_meta = files[file_id]
    token, user = get_current_user()
    pwd_header = request.headers.get("X-File-Password")

    error_response, status_code = validate_file_access(file_meta, user, pwd_header)
    if error_response:
        return error_response, status_code

    dummy_content = f"Preview of file {file_meta['filename']}".encode("utf-8")

    return send_file(
        io.BytesIO(dummy_content),
        mimetype=file_meta.get("mimeType", "application/octet-stream"),
        as_attachment=False,
        download_name=file_meta["filename"],
    )


@app.get("/api/files/stats/<string:file_id>")
def get_file_stats(file_id: str):
    token, user = get_current_user()
    if not user:
        return jsonify({"message": "Unauthorized"}), 401

    if file_id not in files:
        return jsonify({"message": "File not found"}), 404

    file_meta = files[file_id]
    if file_meta.get("ownerEmail") != user["email"] and user.get("role") != "admin":
        return jsonify({"message": "Forbidden"}), 403

    if file_meta.get("ownerEmail") is None:  # Anonymous upload
        return jsonify(
            {"message": "Statistics not available for anonymous uploads"}
        ), 404

    stats = file_stats.get(file_id, {})

    response = {
        "fileId": file_id,
        "fileName": file_meta["filename"],
        "statistics": {
            "downloadCount": stats.get("downloadCount", 0),
            "uniqueDownloaders": len(stats.get("uniqueDownloaders", set())),
            "lastDownloadedAt": stats.get("lastDownloadedAt"),
            "createdAt": file_meta["createdAt"],
        },
    }
    return jsonify(response), 200


@app.get("/api/files/download-history/<string:file_id>")
def get_download_history(file_id: str):
    token, user = get_current_user()
    if not user:
        return jsonify({"message": "Unauthorized"}), 401

    if file_id not in files:
        return jsonify({"message": "File not found"}), 404

    file_meta = files[file_id]
    if file_meta.get("ownerEmail") != user["email"] and user.get("role") != "admin":
        return jsonify({"message": "Forbidden"}), 403

    history = download_history.get(file_id, [])

    # Pagination
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 50))

    start = (page - 1) * limit
    end = start + limit
    paginated_history = history[start:end]

    response = {
        "fileId": file_id,
        "fileName": file_meta["filename"],
        "history": paginated_history,
        "pagination": {
            "currentPage": page,
            "totalPages": (len(history) + limit - 1) // limit,
            "totalRecords": len(history),
            "limit": limit,
        },
    }
    return jsonify(response), 200


if __name__ == "__main__":
    # For local dev only
    app.run(host="0.0.0.0", port=8080, debug=True)
