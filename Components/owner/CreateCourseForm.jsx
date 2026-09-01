"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { createApiClient } from "@/utils/api";
import {
  BookOpen,
  Globe,
  Search,
  ChevronDown,
  X,
  Loader2,
  Plus,
  Trash2,
  Award,
  Layers,
  Clock,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  CheckCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import { fetchCurrencies, searchCurrencies } from "@/utils/currency";
import { useRouter } from "next/navigation";

const slugify = (text) =>
  String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function CreateCourseForm() {
  const { user, getUserData } = useAuth();
  const api = createApiClient();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("general");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true);
  const [currencies, setCurrencies] = useState([]);
  const [filteredCurrencies, setFilteredCurrencies] = useState([]);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");

  const [levels, setLevels] = useState([]);
  const [awardingBodies, setAwardingBodies] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    slug: "",
    price: "0",
    currency: "GBP",
    currencySymbol: "£",
    currencyCode: "GBP",
    country: "United Kingdom",
    level: "",
    awardingBody: "",
    category: "",
    duration: "3 Days",
    durationDays: "3",
    shortDescription: "",
    description: "",
    courseContent: "",
    learningOutcomes: "",
    requirements: "",
    whoShouldAttend: "",
    featuredImage: "",
    certificateImage: "",
    certificationInfo: "",
    featured: false,
    displayOrder: 0,
    status: "active",
    faqs: [{ question: "", answer: "" }],
  });

  const [errors, setErrors] = useState({});
  const currencyDropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Load currencies, levels, and awarding bodies on mount
  useEffect(() => {
    loadCurrencies();
    loadLevelsAndAwardingBodies();

    const handleClickOutside = (event) => {
      if (
        currencyDropdownRef.current &&
        !currencyDropdownRef.current.contains(event.target)
      ) {
        setShowCurrencyDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadLevelsAndAwardingBodies = async () => {
    try {
      const [levelsRes, abRes] = await Promise.allSettled([
        fetch("/api/training/levels").then((r) => r.json()),
        fetch("/api/training/awarding-bodies").then((r) => r.json()),
      ]);

      if (levelsRes.status === "fulfilled" && levelsRes.value?.data) {
        setLevels(levelsRes.value.data);
      }
      if (abRes.status === "fulfilled" && abRes.value?.data) {
        setAwardingBodies(abRes.value.data);
      }
    } catch (err) {
      console.warn("Could not load levels/awarding bodies:", err);
    }
  };

  const loadCurrencies = async () => {
    try {
      setIsLoadingCurrencies(true);
      const currenciesData = await fetchCurrencies();
      setCurrencies(currenciesData || []);
      setFilteredCurrencies(currenciesData || []);
    } catch (error) {
      console.error("Error loading currencies:", error);
    } finally {
      setIsLoadingCurrencies(false);
    }
  };

  const handleCurrencySearch = async (searchTerm) => {
    setCurrencySearch(searchTerm);
    if (!searchTerm.trim()) {
      setFilteredCurrencies(currencies);
      return;
    }
    const searchResults = await searchCurrencies(searchTerm);
    setFilteredCurrencies(searchResults || []);
  };

  const selectCurrency = (currency) => {
    setFormData((prev) => ({
      ...prev,
      currency: currency.currency,
      currencySymbol: currency.symbol,
      currencyCode: currency.code,
      country: currency.country,
    }));
    setCurrencySearch("");
    setShowCurrencyDropdown(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "name") {
      setFormData((prev) => ({
        ...prev,
        name: value,
        slug: prev.slug === "" || prev.slug === slugify(prev.name) ? slugify(value) : prev.slug,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // FAQ Handlers
  const handleFaqChange = (index, field, value) => {
    const updated = [...formData.faqs];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, faqs: updated }));
  };

  const addFaq = () => {
    setFormData((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { question: "", answer: "" }],
    }));
  };

  const removeFaq = (index) => {
    setFormData((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim() || formData.name.trim().length < 3) {
      newErrors.name = "Course name must be at least 3 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fill in the required course fields");
      return;
    }

    setIsLoading(true);
    try {
      const cleanFaqs = formData.faqs.filter(
        (f) => f.question.trim() !== "" || f.answer.trim() !== ""
      );

      const apiData = {
        ...formData,
        name: formData.name.trim(),
        code: formData.code.trim(),
        slug: formData.slug.trim() || slugify(formData.name),
        price: parseFloat(formData.price) || 0,
        durationDays: Number(formData.durationDays) || 0,
        displayOrder: Number(formData.displayOrder) || 0,
        level: formData.level || null,
        awardingBody: formData.awardingBody || null,
        faqs: cleanFaqs,
      };

      const response = await api.post("/api/courses/default/add", apiData);

      if (response.data?.success) {
        toast.success("Course created successfully!");
        if (getUserData) await getUserData();
        router.push("/owner/default-course/all");
      } else {
        toast.error(response.data?.error || "Failed to create course");
      }
    } catch (error) {
      console.error("Course creation error:", error);
      toast.error(error.response?.data?.error || error.message || "Failed to create course");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Create Course</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Add a course with full syllabus, certification, outcomes, and pricing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/owner/default-course/all")}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !formData.name}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Save Course
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-6 bg-white overflow-x-auto">
        {[
          { id: "general", label: "Basic Info & Pricing", icon: BookOpen },
          { id: "content", label: "Curriculum & Details", icon: FileText },
          { id: "media", label: "Media & Certificate", icon: ImageIcon },
          { id: "faqs", label: "FAQs", icon: HelpCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3.5 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {/* TAB 1: GENERAL INFO */}
        {activeTab === "general" && (
          <div className="space-y-6 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Level 6 NVQ Diploma in Occupational Health and Safety"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Code
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="e.g. NVQ-L6-OHS"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="e.g. level-6-nvq-diploma-health-safety"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Awarding Body
                </label>
                <select
                  name="awardingBody"
                  value={formData.awardingBody}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                >
                  <option value="">Select Awarding Body (Optional)</option>
                  {awardingBodies.map((ab) => (
                    <option key={ab._id} value={ab._id}>
                      {ab.name} {ab.shortName ? `(${ab.shortName})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Qualification Level
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                >
                  <option value="">Select Level (Optional)</option>
                  {levels.map((lvl) => (
                    <option key={lvl._id} value={lvl._id}>
                      {lvl.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="e.g. Health & Safety, Construction, Management"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (Text label)
                </label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="e.g. 3 Days / 24 Hours / 6 Months"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    {formData.currencySymbol || "£"}
                  </span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <div className="relative" ref={currencyDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg flex items-center justify-between text-sm bg-white"
                  >
                    <span>
                      {formData.currencySymbol} {formData.currency} ({formData.country})
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {showCurrencyDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-hidden">
                      <div className="p-2 border-b border-gray-100">
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={currencySearch}
                          onChange={(e) => handleCurrencySearch(e.target.value)}
                          placeholder="Search currencies or countries..."
                          className="w-full px-3 py-1.5 border border-gray-200 rounded text-xs"
                        />
                      </div>
                      <div className="overflow-y-auto max-h-48">
                        {filteredCurrencies.slice(0, 50).map((curr) => (
                          <button
                            key={`${curr.country}-${curr.currency}`}
                            type="button"
                            onClick={() => selectCurrency(curr)}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 flex items-center justify-between"
                          >
                            <span>
                              <strong>{curr.symbol}</strong> {curr.currency} - {curr.country}
                            </span>
                            <span className="text-gray-400">{curr.code}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  name="displayOrder"
                  value={formData.displayOrder}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="featured"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="featured" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Feature this course on homepage & highlights
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CURRICULUM & DETAILS */}
        {activeTab === "content" && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Description (Summary)
              </label>
              <textarea
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleInputChange}
                rows={2}
                placeholder="Brief 1-2 sentence overview of the course..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                maxLength={500}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Description / Course Overview
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={5}
                placeholder="Comprehensive overview of the course content, objectives, and industry relevance..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Modules & Content
              </label>
              <textarea
                name="courseContent"
                value={formData.courseContent}
                onChange={handleInputChange}
                rows={5}
                placeholder="List modules, topics, syllabus outline..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Learning Outcomes
                </label>
                <textarea
                  name="learningOutcomes"
                  value={formData.learningOutcomes}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="What learners will achieve upon completion..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Who Should Attend
                </label>
                <textarea
                  name="whoShouldAttend"
                  value={formData.whoShouldAttend}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Target audience, roles, or professionals..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entry Requirements
              </label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleInputChange}
                rows={3}
                placeholder="Prerequisites, prior experience, or qualifications required..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
        )}

        {/* TAB 3: MEDIA & CERTIFICATE */}
        {activeTab === "media" && (
          <div className="space-y-6 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Featured Image URL
                </label>
                <input
                  type="text"
                  name="featuredImage"
                  value={formData.featuredImage}
                  onChange={handleInputChange}
                  placeholder="https://... or /assets/course.webp"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                {formData.featuredImage && (
                  <div className="mt-2 relative h-40 w-full rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                    <img
                      src={formData.featuredImage}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sample Certificate Image URL
                </label>
                <input
                  type="text"
                  name="certificateImage"
                  value={formData.certificateImage}
                  onChange={handleInputChange}
                  placeholder="https://... or /assets/sample-cert.png"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                {formData.certificateImage && (
                  <div className="mt-2 relative h-40 w-full rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                    <img
                      src={formData.certificateImage}
                      alt="Certificate Preview"
                      className="h-full w-full object-contain p-2"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Certification & Accreditation Info
              </label>
              <textarea
                name="certificationInfo"
                value={formData.certificationInfo}
                onChange={handleInputChange}
                rows={3}
                placeholder="Details about certificate validity, awarding body accreditation, or digital badges..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
        )}

        {/* TAB 4: FAQS */}
        {activeTab === "faqs" && (
          <div className="space-y-4 max-w-4xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">
                Add common questions & answers for this specific course.
              </p>
              <button
                type="button"
                onClick={addFaq}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add FAQ
              </button>
            </div>

            {formData.faqs.map((faq, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-lg bg-gray-50/40 relative space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Question {idx + 1}</span>
                  {formData.faqs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFaq(idx)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={faq.question}
                  onChange={(e) => handleFaqChange(idx, "question", e.target.value)}
                  placeholder="e.g. Is this course recognized worldwide?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                />
                <textarea
                  value={faq.answer}
                  onChange={(e) => handleFaqChange(idx, "answer", e.target.value)}
                  rows={2}
                  placeholder="Answer..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                />
              </div>
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="pt-6 mt-8 border-t border-gray-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/owner/default-course/all")}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !formData.name}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Save & Publish Course
          </button>
        </div>
      </form>
    </div>
  );
}
