"use client";

import { useState, useEffect, useCallback } from "react";
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
  Globe,
  Lock,
  Plus,
  Loader2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import DataTablePagination from "@/Components/common/DataTablePagination";
import DataTableBulkBar from "@/Components/common/DataTableBulkBar";
import ConfirmationModal from "@/Components/ConfirmationModal";

export default function CourseReferencesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    courses: contextCourses,
    loading: contextLoading,
    fetchCourses,
  } = useCourseReference();

  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [togglingMap, setTogglingMap] = useState({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const loadCourses = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axios.get("/api/course-ref");
      if (res.data?.success) {
        setCourses(res.data.data || []);
      } else if (contextCourses) {
        setCourses(contextCourses);
      }
    } catch (error) {
      console.error("Error loading courses:", error);
      if (contextCourses) setCourses(contextCourses);
    } finally {
      setIsLoading(false);
    }
  }, [contextCourses]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  // Filter and sort courses
  useEffect(() => {
    let result = [...courses];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (course) =>
          course.courseName?.toLowerCase().includes(term) ||
          course.referenceName?.toLowerCase().includes(term) ||
          course.referenceCode?.toLowerCase().includes(term) ||
          course.referenceNumber?.toLowerCase().includes(term) ||
          course.location?.toLowerCase().includes(term)
      );
    }

    result.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "createdAt" || sortBy === "startDate") {
        aValue = new Date(a[sortBy] || 0);
        bValue = new Date(b[sortBy] || 0);
      } else if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = (bValue || "").toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredCourses(result);
    setPage(1);
  }, [courses, searchTerm, sortBy, sortOrder]);

  const totalItems = filteredCourses.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (page - 1) * pageSize;
  const visibleCourses = filteredCourses.slice(startIndex, startIndex + pageSize);

  const isPageAllSelected =
    visibleCourses.length > 0 &&
    visibleCourses.every((c) => selectedCourses.includes(c._id));
  const isPageSomeSelected =
    visibleCourses.some((c) => selectedCourses.includes(c._id)) && !isPageAllSelected;

  const handleToggleSelectPage = () => {
    if (isPageAllSelected) {
      const visibleIds = new Set(visibleCourses.map((c) => c._id));
      setSelectedCourses((prev) => prev.filter((id) => !visibleIds.has(id)));
    } else {
      const visibleIds = visibleCourses.map((c) => c._id);
      setSelectedCourses((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleToggleCourse = (id, e) => {
    e?.stopPropagation();
    setSelectedCourses((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!selectedCourses.length) return;
    try {
      setIsBulkDeleting(true);
      const res = await axios.delete("/api/course-ref/delete/bulk", {
        data: { ids: selectedCourses },
      });
      if (res.data?.success) {
        toast.success(
          res.data.data?.message || `${selectedCourses.length} course reference(s) deleted`
        );
        const deletedSet = new Set(selectedCourses);
        setCourses((prev) => prev.filter((c) => !deletedSet.has(c._id)));
        setFilteredCourses((prev) => prev.filter((c) => !deletedSet.has(c._id)));
        setSelectedCourses([]);
        setShowBulkDeleteModal(false);
        fetchCourses?.();
      } else {
        toast.error(res.data?.error || "Failed to delete course references");
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to delete course references");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleTogglePublic = async (courseId, currentValue, e) => {
    e.stopPropagation();
    setTogglingMap((prev) => ({ ...prev, [courseId]: true }));

    const nextValue = !currentValue;

    // Optimistic update
    setCourses((prev) =>
      prev.map((c) =>
        c._id === courseId ? { ...c, showInSchedule: nextValue } : c
      )
    );

    try {
      const res = await axios.patch(`/api/course-ref/${courseId}`, {
        showInSchedule: nextValue,
      });

      if (res.data?.success) {
        toast.success(
          nextValue
            ? "Reference is now visible on public schedule & course pages!"
            : "Reference is hidden from public schedule"
        );
      } else {
        throw new Error(res.data?.error || "Failed to update visibility");
      }
    } catch (error) {
      console.error("Toggle error:", error);
      toast.error(error.message || "Failed to toggle schedule visibility");
      // Revert optimistic update
      setCourses((prev) =>
        prev.map((c) =>
          c._id === courseId ? { ...c, showInSchedule: currentValue } : c
        )
      );
    } finally {
      setTogglingMap((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  const handleRowClick = (courseId) => {
    router.push(`/dashboard/course-reference/${courseId}/candidates/edit`);
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
      full: { color: "bg-purple-100 text-purple-800", label: "Full" },
    };

    const config = statusConfig[status] || statusConfig.active;
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
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
    if (!dateString) return "Flexible / TBA";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Course References & Sessions
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage organization course references and control website public schedule visibility
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadCourses}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <Link
              href="/dashboard/course-reference/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium shadow-sm transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Reference
            </Link>
          </div>
        </div>

        {/* Search & Sort Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by reference title, code, course name, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="sm:w-56">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              >
                <option value="createdAt">Sort by Date Created</option>
                <option value="startDate">Sort by Start Date</option>
                <option value="courseName">Sort by Course Name</option>
                <option value="candidatesCount">Sort by Candidates</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Action Bar */}
        <DataTableBulkBar
          selectedCount={selectedCourses.length}
          onClearSelection={() => setSelectedCourses([])}
          itemName="course references"
          actions={
            <button
              type="button"
              onClick={() => setShowBulkDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected ({selectedCourses.length})
            </button>
          }
        />

        {/* References Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Loading course references...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-900 mb-1">No course references found</h3>
              <p className="text-sm text-gray-500 mb-4">
                {searchTerm ? "Try searching for another term" : "Create your first reference session to start enrolling candidates"}
              </p>
              <Link
                href="/dashboard/course-reference/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Create Reference
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3.5 text-center w-12">
                      <input
                        type="checkbox"
                        checked={isPageAllSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isPageSomeSelected;
                        }}
                        onChange={handleToggleSelectPage}
                        className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                        aria-label="Select all on this page"
                      />
                    </th>
                    <th
                      onClick={() => handleSort("courseName")}
                      className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1">
                        Course & Session Title
                        <SortIcon column="courseName" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("startDate")}
                      className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1">
                        Start Date
                        <SortIcon column="startDate" />
                      </div>
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Mode & Location
                    </th>
                    <th
                      onClick={() => handleSort("candidatesCount")}
                      className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1">
                        Enrolled / Seats
                        <SortIcon column="candidatesCount" />
                      </div>
                    </th>
                    <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Public Schedule
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visibleCourses.map((course) => {
                    const isPublic = course.showInSchedule !== false;
                    const isToggling = !!togglingMap[course._id];

                    return (
                      <tr
                        key={course._id}
                        onClick={() => handleRowClick(course._id)}
                        className={`cursor-pointer transition-colors group ${
                          selectedCourses.includes(course._id)
                            ? "bg-blue-50/70 hover:bg-blue-50"
                            : "hover:bg-blue-50/40"
                        }`}
                      >
                        {/* Row Selection Checkbox */}
                        <td
                          className="px-4 py-4 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedCourses.includes(course._id)}
                            onChange={(e) => handleToggleCourse(course._id, e)}
                            className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                            aria-label={`Select ${course.referenceName || course.courseName}`}
                          />
                        </td>

                        {/* Course & Session Info */}
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900 text-sm">
                            {course.referenceName || course.courseName}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                            {course.referenceCode && (
                              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                                {course.referenceCode}
                              </span>
                            )}
                            <span className="text-gray-400">• Ref #{course.referenceNumber}</span>
                          </div>
                        </td>

                        {/* Dates */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {formatDate(course.startDate)}
                          </div>
                          {course.endDate && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              to {formatDate(course.endDate)}
                            </div>
                          )}
                        </td>

                        {/* Mode & Location */}
                        <td className="px-6 py-4">
                          <div className="text-xs font-medium text-gray-900 capitalize">
                            {course.modeLabel || course.mode || "Online"}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-[150px]">
                            {course.location || "Online"}
                          </div>
                        </td>

                        {/* Enrolled / Seats */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                            <Users className="w-4 h-4 text-blue-600" />
                            <span>{course.candidatesCount || 0}</span>
                            <span className="text-xs text-gray-400">/ {course.seats || 20}</span>
                          </div>
                        </td>

                        {/* Public Schedule Toggle */}
                        <td
                          className="px-6 py-4 text-center whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => handleTogglePublic(course._id, isPublic, e)}
                              disabled={isToggling}
                              title={isPublic ? "Visible on /schedule and course pages. Click to hide." : "Hidden from public schedule. Click to show."}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                isPublic ? "bg-green-600" : "bg-gray-300"
                              } ${isToggling ? "opacity-60 cursor-wait" : ""}`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                  isPublic ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                            <span className="text-xs font-medium text-gray-600 min-w-[50px] text-left">
                              {isPublic ? (
                                <span className="text-green-700 flex items-center gap-1">
                                  <Globe className="w-3 h-3" /> Public
                                </span>
                              ) : (
                                <span className="text-gray-400 flex items-center gap-1">
                                  <Lock className="w-3 h-3" /> Hidden
                                </span>
                              )}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {handleStatusBadge(course.status)}
                        </td>

                        {/* Action */}
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <Link
                            href={`/dashboard/course-reference/${course._id}/candidates/edit`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Candidates
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <DataTablePagination
                page={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setPage(1);
                }}
                itemName="course references"
              />
            </div>
          )}
        </div>
      </div>

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
        title="Delete Course References"
        message={`Are you sure you want to permanently delete ${selectedCourses.length} selected course reference(s)? All candidate records associated with these references will also be removed. This action cannot be undone.`}
        confirmText={isBulkDeleting ? "Deleting..." : "Delete Selected"}
        type="delete"
      />
    </div>
  );
}
