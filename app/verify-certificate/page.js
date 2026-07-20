"use client";

import React, { useState } from "react";
import {
  Search,
  ShieldCheck,
  User,
  FileText,
  Calendar,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle,
  XCircle,
  Award,
  Hash,
  BookOpen,
  Clock,
} from "lucide-react";
import webData from "@/constants";

const CertificateVerification = () => {
  const [formData, setFormData] = useState({
    searchOption: "1", // 1 = without DOB, 2 = with DOB
    certificateNumber: "",
    cnd_fname: "",
    cnd_lname: "",
    cnd_dob: "",
  });

  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const toggleDOBField = (value) => {
    setFormData((prev) => ({
      ...prev,
      searchOption: value,
      cnd_dob: value === "1" ? "" : prev.cnd_dob,
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.certificateNumber.trim()) {
      newErrors.certificateNumber = "Certificate Number is required";
    }

    if (!formData.cnd_fname.trim()) {
      newErrors.cnd_fname = "First Name is required";
    }

    if (!formData.cnd_lname.trim()) {
      newErrors.cnd_lname = "Surname is required";
    }

    if (formData.searchOption === "2" && !formData.cnd_dob) {
      newErrors.cnd_dob = "Date of Birth is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/verify-certificate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      setVerificationResult(data);
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationResult({
        success: false,
        message:
          "An error occurred during verification. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      searchOption: "1",
      certificateNumber: "",
      cnd_fname: "",
      cnd_lname: "",
      cnd_dob: "",
    });
    setVerificationResult(null);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center p-3 sm:p-4 bg-blue-100 rounded-xl sm:rounded-2xl mb-4 sm:mb-6">
              <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-blue-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
              {webData.brand.name} Trainee Verification
            </h1>
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="h-1 w-16 sm:w-20 lg:w-24 bg-blue-600 rounded-full"></div>
            </div>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Verify the authenticity of {webData.brand.name} trainee records instantly and
              securely
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Form Section */}
          <div className="p-4 sm:p-6 lg:p-8">
            <form
              onSubmit={handleSubmit}
              className="space-y-5 sm:space-y-6 lg:space-y-8"
            >
              {/* Search Option */}
              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    Search Option
                  </span>
                </label>
                <div className="relative">
                  <select
                    id="searchOption"
                    value={formData.searchOption}
                    onChange={(e) => toggleDOBField(e.target.value)}
                    className="w-full px-4 sm:px-5 py-3 sm:py-3.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none appearance-none bg-white pr-10"
                  >
                    <option value="1">Search without DOB (Faster)</option>
                    <option value="2">Search with DOB (More Secure)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-2">
                  {formData.searchOption === "1"
                    ? "Quick verification using Trainee ID and Name only"
                    : "Enhanced verification including Date of Birth for additional security"}
                </p>
              </div>

              {/* DOB Field - Conditionally Rendered */}
              {formData.searchOption === "2" && (
                <div className="animate-fadeIn">
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      Date of Birth
                    </span>
                  </label>
                  <input
                    type="date"
                    lang="en-GB"
                    name="cnd_dob"
                    value={formData.cnd_dob}
                    onChange={handleInputChange}
                    className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 text-sm sm:text-base border ${errors.cnd_dob ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none`}
                  />
                  {errors.cnd_dob && (
                    <p className="text-xs sm:text-sm text-red-600 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      {errors.cnd_dob}
                    </p>
                  )}
                </div>
              )}

              {/* Certificate Number */}
              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <Hash className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    Certificate Number
                  </span>
                </label>
                <input
                  type="text"
                  name="certificateNumber"
                  value={formData.certificateNumber}
                  onChange={handleInputChange}
                  placeholder={`Enter Certificate Number (e.g., ${webData.documents.certificatePrefix}-V-XXXXXX)`}
                  className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 text-sm sm:text-base border ${errors.certificateNumber ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none`}
                />
                {errors.certificateNumber && (
                  <p className="text-xs sm:text-sm text-red-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    {errors.certificateNumber}
                  </p>
                )}
              </div>

              {/* First Name and Surname */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="cnd_fname"
                    value={formData.cnd_fname}
                    onChange={handleInputChange}
                    placeholder="Enter First Name"
                    className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 text-sm sm:text-base border ${errors.cnd_fname ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none`}
                  />
                  {errors.cnd_fname && (
                    <p className="text-xs sm:text-sm text-red-600 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      {errors.cnd_fname}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    Surname
                  </label>
                  <input
                    type="text"
                    name="cnd_lname"
                    value={formData.cnd_lname}
                    onChange={handleInputChange}
                    placeholder="Enter Surname"
                    className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 text-sm sm:text-base border ${errors.cnd_lname ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none`}
                  />
                  {errors.cnd_lname && (
                    <p className="text-xs sm:text-sm text-red-600 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      {errors.cnd_lname}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-5 lg:pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:flex-1 bg-blue-600 text-white py-3.5 sm:py-4 px-4 sm:px-6 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Verify Trainee</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:flex-1 bg-gray-100 text-gray-700 py-3.5 sm:py-4 px-4 sm:px-6 rounded-lg font-medium hover:bg-gray-200 transition-all duration-300 border border-gray-300 text-sm sm:text-base"
                >
                  Reset Form
                </button>
              </div>
            </form>

            {/* Verification Result */}
            {verificationResult && (
              <div
                className={`mt-6 sm:mt-8 p-4 sm:p-6 lg:p-8 rounded-xl border-2 ${verificationResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"} transition-all duration-500 animate-slideUp`}
              >
                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                  <div
                    className={`p-3 sm:p-4 rounded-full ${verificationResult.success ? "bg-green-100" : "bg-red-100"} flex-shrink-0`}
                  >
                    {verificationResult.success ? (
                      <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-green-600" />
                    ) : (
                      <XCircle className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 w-full">
                    <h3
                      className={`text-lg sm:text-xl lg:text-2xl font-bold ${verificationResult.success ? "text-green-800" : "text-red-800"} mb-2`}
                    >
                      {verificationResult.success
                        ? "Trainee Verified Successfully!"
                        : "Trainee Not Found"}
                    </h3>
                    <p
                      className={`text-sm sm:text-base ${verificationResult.success ? "text-green-700" : "text-red-700"} mb-4 sm:mb-6`}
                    >
                      {verificationResult.success
                        ? `This ${webData.brand.name} trainee record has been verified as authentic and valid.`
                        : verificationResult.message ||
                          "The trainee details you provided could not be verified. Please check the information and try again."}
                    </p>

                    {verificationResult.success && (
                      <>
                        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                          <div className="bg-white p-3 sm:p-4 rounded-lg border border-green-100">
                            <p className="text-xs text-gray-600 mb-1">
                              Trainee ID
                            </p>
                            <p className="text-sm sm:text-base font-semibold text-gray-800 break-all">
                              {verificationResult.certificate.traineeId}
                            </p>
                          </div>
                          <div className="bg-white p-3 sm:p-4 rounded-lg border border-green-100">
                            <p className="text-xs text-gray-600 mb-1">Status</p>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <p className="text-sm sm:text-base font-semibold text-green-600">
                                {verificationResult.certificate.status}
                              </p>
                            </div>
                          </div>
                          <div className="bg-white p-3 sm:p-4 rounded-lg border border-green-100">
                            <p className="text-xs text-gray-600 mb-1">Course</p>
                            <p className="text-sm sm:text-base font-semibold text-gray-800 break-words">
                              {verificationResult.certificate.course}
                            </p>
                          </div>
                          <div className="bg-white p-3 sm:p-4 rounded-lg border border-green-100">
                            <p className="text-xs text-gray-600 mb-1">
                              Training Provider
                            </p>
                            <p className="text-sm sm:text-base font-semibold text-gray-800">
                              {verificationResult.courseReference.atcName}
                            </p>
                          </div>
                        </div>

                        {/* Additional Course Details */}
                        {verificationResult.certificate.courseCode && (
                          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                            <div className="bg-white p-3 sm:p-4 rounded-lg border border-green-100">
                              <p className="text-xs text-gray-600 mb-1">
                                Course Code
                              </p>
                              <p className="text-sm sm:text-base font-semibold text-gray-800">
                                {verificationResult.certificate.courseCode}
                              </p>
                            </div>
                            <div className="bg-white p-3 sm:p-4 rounded-lg border border-green-100">
                              <p className="text-xs text-gray-600 mb-1">
                                Duration
                              </p>
                              <p className="text-sm sm:text-base font-semibold text-gray-800">
                                {verificationResult.certificate.courseDuration}
                              </p>
                            </div>
                            <div className="bg-white p-3 sm:p-4 rounded-lg border border-green-100">
                              <p className="text-xs text-gray-600 mb-1">
                                ATC Name
                              </p>
                              <p className="text-sm sm:text-base font-semibold text-gray-800">
                                {verificationResult.certificate.atcName}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="bg-white p-4 sm:p-6 rounded-lg border border-green-100">
                          <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                            <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                            Trainee Information
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                            <div>
                              <p className="text-xs text-gray-600 mb-1">
                                Full Name
                              </p>
                              <p className="text-sm sm:text-base font-medium text-gray-800 break-words">
                                {verificationResult.certificate.fullName}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">
                                Issue Date
                              </p>
                              <p className="text-sm sm:text-base font-medium text-gray-800">
                                {verificationResult.courseReference.startDate
                                  ? new Date(
                                      verificationResult.courseReference
                                        .startDate,
                                    ).toLocaleDateString("en-GB", {
                                      day: "2-digit",
                                      month: "long",
                                      year: "numeric",
                                    })
                                  : "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">
                                Expiry Date
                              </p>
                              <p className="text-sm sm:text-base font-medium text-gray-800">
                                {verificationResult.courseReference.endDate
                                  ? new Date(
                                      verificationResult.courseReference
                                        .endDate,
                                    ).toLocaleDateString("en-GB", {
                                      day: "2-digit",
                                      month: "long",
                                      year: "numeric",
                                    })
                                  : "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
              <div className="bg-blue-50 rounded-xl p-4 sm:p-6">
                <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  Need Assistance?
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                  If you encounter any issues with certificate verification or
                  have questions, please contact us:
                </p>
                <div className="space-y-2">
                  {(webData.contact.infoEmail || webData.contact.supportEmail) && (
                  <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                    <a
                      href={`mailto:${webData.contact.infoEmail || webData.contact.supportEmail}`}
                      className="text-sm sm:text-base text-blue-600 hover:text-blue-700 break-all"
                    >
                      {webData.contact.infoEmail || webData.contact.supportEmail}
                    </a>
                  </div>
                  )}
                  <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                    <a
                      href={`tel:${webData.contact.phone ? webData.contact.phone.replace(/\D/g, '').replace(/^44/, '+44') : '+4401234567890'}`}
                      className="text-sm sm:text-base text-blue-600 hover:text-blue-700"
                    >
                      {webData.contact.phone || "+44 (0) 123 456 7890"}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateVerification;
