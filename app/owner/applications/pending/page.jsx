"use client";

export default function RemovedPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Available</h1>
        <p className="text-gray-600 mb-6">This page has been removed.</p>
        <a href="/owner" className="text-blue-600 hover:underline font-medium">
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}