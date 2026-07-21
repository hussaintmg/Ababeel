"use client";

import CmsPageContent from "@/Components/cms/CmsPageContent";
import React, { useState, useEffect, use } from "react";
import {
  User,
  Building,
  Phone,
  Mail,
  MessageSquare,
  MapPin,
  Clock,
  Send,
  Globe,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useContact } from "@/context/ContactContext";
import { toast } from "react-toastify";
import { fetchCountries } from "@/utils/countries";
import webData from "@/constants";

const ContactUsInner = () => {
  const [countries, setCountries] = useState([]);
  const [formData, setFormData] = useState({
    contact_fullname: "",
    contact_company: "",
    contact_no: "",
    contact_email: "",
    contact_inquiryreg: "",
    contact_country: "",
    contact_message: "",
    status: "pending",
  });
  const { submitContact } = useContact();

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const inquiryOptions = [
    "--- Inquiry Regarding ---",
    "Organization",
    "Certification",
    "Complaint",
  ];

  useEffect(() => {
    const loadCountries = async () => {
      const countryList = await fetchCountries();
      setCountries([
        "--- Select Country ---",
        ...countryList.map((country) => country.name),
      ]);
    };
    loadCountries();
  }, []);

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

    if (!formData.contact_fullname.trim()) {
      newErrors.contact_fullname = "Contact Name is required";
      toast.error("Contact Name is required");
      return;
    }

    if (!formData.contact_no.trim()) {
      newErrors.contact_no = "Contact No is required";
      toast.error("Contact No is required");
      return;
    }

    if (!formData.contact_email.trim()) {
      newErrors.contact_email = "Email Address is required";
      toast.error("Email Address is required");
      return;
    } else if (!/\S+@\S+\.\S+/.test(formData.contact_email)) {
      newErrors.contact_email = "Email Address is invalid";
      toast.error("Email Address is invalid");
      return;
    }

    if (
      !formData.contact_inquiryreg.trim() ||
      formData.contact_inquiryreg === inquiryOptions[0]
    ) {
      newErrors.contact_inquiryreg = "Please select an inquiry type";
      toast.error("Please select an inquiry type");
      return;
    }

    if (
      !formData.contact_country.trim() ||
      formData.contact_country === countries[0]
    ) {
      newErrors.contact_country = "Please select a country";
      toast.error("Please select a country");
      return;
    }

    if (!formData.contact_message.trim()) {
      newErrors.contact_message = "Message is required";
      toast.error("Message is required");
      return;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    await submitContact(formData);

    // Simulate form submission
    setTimeout(() => {
      console.log("Form submitted:", formData);
      toast.success("Form Submit Successfully!");
      setIsSubmitting(false);
      setSubmitSuccess(true);

      // Reset form after success
      setTimeout(() => {
        setFormData({
          contact_fullname: "",
          contact_company: "",
          contact_no: "",
          contact_email: "",
          contact_inquiryreg: "",
          contact_country: "",
          contact_message: "",
          status: "pending",
        });
        setSubmitSuccess(false);
      }, 3000);
    }, 1500);
  };

  const handleReset = () => {
    setFormData({
      contact_fullname: "",
      contact_company: "",
      contact_no: "",
      contact_email: "",
      contact_inquiryreg: "",
      contact_country: "",
      contact_message: "",
      status: "pending",
    });
    setErrors({});
    setSubmitSuccess(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Contact Us
            </h1>
            <div className="flex justify-center mb-6">
              <div className="h-1.5 w-24 bg-blue-600 rounded-full"></div>
            </div>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Get in touch with {webData.brand.name} for inquiries about organizations,
              certification, or support
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Info Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-blue-100 rounded-lg">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  CONTACT INFO
                </h2>
              </div>

              <div className="space-y-4">
                {(webData.contact.infoEmail || webData.contact.supportEmail) && (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-700">Email:</p>
                    <a
                      href={`mailto:${webData.contact.infoEmail || webData.contact.supportEmail}`}
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {webData.contact.infoEmail || webData.contact.supportEmail}
                    </a>
                  </div>
                </div>
                )}

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-700">Address:</p>
                    <p className="text-gray-600">
                      {webData.contact.address || "Address pending"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Working Hours Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-green-100 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  WORKING HOURS
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="font-medium text-gray-700">Mon-Fri:</p>
                  <p className="text-gray-600">Office 9am-5pm</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Public Holidays:</p>
                  <p className="text-gray-600">Closed</p>
                </div>
              </div>
            </div>

            {/* Global Presence */}
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border border-blue-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Globe className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-800">Global Presence</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Serving clients worldwide with safety certification and organization
                services
              </p>
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-blue-100 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Send Us a Message
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Fill out the form below and we&apos;ll get back to you soon
                  </p>
                </div>
              </div>

              {/* Success Message */}
              {submitSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-800">
                        Message Sent Successfully!
                      </p>
                      <p className="text-green-700 text-sm">
                        Thank you for contacting us. We&apos;ll get back to you
                        shortly.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name & Company */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Contact Name
                    </label>
                    <input
                      type="text"
                      name="contact_fullname"
                      value={formData?.contact_fullname}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className={`w-full px-4 py-3.5 border ${errors.contact_fullname ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-lg`}
                    />
                    {errors.contact_fullname && (
                      <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.contact_fullname}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="contact_company"
                      value={formData.contact_company}
                      onChange={handleInputChange}
                      placeholder="Enter company name"
                      className={`w-full px-4 py-3.5 border ${errors.contact_company ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-lg`}
                    />
                    {errors.contact_company && (
                      <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.contact_company}
                      </p>
                    )}
                  </div>
                </div>

                {/* Phone & Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Contact No.
                    </label>
                    <input
                      type="text"
                      name="contact_no"
                      value={formData.contact_no}
                      onChange={handleInputChange}
                      placeholder="(Code) Contact No"
                      className={`w-full px-4 py-3.5 border ${errors.contact_no ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-lg`}
                    />
                    {errors.contact_no && (
                      <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.contact_no}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      E-Mail Address
                    </label>
                    <input
                      type="email"
                      name="contact_email"
                      value={formData.contact_email}
                      onChange={handleInputChange}
                      placeholder="example@mail.com"
                      className={`w-full px-4 py-3.5 border ${errors.contact_email ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-lg`}
                    />
                    {errors.contact_email && (
                      <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.contact_email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Inquiry Regarding */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inquiry Regarding
                  </label>
                  <select
                    name="contact_inquiryreg"
                    value={formData.contact_inquiryreg}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3.5 border ${errors.contact_inquiryreg ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-lg appearance-none bg-white`}
                  >
                    {inquiryOptions.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {errors.contact_inquiryreg && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.contact_inquiryreg}
                    </p>
                  )}
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <select
                    name="contact_country"
                    value={formData.contact_country}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3.5 border ${errors.contact_country ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-lg appearance-none bg-white`}
                  >
                    {countries.map((country, index) => (
                      <option key={index} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                  {errors.contact_country && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.contact_country}
                    </p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    name="contact_message"
                    value={formData.contact_message}
                    onChange={handleInputChange}
                    placeholder="Write your message here..."
                    rows="6"
                    className={`w-full px-4 py-3.5 border ${errors.contact_message ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-lg resize-none`}
                  />
                  {errors.contact_message && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.contact_message}
                    </p>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Message
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex-1 bg-gray-100 text-gray-700 py-3.5 px-6 rounded-lg font-medium hover:bg-gray-200 transition-all duration-300 border border-gray-300"
                  >
                    Reset Form
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="mt-12">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Our Location
              </h3>
            </div>
            <div className="h-64 md:h-80 bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
                <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-gray-500 text-sm mt-1">
                  {webData.contact.address || "Address pending"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContactUs = () => (
  <CmsPageContent pageKey="contact-us">
    <ContactUsInner />
  </CmsPageContent>
);

export default ContactUs;
