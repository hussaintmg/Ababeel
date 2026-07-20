"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  Loader,
  RefreshCw,
  Check,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import ConfirmationModal from "@/Components/ConfirmationModal";

const DefaultCoursesPage = () => {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [deleteAllLoading, setDeleteAllLoading] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [updateLoading, setUpdateLoading] = useState(null);

  // Confirmation Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

  // Fetch courses from API
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/courses/default`);

      if (!response.data.success) {
        throw new Error("Failed to fetch courses");
      }

      const data = response?.data;
      console.log(data);

      if (data.success) {
        setCourses(data?.data || []);
        setFilteredCourses(data?.data || []);
      } else {
        throw new Error(data.error || "Failed to load courses");
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error(error.message || "Failed to load courses");
      setCourses([]);
      setFilteredCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Handle search filtering
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCourses(courses);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = courses.filter(
      (course) =>
        course.name?.toLowerCase().includes(searchLower) ||
        course.description?.toLowerCase().includes(searchLower) ||
        course.status?.toLowerCase().includes(searchLower)
    );

    setFilteredCourses(filtered);
  }, [searchTerm, courses]);

  // Handle edit start
  const handleEditStart = (course) => {
    setEditingCourse(course._id);
    setEditFormData({
      name: course.name || "",
      description: course.description || "",
      price: course.price || "",
      status: course.status || "draft",
    });
  };

  // Handle edit cancel
  const handleEditCancel = () => {
    setEditingCourse(null);
    setEditFormData({});
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle course update
  const handleUpdate = async (courseId) => {
    if (!editFormData.name?.trim()) {
      toast.error("Course name is required");
      return;
    }

    try {
      setUpdateLoading(courseId);

      const response = await axios.put(
        `/api/courses/default/${courseId}`,
        editFormData
      );

      if (response.data.success) {
        toast.success("Course updated successfully");
        setEditingCourse(null);
        setEditFormData({});
        fetchCourses(); // Refresh the list
      } else {
        throw new Error(response.data.error || "Failed to update course");
      }
    } catch (error) {
      console.error("Error updating course:", error);
      toast.error(error.message || "Failed to update course");
    } finally {
      setUpdateLoading(null);
    }
  };

  // Handle delete confirmation
  const handleDeleteClick = (courseId, courseName) => {
    setCourseToDelete({ id: courseId, name: courseName });
    setShowDeleteModal(true);
  };

  // Handle confirmed delete
  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return;

    try {
      setDeleteLoading(courseToDelete.id);

      const response = await axios.delete(
        `/api/courses/default/${courseToDelete.id}`
      );

      if (response.data.success) {
        toast.success(`Course "${courseToDelete.name}" deleted successfully`);
        fetchCourses(); // Refresh the list
      } else {
        throw new Error(response.data.error || "Failed to delete course");
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error(error.message || "Failed to delete course");
    } finally {
      setDeleteLoading(null);
      setShowDeleteModal(false);
      setCourseToDelete(null);
    }
  };

  //Handle delete all
  const handleDeleteAll = async () => {
    try {
      setDeleteAllLoading(true);
      const response = await axios.delete(`/api/courses/default/delete/all`);

      if (response.data.success) {
        toast.success("All Courses deleted successfully");
        setEditingCourse(null);
        setEditFormData({});
        fetchCourses();
      } else {
        throw new Error(response.data.error || "Failed to update course");
      }
    } catch (err) {
      console.log(err);
    } finally {
      setDeleteAllLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (price,currencySymbol) => {
    if (!price) return "Free";
    return `${currencySymbol} ${parseFloat(price).toLocaleString("en-PK")}`;
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      draft: { color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
      archived: { color: "bg-gray-100 text-gray-800", icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setCourseToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Course"
        message={
          <>
            Are you sure you want to delete
            <span className="font-semibold text-gray-900">
              {" "}
              &quot;{courseToDelete?.name}&quot;
            </span>
            ?<p className="mt-2 text-red-600">This action cannot be undone.</p>
          </>
        }
        confirmText={deleteLoading ? "Deleting..." : "Yes, Delete"}
        cancelText="Cancel"
        type="delete"
      />

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Default Courses
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your default course catalog
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchCourses()}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={() => router.push("/admin/default-course/new")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              Add Course
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses by name, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10! pr-4! py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              <span className="ml-2 text-gray-600">Loading courses...</span>
            </div>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <AlertCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No courses found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? "No courses match your search. Try a different search term."
                : "Get started by creating a new course"}
            </p>
            <button
              onClick={() => router.push("/owner/default-course/new")}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Create Course
            </button>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-medium">{filteredCourses.length}</span> of{" "}
                <span className="font-medium">{courses.length}</span> courses
                {searchTerm && (
                  <span className="ml-2">
                    for &quot;<span className="font-medium">{searchTerm}</span>&quot;
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Course Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Price
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCourses.map((course) => (
                    <tr key={course._id} className="hover:bg-gray-50">
                      {/* Course Name Column */}
                      <td className="px-6 py-4">
                        {editingCourse === course._id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              name="name"
                              value={editFormData.name}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Course name"
                            />
                            <textarea
                              name="description"
                              value={editFormData.description}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Description"
                              rows="2"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                              <span className="text-blue-600 font-bold">
                                {course.name?.charAt(0).toUpperCase() || "C"}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {course.name}
                              </div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {course.description || "No description"}
                              </div>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Price Column */}
                      <td className="px-6 py-4">
                        {editingCourse === course._id ? (
                          <input
                            type="number"
                            name="price"
                            value={editFormData.price}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Price"
                          />
                        ) : (
                          <div className="font-semibold text-gray-900">
                            {formatCurrency(course.price,course.currencySymbol)}
                          </div>
                        )}
                      </td>

                      {/* Status Column */}
                      <td className="px-6 py-4">
                        {editingCourse === course._id ? (
                          <select
                            name="status"
                            value={editFormData.status}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="draft">Draft</option>
                            <option value="active">Active</option>
                            <option value="archived">Archived</option>
                          </select>
                        ) : (
                          getStatusBadge(course.status || "draft")
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {editingCourse === course._id ? (
                            <>
                              <button
                                onClick={() => handleUpdate(course._id)}
                                disabled={updateLoading === course._id}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                                title="Save"
                              >
                                {updateLoading === course._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                onClick={handleEditCancel}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditStart(course)}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteClick(course._id, course.name)
                                }
                                disabled={deleteLoading === course._id}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                title="Delete"
                              >
                                {deleteLoading === course._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      {filteredCourses.length !== 0 && (
        <button
          onClick={() => handleDeleteAll()}
          className={`my-3 w-full text-center text-white py-3 rounded-xl hover:-translate-y-0.5 transition-all ${
            deleteAllLoading || deleteLoading ? " bg-red-200" : " bg-red-600"
          } `}
        >
          {deleteAllLoading ? (
            <Loader className="mx-auto animate-spin" />
          ) : (
            "Delete All Courses"
          )}
        </button>
      )}
    </div>
  );
};

export default DefaultCoursesPage;
