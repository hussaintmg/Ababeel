"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { createApiClient } from "@/utils/api";
import { Globe, Phone, MapPin, Loader2, Search, ChevronDown, X } from "lucide-react";
import { toast } from "react-toastify";
import { fetchCountries, searchCountries } from "@/utils/countries";

export default function PersonalDetails({ user }) {
  const { getUserData } = useAuth();
  const api = createApiClient();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  
  const [formData, setFormData] = useState({
    country: "",
    countryDialCode: "",
    contactNo: "",
    address: ""
  });
  
  const [errors, setErrors] = useState({
    country: "",
    contactNo: "",
    address: ""
  });

  const countryDropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Load countries and process user data on component mount
  useEffect(() => {
    const processUserData = async () => {
      try {
        setIsLoadingCountries(true);
        const countriesData = await fetchCountries();
        setCountries(countriesData);
        setFilteredCountries(countriesData.slice(0, 7));

        // Process user data
        const processedData = processUserCountryAndPhone(user, countriesData);
        setFormData(processedData);
        
      } catch (error) {
        console.error("Error processing user data:", error);
        toast.error("Failed to load countries data");
      } finally {
        setIsLoadingCountries(false);
      }
    };

    processUserData();
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [user]);

  // Process user's country and phone number
  const processUserCountryAndPhone = (userData, countriesList) => {
    const result = {
      country: "",
      countryDialCode: "",
      contactNo: "",
      address: userData?.address || ""
    };

    if (!userData) return result;

    // Process country
    if (userData.country) {
      // Try to find exact match
      let matchedCountry = countriesList.find(c => 
        c.name.toLowerCase() === userData.country.toLowerCase()
      );

      // If no exact match, try partial match
      if (!matchedCountry) {
        matchedCountry = countriesList.find(c => 
          userData.country.toLowerCase().includes(c.name.toLowerCase()) ||
          c.name.toLowerCase().includes(userData.country.toLowerCase())
        );
      }

      if (matchedCountry) {
        result.country = matchedCountry.name;
        result.countryDialCode = matchedCountry.dialCode;
      } else {
        result.country = userData.country;
      }
    }

    // Process contact number
    if (userData.contact) {
      let phoneNumber = userData?.contact;
      console.log(phoneNumber)
      
      // Remove existing dial code if we found a country match
      if (result.countryDialCode && phoneNumber.startsWith(result.countryDialCode)) {
        result.contactNo = phoneNumber.substring(result.countryDialCode.length).trim();
      } 
      // Try to find and remove any dial code from countries list
      else {
        // Find the longest matching dial code
        let matchedCode = "";
        let matchedLength = 0;
        
        for (const country of countriesList) {
          if (phoneNumber.startsWith(country.dialCode) && country.dialCode.length > matchedLength) {
            matchedCode = country.dialCode;
            matchedLength = country.dialCode.length;
          }
        }
        
        if (matchedCode) {
          result.contactNo = phoneNumber.substring(matchedCode.length).trim();
          // If we haven't set country yet, try to set it from the dial code
          if (!result.country) {
            const countryFromDialCode = countriesList.find(c => c.dialCode === matchedCode);
            if (countryFromDialCode) {
              result.country = countryFromDialCode.name;
              result.countryDialCode = countryFromDialCode.dialCode;
            }
          }
        } else {
          result.contactNo = phoneNumber;
        }
      }
      
      // Remove any non-digit characters from the contact number
      result.contactNo = result.contactNo.replace(/\D/g, "");
    }

    return result;
  };

  // Handle country search
  const handleCountrySearch = async (searchTerm) => {
    setCountrySearch(searchTerm);
    
    if (!searchTerm.trim()) {
      setFilteredCountries(countries.slice(0, 7));
      return;
    }
    
    const searchResults = await searchCountries(searchTerm, 7);
    setFilteredCountries(searchResults);
  };

  // Select a country
  const selectCountry = (country) => {
    setFormData(prev => ({
      ...prev,
      country: country.name,
      countryDialCode: country.dialCode
    }));
    setCountrySearch("");
    setShowCountryDropdown(false);
    
    // Clear country error if exists
    if (errors.country) {
      setErrors(prev => ({ ...prev, country: "" }));
    }
  };

  // Clear country selection
  const clearCountry = () => {
    setFormData(prev => ({
      ...prev,
      country: "",
      countryDialCode: ""
    }));
    setCountrySearch("");
    setFilteredCountries(countries.slice(0, 7));
  };

  // Validate form
  const validateForm = () => {
    let isValid = true;
    const newErrors = { country: "", contactNo: "", address: "" };

    if (!formData.country.trim()) {
      newErrors.country = "Please select a country";
      isValid = false;
      toast.error("Please select a country");
    }

    if (!formData.contactNo.trim() || formData.contactNo.replace(/\D/g, "").length < 7) {
      newErrors.contactNo = "Valid contact number is required (at least 7 digits)";
      isValid = false;
      toast.error("Valid contact number is required");
    }

    if (!formData.address.trim() || formData.address.length < 5) {
      newErrors.address = "Address must be at least 5 characters";
      isValid = false;
      toast.error("Address must be at least 5 characters");
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
        country: formData.country,
        contactNo: formData.countryDialCode + formData.contactNo.replace(/\D/g, ""),
        address: formData.address
      };

      console.log("Sending data to API:", apiData);

      const response = await api.post('/api/profile/update-personal', apiData);
      
      if (response.data.success) {
        toast.success(
          response.data.message || "Personal details updated successfully!",
          { icon: "✅" }
        );
        
        if (getUserData) {
          await getUserData();
        }
      }
    } catch (error) {
      console.error('Personal details update error:', error);
      // Error is already handled by interceptor
    } finally {
      setIsLoading(false);
    }
  };

  // Handle contact number change (only allow numbers)
  const handleContactNoChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Remove non-digits
    setFormData(prev => ({ ...prev, contactNo: value }));
    
    if (errors.contactNo) {
      setErrors(prev => ({ ...prev, contactNo: "" }));
    }
  };

  // Handle address change
  const handleAddressChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, address: value }));
    
    if (errors.address) {
      setErrors(prev => ({ ...prev, address: "" }));
    }
  };

  // Focus search input when dropdown opens
  useEffect(() => {
    if (showCountryDropdown && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [showCountryDropdown]);

  // Get country flag for display
  const getCountryFlag = () => {
    if (!formData.country) return "🌐";
    const country = countries.find(c => c.name === formData.country);
    return country?.flag || "🌐";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 md:mb-6">Personal Details</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        {/* Country - Searchable Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country <span className="text-red-500">*</span>
          </label>
          
          <div className="relative" ref={countryDropdownRef}>
            {/* Country Input Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Globe className="h-5 w-5 text-gray-400" />
              </div>
              
              <div className="flex items-center">
                <input
                  type="text"
                  value={formData.country}
                  readOnly
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  className="pl-10! pr-10 w-full px-3 py-2.5 md:px-4 md:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm md:text-base cursor-pointer bg-white"
                  placeholder="Select a country"
                />
                
                <div className="absolute right-0 flex items-center pr-3 space-x-1">
                  {formData.country && (
                    <button
                      type="button"
                      onClick={clearCountry}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Country Dropdown */}
            {showCountryDropdown && (
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
                      value={countrySearch}
                      onChange={(e) => handleCountrySearch(e.target.value)}
                      className="pl-9 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Search countries..."
                    />
                  </div>
                </div>
                
                {/* Countries List */}
                <div className="overflow-y-auto max-h-64">
                  {isLoadingCountries ? (
                    <div className="p-4 text-center text-gray-500">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                      Loading countries...
                    </div>
                  ) : filteredCountries.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No countries found
                    </div>
                  ) : (
                    <ul className="py-1">
                      {filteredCountries.map((country) => (
                        <li key={`${country.code}-${country.name}`}>
                          <button
                            type="button"
                            onClick={() => selectCountry(country)}
                            className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center gap-3 ${
                              formData.country === country.name ? "bg-blue-50" : ""
                            }`}
                          >
                            <span className="text-xl">{country.flag}</span>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 text-sm">
                                {country.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {country.dialCode}
                              </div>
                            </div>
                            {formData.country === country.name && (
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
          
          {errors.country && (
            <p className="mt-1 text-sm text-red-600">{errors.country}</p>
          )}
        </div>

        {/* Contact Number with Country Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact No. <span className="text-red-500">*</span>
          </label>
          
          <div className="flex gap-2">
            {/* Country Code Display */}
            <div className="relative flex-1 max-w-[120px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-lg">{getCountryFlag()}</span>
              </div>
              <input
                type="text"
                value={formData.countryDialCode || "Select country"}
                readOnly
                className="pl-10! w-full px-3 py-2.5 md:px-4 md:py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm md:text-base"
              />
            </div>
            
            {/* Phone Number Input */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={formData.contactNo}
                  onChange={handleContactNoChange}
                  className="pl-10! w-full px-3 py-2.5 md:px-4 md:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm md:text-base"
                  placeholder="Phone number (digits only)"
                  maxLength={15}
                />
              </div>
            </div>
          </div>
          
          {errors.contactNo && (
            <p className="mt-1 text-sm text-red-600">{errors.contactNo}</p>
          )}
          
          <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="font-medium">Full number:</span>
              <span className="bg-gray-100 px-2 py-1 rounded font-mono">
                {formData.countryDialCode || "+XXX"}{formData.contactNo || "XXXXXXX"}
              </span>
            </div>
            <div className="text-gray-400">
              {formData.contactNo ? `${formData.contactNo.length} digits` : "Enter phone number"}
            </div>
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3">
              <MapPin className="h-5 w-5 text-gray-400" />
            </div>
            <textarea
              value={formData.address}
              onChange={handleAddressChange}
              rows={3}
              className="pl-10! w-full px-3 py-2.5 md:px-4 md:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm md:text-base"
              placeholder="Enter your complete address"
            />
          </div>
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">{errors.address}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Include street, city, and postal code
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !formData.country || !formData.contactNo  || !formData.address}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm md:text-base"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Personal Details"
          )}
        </button>
      </form>
    </div>
  );
}