"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import ForgotPassword from "@/Components/ForgotPasswordBackground";
import AuthTheme from "@/Components/cms/AuthTheme";

export default function VerifyCode() {
  const { token } = useParams();
  const router = useRouter();
  const [showPopup, setShowPopup] = useState(false);
  const [code, setCode] = useState("");

  useEffect(() => {
    if (!token) return router.push("/");

    // ✅ correct axios GET with params
    axios
      .get("/api/auth/check-fp", { params: { token } })
      .then((res) => {
        if (res.data.valid) setShowPopup(true);
        else {
          toast.error("Invalid or Expired Token");
          router.push("/");
        }
      })
      .catch(() => {
        toast.error("Invalid or Expired Token");
        router.push("/");
      });
  }, [token, router]);

  const handleChange = async (e) => {
    const val = e.target.value.replace(/\D/g, "");
    setCode(val);

    if (val.length === 6) {
      try {
        const res = await axios.post("/api/auth/check-code", {
          token,
          code: val,
        });

        toast.success("Redirecting to reset page");
        router.push(res.data.url);
      } catch {
        toast.error("Invalid Code");
      }
    }
  };

  return (
    <div className="cms-auth min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <AuthTheme />
      {/* Background Forgot Password */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <ForgotPassword />
      </div>

      {/* Popup */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="cms-auth-card bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
            <h2 className="cms-auth-title text-2xl font-semibold text-gray-800 mb-4 text-center">
              Enter Verification Code
            </h2>
            <p className="cms-auth-sub text-gray-500 text-sm text-center mb-6">
              A 6-digit code has been sent to your email
            </p>

            <input
              value={code}
              onChange={handleChange}
              maxLength={6}
              autoFocus
              className="cms-auth-input w-full text-center border border-gray-300 rounded-lg p-3 text-xl tracking-widest
              focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
              placeholder="● ● ● ● ● ●"
            />

            <button
              onClick={() => setCode("")}
              className="mt-4 w-full py-2 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200 transition"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
