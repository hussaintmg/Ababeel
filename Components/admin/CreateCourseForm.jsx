"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createApiClient } from "@/utils/api";
import { BookOpen, Loader2, Plus } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

export default function CreateCourseForm() {
  const { getUserData } = useAuth();
  const api = createApiClient();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  // Price and currency are no longer set here — an organization picks them
  // when it creates a course reference from this catalogue.
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const [errors, setErrors] = useState({
    name: "",
  });

  // Validate form
  const validateForm = () => {
    let isValid = true;
    const newErrors = { name: "" };

    if (!formData.name.trim() || formData.name.trim().length < 3) {
      newErrors.name = "Course name must be at least 3 characters";
      isValid = false;
      toast.error("Please enter a valid course name");
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
          description: "",
        });

        // Refresh user data if needed
        if (getUserData) {
          await getUserData();
        }
        router.push("/admin/default-course/all");
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

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
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

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
          Course price and currency are set by the organization when it creates
          a course reference for this course.
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={isLoading || !formData.name}
            className={`w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm md:text-base ${
              formData.name
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
            {!formData.name ? (
              <p className="text-red-500">⚠️ Course name is required</p>
            ) : (
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
