// Extracted from app/contact-us/page.js; original layouts with typed CMS content.
"use client";

import React, { useState, useEffect, use } from "react";
import { User, Building, Phone, Mail, MessageSquare, MapPin, Clock, Send, Globe, AlertCircle, CheckCircle } from "lucide-react";
import { useContact } from "@/context/ContactContext";
import { toast } from "react-toastify";
import { fetchCountries } from "@/utils/countries";
import webData from "@/constants";
import defaults from "./contact-us.defaults.json";
export default function PublicPage(cmsProps = {}) {
  const cms = {
    ...defaults,
    ...cmsProps
  };
  const [countries, setCountries] = useState([]);
  const [formData, setFormData] = useState({
    contact_fullname: "",
    contact_company: "",
    contact_no: "",
    contact_email: "",
    contact_inquiryreg: "",
    contact_country: "",
    contact_message: "",
    status: "pending"
  });
  const {
    submitContact
  } = useContact();
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const inquiryOptions = ["--- Inquiry Regarding ---", "Organization", "Certification", "Complaint"];
  useEffect(() => {
    const loadCountries = async () => {
      const countryList = await fetchCountries();
      setCountries(["--- Select Country ---", ...countryList.map(country => country.name)]);
    };
    loadCountries();
  }, []);
  const handleInputChange = e => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
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
    if (!formData.contact_inquiryreg.trim() || formData.contact_inquiryreg === inquiryOptions[0]) {
      newErrors.contact_inquiryreg = "Please select an inquiry type";
      toast.error("Please select an inquiry type");
      return;
    }
    if (!formData.contact_country.trim() || formData.contact_country === countries[0]) {
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
  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    await submitContact(formData);
    setTimeout(() => {
      console.log("Form submitted:", formData);
      toast.success("Form Submit Successfully!");
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setTimeout(() => {
        setFormData({
          contact_fullname: "",
          contact_company: "",
          contact_no: "",
          contact_email: "",
          contact_inquiryreg: "",
          contact_country: "",
          contact_message: "",
          status: "pending"
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
      status: "pending"
    });
    setErrors({});
    setSubmitSuccess(false);
  };
  return <div className=" bg-gradient-to-b from-gray-50 to-white">
      {}
      {(cmsProps.section == null || cmsProps.section === 0) && <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{cms.Heading_Contact_Us_1}</h1>
            <div className="flex justify-center mb-6">
              <div className="h-1.5 w-24 bg-blue-600 rounded-full"></div>
            </div>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">{cms.Description_Get_in_touch_with_2}{webData.brand.name}{cms.Description_for_inquiries_about_organizations__certification_3}</p>
          </div>
        </div>
      </div>}

      {}
      {(cmsProps.section == null || cmsProps.section === 1) && <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {}
          <div className="lg:col-span-1 space-y-6">
            {}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-blue-100 rounded-lg">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">{cms.Heading_CONTACT_INFO_4}</h2>
              </div>

              <div className="space-y-4">
                {(webData.contact.infoEmail || webData.contact.supportEmail) && <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-700">{cms.Description_Email__5}</p>
                    <a href={`mailto:${webData.contact.infoEmail || webData.contact.supportEmail}`} className="text-blue-600 hover:text-blue-700 transition-colors">
                      {webData.contact.infoEmail || webData.contact.supportEmail}
                    </a>
                  </div>
                </div>}

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-700">{cms.Description_Address__6}</p>
                    <p className="text-gray-600">
                      {webData.contact.address || "Address pending"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-green-100 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">{cms.Heading_WORKING_HOURS_7}</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="font-medium text-gray-700">{cms.Description_Mon_Fri__8}</p>
                  <p className="text-gray-600">{cms.Description_Office_9am_5pm_9}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">{cms.Description_Public_Holidays__10}</p>
                  <p className="text-gray-600">{cms.Description_Closed_11}</p>
                </div>
              </div>
            </div>

            {}
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border border-blue-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Globe className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-800">{cms.Heading_Global_Presence_12}</h3>
              </div>
              <p className="text-gray-600 text-sm">{cms.Description_Serving_clients_worldwide_with_safety_certificat_13}</p>
            </div>
          </div>

          {}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-blue-100 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{cms.Heading_Send_Us_a_Message_14}</h2>
                  <p className="text-gray-600 mt-1">{cms.Description_Fill_out_the_form_below_and_we_ll_get_back_to_yo_15}</p>
                </div>
              </div>

              {}
              {submitSuccess && <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-800">{cms.Description_Message_Sent_Successfully__16}</p>
                      <p className="text-green-700 text-sm">{cms.Description_Thank_you_for_contacting_us__We_ll_get_back_to_y_17}</p>
                    </div>
                  </div>
                </div>}

              <form onSubmit={handleSubmit} className="space-y-6">
                {}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <User className="w-4 h-4" />{cms.Text_Contact_Name_18}</label>
                    <input type="text" name="contact_fullname" value={formData?.contact_fullname} onChange={handleInputChange} placeholder={cms.placeholder_Enter_your_full_name_19} className={`w-full px-4 py-3.5 border ${errors.contact_fullname ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-lg`} />
                    {errors.contact_fullname && <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.contact_fullname}
                      </p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Building className="w-4 h-4" />{cms.Text_Company_Name_20}</label>
                    <input type="text" name="contact_company" value={formData.contact_company} onChange={handleInputChange} placeholder={cms.placeholder_Enter_company_name_21} className={`w-full px-4 py-3.5 border ${errors.contact_company ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-lg`} />
                    {errors.contact_company && <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.contact_company}
                      </p>}
                  </div>
                </div>

                {}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Phone className="w-4 h-4" />{cms.Text_Contact_No__22}</label>
                    <input type="text" name="contact_no" value={formData.contact_no} onChange={handleInputChange} placeholder={cms.placeholder__Code__Contact_No_23} className={`w-full px-4 py-3.5 border ${errors.contact_no ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-lg`} />
                    {errors.contact_no && <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.contact_no}
                      </p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4" />{cms.Text_E_Mail_Address_24}</label>
                    <input type="email" name="contact_email" value={formData.contact_email} onChange={handleInputChange} placeholder={cms.placeholder_example_mail_com_25} className={`w-full px-4 py-3.5 border ${errors.contact_email ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-lg`} />
                    {errors.contact_email && <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.contact_email}
                      </p>}
                  </div>
                </div>

                {}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{cms.Text_Inquiry_Regarding_26}</label>
                  <select name="contact_inquiryreg" value={formData.contact_inquiryreg} onChange={handleInputChange} className={`w-full px-4 py-3.5 border ${errors.contact_inquiryreg ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-lg appearance-none bg-white`}>
                    {inquiryOptions.map((option, index) => <option key={index} value={option}>
                        {option}
                      </option>)}
                  </select>
                  {errors.contact_inquiryreg && <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.contact_inquiryreg}
                    </p>}
                </div>

                {}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{cms.Text_Country_27}</label>
                  <select name="contact_country" value={formData.contact_country} onChange={handleInputChange} className={`w-full px-4 py-3.5 border ${errors.contact_country ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-lg appearance-none bg-white`}>
                    {countries.map((country, index) => <option key={index} value={country}>
                        {country}
                      </option>)}
                  </select>
                  {errors.contact_country && <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.contact_country}
                    </p>}
                </div>

                {}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{cms.Text_Message_28}</label>
                  <textarea name="contact_message" value={formData.contact_message} onChange={handleInputChange} placeholder={cms.placeholder_Write_your_message_here____29} rows="6" className={`w-full px-4 py-3.5 border ${errors.contact_message ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-lg resize-none`} />
                  {errors.contact_message && <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.contact_message}
                    </p>}
                </div>

                {}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button type="submit" disabled={isSubmitting} className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting ? <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>{cms.Text_Sending____30}</> : <>
                        <Send className="w-5 h-5" />{cms.Text_Send_Message_31}</>}
                  </button>

                  <button type="button" onClick={handleReset} className="flex-1 bg-gray-100 text-gray-700 py-3.5 px-6 rounded-lg font-medium hover:bg-gray-200 transition-all duration-300 border border-gray-300">{cms.Text_Reset_Form_32}</button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {}
        <div className="mt-12">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />{cms.Heading_Our_Location_33}</h3>
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
      </div>}
    </div>;
}
