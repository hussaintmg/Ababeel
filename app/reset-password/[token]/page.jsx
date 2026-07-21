"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import AuthTheme from "@/Components/cms/AuthTheme";

export default function ResetPassword() {
  const { token } = useParams();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return router.push("/");

    axios
      .get("/api/auth/check-rp", { params: { token } })
      .then((res) => {
        if (!res.data.valid) {
          toast.error("Invalid or Expired Token");
          router.push("/");
        }
      })
      .catch((err) => {
        console.log(err)
        toast.error("Server error");
        router.push("/");
      });
  }, [token, router]);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8)
      return toast.error("Password must be at least 8 characters long");

    try {
      setLoading(true);
      await axios.post("/api/auth/reset-password", { token, newPassword: password });
      toast.success("Password Updated Successfully");
      router.push("/login");
    } catch {
      toast.error("Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cms-auth min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <AuthTheme page="reset" />
      <div className="cms-auth-card w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
        <h1 className="cms-auth-title text-3xl font-bold text-gray-800 text-center mb-4">
          Reset Password
        </h1>
        <p className="cms-auth-sub text-gray-500 text-center mb-8">
          Enter your new password below to update your account.
        </p>
        <form onSubmit={submit}>
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-gray-600 mb-2 font-medium"
            >
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              className="cms-auth-input w-full border border-gray-300 rounded-lg px-4 py-3
              focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400
              transition text-gray-800 placeholder-gray-400"
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="cms-auth-btn cursor-pointer w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg
            hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        <p className="cms-auth-sub text-sm text-gray-400 text-center mt-6">
          Make sure your password is at least 8 characters long
        </p>
      </div>
    </div>
  );
}
