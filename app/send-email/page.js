"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { toast } from "react-toastify";

export default function VerifyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;

    if (user.authenticatedEmail) {
      toast.success("Your email is already verified! Redirecting...");
      const timer = setTimeout(() => router.push("/dashboard"), 1500);
      return () => clearTimeout(timer);
    }
  }, [mounted, user, router]);

  const sendVerificationEmail = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await axios.get("/api/auth/send-verification-email", {
        withCredentials: true,
      });

      if (res.data.success) {
        toast.success("Verification email sent! Check your inbox.");
      } else {
        toast.error("Failed to send email. Try again later.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return <div className="grid place-items-center h-dvh">Loading user info...</div>;
  if (!user) return <div className="grid place-items-center h-dvh">No user found...</div>;
  if (user.authenticatedEmail) return null;

  return (
    <div className="w-full h-dvh grid place-items-center">
      <div className="max-w-md p-6 bg-gray-800 text-white rounded-lg shadow-md text-center">
        <p className="mb-4">Your email has not been verified.</p>
        <button
          onClick={sendVerificationEmail}
          disabled={loading}
          className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Verification Email"}
        </button>
      </div>
    </div>
  );
}
