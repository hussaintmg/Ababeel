"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";

const CourseCertificateGenerator = ({ candidate }) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!candidate?._id) {
      toast.error("Candidate information is missing");
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Generating certificate...");

    try {
      const response = await fetch("/api/download/course-certificate/single", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidateId: candidate._id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate certificate");
      }

      // Get the blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Certificate-${candidate?.firstName || "candidate"}-${candidate?.lastName || ""}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Certificate downloaded successfully!", {
        id: loadingToast,
      });
    } catch (error) {
      console.error("Error downloading certificate:", error);
      toast.error(error.message || "Error generating certificate. Please try again.", {
        id: loadingToast,
      });
    } finally {
      setLoading(false);
      toast.dismiss(loadingToast)
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex border border-green-300 items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-md hover:bg-green-100 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <svg className="animate-spin w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Generating...
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Certificate
        </>
      )}
    </button>
  );
};

export default CourseCertificateGenerator;