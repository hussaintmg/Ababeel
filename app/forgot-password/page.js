"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

export default function ForgotPassword() {
  const router = useRouter();

  const [value, setValue] = useState("");
  const [useUsername, setUseUsername] = useState(true);
  const [loading, setLoading] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault()
    if (!value.trim()) {
      toast.error(useUsername ? "Username required" : "Email required");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post("/api/auth/forgot-password", {
        username: value,
        stateAsU: useUsername,
      });

      toast.success("Reset link sent");
      router.push(res.data.url);
    } catch (err) {
      toast.error(err.response?.data?.error);
      console.log("Error:", err.response?.data?.error);
      console.log("Email:", err.response?.data?.email);
      console.log("Pass:", err.response?.data?.pass);
      console.log("Host:", err.response?.data?.host);
      console.log("Port:", err.response?.data?.port);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-8">
        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">
          Forgot Password
        </h1>
        <p className="text-gray-500 text-sm text-center mb-8">
          {useUsername
            ? "Enter your username to reset your password"
            : "Enter your email to recover your account"}
        </p>
        <form onSubmit={submitHandler}>
          {/* Input */}
          <div className="relative mb-5">
            <input
              type={useUsername ? "text" : "email"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="peer w-full border border-gray-300 rounded-lg px-4 py-3
            text-gray-800 placeholder-transparent outline-none
            focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
              placeholder="value"
            />

            <label
              className={`absolute left-4 px-1 bg-white text-gray-500 text-sm
            transition-all duration-200 pointer-events-none
            ${
              value
                ? "-top-2 text-xs text-emerald-600"
                : "top-3 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-emerald-600"
            }`}
            >
              {useUsername ? "Username" : "Email"}
            </label>
          </div>

          {/* Toggle */}
          <button
            type="button"
            onClick={() => {
              setUseUsername(!useUsername);
              setValue("");
            }}
            className="text-sm text-emerald-600 hover:text-emerald-500 transition mb-6 cursor-pointer"
          >
            {useUsername
              ? "Forgot username? Use email instead"
              : "Use username instead"}
          </button>

          {/* Submit */}
          <button
            disabled={loading}
            type="submit"
            className="w-full py-3 rounded-lg font-semibold text-white
          bg-emerald-600 hover:bg-emerald-500 transition
          disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        {/* Footer */}
        <p className="text-xs text-gray-400 text-center mt-6">
          A secure reset code will be sent to you Email
        </p>
      </div>
    </div>
  );
}
