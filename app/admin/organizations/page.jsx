"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import {
  Building2,
  Search,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  Mail,
  Phone,
  Calendar,
  Menu,
  X,
  Plus,
  KeyRound,
} from "lucide-react";
import axios from "axios";

const emptyForm = {
  name: "",
  contactPerson: "",
  contactEmail: "",
  phone: "",
  address: "",
  website: "",
  registrationNumber: "",
};

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resettingPasswordId, setResettingPasswordId] = useState(null);
  // Holds the generated password so the admin can pass it on if the email
  // fails to send.
  const [generatedPassword, setGeneratedPassword] = useState(null);

  const handleResetPassword = async (org) => {
    setResettingPasswordId(org._id);
    try {
      const { data } = await axios.post(
        `/api/admin/organizations/${org._id}/reset-password`
      );
      setGeneratedPassword({
        password: data.password,
        emailSent: data.emailSent,
        email: org.contactEmail,
      });
      toast[data.emailSent ? "success" : "warning"](data.message);
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Failed to generate a new password"
      );
    } finally {
      setResettingPasswordId(null);
    }
  };

  // Escape closes the active dialog, matching the convention used by the
  // owner CreateAdminForm/CreateOrganizationForm components. The delete
  // confirmation is dismissed first so Escape unwinds one layer at a time,
  // and neither closes while a mutation is in flight.
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key !== "Escape" || submitting) return;
      if (showDeleteConfirm) {
        setShowDeleteConfirm(null);
      } else if (showModal) {
        setShowModal(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showModal, showDeleteConfirm, submitting]);

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/admin/organizations");
      if (data.success) {
        setOrganizations(data.data.organizations);
      }
    } catch (error) {
      toast.error("Failed to load organizations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const filteredOrganizations = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return organizations.filter(
      (org) =>
        org.name?.toLowerCase().includes(term) ||
        org.contactEmail?.toLowerCase().includes(term) ||
        org.contactPerson?.toLowerCase().includes(term)
    );
  }, [searchTerm, organizations]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openCreateModal = () => {
    setEditingOrg(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (org) => {
    setEditingOrg(org);
    setForm({
      name: org.name || "",
      contactPerson: org.contactPerson || "",
      contactEmail: org.contactEmail || "",
      phone: org.phone || "",
      address: org.address || "",
      website: org.website || "",
      registrationNumber: org.registrationNumber || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingOrg) {
        await axios.put(`/api/admin/organizations/${editingOrg._id}`, form);
        toast.success("Organization updated successfully");
      } else {
        await axios.post("/api/admin/organizations", form);
        toast.success("Organization created successfully");
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditingOrg(null);
      fetchOrganizations();
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Failed to save organization"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/admin/organizations/${id}`);
      toast.success("Organization deleted successfully");
      setShowDeleteConfirm(null);
      fetchOrganizations();
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Failed to delete organization"
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 animate-spin mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-gray-600">Loading organizations...</p>
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              My Organizations
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
              Manage organizations you have created
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white text-sm sm:text-base font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 whitespace-nowrap"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            Create Organization
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Organizations</p>
              <p className="text-2xl font-bold text-gray-900">{organizations.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Search className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Search Results</p>
              <p className="text-2xl font-bold text-gray-900">{filteredOrganizations.length}</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by organization name, email, or contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile View */}
        <div className="block lg:hidden space-y-4">
          {filteredOrganizations.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl shadow-sm text-center border border-gray-100">
              <div className="flex flex-col items-center gap-3">
                <Building2 className="h-10 w-10 text-gray-300" />
                <p className="text-gray-500 font-medium">No organizations found.</p>
              </div>
            </div>
          ) : (
            filteredOrganizations.map((org) => (
              <div
                key={org._id}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-900 text-lg leading-tight truncate">
                        {org.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5 font-medium truncate">
                        <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        {org.contactEmail || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 p-2.5 rounded-xl">
                      <p className="text-[10px] text-gray-500 mb-0.5">Phone</p>
                      <p className="text-xs font-medium text-gray-700 truncate flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{org.phone || "N/A"}</span>
                      </p>
                    </div>
                    <div className="bg-gray-50 p-2.5 rounded-xl">
                      <p className="text-[10px] text-gray-500 mb-0.5">Created</p>
                      <p className="text-xs font-medium text-gray-700 truncate flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{formatDate(org.createdAt)}</span>
                      </p>
                    </div>
                    <div className="bg-gray-50 p-2.5 rounded-xl">
                      <p className="text-[10px] text-gray-500 mb-0.5">Contact</p>
                      <p className="text-xs font-medium text-gray-700 truncate">
                        {org.contactPerson || "N/A"}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-2.5 rounded-xl">
                      <p className="text-[10px] text-gray-500 mb-0.5">Status</p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full ${
                          org.status === "active"
                            ? "bg-green-100 text-green-700"
                            : org.status === "suspended"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {org.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => setSelectedOrg(org)}
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
                    <button
                      onClick={() => setShowDeleteConfirm(org)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {filteredOrganizations.length === 0 ? (
              <div className="p-20 text-center">
                <Building2 className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium text-lg">No organizations found.</p>
              </div>
            ) : (
              <>{/* 8 columns, so an explicit min-width keeps the scrolling
                  inside this container instead of widening the page. */}
              <div className="w-full max-w-full overflow-x-auto">
                <table className="w-full min-w-[900px] divide-y divide-gray-200 tabular-nums">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Organization Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Contact Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Contact Person
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Created Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrganizations.map((org) => (
                      <tr
                        key={org._id}
                        className="hover:bg-gray-50/50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Building2 className="h-4.5 w-4.5 text-blue-600" />
                            </div>
                            <div className="font-bold text-gray-900 wrap-break-word max-w-[220px]">
                              {org.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600 wrap-break-word min-w-[180px] max-w-[260px]">
                            <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            {org.contactEmail || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600 whitespace-nowrap">
                            <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            {org.phone || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 wrap-break-word max-w-[180px]">
                            {org.contactPerson || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            {formatDate(org.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${
                              org.status === "active"
                                ? "bg-green-50 text-green-700 ring-green-700/10"
                                : org.status === "suspended"
                                ? "bg-red-50 text-red-700 ring-red-700/10"
                                : "bg-gray-50 text-gray-700 ring-gray-700/10"
                            }`}
                          >
                            {org.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1 sm:gap-2">
                            <button
                              onClick={() => setSelectedOrg(org)}
                              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              View
                            </button>
                            <button
                              onClick={() => openEditModal(org)}
                              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(org)}
                              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Delete
                            </button>
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
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-600 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowModal(false);
              setEditingOrg(null);
              setForm(emptyForm);
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  {editingOrg ? "Edit Organization" : "Create Organization"}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingOrg(null);
                    setForm(emptyForm);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                    placeholder="Enter organization name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={form.contactPerson}
                    onChange={handleChange}
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
                    name="contactEmail"
                    value={form.contactEmail}
                    onChange={handleChange}
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
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
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
                    name="registrationNumber"
                    value={form.registrationNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                    placeholder="Registration number"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
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
                    name="website"
                    value={form.website}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingOrg(null);
                    setForm(emptyForm);
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
                  {editingOrg ? "Update Organization" : "Create Organization"}
                </button>
              </div>
            </form>
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
                Are you sure you want to delete{" "}
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
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {/* Shows the generated password once, so it can still be delivered by
          hand if the email did not go out. */}
      {generatedPassword && (
        <div className="fixed inset-0 z-700 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
            onClick={() => setGeneratedPassword(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <KeyRound className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              New password generated
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {generatedPassword.emailSent
                ? `Emailed to ${generatedPassword.email}.`
                : "The email could not be sent — share this password securely."}
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6">
              <p className="text-xs text-gray-500 mb-1">Password</p>
              <p className="text-xl font-bold tracking-widest font-mono text-gray-900 break-all">
                {generatedPassword.password}
              </p>
            </div>
            <button
              onClick={() => setGeneratedPassword(null)}
              className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {selectedOrg && (
        <div className="fixed inset-0 z-600 flex items-center w-full justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-hidden">
          <div
            onClick={() => setSelectedOrg(null)}
            className="fixed w-full h-screen top-0 left-0 -z-1"
          ></div>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Organization Details
              </h3>
              <button
                onClick={() => setSelectedOrg(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Organization Name</p>
                <p className="text-sm font-bold text-gray-900">{selectedOrg.name}</p>
              </div>

              {selectedOrg.slug && (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Slug</p>
                  <p className="text-sm font-medium text-gray-900">/{selectedOrg.slug}</p>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Contact Person</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedOrg.contactPerson || "N/A"}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900">
                    {selectedOrg.contactEmail || "N/A"}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Phone</p>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900">
                    {selectedOrg.phone || "N/A"}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Address</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedOrg.address || "N/A"}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Website</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedOrg.website || "N/A"}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Registration Number</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedOrg.registrationNumber || "N/A"}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Created By</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedOrg.createdByNameSnapshot || "N/A"}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Created Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(selectedOrg.createdAt)}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${
                    selectedOrg.status === "active"
                      ? "bg-green-50 text-green-700 ring-green-700/10"
                      : selectedOrg.status === "suspended"
                      ? "bg-red-50 text-red-700 ring-red-700/10"
                      : "bg-gray-50 text-gray-700 ring-gray-700/10"
                  }`}
                >
                  {selectedOrg.status?.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => handleResetPassword(selectedOrg)}
                disabled={resettingPasswordId === selectedOrg._id}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium text-sm transition disabled:opacity-50"
              >
                {resettingPasswordId === selectedOrg._id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                New Password &amp; Send Email
              </button>
              <button
                onClick={() => {
                  setSelectedOrg(null);
                  openEditModal(selectedOrg);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium text-sm transition"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => setSelectedOrg(null)}
                className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 font-medium text-sm transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
