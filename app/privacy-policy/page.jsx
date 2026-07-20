"use client";

import { useState } from "react";
import {
  Shield,
  Lock,
  Eye,
  Database,
  UserCheck,
  FileText,
  Mail,
  Phone,
  Building,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import webData from "@/constants";

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState("overview");
  const [expandedSections, setExpandedSections] = useState(["data-collection"]);

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId],
    );
  };

  const navigationItems = [
    { id: "overview", label: "Overview", icon: Shield },
    { id: "data-collection", label: "Data Collection", icon: Database },
    { id: "data-usage", label: "Data Usage", icon: Eye },
    { id: "data-protection", label: "Data Protection", icon: Lock },
    { id: "user-rights", label: "Your Rights", icon: UserCheck },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-900 to-blue-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-40 right-10 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-6">
              <Shield className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Privacy & Data Protection Policy
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              At {webData.brand.name}, we are committed to protecting your
              privacy and ensuring the security of your personal information.
              Learn how we collect, use, and protect your data.
            </p>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white text-sm font-medium px-6 py-3 rounded-full">
              <Calendar className="w-4 h-4" />
              Last Updated: December 1, 2024
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Navigation */}
          <div className="lg:w-1/4">
            <div className="sticky top-24 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Policy Sections
              </h3>
              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                        activeSection === item.id
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Right Content */}
          <div className="lg:w-3/4">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Content Navigation */}
              <div className="border-b border-gray-200 p-6">
                <div className="flex flex-wrap gap-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                          activeSection === item.id
                            ? "bg-blue-100 text-blue-700"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content Sections */}
              <div className="p-6 md:p-8">
                {/* Overview Section */}
                {activeSection === "overview" && (
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Shield className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                          Privacy Policy Overview
                        </h2>
                        <p className="text-gray-600 mb-4">
                          Welcome to {webData.brand.name}&apos;s Privacy Policy.
                          This document outlines how we collect, use, disclose,
                          and safeguard your information when you visit our
                          website or use our certification services.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
                      <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100">
                        <div className="inline-flex p-3 bg-blue-100 rounded-lg mb-4">
                          <Lock className="w-6 h-6 text-blue-600" />
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2">
                          Data Security
                        </h4>
                        <p className="text-sm text-gray-600">
                          Advanced encryption and security measures to protect
                          your personal information
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl border border-green-100">
                        <div className="inline-flex p-3 bg-green-100 rounded-lg mb-4">
                          <Eye className="w-6 h-6 text-green-600" />
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2">
                          Transparency
                        </h4>
                        <p className="text-sm text-gray-600">
                          Clear communication about how we collect and use your
                          data
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl border border-purple-100">
                        <div className="inline-flex p-3 bg-purple-100 rounded-lg mb-4">
                          <UserCheck className="w-6 h-6 text-purple-600" />
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2">
                          User Control
                        </h4>
                        <p className="text-sm text-gray-600">
                          Full control over your personal data and privacy
                          preferences
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-3">
                        Key Principles
                      </h3>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600">
                            We never sell your personal data to third parties
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600">
                            We collect only necessary data for service provision
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600">
                            You have the right to access, modify, or delete your
                            data
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600">
                            All data transfers are encrypted and secure
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Data Collection Section */}
                {activeSection === "data-collection" && (
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Database className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                          Data We Collect
                        </h2>
                        <p className="text-gray-600 mb-4">
                          We collect various types of information to provide and
                          improve our safety certification services.
                        </p>
                      </div>
                    </div>

                    {/* Expandable Sections */}
                    <div className="space-y-4">
                      {[
                        {
                          id: "personal-info",
                          title: "Personal Information",
                          content:
                            "When you register for our certification programs, we collect your name, email address, phone number, company details, and professional qualifications. This information is necessary for course enrollment, certification, and communication.",
                          icon: UserCheck,
                        },
                        {
                          id: "certification-data",
                          title: "Certification Progress & Performance",
                          content:
                            "We track your course progress, quiz scores, completion times, and assessment results. This data helps us provide personalized learning experiences and generate certification certificates.",
                          icon: FileText,
                        },
                        {
                          id: "technical-data",
                          title: "Technical Information",
                          content:
                            "Automatically collected data includes IP address, browser type, device information, operating system, and usage patterns. This helps us optimize website performance and user experience.",
                          icon: Eye,
                        },
                        {
                          id: "communication-data",
                          title: "Communication Data",
                          content:
                            "Records of our communications including emails, chat logs, and support tickets. We keep these to provide better customer service and resolve issues efficiently.",
                          icon: Mail,
                        },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isExpanded = expandedSections.includes(item.id);

                        return (
                          <div
                            key={item.id}
                            className="border border-gray-200 rounded-xl overflow-hidden"
                          >
                            <button
                              onClick={() => toggleSection(item.id)}
                              className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg">
                                  <Icon className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="font-semibold text-gray-900">
                                  {item.title}
                                </span>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-500" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-500" />
                              )}
                            </button>
                            {isExpanded && (
                              <div className="px-6 py-4 bg-white">
                                <p className="text-gray-600">{item.content}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                      <h4 className="font-bold text-gray-900 mb-3">
                        Data Minimization Principle
                      </h4>
                      <p className="text-gray-600 mb-3">
                        We adhere to the data minimization principle, collecting
                        only the information that is:
                      </p>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-600">
                            Adequate - sufficient to fulfill the specified
                            purpose
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-600">
                            Relevant - has a rational link to the purpose
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-600">
                            Limited - collected for specified, explicit purposes
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Data Usage Section */}
                {activeSection === "data-usage" && (
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Eye className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                          How We Use Your Data
                        </h2>
                        <p className="text-gray-600 mb-4">
                          Your data is used solely for legitimate business
                          purposes and to enhance your certification experience.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        {
                          title: "Certification Delivery",
                          description:
                            "To provide access to courses, track progress, and issue certifications",
                          color: "blue",
                        },
                        {
                          title: "Communication",
                          description:
                            "To send course updates, reminders, and important announcements",
                          color: "green",
                        },
                        {
                          title: "Service Improvement",
                          description:
                            "To analyze usage patterns and enhance our certification platform",
                          color: "purple",
                        },
                        {
                          title: "Compliance",
                          description:
                            "To meet regulatory requirements and maintain certification records",
                          color: "orange",
                        },
                        {
                          title: "Support Services",
                          description:
                            "To provide technical support and resolve user inquiries",
                          color: "red",
                        },
                        {
                          title: "Research & Development",
                          description:
                            "To develop new certification modules and improve safety education",
                          color: "indigo",
                        },
                      ].map((item, index) => (
                        <div
                          key={index}
                          className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div
                              className={`p-2 rounded-lg bg-${item.color}-100`}
                            >
                              <div
                                className={`w-6 h-6 rounded-full bg-${item.color}-500 flex items-center justify-center`}
                              >
                                <span className="text-white font-bold text-sm">
                                  {index + 1}
                                </span>
                              </div>
                            </div>
                            <h4 className="font-bold text-gray-900">
                              {item.title}
                            </h4>
                          </div>
                          <p className="text-gray-600 text-sm">
                            {item.description}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="font-bold text-gray-900 mb-3">
                        Legal Basis for Processing
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-1">
                              Contractual Necessity
                            </h5>
                            <p className="text-gray-600 text-sm">
                              Processing is necessary for the performance of our
                              certification service contract
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-1">
                              Legitimate Interest
                            </h5>
                            <p className="text-gray-600 text-sm">
                              Processing is necessary for our legitimate
                              business interests
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <UserCheck className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-1">
                              Consent
                            </h5>
                            <p className="text-gray-600 text-sm">
                              Processing based on your explicit consent for
                              specific purposes
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Data Protection Section */}
                {activeSection === "data-protection" && (
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Lock className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                          Data Protection Measures
                        </h2>
                        <p className="text-gray-600 mb-4">
                          We implement robust security measures to protect your
                          data from unauthorized access, alteration, or
                          disclosure.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                      {/* <div className="space-y-6">
                        <h3 className="text-xl font-bold text-gray-900">
                          Security Technologies
                        </h3>
                        {[
                          {
                            title: "End-to-End Encryption",
                            description:
                              "All data transmissions are protected with TLS 1.3 encryption",
                            level: "100%",
                          },
                          {
                            title: "Secure Data Centers",
                            description:
                              "ISO 27001 certified facilities with 24/7 monitoring",
                            level: "100%",
                          },
                          {
                            title: "Access Controls",
                            description:
                              "Role-based access with multi-factor authentication",
                            level: "95%",
                          },
                          {
                            title: "Regular Audits",
                            description:
                              "Quarterly security assessments and penetration testing",
                            level: "90%",
                          },
                        ].map((item, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-900">
                                {item.title}
                              </span>
                              <span className="text-sm font-semibold text-blue-600">
                                {item.level}
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                                style={{ width: item.level }}
                              ></div>
                            </div>
                            <p className="text-sm text-gray-600">
                              {item.description}
                            </p>
                          </div>
                        ))}
                      </div> */}

                      <div className="space-y-6">
                        <h3 className="text-xl font-bold text-gray-900">
                          Protection Framework
                        </h3>
                        <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100">
                          <h4 className="font-bold text-gray-900 mb-4">
                            Our Security Standards
                          </h4>
                          <div className="space-y-4">
                            {[
                              "Regular security certification for all employees",
                              "Data breach response protocol",
                              "Secure coding practices",
                              "Vulnerability management program",
                              "Incident monitoring and logging",
                              "Business continuity planning",
                            ].map((item, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-3"
                              >
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                </div>
                                <span className="text-gray-700">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-100">
                      <h4 className="font-bold text-gray-900 mb-3">
                        ⚠️ Data Retention Policy
                      </h4>
                      <p className="text-gray-600 mb-3">
                        We retain personal data only for as long as necessary to
                        fulfill the purposes for which it was collected:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="bg-white p-3 rounded-lg">
                          <div className="font-semibold text-gray-900 mb-1">
                            Certification Records
                          </div>
                          <div className="text-gray-600">
                            7 years from completion
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <div className="font-semibold text-gray-900 mb-1">
                            User Accounts
                          </div>
                          <div className="text-gray-600">
                            2 years after last activity
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <div className="font-semibold text-gray-900 mb-1">
                            Financial Data
                          </div>
                          <div className="text-gray-600">
                            10 years for tax purposes
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* User Rights Section */}
                {activeSection === "user-rights" && (
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <UserCheck className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                          Your Data Protection Rights
                        </h2>
                        <p className="text-gray-600 mb-4">
                          You have comprehensive rights regarding your personal
                          data under data protection laws.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        {
                          title: "Right to Access",
                          description: "Request copies of your personal data",
                          color: "blue",
                          icon: "👁️",
                        },
                        {
                          title: "Right to Rectification",
                          description: "Request correction of inaccurate data",
                          color: "green",
                          icon: "✏️",
                        },
                        {
                          title: "Right to Erasure",
                          description: "Request deletion of your personal data",
                          color: "red",
                          icon: "🗑️",
                        },
                        {
                          title: "Right to Restriction",
                          description: "Request restriction of processing",
                          color: "yellow",
                          icon: "⏸️",
                        },
                        {
                          title: "Right to Portability",
                          description:
                            "Request transfer of data to another organization",
                          color: "purple",
                          icon: "📤",
                        },
                        {
                          title: "Right to Object",
                          description:
                            "Object to processing of your personal data",
                          color: "orange",
                          icon: "🚫",
                        },
                      ].map((right, index) => (
                        <div
                          key={index}
                          className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-300"
                        >
                          <div className="flex items-start gap-4">
                            <div className="text-2xl">{right.icon}</div>
                            <div>
                              <h4 className="font-bold text-gray-900 mb-2">
                                {right.title}
                              </h4>
                              <p className="text-gray-600 text-sm">
                                {right.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                      <h4 className="font-bold text-gray-900 mb-4">
                        How to Exercise Your Rights
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 font-bold">1</span>
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-1">
                              Submit Request
                            </h5>
                            <p className="text-gray-600 text-sm">
                              Contact our Data Protection Officer via email or
                              the contact form below
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 font-bold">2</span>
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-1">
                              Identity Verification
                            </h5>
                            <p className="text-gray-600 text-sm">
                              We&apos;ll verify your identity to ensure data security
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 font-bold">3</span>
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-1">
                              Response Timeline
                            </h5>
                            <p className="text-gray-600 text-sm">
                              We respond to all legitimate requests within 30
                              days
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Policy Updates */}
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">
                      Policy Updates
                    </h4>
                    <p className="text-gray-600 text-sm">
                      We may update this privacy policy periodically. Continued
                      use of our services constitutes acceptance of changes.
                    </p>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-900 font-semibold">
                      Version: 3.2
                    </div>
                    <div className="text-gray-600">
                      Effective: December 1, 2024
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
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
      `}</style>
    </div>
  );
}
