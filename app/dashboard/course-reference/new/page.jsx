"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCourses } from "@/context/CourseContext";
import { useAuth } from "@/context/AuthContext";
import { fetchCountries, searchCountries } from "@/utils/countries";
import { ChevronDown, Search } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useCourseReference } from "@/context/CourseReferenceContext";

export default function CreateCoursePage() {
  const router = useRouter();
  const { courses: allCourses } = useCourses();
  const { user } = useAuth();
  const { createCourse } = useCourseReference();

  const [loading, setLoading] = useState(false);
  // Trainer and ATC fields were removed from this flow: references are built
  // from the default course catalogue only.
  const [formData, setFormData] = useState({
    courseId: "",
    country: "",
    countryDialCode: "",
    startDate: "",
  });

  const [filteredCountries, setFilteredCountries] = useState([]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [defaultCourses, setDefaultCourses] = useState([]);
  const [activeCourses, setActiveCourses] = useState([]);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");

  const fetchDefaultCourses = useCallback(async () => {
    try {
      const response = await axios.get(`/api/courses/default`);

      if (!response.data.success) {
        throw new Error("Failed to fetch courses");
      }

      const data = response?.data;

      if (data.success) {
        setDefaultCourses(data?.data || []);
      } else {
        throw new Error(data.error || "Failed to load courses");
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error(error.message || "Failed to load courses");
      setDefaultCourses([]);
    }
  }, []);

  useEffect(() => {
    fetchDefaultCourses();
  }, [fetchDefaultCourses]);

  useEffect(() => {
    const customActive = allCourses.filter((c) => c.isActive === true);
    const defaultActive = defaultCourses.filter((c) => c.status === "active");

    const combinedActive = [...customActive, ...defaultActive];

    // Use a Map for robust deduplication by _id, id, or name
    const courseMap = new Map();
    combinedActive.forEach((course) => {
      const id = course._id || course.id || course.name;
      if (id && !courseMap.has(id)) {
        courseMap.set(id, course);
      }
    });

    const uniqueCourses = Array.from(courseMap.values());
    const sortedCourses = uniqueCourses.sort((a, b) =>
      (a.name || "").localeCompare(b.name || ""),
    );
    setActiveCourses(sortedCourses);
  }, [allCourses, defaultCourses]);

  // Fetch countries on mount
  useEffect(() => {
    const loadCountries = async () => {
      const countries = await fetchCountries();
      setFilteredCountries(countries);
    };
    loadCountries();
  }, []);

  // Handle country search
  const handleCountrySearch = async (searchTerm) => {
    setCountrySearch(searchTerm);
    if (searchTerm.length > 0) {
      const results = await searchCountries(searchTerm, 7);
      setFilteredCountries(results);
    } else {
      const allCountries = await fetchCountries();
      setFilteredCountries(allCountries);
    }
  };

  const selectCountry = (country) => {
    setFormData((prev) => ({
      ...prev,
      country: country.name,
      countryDialCode: country.dialCode,
    }));
    setShowCountryDropdown(false);
    setCountrySearch("");
  };

  const selectCourse = (course) => {
    setFormData((prev) => ({
      ...prev,
      courseId: course._id,
    }));
    setShowCourseDropdown(false);
    setCourseSearch("");
  };

  const filteredCourses = activeCourses.filter((course) =>
    course.name.toLowerCase().includes(courseSearch.toLowerCase()),
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.courseId || !formData.startDate || !formData.country) {
        toast.error("Please fill all required fields");
        setLoading(false);
        return;
      }

      const selectedCourse = activeCourses.find(
        (course) => course._id === formData.courseId,
      );

      const courseData = {
        courseId: selectedCourse._id,
        courseName: selectedCourse.name,
        coursePrice: selectedCourse.price,
        currencySymbol: selectedCourse.currencySymbol || "₨",
        startDate: formData.startDate,
        country: formData.country,
        createdBy: user._id,
      };

      const { data } = await createCourse(courseData);

      // Navigate to add candidates page
      router.push(
        `/dashboard/course-reference/${data.data.course._id}/candidates`,
      );
    } catch (error) {
      console.error("Error creating course:", error);
      toast.error(
        error.message || "Failed to create course. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Create New Course
          </h1>
          <p className="text-gray-600 mb-6">Fill in the course details below</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Select Course */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Course *
              </label>
              <div className="relative">
                <div className="flex items-center">
                  <input
                    type="text"
                    value={
                      activeCourses.find((c) => c._id === formData.courseId)
                        ?.name || ""
                    }
                    readOnly
                    onClick={() => {
                      if (activeCourses.length > 0) {
                        setShowCourseDropdown(!showCourseDropdown);
                      }
                    }}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer bg-white ${
                      activeCourses.length === 0 ? "bg-gray-100" : ""
                    }`}
                    placeholder={
                      activeCourses.length === 0
                        ? "No courses available"
                        : "Select a course"
                    }
                    disabled={activeCourses.length === 0}
                  />

                  <div className="absolute right-0 flex items-center pr-3 space-x-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (activeCourses.length > 0) {
                          setShowCourseDropdown(!showCourseDropdown);
                        }
                      }}
                      disabled={activeCourses.length === 0}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ChevronDown
                        className={`h-4 w-4 text-gray-500 transition-transform ${
                          showCourseDropdown ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {showCourseDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-200">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={courseSearch}
                          onChange={(e) => setCourseSearch(e.target.value)}
                          className="pl-9 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="Search courses..."
                          autoFocus
                        />
                      </div>
                    </div>

                    <ul>
                      {filteredCourses.length > 0 ? (
                        filteredCourses.map((course) => (
                          <li key={course._id}>
                            <button
                              type="button"
                              onClick={() => selectCourse(course)}
                              className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center gap-3 ${
                                formData.courseId === course._id
                                  ? "bg-blue-50 text-blue-700 font-medium"
                                  : "text-gray-700"
                              }`}
                            >
                              <span>{course.name}</span>
                            </button>
                          </li>
                        ))
                      ) : (
                        <li className="px-4 py-3 text-sm text-gray-500 text-center">
                          No courses found
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              {activeCourses.length === 0 && (
                <p className="mt-1 text-sm text-red-600">
                  No active courses available. Please add courses first.
                </p>
              )}
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country *
              </label>
              <div className="relative">
                <div className="flex items-center">
                  <input
                    type="text"
                    value={formData.country}
                    readOnly
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    className="pl-10! pr-10 w-full px-3 py-2.5 md:px-4 md:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm md:text-base cursor-pointer bg-white"
                    placeholder="Select Country"
                  />

                  <div className="absolute right-0 flex items-center pr-3 space-x-1">
                    <button
                      type="button"
                      onClick={() =>
                        setShowCountryDropdown(!showCountryDropdown)
                      }
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ChevronDown
                        className={`h-4 w-4 text-gray-500 transition-transform ${
                          showCountryDropdown ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {showCountryDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {/* Search Input */}
                    <div className="p-2! border-b border-gray-200">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={countrySearch}
                          onChange={(e) => handleCountrySearch(e.target.value)}
                          className="pl-9! w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="Search countries..."
                        />
                      </div>
                    </div>

                    <ul>
                      {filteredCountries.map((country) => (
                        <li key={`${country.code}-${country.name}`}>
                          <button
                            type="button"
                            onClick={() => selectCountry(country)}
                            className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center gap-3 ${
                              formData.country === country.name
                                ? "bg-blue-50"
                                : ""
                            }`}
                          >
                            <span className="text-lg">{country.flag}</span>
                            <span>{country.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Course Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Start Date *
              </label>
              <input
                type="date"
                lang="en-GB"
                required
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || activeCourses.length === 0}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating Course..." : "Next → Add Candidates"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
