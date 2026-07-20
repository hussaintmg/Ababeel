"use client";

export default function SignUpRemoved() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Available</h1>
        <p className="text-gray-600 mb-6">
          Public signup has been removed. Accounts are created by the administrator.
        </p>
        <a href="/login" className="text-blue-600 hover:underline font-medium">
          Go to Login
        </a>
      </div>
    </div>
  );
}
