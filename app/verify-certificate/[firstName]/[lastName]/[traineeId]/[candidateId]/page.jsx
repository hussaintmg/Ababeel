"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  User,
  BookOpen,
  Hash,
  Calendar,
  Award,
  Shield,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { webData } from "@/constants";

export default function VerifyCertificatePage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyCertificate = async () => {
      try {
        // Extract parameters from URL
        const firstName = params?.firstName || "";
        const lastName = params?.lastName || "";
        const traineeId = params?.traineeId || "";
        const candidateId = params?.candidateId || "";

        // Decode URL encoded values
        const decodedFirstName = decodeURIComponent(firstName);
        const decodedLastName = decodeURIComponent(lastName);
        const decodedTraineeId = decodeURIComponent(traineeId);
        const decodedCandidateId = decodeURIComponent(candidateId);

        // Validate parameters
        if (
          !decodedFirstName ||
          !decodedLastName ||
          !decodedTraineeId ||
          !decodedCandidateId
        ) {
          setError({
            message: "Invalid verification link. Missing required parameters.",
          });
          setLoading(false);
          return;
        }

        // Send verification request
        const response = await axios.post("/api/verify-certificate-via-link", {
          traineeId: decodedTraineeId,
          candidateId: decodedCandidateId,
          cnd_fname: decodedFirstName,
          cnd_lname: decodedLastName,
        });

        setResult(response.data);
      } catch (err) {
        console.error("Verification error:", err);
        setError(
          err.response?.data || { message: "Failed to verify certificate" },
        );
      } finally {
        setLoading(false);
      }
    };

    verifyCertificate();
  }, [params]);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative flex flex-col items-center justify-center min-h-screen p-4">
          {/* Logo or Icon */}
          <div className="mb-8 animate-pulse">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl rotate-45 transform hover:rotate-0 transition-transform duration-700"></div>
          </div>

          {/* Loading Card */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-100">
            <div className="flex flex-col items-center text-center">
              {/* Spinner Container */}
              <div className="relative mb-6">
                <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <Shield className="w-8 h-8 text-blue-500 animate-pulse" />
                </div>
              </div>

              {/* Loading Text */}
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Verifying Certificate
              </h2>
              <p className="text-gray-600 mb-4">
                Please wait while we verify the authenticity of this
                certificate...
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full animate-progress"></div>
              </div>

              {/* Loading Steps */}
              <div className="space-y-3 w-full">
                <div className="flex items-center gap-3 text-gray-500">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Checking trainee records...</span>
                </div>
                <div className="flex items-center gap-3 text-gray-500">
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                  <span className="text-sm">
                    Validating certificate details...
                  </span>
                </div>
                <div className="flex items-center gap-3 text-gray-500">
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                  <span className="text-sm">
                    Preparing verification result...
                  </span>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="mt-6 flex gap-2">
                <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-300 rounded-full animate-bounce animation-delay-100"></div>
                <div className="w-2 h-2 bg-pink-300 rounded-full animate-bounce animation-delay-200"></div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-8 text-sm text-gray-500">
            Powered by {webData.brand.name} Secure Verification System
          </p>
        </div>

        <style jsx>{`
          @keyframes blob {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            33% {
              transform: translate(30px, -50px) scale(1.1);
            }
            66% {
              transform: translate(-20px, 20px) scale(0.9);
            }
            100% {
              transform: translate(0px, 0px) scale(1);
            }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
          .animation-delay-100 {
            animation-delay: 0.1s;
          }
          .animation-delay-200 {
            animation-delay: 0.2s;
          }
          @keyframes progress {
            0% {
              width: 0%;
            }
            50% {
              width: 70%;
            }
            100% {
              width: 100%;
            }
          }
          .animate-progress {
            animation: progress 2s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          {/* Error Header */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-lg">
              <XCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              Verification Failed
            </h2>
          </div>

          {/* Error Content */}
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-700 font-medium">
                    Unable to verify certificate
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    {error.message ||
                      "The certificate could not be verified. Please check the link and try again."}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/"
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors text-center"
              >
                Go to Home
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>

            {/* Help Text */}
            {(webData.contact.infoEmail || webData.contact.supportEmail) && (
            <p className="text-xs text-gray-500 text-center mt-6">
              If you believe this is an error, please contact support at{" "}
              <a
                href={`mailto:${webData.contact.infoEmail || webData.contact.supportEmail}`}
                className="text-blue-600 hover:underline"
              >
                {webData.contact.infoEmail || webData.contact.supportEmail}
              </a>
            </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Success State
  if (result?.success) {
    const certificate = result.certificate;
    const course = result.courseReference;

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Certificate Verified
            </h1>
            <p className="text-gray-600">
              This certificate has been verified as authentic and valid
            </p>
          </div>

          {/* Certificate Card */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-green-100">
            {/* Certificate Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {webData.brand.name} Certificate
                  </h2>
                  <p className="text-green-100">
                    Verified by {webData.brand.name} Secure System
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Award className="w-8 h-8" />
                </div>
              </div>
            </div>

            {/* Certificate Content */}
            <div className="p-6 md:p-8">
              {/* Verification Badge */}
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <CheckCircle className="w-4 h-4" />
                <span>Verification ID: {certificate.verificationId}</span>
              </div>

              {/* Certificate Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Trainee Info */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">
                      Trainee Information
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Full Name</p>
                      <p className="font-medium text-gray-900">
                        {certificate.fullName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Trainee ID</p>
                      <p className="font-medium text-gray-900 font-mono">
                        {certificate.traineeId}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Course Info */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <BookOpen className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">
                      Course Information
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Course Name</p>
                      <p className="font-medium text-gray-900">
                        {certificate.course}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Training Provider</p>
                      <p className="font-medium text-gray-900">
                        {course.atcName}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow-md">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900">
                      Certificate Validity
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {/* Issue Date */}
                    <div className="flex items-center justify-between border-b border-amber-200/50 pb-2">
                      <span className="text-sm text-gray-600">Issue Date:</span>
                      <span className="font-medium text-gray-900 bg-white px-3 py-1 rounded-full text-sm shadow-sm">
                        {course.startDate
                          ? new Date(course.startDate).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "N/A"}
                      </span>
                    </div>

                    {/* Expiry Date */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Valid Until:
                      </span>
                      <div className="flex items-center gap-2">
                        {/* Status Indicator */}
                        {new Date(course.endDate) > new Date() ? (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                        ) : (
                          <span className="flex h-2 w-2 relative">
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                        )}

                        {/* Date Display */}
                        <span
                          className={`
          font-bold px-4 py-1.5 rounded-lg text-sm
          ${
            new Date(course.endDate) > new Date()
              ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-200"
              : "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-200"
          }
        `}
                        >
                          {course.endDate
                            ? new Date(course.endDate).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-6">
            This verification is provided by {webData.brand.name} Secure System.{(webData.contact.infoEmail || webData.contact.supportEmail) && ` For any inquiries, please contact ${webData.contact.infoEmail || webData.contact.supportEmail}`}
          </p>
        </div>
      </div>
    );
  }

  // Fallback (should rarely happen)
  return null;
}
