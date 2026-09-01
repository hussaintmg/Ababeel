"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Calendar,
  BookOpen,
  MapPin,
  Clock,
  Users,
  Eye,
  CheckCircle,
  Loader2,
  ChevronDown,
  Search,
  Plus,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

const DELIVERY_MODES = [
  { value: "online", label: "Online / Virtual Classroom" },
  { value: "classroom", label: "Classroom (In-Person)" },
  { value: "blended", label: "Blended (Online & Face-to-Face)" },
  { value: "in-house", label: "In-House Corporate Training" },
  { value: "distance", label: "Distance Learning / Self-Paced" },
];

export default function CreateCourseReferencePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courseSearch, setCourseSearch] = useState("");
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);

  const [formData, setFormData] = useState({
    courseId: "",
    referenceName: "",
    referenceCode: "",
    deliveryMode: "online",
    modeLabel: "Live Interactive Online Session",
    location: "Online / Zoom",
    duration: "3 Days",
    seats: 20,
    startDate: "",
    endDate: "",
    examDate: "",
    registrationDeadline: "",
    notes: "",
    showInSchedule: true,
    status: "active",
  });

  const [selectedCourse, setSelectedCourse] = useState(null);

  // Fetch published & active courses
  const fetchCourses = useCallback(async () => {
    try {
      setLoadingCourses(true);
      const response = await axios.get("/api/courses/default");
      if (response.data?.success) {
        const activeList = (response.data.data || []).filter(
          (c) => c.status === "active" || c.status === "published"
        );
        setCourses(activeList);
      }
    } catch (error) {
      console.error("Error loading courses:", error);
      toast.error("Failed to load course catalogue");
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    setFormData((prev) => {
      const autoRefName = `${course.name} - ${new Date().toLocaleDateString("en-GB", { month: "short", year: "numeric" })} Intake`;
      const autoRefCode = course.code ? `${course.code}-${new Date().getFullYear().toString().slice(-2)}` : "";
      return {
        ...prev,
        courseId: course._id,
        referenceName: prev.referenceName || autoRefName,
        referenceCode: prev.referenceCode || autoRefCode,
        duration: course.duration || prev.duration,
      };
    });
    setShowCourseDropdown(false);
    setCourseSearch("");
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.courseId || !selectedCourse) {
      toast.error("Please select a course for this reference");
      return;
    }
    if (!formData.startDate) {
      toast.error("Please provide a start date");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        course: selectedCourse._id,
        courseId: selectedCourse._id,
        courseName: selectedCourse.name,
        coursePrice: selectedCourse.price || 0,
        currencySymbol: selectedCourse.currencySymbol || "£",
        currency: selectedCourse.currency || "GBP",
        currencyCode: selectedCourse.currencyCode || "GBP",
        country: selectedCourse.country || "United Kingdom",
        referenceName: formData.referenceName.trim() || `${selectedCourse.name} Reference`,
        referenceCode: formData.referenceCode.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        examDate: formData.examDate || null,
        registrationDeadline: formData.registrationDeadline || null,
        mode: formData.deliveryMode,
        modeLabel: formData.modeLabel.trim(),
        location: formData.location.trim(),
        duration: formData.duration.trim(),
        seats: Number(formData.seats) || 20,
        notes: formData.notes.trim(),
        showInSchedule: Boolean(formData.showInSchedule),
        status: formData.status,
      };

      const res = await axios.post("/api/course-ref/create", payload);

      if (res.data?.success) {
        toast.success("Course reference created successfully!");
        const refId = res.data.data?.course?._id;
        if (refId) {
          router.push(`/dashboard/course-reference/${refId}/candidates`);
        } else {
          router.push("/dashboard/course-reference/all");
        }
      } else {
        toast.error(res.data?.error || "Failed to create course reference");
      }
    } catch (error) {
      console.error("Creation error:", error);
      toast.error(error.response?.data?.error || error.message || "Failed to create course reference");
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter((c) =>
    c.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
    (c.code && c.code.toLowerCase().includes(courseSearch.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Form Header */}
          <div className="p-6 md:p-8 bg-linear-to-r from-blue-600 to-indigo-700 text-white">
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2 bg-white/10 backdrop-blur-md rounded-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </span>
              <h1 className="text-2xl font-bold">Create Course Reference / Intake Session</h1>
            </div>
            <p className="text-blue-100 text-sm">
              Schedule an intake session, configure delivery dates, seats, and toggle public website visibility.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
            {/* Section 1: Course Selection */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                  1
                </span>
                Select Course
              </h3>

              <div className="relative">
                <div
                  onClick={() => setShowCourseDropdown(!showCourseDropdown)}
                  className={`w-full p-4 border rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                    selectedCourse
                      ? "border-blue-500 bg-blue-50/30"
                      : "border-gray-300 hover:border-gray-400 bg-white"
                  }`}
                >
                  {selectedCourse ? (
                    <div>
                      <div className="font-semibold text-gray-900">{selectedCourse.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-3 mt-1">
                        {selectedCourse.code && (
                          <span className="px-2 py-0.5 bg-gray-100 rounded font-mono">
                            {selectedCourse.code}
                          </span>
                        )}
                        {selectedCourse.level?.name && (
                          <span className="text-blue-600">{selectedCourse.level.name}</span>
                        )}
                        <span>
                          Price: {selectedCourse.currencySymbol || "£"}{selectedCourse.price}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm">
                      {loadingCourses ? "Loading courses..." : "Click to select a course from catalogue..."}
                    </span>
                  )}
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      showCourseDropdown ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {showCourseDropdown && (
                  <div className="absolute z-30 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 overflow-hidden">
                    <div className="p-3 border-b border-gray-100">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={courseSearch}
                          onChange={(e) => setCourseSearch(e.target.value)}
                          placeholder="Search courses..."
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="overflow-y-auto max-h-56 divide-y divide-gray-50">
                      {filteredCourses.length > 0 ? (
                        filteredCourses.map((c) => (
                          <div
                            key={c._id}
                            onClick={() => handleSelectCourse(c)}
                            className="p-3 hover:bg-blue-50 cursor-pointer transition-colors"
                          >
                            <div className="font-medium text-sm text-gray-900">{c.name}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                              {c.code && <span className="font-mono text-gray-600">{c.code}</span>}
                              <span>•</span>
                              <span>{c.currencySymbol || "£"}{c.price}</span>
                              {c.duration && <span>• {c.duration}</span>}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-gray-500">
                          No matching courses found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Reference Details */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                  2
                </span>
                Session & Reference Identification
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Reference Name / Session Title *
                  </label>
                  <input
                    type="text"
                    name="referenceName"
                    value={formData.referenceName}
                    onChange={handleInputChange}
                    placeholder="e.g. May 2026 Weekend Batch"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Reference Code
                  </label>
                  <input
                    type="text"
                    name="referenceCode"
                    value={formData.referenceCode}
                    onChange={handleInputChange}
                    placeholder="e.g. NVQ-L6-MAY26"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Delivery Mode
                  </label>
                  <select
                    name="deliveryMode"
                    value={formData.deliveryMode}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  >
                    {DELIVERY_MODES.map((dm) => (
                      <option key={dm.value} value={dm.value}>
                        {dm.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Mode Custom Label
                  </label>
                  <input
                    type="text"
                    name="modeLabel"
                    value={formData.modeLabel}
                    onChange={handleInputChange}
                    placeholder="e.g. Live Zoom Interactive"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Training Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g. Online / Zoom or London Campus"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Seats Available
                  </label>
                  <input
                    type="number"
                    name="seats"
                    min="1"
                    max="500"
                    value={formData.seats}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Dates & Scheduling */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                  3
                </span>
                Schedule Dates
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Exam / Assessment Date
                  </label>
                  <input
                    type="date"
                    name="examDate"
                    value={formData.examDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Registration Deadline
                  </label>
                  <input
                    type="date"
                    name="registrationDeadline"
                    value={formData.registrationDeadline}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Public Visibility & Notes */}
            <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-4">
              <div className="flex items-start gap-3">
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    id="showInSchedule"
                    name="showInSchedule"
                    checked={formData.showInSchedule}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label
                    htmlFor="showInSchedule"
                    className="text-sm font-semibold text-gray-900 cursor-pointer flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4 text-blue-600" />
                    Show on Public Website Schedule & Course Pages
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    When enabled, this session will appear on the public <strong>/schedule</strong> calendar and in the course&apos;s available intake months for online candidate registration.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Internal Notes & Instructions (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Additional notes for organizers or instructors..."
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                />
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => router.push("/dashboard/course-reference/all")}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.courseId || !formData.startDate}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Reference...
                  </>
                ) : (
                  <>
                    <span>Create & Add Candidates</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
