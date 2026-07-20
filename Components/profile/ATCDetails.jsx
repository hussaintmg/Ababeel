"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const ATCDetails = ({ user, setMessage, clearMessage }) => {
  const { getUserData } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    atcName: "",
    atcNumber: "",
    atcAddress: "",
  });

  // Initialize form with user data
  useEffect(() => {
    if (user?.atcDetails) {
      setFormData({
        atcName: user?.atcDetails.atcName || "",
        atcNumber: user?.atcDetails.atcNumber || "",
        atcAddress: user?.atcDetails.atcAddress || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    clearMessage();

    try {
      const response = await fetch("/api/profile/update-atc", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          atcName: formData.atcName,
          atcNumber: formData.atcNumber,
          atcAddress: formData.atcAddress,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update context/user state
        await getUserData();

        setMessage({
          type: "success",
          text: data.message || "ATC details updated successfully!",
        });

        // Clear message after 5 seconds
        setTimeout(() => {
          clearMessage();
        }, 5000);
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to update ATC details",
        });
      }
    } catch (error) {
      console.error("Error updating ATC details:", error);
      setMessage({
        type: "error",
        text: "An error occurred while updating ATC details",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">ATC Details</h2>
        <p className="text-gray-600 text-sm mt-1">
          Add or update your ATC (Authorized Tax Consultant) information
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ATC Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ATC Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="atcName"
            value={formData.atcName}
            onChange={handleChange}
            disabled={user?.atcDetails?.atcName !== ""}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="Enter ATC name"
            required
            maxLength={100}
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter the full name of your ATC
          </p>
        </div>

        {/* ATC Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ATC Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="atcNumber"
            value={formData.atcNumber}
            onChange={handleChange}
            disabled={user?.atcDetails?.atcNumber !== ""}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="Enter ATC number"
            required
            maxLength={50}
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter your official ATC registration number
          </p>
        </div>

        {/* ATC Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ATC Address <span className="text-red-500">*</span>
          </label>
          <textarea
            name="atcAddress"
            value={formData.atcAddress}
            onChange={handleChange}
            disabled={user?.atcDetails?.atcAddress !== ""}
            rows={4}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
            placeholder="Enter complete ATC address"
            required
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">
            Full address including city and country
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-blue-800 font-medium">Note:</p>
              <p className="text-sm text-blue-700 mt-1">
                ATC (Authorized Tax Consultant) details are required for
                tax-related documentation and official correspondence. Please
                ensure all information is accurate.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center items-center px-4 py-3 rounded-lg font-medium text-white transition-all ${
              isLoading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                {user?.atcDetails?.atcName
                  ? "Update ATC Details"
                  : "Save ATC Details"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ATCDetails;
