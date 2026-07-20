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
} from "lucide-react";
import { toast } from "react-toastify";
import { fetchCurrencies, searchCurrencies } from "@/utils/currency";
import { useRouter } from "next/navigation";

export default function CreateCourseForm() {
  const { user, getUserData } = useAuth();
  const api = createApiClient();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true);
  const [currencies, setCurrencies] = useState([]);
  const [filteredCurrencies, setFilteredCurrencies] = useState([]);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    currency: "",
    currencySymbol: "",
    currencyCode: "",
    country: "",
    description: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    price: "",
    currency: "",
  });

  const currencyDropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Load currencies on component mount
  useEffect(() => {
    loadCurrencies();

    // Close dropdown when clicking outside
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

  // Load currencies from CSV
  const loadCurrencies = async () => {
    try {
      setIsLoadingCurrencies(true);
      const currenciesData = await fetchCurrencies();
      setCurrencies(currenciesData);
      setFilteredCurrencies(currenciesData);
    } catch (error) {
      console.error("Error loading currencies:", error);
      toast.error("Failed to load currency data");
    } finally {
      setIsLoadingCurrencies(false);
    }
  };

  // Handle currency search
  const handleCurrencySearch = async (searchTerm) => {
    setCurrencySearch(searchTerm);

    if (!searchTerm.trim()) {
      setFilteredCurrencies(currencies);
      return;
    }

    const searchResults = await searchCurrencies(searchTerm);
    setFilteredCurrencies(searchResults);
  };

  // Select a currency
  const selectCurrency = (currency) => {
    setFormData({
      ...formData,
      currency: currency.currency,
      currencySymbol: currency.symbol,
      currencyCode: currency.code,
      country: currency.country,
    });
    setCurrencySearch("");
    setShowCurrencyDropdown(false);

    // Clear currency error if exists
    if (errors.currency) {
      setErrors((prev) => ({ ...prev, currency: "" }));
    }
  };

  // Clear currency selection
  const clearCurrency = () => {
    setFormData({
      ...formData,
      currency: "",
      currencySymbol: "",
      currencyCode: "",
      country: "",
    });
    setCurrencySearch("");
    setFilteredCurrencies(currencies);
  };

  // Validate form
  const validateForm = () => {
    let isValid = true;
    const newErrors = { name: "", price: "", currency: "" };

    if (!formData.name.trim() || formData.name.trim().length < 3) {
      newErrors.name = "Course name must be at least 3 characters";
      isValid = false;
      toast.error("Please enter a valid course name");
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "Please enter a valid price";
      isValid = false;
      toast.error("Please enter a valid price");
    }

    if (!formData.currency || !formData.currencySymbol) {
      newErrors.currency = "Please select a currency";
      isValid = false;
      toast.error("Please select a currency");
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Prepare data for API
      const apiData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        currency: formData.currency,
        currencySymbol: formData.currencySymbol,
        currencyCode: formData.currencyCode,
        country: formData.country,
        description: formData.description.trim(),
      };

      const response = await api.post("/api/courses/default/add", apiData);

      if (response.data.success) {
        toast.success(response.data.message || "Course created successfully!", {
          icon: "✅",
        });

        // Reset form
        setFormData({
          name: "",
          price: "",
          currency: "",
          currencySymbol: "",
          currencyCode: "",
          country: "",
          description: "",
        });

        // Refresh user data if needed
        if (getUserData) {
          await getUserData();
        }
        router.push("/owner/default-course/all")
      }
    } catch (error) {
      console.error("Course creation error:", error);
      // Error is already handled by interceptor
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Special handling for price (only allow numbers and decimal)
    if (name === "price") {
      // Allow only numbers and one decimal point
      const regex = /^\d*\.?\d*$/;
      if (regex.test(value) || value === "") {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Focus search input when dropdown opens
  useEffect(() => {
    if (showCurrencyDropdown && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [showCurrencyDropdown]);

  // Format price with currency symbol
  const formatPrice = () => {
    if (!formData.price || !formData.currencySymbol) return "";

    const price = parseFloat(formData.price).toFixed(2);
    return `${formData.currencySymbol} ${price}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Create New Course
          </h2>
          <p className="text-gray-600 mt-1">Add a new course to your academy</p>
        </div>
        <div className="p-2 bg-blue-100 rounded-lg">
          <BookOpen className="h-6 w-6 text-blue-600" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Course Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name of Course <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BookOpen className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="pl-10! w-full px-3 py-2.5 md:px-4 md:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm md:text-base"
              placeholder="Enter course name"
              maxLength={200}
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {formData.name.length}/200 characters
          </p>
        </div>

        {/* Price and Currency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Price Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="pl-5! w-full px-3 py-2.5 md:px-4 md:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm md:text-base"
                placeholder="0.00"
              />
            </div>
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">{errors.price}</p>
            )}
          </div>

          {/* Currency Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency <span className="text-red-500">*</span>
            </label>

            <div className="relative" ref={currencyDropdownRef}>
              {/* Currency Input Field */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-gray-400" />
                </div>

                <div className="flex items-center">
                  <input
                    type="text"
                    value={formData.currency}
                    readOnly
                    onClick={() =>
                      setShowCurrencyDropdown(!showCurrencyDropdown)
                    }
                    className="pl-10! pr-10 w-full px-3 py-2.5 md:px-4 md:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm md:text-base cursor-pointer bg-white"
                    placeholder="Select currency"
                  />

                  <div className="absolute right-0 flex items-center pr-3 space-x-1">
                    {formData.currency && (
                      <button
                        type="button"
                        onClick={clearCurrency}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrencyDropdown(!showCurrencyDropdown)
                      }
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ChevronDown
                        className={`h-4 w-4 text-gray-500 transition-transform ${
                          showCurrencyDropdown ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Currency Dropdown */}
              {showCurrencyDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
                  {/* Search Input */}
                  <div className="p-2 border-b border-gray-200">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={currencySearch}
                        onChange={(e) => handleCurrencySearch(e.target.value)}
                        className="pl-9! w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Search countries or currencies..."
                      />
                    </div>
                  </div>

                  {/* Currencies List */}
                  <div className="overflow-y-auto max-h-64">
                    {isLoadingCurrencies ? (
                      <div className="p-4 text-center text-gray-500">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                        Loading currencies...
                      </div>
                    ) : filteredCurrencies.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No currencies found
                      </div>
                    ) : (
                      <ul className="py-1">
                        {filteredCurrencies.map((currency) => (
                          <li key={`${currency.country}-${currency.currency}`}>
                            <button
                              type="button"
                              onClick={() => selectCurrency(currency)}
                              className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center gap-3 ${
                                formData.currency === currency.currency
                                  ? "bg-blue-50"
                                  : ""
                              }`}
                            >
                              <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded">
                                <span className="font-medium">
                                  {currency.symbol}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 text-sm">
                                  {currency.country}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {currency.currency} ({currency.code})
                                </div>
                              </div>
                              {formData.currency === currency.currency && (
                                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>

            {errors.currency && (
              <p className="mt-1 text-sm text-red-600">{errors.currency}</p>
            )}
          </div>
        </div>

        {/* Selected Currency Preview */}
        {formData.currency && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Selected Currency
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-lg">
                  <span className="text-lg font-bold">
                    {formData.currencySymbol}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {formData.currency}
                  </div>
                  <div className="text-xs text-gray-600">
                    {formData.country}
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Price Preview:</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatPrice()}
                    </span>
                  </div>
                  {formData.currencyCode && (
                    <div className="mt-1 text-xs text-gray-500">
                      Currency Code:{" "}
                      <span className="font-mono">{formData.currencyCode}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Description (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2.5 md:px-4 md:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm md:text-base"
            placeholder="Describe your course (optional)"
            maxLength={1000}
          />
          <p className="mt-1 text-xs text-gray-500">
            {formData.description.length}/1000 characters
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={
              isLoading ||
              !formData.name ||
              !formData.price ||
              !formData.currency
            }
            className={`w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm md:text-base ${
              formData.name && formData.price && formData.currency
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating Course...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" />
                Create Course
              </>
            )}
          </button>

          {/* Form Status */}
          <div className="mt-3 text-xs text-gray-500">
            {!formData.name && (
              <p className="text-red-500">⚠️ Course name is required</p>
            )}
            {!formData.price && (
              <p className="text-red-500">⚠️ Price is required</p>
            )}
            {!formData.currency && (
              <p className="text-red-500">⚠️ Please select a currency</p>
            )}
            {formData.name && formData.price && formData.currency && (
              <p className="text-green-600">
                ✅ All required fields are filled
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
