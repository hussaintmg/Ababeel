"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

export default function VerifyEmailPage() {
  const params = useParams();
  const router = useRouter();
  const { getUserData } = useAuth();

  const [status, setStatus] = useState("Verifying...");
  const [loading, setLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;

    const token = params.token;
    if (!token) {
      setStatus("Invalid verification link.");
      setLoading(false);
      setTimeout(() => router.push("/"), 3000);
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await axios.post("/api/auth/verify-email", { token });

        if (res.data?.message?.includes("success")) {
          setStatus("Your email has been successfully verified!");
          setIsSuccess(true);
          getUserData();
        } else {
          setStatus(res.data?.message || "Failed to verify email.");
          setIsSuccess(false);
        }
      } catch (err) {
        console.error("Email verification error:", err);
        setStatus(err.response?.data?.error || "Server error verifying email.");
        setIsSuccess(false);
      } finally {
        setLoading(false);
        setTimeout(() => router.push("/"), 3000);
      }
    };

    verifyToken();
  }, [params, router, getUserData]);

  // Jab tak verification complete nahi hoti, sirf loading dikhao
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 p-4">
        <div className="max-w-md w-full rounded-xl shadow-lg p-8 text-center">
          <div className="mx-auto w-20 h-20 flex items-center justify-center rounded-full mb-6 bg-blue-100">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h1 className="text-2xl font-bold mb-4 text-blue-700">Verifying Email</h1>
          <p className="text-gray-600 mb-4">Please wait while we verify your email...</p>
        </div>
      </div>
    );
  }

  // Jab verification complete ho jaye tab result dikhao
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <div className="max-w-md w-full rounded-xl shadow-lg p-8 text-center animate-scale">
        <div
          className={`mx-auto w-20 h-20 flex items-center justify-center rounded-full mb-6 ${
            isSuccess ? "bg-green-100" : "bg-red-100"
          }`}
        >
          <svg
            className={`w-12 h-12 ${
              isSuccess ? "text-green-600" : "text-red-600"
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            {isSuccess ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            )}
          </svg>
        </div>

        <h1
          className={`text-2xl font-bold mb-4 ${
            isSuccess ? "text-green-700" : "text-red-700"
          }`}
        >
          {isSuccess ? "Verified!" : "Verification Failed"}
        </h1>

        <p className="text-gray-600 mb-4">{status}</p>

        <p className="text-sm text-gray-500 animate-pulse">
          Redirecting to Home page...
        </p>
      </div>
    </div>
  );
}