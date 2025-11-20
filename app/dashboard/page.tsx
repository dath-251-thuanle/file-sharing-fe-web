"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, File as FileType, UserProfileResponse } from "@/lib/components/schemas";
import { getUserProfile, disableTotp } from "@/lib/api/auth";
import { ShieldCheck, ShieldOff, Loader, KeyRound } from "lucide-react";

export default function Dashboard() {
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTotpInput, setShowTotpInput] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await getUserProfile();
        setUserProfile(profile);
      } catch (err: any) {
        if (err.message.includes("Unauthorized")) {
          router.push("/login");
        } else {
          setError("Failed to fetch user profile.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleDisableTotp = async () => {
    if (!totpCode) {
      alert("Please enter the TOTP code.");
      return;
    }
    setIsSubmitting(true);
    try {
      await disableTotp(totpCode);
      // Refresh profile to show updated TOTP status
      const profile = await getUserProfile();
      setUserProfile(profile);
      setShowTotpInput(false);
      setTotpCode("");
      alert("TOTP has been disabled successfully.");
    } catch (err: any) {
      alert(`Failed to disable TOTP: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin h-8 w-8 text-gray-500" />
        <p className="ml-2 text-gray-500">Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  if (!userProfile) {
    return null; // or a fallback UI
  }

  const { user, files, summary } = userProfile;

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h1 className="text-2xl font-bold mb-4">Welcome, {user.username}!</h1>
        <p className="text-gray-600">Email: {user.email}</p>
        <p className="text-gray-600">Role: {user.role}</p>

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Two-Factor Authentication (2FA)</h2>
          {user.totpEnabled ? (
            <div className="flex items-center gap-4">
              <span className="flex items-center text-green-600">
                <ShieldCheck className="h-5 w-5 mr-1" />
                2FA is Enabled
              </span>
              <button
                onClick={() => setShowTotpInput(!showTotpInput)}
                className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Disable 2FA
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <span className="flex items-center text-red-600">
                <ShieldOff className="h-5 w-5 mr-1" />
                2FA is Not Enabled
              </span>
              <Link href="/totp-setup">
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Enable 2FA
                </button>
              </Link>
            </div>
          )}

          {showTotpInput && (
            <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                <label htmlFor="totp-code" className="block text-sm font-medium text-gray-700 mb-2">Enter TOTP Code to Disable</label>
                <div className="flex gap-2">
                    <div className="relative rounded-md shadow-sm flex-grow">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <KeyRound className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            id="totp-code"
                            value={totpCode}
                            onChange={(e) => setTotpCode(e.target.value)}
                            className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="6-digit code"
                            maxLength={6}
                        />
                    </div>
                    <button
                        onClick={handleDisableTotp}
                        disabled={isSubmitting || totpCode.length !== 6}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        {isSubmitting && <Loader className="animate-spin h-4 w-4 mr-2" />}
                        Confirm & Disable
                    </button>
                </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Your Files</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center mb-6">
            <div className="p-4 bg-blue-100 rounded-lg">
                <p className="text-2xl font-bold">{summary.activeFiles}</p>
                <p className="text-sm text-blue-800">Active</p>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg">
                <p className="text-2xl font-bold">{summary.pendingFiles}</p>
                <p className="text-sm text-gray-800">Pending</p>
            </div>
            <div className="p-4 bg-yellow-100 rounded-lg">
                <p className="text-2xl font-bold">{summary.expiredFiles}</p>
                <p className="text-sm text-yellow-800">Expired</p>
            </div>
            <div className="p-4 bg-red-100 rounded-lg">
                <p className="text-2xl font-bold">{summary.deletedFiles}</p>
                <p className="text-sm text-red-800">Deleted</p>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {files.length > 0 ? (
                files.map((file) => (
                  <tr key={file.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{file.fileName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            file.status === 'active' ? 'bg-green-100 text-green-800' :
                            file.status === 'expired' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                            {file.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(file.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">You have not uploaded any files yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
