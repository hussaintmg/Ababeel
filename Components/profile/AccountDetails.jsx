"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createApiClient } from "@/utils/api";
import { User, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

export default function AccountDetails({ user }) {
  const { getUserData } = useAuth();
  const api = createApiClient();

  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [username, setUsername] = useState(user?.username || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState({
    username: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const validateUsername = () => {
    if (!username.trim()) {
      setErrors((prev) => ({ ...prev, username: "Username is required" }));
      return false;
    }
    if (username.length < 3) {
      setErrors((prev) => ({
        ...prev,
        username: "Username must be at least 3 characters",
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, username: "" }));
    return true;
  };

  const validatePassword = () => {
    let isValid = true;
    const newErrors = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    };

    if (!currentPassword.trim()) {
      newErrors.currentPassword = "Current password is required";
      isValid = false;
    }

    if (newPassword.length < 8) {
      newErrors.newPassword = "New password must be at least 8 characters";
      isValid = false;
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
      isValid = false;
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return isValid;
  };

  const handleUpdateUsername = async () => {
    if (!validateUsername()) return;

    setIsLoading(true);
    try {
      const response = await api.post("/api/profile/update-username", {
        username,
      });
      if (response.data.success) {
        toast.success(
          response.data.message || "Username updated successfully!"
        );
        getUserData();
      }
    } catch (error) {
      console.error("Username update error:", error);
      // Error is already handled by interceptor
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!validatePassword()) return;

    setIsPasswordLoading(true);
    try {
      const response = await api.post("/api/profile/update-password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (response.data.success) {
        toast.success(
          response.data.message || "Password updated successfully!"
        );
        // Clear password fields
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        getUserData();
        setErrors({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      console.error("Password update error:", error);
      // Error is already handled by interceptor
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 md:mb-6">
        Account Details
      </h2>

      <div className="space-y-6">
        {/* Username Section */}
        <div>
          <div className="flex items-center justify-between my-2">
            <label className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <button
              onClick={handleUpdateUsername}
              disabled={isLoading || username === user?.username}
              className="py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-25"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update"
              )}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (errors.username)
                  setErrors((prev) => ({ ...prev, username: "" }));
              }}
              onBlur={validateUsername}
              className="pl-10! w-full px-3 py-2.5 md:px-4 md:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm md:text-base"
              placeholder="Enter your username"
            />
          </div>
          {errors.username && (
            <p className="mt-1 text-sm text-red-600">{errors.username}</p>
          )}
        </div>

        {/* Password Update Section */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <h3 className="text-base font-medium text-gray-900">
            Change Password
          </h3>
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 my-2">
                Current Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (errors.currentPassword)
                      setErrors((prev) => ({ ...prev, currentPassword: "" }));
                  }}
                  className="pl-10! w-full px-3 py-2.5 md:px-4 md:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm md:text-base"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.currentPassword}
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 my-2">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.newPassword)
                      setErrors((prev) => ({ ...prev, newPassword: "" }));
                  }}
                  className="pl-10! w-full px-3 py-2.5 md:px-4 md:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm md:text-base"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.newPassword}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 my-2">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword)
                      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                  }}
                  className="pl-10! w-full px-3 py-2.5 md:px-4 md:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm md:text-base"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword}
                </p>
              )}

              {/* Password match indicator */}
              {newPassword && confirmPassword && (
                <div
                  className={`mt-1 text-sm ${
                    newPassword === confirmPassword
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {newPassword === confirmPassword
                    ? "✓ Passwords match"
                    : "✗ Passwords do not match"}
                </div>
              )}
            </div>

            {/* Update Password Button */}
            <button
              onClick={handleUpdatePassword}
              disabled={
                isPasswordLoading ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
              className="mt-5 w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm md:text-base"
            >
              {isPasswordLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Updating Password...
                </>
              ) : (
                "Update Password"
              )}
            </button>
        </div>
      </div>
    </div>
  );
}
