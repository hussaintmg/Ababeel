"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  Mail,
  Phone,
  Calendar,
  X,
  Menu,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  Shield,
  User,
  Hash,
  Clock,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import CreateOrganizationForm from "@/Components/owner/CreateOrganizationForm";

const SEARCH_DEBOUNCE_MS = 400;

export default function OwnerOrganizationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [creatorRoleFilter, setCreatorRoleFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(null);
  const [showReactivateConfirm, setShowReactivateConfirm] = useState(null);

  // Escape closes the active dialog, matching the convention used by the
  // owner CreateAdminForm/CreateOrganizationForm components. Confirmation
  // dialogs are dismissed before the create/edit modals so Escape unwinds one
  // layer at a time, and nothing closes while a mutation is in flight.
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key !== "Escape" || submitting) return;
      if (showDeleteConfirm) setShowDeleteConfirm(null);
      else if (showDeactivateConfirm) setShowDeactivateConfirm(null);
      else if (showReactivateConfirm) setShowReactivateConfirm(null);
      else if (showEditModal) setShowEditModal(false);
      else if (showCreateModal) setShowCreateModal(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [
    showCreateModal,
    showEditModal,
    showDeleteConfirm,
    showDeactivateConfirm,
    showReactivateConfirm,
    submitting,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", "20");
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter) params.set("status", statusFilter);
      if (creatorRoleFilter) params.set("createdByRole", creatorRoleFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const response = await axios.get(
        `/api/owner/organizations?${params.toString()}`
      );
      if (response.data.success) {
        setOrganizations(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
      toast.error("Failed to load organizations");
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    debouncedSearch,
    statusFilter,
    creatorRoleFilter,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setStatusFilter("");
    setCreatorRoleFilter("");
    setDateFrom("");
    setDateTo("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    statusFilter || creatorRoleFilter || dateFrom || dateTo;

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const openEditModal = (org) => {
    setEditingOrg(org);
    setEditForm({
      name: org.name || "",
      slug: org.slug || "",
      contactPerson: org.contactPerson || "",
      contactEmail: org.contactEmail || "",
      phone: org.phone || "",
      address: org.address || "",
      website: org.website || "",
      registrationNumber: org.registrationNumber || "",
      status: org.status || "active",
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.put(`/api/owner/organizations/${editingOrg._id}`, {
        name: editForm.name.trim(),
        slug: editForm.slug.trim(),
        contactPerson: editForm.contactPerson.trim(),
        contactEmail: editForm.contactEmail.trim(),
        phone: editForm.phone.trim(),
        address: editForm.address.trim(),
        website: editForm.website.trim(),
        registrationNumber: editForm.registrationNumber.trim(),
        status: editForm.status,
      });
      toast.success("Organization updated successfully");
      setShowEditModal(false);
      setEditingOrg(null);
      fetchOrganizations();
    } catch (error) {
      console.error("Error updating organization:", error);
      toast.error(
        error.response?.data?.error || "Failed to update organization"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/owner/organizations/${id}`);
      toast.success("Organization deleted permanently");
      setShowDeleteConfirm(null);
      fetchOrganizations();
    } catch (error) {
      console.error("Error deleting organization:", error);
      toast.error("Failed to delete organization");
    }
  };

  const handleStatusChange = async (id, action, previousStatus) => {
    try {
      await axios.patch(`/api/owner/organizations/${id}`, {
        action,
        previousStatus,
      });
      toast.success(
        `Organization ${action === "deactivate" ? "deactivated" : action === "suspend" ? "suspended" : "reactivated"} successfully`
      );
      setShowDeactivateConfirm(null);
      setShowReactivateConfirm(null);
      fetchOrganizations();
    } catch (error) {
      console.error("Error changing organization status:", error);
      toast.error(
        error.response?.data?.error || "Failed to update organization status"
      );
    }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return null;
    return (
      <span className="ml-1">{sortOrder === "asc" ? "\u2191" : "\u2193"}</span>
    );
  };

  if (loading && organizations.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="text-center bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium text-sm sm:text-base">
            Loading organizations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Organizations
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
              Manage all registered organizations
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white text-sm sm:text-base font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 whitespace-nowrap"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            Create Organization
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <StatCard
            title="Total Organizations"
            value={pagination.totalCount}
            icon={Building2}
            color="blue"
          />
          <StatCard
            title="Active"
            value={
              organizations.filter((o) => o.status === "active").length
            }
            icon={Building2}
            color="green"
          />
          <StatCard
            title="Inactive"
            value={
              organizations.filter((o) => o.status === "inactive").length
            }
            icon={Building2}
            color="yellow"
          />
          <StatCard
            title="Page"
            value={`${pagination.page} / ${pagination.totalPages || 1}`}
            icon={Clock}
            color="indigo"
          />
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* Mobile Menu Toggle */}
          <div className="sm:hidden p-3 border-b border-gray-200">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <span className="font-medium text-gray-700 flex items-center">
                <Building2 className="h-4 w-4 mr-2 text-blue-600" />
                Organizations
              </span>
              {mobileMenuOpen ? (
                <X className="h-4 w-4 text-gray-500" />
              ) : (
                <Menu className="h-4 w-4 text-gray-500" />
              )}
            </button>
          </div>

          {/* Search and Filters */}
          <div className="p-3 sm:p-4 border-b border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, slug, email, contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  maxLength={200}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 text-sm border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-colors ${
                  hasActiveFilters
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {[statusFilter, creatorRoleFilter, dateFrom, dateTo].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Created By
                    </label>
                    <select
                      value={creatorRoleFilter}
                      onChange={(e) => {
                        setCreatorRoleFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Creators</option>
                      <option value="owner">Owner</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Created From
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => {
                        setDateFrom(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Created To
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => {
                        setDateTo(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={clearFilters}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                      <X className="h-3 w-3" />
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Table.
              The table has 9 columns, so it is given an explicit min-width and
              scrolls inside its own container. Without this the row content
              pushed the page itself sideways. */}
          <div className="hidden md:block bg-white w-full max-w-full overflow-x-auto">
            <table className="w-full min-w-[1100px] divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    onClick={() => handleSort("name")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Organization
                    <SortIcon field="name" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th
                    onClick={() => handleSort("status")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Status
                    <SortIcon field="status" />
                  </th>
                  <th
                    onClick={() => handleSort("createdAt")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Created
                    <SortIcon field="createdAt" />
                  </th>
                  <th
                    onClick={() => handleSort("updatedAt")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Updated
                    <SortIcon field="updatedAt" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {organizations.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-12 text-center text-gray-500 text-sm"
                    >
                      <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      No organizations found
                    </td>
                  </tr>
                ) : (
                  organizations.map((org) => (
                    <tr
                      key={org._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-3 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                              {org.name}
                            </div>
                            {org.slug && (
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Hash className="h-3 w-3" />
                                {org.slug}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {org.contactPerson && (
                            <div className="font-medium text-gray-700">
                              {org.contactPerson}
                            </div>
                          )}
                          <div className="flex items-center text-xs text-gray-500 mt-0.5">
                            <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate max-w-[160px]">
                              {org.contactEmail || "N/A"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-900">
                          <Phone className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                          <span className="truncate">
                            {org.phone || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {org.createdByRole === "owner" ? (
                            <Shield className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                          ) : (
                            <User className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
                          )}
                          <div className="text-sm min-w-0">
                            <span className="text-gray-900 font-medium">
                              {org.createdByNameSnapshot || "Unknown"}
                            </span>
                            <span className="text-gray-400 mx-1">&mdash;</span>
                            <span
                              className={`text-xs font-medium ${
                                org.createdByRole === "owner"
                                  ? "text-amber-600"
                                  : "text-purple-600"
                              }`}
                            >
                              {org.createdByRole === "owner"
                                ? "Owner"
                                : "Admin"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={org.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(org.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDateTime(org.updatedAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            onClick={() =>
                              router.push(`/owner/organizations/${org._id}`)
                            }
                            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            title="View details"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => openEditModal(org)}
                            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                            title="Edit organization"
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </button>
                          {org.status === "active" ? (
                            <button
                              onClick={() => setShowDeactivateConfirm(org)}
                              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                              title="Deactivate organization"
                            >
                              <RotateCcw className="h-3.5 w-3.5 mr-1" />
                              Deactivate
                            </button>
                          ) : org.status === "inactive" ||
                            org.status === "suspended" ? (
                            <button
                              onClick={() => setShowReactivateConfirm(org)}
                              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                              title="Reactivate organization"
                            >
                              <RotateCcw className="h-3.5 w-3.5 mr-1" />
                              Reactivate
                            </button>
                          ) : null}
                          <button
                            onClick={() => setShowDeleteConfirm(org)}
                            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                            title="Permanently delete"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden bg-white">
            {organizations.length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-500 text-sm">
                <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                No organizations found
              </div>
            ) : (
              organizations.map((org) => (
                <div
                  key={org._id}
                  className="border-b border-gray-200 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-3 min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 break-words">
                          {org.name}
                        </div>
                        {org.slug && (
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Hash className="h-3 w-3 flex-shrink-0" />
                            <span className="break-all">{org.slug}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={org.status} />
                  </div>

                  <div className="space-y-1.5 mb-3">
                    {org.contactPerson && (
                      <div className="flex items-center text-xs text-gray-700">
                        <User className="h-3.5 w-3.5 mr-2 text-gray-400 flex-shrink-0" />
                        <span>{org.contactPerson}</span>
                      </div>
                    )}
                    <div className="flex items-center text-xs text-gray-600">
                      <Mail className="h-3.5 w-3.5 mr-2 text-gray-400 flex-shrink-0" />
                      <span className="break-all">
                        {org.contactEmail || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                      <Phone className="h-3.5 w-3.5 mr-2 text-gray-400 flex-shrink-0" />
                      <span>{org.phone || "N/A"}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      {org.createdByRole === "owner" ? (
                        <Shield className="h-3.5 w-3.5 mr-2 text-amber-500 flex-shrink-0" />
                      ) : (
                        <User className="h-3.5 w-3.5 mr-2 text-purple-500 flex-shrink-0" />
                      )}
                      <span className="font-medium">Created by:</span>
                      <span className="ml-1 text-gray-700">
                        {org.createdByNameSnapshot || "Unknown"}
                      </span>
                      <span className="text-gray-400 mx-1">&mdash;</span>
                      <span
                        className={`font-medium ${
                          org.createdByRole === "owner"
                            ? "text-amber-600"
                            : "text-purple-600"
                        }`}
                      >
                        {org.createdByRole === "owner" ? "Owner" : "Admin"}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3.5 w-3.5 mr-2 text-gray-400 flex-shrink-0" />
                      <span>{formatDate(org.createdAt)}</span>
                      {org.updatedAt && org.updatedAt !== org.createdAt && (
                        <>
                          <span className="mx-1">&middot;</span>
                          <span>Updated {formatDate(org.updatedAt)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() =>
                        router.push(`/owner/organizations/${org._id}`)
                      }
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      View
                    </button>
                    <button
                      onClick={() => openEditModal(org)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </button>
                    {org.status === "active" ? (
                      <button
                        onClick={() => setShowDeactivateConfirm(org)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowReactivateConfirm(org)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        Reactivate
                      </button>
                    )}
                    <button
                      onClick={() => setShowDeleteConfirm(org)}
                      className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-3 sm:px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="text-xs sm:text-sm text-gray-600">
                Showing{" "}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.totalCount
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium">{pagination.totalCount}</span>{" "}
                organizations
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.max(1, p - 1))
                  }
                  disabled={!pagination.hasPrevPage}
                  className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-600" />
                </button>
                {Array.from(
                  { length: Math.min(5, pagination.totalPages) },
                  (_, i) => {
                    const startPage = Math.max(
                      1,
                      pagination.page - 2
                    );
                    return startPage + i;
                  }
                )
                  .filter((p) => p <= pagination.totalPages)
                  .map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                        p === pagination.page
                          ? "bg-blue-600 text-white"
                          : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                <button
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(pagination.totalPages, p + 1)
                    )
                  }
                  disabled={!pagination.hasNextPage}
                  className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Organization Modal */}
      <CreateOrganizationForm
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchOrganizations}
      />

      {/* Edit Organization Modal */}
      {showEditModal && editingOrg && (
        <div className="fixed inset-0 z-600 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowEditModal(false);
              setEditingOrg(null);
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Edit Organization
                </h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingOrg(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                    placeholder="Enter organization name"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug / Identifier
                  </label>
                  <input
                    type="text"
                    value={editForm.slug}
                    onChange={(e) =>
                      setEditForm({ ...editForm, slug: e.target.value })
                    }
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                    placeholder="organization-slug"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={editForm.contactPerson}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        contactPerson: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                    placeholder="Contact person name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={editForm.contactEmail}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        contactEmail: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                    placeholder="contact@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                    placeholder="+1 234 567 890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    value={editForm.registrationNumber}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        registrationNumber: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                    placeholder="Registration number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value })
                    }
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    value={editForm.address}
                    onChange={(e) =>
                      setEditForm({ ...editForm, address: e.target.value })
                    }
                    rows={2}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 resize-none"
                    placeholder="Organization address"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={editForm.website}
                    onChange={(e) =>
                      setEditForm({ ...editForm, website: e.target.value })
                    }
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingOrg(null);
                  }}
                  className="px-4 sm:px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Update Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {showDeactivateConfirm && (
        <div className="fixed inset-0 z-600 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeactivateConfirm(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Deactivate Organization
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to deactivate{" "}
                <span className="font-semibold text-gray-900">
                  {showDeactivateConfirm.name}
                </span>
                ? The organization will be marked as inactive and hidden from
                default views.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowDeactivateConfirm(null)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleStatusChange(
                      showDeactivateConfirm._id,
                      "deactivate",
                      showDeactivateConfirm.status
                    )
                  }
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  Deactivate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reactivate Confirmation Modal */}
      {showReactivateConfirm && (
        <div className="fixed inset-0 z-600 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowReactivateConfirm(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Reactivate Organization
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to reactivate{" "}
                <span className="font-semibold text-gray-900">
                  {showReactivateConfirm.name}
                </span>
                ? The organization will be set back to active status.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowReactivateConfirm(null)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleStatusChange(
                      showReactivateConfirm._id,
                      "reactivate",
                      showReactivateConfirm.status
                    )
                  }
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reactivate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-600 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Delete Organization
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to permanently delete{" "}
                <span className="font-semibold text-gray-900">
                  {showDeleteConfirm.name}
                </span>
                ? This action cannot be undone.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm._id)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  };

  return (
    <div
      className={`bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border ${colors[color]} shadow-sm`}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-gray-500 mb-0.5 sm:mb-1 truncate">
            {title}
          </p>
          <p className="text-base sm:text-lg md:text-2xl font-bold text-gray-900 truncate">
            {value}
          </p>
        </div>
        <div
          className={`p-2 sm:p-3 rounded-lg ${colors[color]} ml-2 flex-shrink-0`}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-yellow-100 text-yellow-700",
    suspended: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
}
