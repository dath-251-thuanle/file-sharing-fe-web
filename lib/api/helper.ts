import { User } from "@/lib/components/schemas";

const ACCESS_TOKEN_KEY = "fs_access_token";
const USER_KEY = "fs_user";
const CID_KEY = "fs_login_cid";

/**
 * Helpers: localStorage-safe (avoid SSR crash)
 */
function safeGetItem(key: string): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(key);
}

function safeSetItem(key: string, value: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, value);
}

function safeRemoveItem(key: string) {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
}

/**
 * Auth storage helpers
 */
export function getAccessToken(): string | null {
    return safeGetItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string) {
    safeSetItem(ACCESS_TOKEN_KEY, token);
}

export function clearAuth() {
    safeRemoveItem(ACCESS_TOKEN_KEY);
    safeRemoveItem(USER_KEY);
    safeRemoveItem(CID_KEY);
}

export function setLoginChallengeId(cid: string) {
    safeSetItem(CID_KEY, cid);
}

export function getLoginChallengeId(): string | null {
    return safeGetItem(CID_KEY);
}

export function clearLoginChallengeId() {
    safeRemoveItem(CID_KEY);
}

export function getCurrentUser(): User | null {
    const raw = safeGetItem(USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as User;
    } catch {
        return null;
    }
}

export function setCurrentUser(user: User) {
    safeSetItem(USER_KEY, JSON.stringify(user));
}

export function _isLoggedIn(): boolean {
    // return true;
    return !!getAccessToken();
}

export function _isAdmin(): boolean {
    // return true;
    const user = getCurrentUser();
    console.log(user);
    return user?.role === "admin";
}

export function getErrorMessage(error: any, defaultMessage: string = "An error occurred"): string {
    if (!error) return defaultMessage;

    if (typeof error === "string") return error;

    // Axios error with response
    if (error.response) {
        const data = error.response.data;
        // If data is simple string
        if (typeof data === "string") return data;
        
        // If data is object
        if (data && typeof data === "object") {
            // Prioritize 'message' then 'error'
            if (data.message) return data.message;
            if (data.error) return data.error;
        }
    }

    // Fallback to error message or default
    return error.message || defaultMessage;
}

export function isFormData(value: unknown): value is FormData {
    if (typeof FormData === "undefined" || !value) {
        return false;
    }

    return value instanceof FormData;
}