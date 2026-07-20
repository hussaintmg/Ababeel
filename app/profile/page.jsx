"use client";

import { useState, useMemo } from "react";
import AccountDetails from "@/Components/profile/AccountDetails";
import SignatureProfile from "@/Components/profile/SignatureProfile";
import PersonalDetails from "@/Components/profile/PersonalDetails";
import ATCDetails from "@/Components/profile/ATCDetails";
import UserInfoCard from "@/Components/profile/UserInfoCard";
import InstructionsPanel from "@/Components/profile/InstructionsPanel";
import { AlertCircle, Check, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("account");
  const [message, setMessage] = useState({ type: "", text: "" });
  // The visible tabs are a function of the user's role, so they are derived
  // during render rather than pushed into state by an effect.
  const tabs = useMemo(() => {
    if (user?.role && ["organization"].includes(user.role)) {
      return [
        { id: "account", label: "Account Details" },
        { id: "signature", label: "Signature & Profile" },
        { id: "personal", label: "Personal Details" },
        { id: "atc", label: "ATC Details" },
      ];
    }
    // Default tabs for every other role, and before the user has loaded.
    return [
      { id: "account", label: "Account Details" },
      { id: "personal", label: "Personal Details" },
    ];
  }, [user]);

  // Clear message after 5 seconds
  const clearMessage = () => setMessage({ type: "", text: "" });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Profile Settings
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your account settings and personal details
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium text-sm md:text-base transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Message Alert */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : message.type === "error"
                ? "bg-red-50 text-red-800 border border-red-200"
                : "bg-blue-50 text-blue-800 border border-blue-200"
            }`}
          >
            <div className="flex items-center">
              {message.type === "success" ? (
                <Check className="w-5 h-5 mr-2" />
              ) : message.type === "error" ? (
                <X className="w-5 h-5 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-2" />
              )}
              <span className="text-sm md:text-base">{message.text}</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Left Column - Forms */}
          <div>
            {activeTab === "account" && (
              <AccountDetails
                user={user}
                setMessage={setMessage}
                clearMessage={clearMessage}
              />
            )}
            {activeTab === "signature" && (
              <SignatureProfile
                user={user}
                setMessage={setMessage}
                clearMessage={clearMessage}
              />
            )}
            {activeTab === "personal" && (
              <PersonalDetails
                user={user}
                setMessage={setMessage}
                clearMessage={clearMessage}
              />
            )}
            {activeTab === "atc" && (
              <ATCDetails
                user={user}
                setMessage={setMessage}
                clearMessage={clearMessage}
              />
            )}
          </div>

          {/* Right Column - Info & Instructions */}
          <div className="space-y-4 md:space-y-6">
            <InstructionsPanel activeTab={activeTab} />
            <UserInfoCard user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}
