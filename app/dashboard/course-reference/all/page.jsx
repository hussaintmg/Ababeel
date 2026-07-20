"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCourseReference } from "@/context/CourseReferenceContext";
import { toast } from "react-toastify";
import {
  Search,
  Users,
  Calendar,
  Eye,
  ChevronRight,
  RefreshCw,
  FileText,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";

export default function CourseReferencesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    courses,
    loading: contextLoading,
    fetchCourses,
  } = useCourseReference();

  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch courses on mount
  useEffect(() => {
    loadCourses();
  }, []);

  // Filter and sort courses
  useEffect(() => {
    if (!courses.length) {
      setFilteredCourses([]);
      return;
    }

    // Every course reference is listed, including ones whose invoice is still
    // pending. Payment is not part of the flow yet, so filtering on a paid
    // invoice hid newly created references entirely. The status badge and the
    // payment column below still distinguish pending from active.
    let result = [...courses];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (course) =>
          course.courseName?.toLowerCase().includes(term) ||
          course.referenceNumber?.toLowerCase().includes(term) ||
          course.trainerName?.toLowerCase().includes(term) ||
          course.country?.toLowerCase().includes(term),
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "courseName":
          aValue = a.courseName?.toLowerCase();
          bValue = b.courseName?.toLowerCase();
          break;
        case "coursePrice":
          aValue = a.coursePrice || 0;
          bValue = b.coursePrice || 0;
          break;
        case "candidatesCount":
          aValue = a.candidatesCount || 0;
          bValue = b.candidatesCount || 0;
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredCourses(result);
  }, [courses, searchTerm, sortBy, sortOrder]);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      await fetchCourses();
    } catch (error) {
      console.error("Error loading courses:", error);
      toast.error("Failed to load courses");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowClick = (courseId) => {
    router.push(`/dashboard/course-reference/${courseId}/candidates/edit`);
  };

  const handleViewDetails = (course, e) => {
    e.stopPropagation();
    setSelectedCourse(course);
    setShowDetails(true);
  };

  const handleStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: "bg-gray-100 text-gray-800", label: "Draft" },
      pending_payment: {
        color: "bg-yellow-100 text-yellow-800",
        label: "Pending Payment",
      },
      active: { color: "bg-green-100 text-green-800", label: "Active" },
      completed: { color: "bg-blue-100 text-blue-800", label: "Completed" },
      cancelled: { color: "bg-red-100 text-red-800", label: "Cancelled" },
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isMobile) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="h-4 w-4 inline" />
    ) : (
      <ChevronDown className="h-4 w-4 inline" />
    );
  };

  if (isLoading || contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-3 py-4 md:px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                Course References
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                Manage and view all your course references
              </p>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={loadCourses}
                className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm md:text-base"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <Link
                href="/dashboard/course-reference/new"
                className="px-3 py-2 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm md:text-base whitespace-nowrap"
              >
                Create New
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden px-3 py-6 md:px-4">
          {/* Stats Cards - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-500">
                    Total Courses
                  </p>
                  <p className="text-lg md:text-2xl font-bold mt-1">
                    {courses.length}
                  </p>
                </div>
                <div className="p-2 md:p-3 bg-blue-100 rounded-lg">
                  <FileText className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-500">
                    Active Courses
                  </p>
                  <p className="text-lg md:text-2xl font-bold mt-1">
                    {courses.filter((c) => c.status === "active").length}
                  </p>
                </div>
                <div className="p-2 md:p-3 bg-green-100 rounded-lg">
                  <Calendar className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-500">
                    Total Candidates
                  </p>
                  <p className="text-lg md:text-2xl font-bold mt-1">
                    {courses.reduce(
                      (sum, course) => sum + (course.candidatesCount || 0),
                      0,
                    )}
                  </p>
                </div>
                <div className="p-2 md:p-3 bg-purple-100 rounded-lg">
                  <Users className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-500">
                    Pending Payment
                  </p>
                  <p className="text-lg md:text-2xl font-bold mt-1">
                    {
                      courses.filter((c) => c.status === "pending_payment")
                        .length
                    }
                  </p>
                </div>
                <div className="p-2 md:p-3 bg-yellow-100 rounded-lg">
                  <span className="text-sm md:text-2xl px-1 font-bold text-yellow-500">
                    £
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-xl shadow-sm p-3 md:p-4 mb-4 md:mb-6">
            <div className="flex flex-col lg:flex-row gap-3 md:gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                  />
                </div>
              </div>

              {/* Sort */}
              <div className="w-full lg:w-48">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                >
                  <option value="createdAt">Sort by Date</option>
                  <option value="courseName">Sort by Name</option>
                  <option value="coursePrice">Sort by Price</option>
                  <option value="candidatesCount">Sort by Candidates</option>
                </select>
              </div>
            </div>
          </div>

          {/* Courses Table Container */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden h-full">
            <div className="overflow-x-auto h-full">
              {isMobile ? (
                /* Mobile View - Cards */
                <div className="p-3 space-y-4">
                  {filteredCourses.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium text-gray-500">
                        No courses found
                      </p>
                      <p className="text-gray-400 mt-2">
                        {searchTerm
                          ? "Try changing your search"
                          : "Create your first course"}
                      </p>
                    </div>
                  ) : (
                    filteredCourses.map((course) => (
                      <div
                        key={course._id}
                        onClick={() => handleRowClick(course._id)}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {course.courseName}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {course.referenceNumber}
                            </p>
                          </div>
                          {handleStatusBadge(course.status)}
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Trainer:</span>
                            <span className="font-medium">
                              {course.trainerName}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Candidates:</span>
                            <span className="font-medium flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {course.candidatesCount || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Price:</span>
                            <span className="font-medium">
                              {course.currencySymbol}{" "}
                              {course.coursePrice?.toFixed(4)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Created:</span>
                            <span className="font-medium flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(course.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                          <button
                            onClick={(e) => handleViewDetails(course, e)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View Details
                          </button>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* Desktop View - Table */
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("referenceNumber")}
                      >
                        <div className="flex items-center gap-1">
                          Reference #
                          <SortIcon column="referenceNumber" />
                        </div>
                      </th>
                      <th
                        className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("courseName")}
                      >
                        <div className="flex items-center gap-1">
                          Course Name
                          <SortIcon column="courseName" />
                        </div>
                      </th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trainer
                      </th>
                      <th
                        className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("candidatesCount")}
                      >
                        <div className="flex items-center gap-1">
                          Candidates
                          <SortIcon column="candidatesCount" />
                        </div>
                      </th>
                      <th
                        className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("coursePrice")}
                      >
                        <div className="flex items-center gap-1">
                          Price
                          <SortIcon column="coursePrice" />
                        </div>
                      </th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th
                        className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("createdAt")}
                      >
                        <div className="flex items-center gap-1">
                          Created
                          <SortIcon column="createdAt" />
                        </div>
                      </th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCourses.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center">
                          <div className="text-gray-500">
                            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium">
                              No courses found
                            </p>
                            <p className="mt-2">
                              {searchTerm
                                ? "Try changing your search"
                                : "Create your first course reference"}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredCourses.map((course) => (
                        <tr
                          key={course._id}
                          onClick={() => handleRowClick(course._id)}
                          className="cursor-pointer hover:bg-gray-50 transition-colors group"
                        >
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {course.referenceNumber || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {course.country || "N/A"}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {course.courseName}
                            </div>
                            {/* <div className="text-xs text-gray-500">
                              Validity: {course.validity} year(s)
                            </div> */}
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-gray-900">
                              {course.trainerName}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {course.trainerId}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium">
                                {course.candidatesCount || 0}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-medium">
                                {course.coursePrice?.toFixed(4)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {course.currencySymbol || "₨"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {handleStatusBadge(course.status)}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {formatDate(course.createdAt)}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => handleViewDetails(course, e)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {filteredCourses.length > 0 && !isMobile && (
              <div className="px-3 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">
                      {filteredCourses.length}
                    </span>{" "}
                    of <span className="font-medium">{courses.length}</span>{" "}
                    courses
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course Details Modal - Responsive */}
      {showDetails && selectedCourse && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50 transition-opacity"
              onClick={() => setShowDetails(false)}
            />
            <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl shadow-2xl mx-auto">
              <div className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">
                    Course Details
                  </h3>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4 md:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">
                        Course Information
                      </h4>
                      <div className="space-y-2 md:space-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Course Name</p>
                          <p className="font-medium text-sm md:text-base">
                            {selectedCourse.courseName}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">
                            Reference Number
                          </p>
                          <p className="font-medium text-sm md:text-base">
                            {selectedCourse.referenceNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Price</p>
                          <p className="font-medium text-sm md:text-base">
                            {selectedCourse.currencySymbol}{" "}
                            {selectedCourse.coursePrice?.toFixed(4)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">
                        Timeline
                      </h4>
                      <div className="space-y-2 md:space-y-3">
                        <div>
                          {/* <p className="text-xs text-gray-500">Validity</p>
                          <p className="font-medium text-sm md:text-base">
                            {selectedCourse.validity} year(s)
                          </p> */}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Start Date</p>
                          <p className="font-medium text-sm md:text-base">
                            {formatDate(selectedCourse.startDate)}
                          </p>
                        </div>
                        <div>
                          {/* <p className="text-xs text-gray-500">Expiry Date</p>
                          <p className="font-medium text-sm md:text-base">
                            {formatDate(selectedCourse.expiryDate)}
                          </p> */}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 md:pt-6">
                    <div className="flex flex-col sm:flex-row justify-end gap-2 md:gap-3">
                      <button
                        onClick={() => {
                          setShowDetails(false);
                          router.push(
                            `/dashboard/course-reference/${selectedCourse._id}/candidates/edit`,
                          );
                        }}
                        className="px-3 py-2 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm md:text-base w-full sm:w-auto"
                      >
                        Manage Candidates
                      </button>
                      <button
                        onClick={() => setShowDetails(false)}
                        className="px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm md:text-base w-full sm:w-auto"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
