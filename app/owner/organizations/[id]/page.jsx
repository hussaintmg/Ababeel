"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Building2,
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  Calendar,
  Globe,
  MapPin,
  Shield,
  User,
  Hash,
  Clock,
  Pencil,
  KeyRound,
  RotateCcw,
  Trash2,
  ExternalLink,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

export default function OrganizationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [showReactivateConfirm, setShowReactivateConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  // Holds the generated password so the owner can still pass it on if the
  // email fails to send.
  const [generatedPassword, setGeneratedPassword] = useState(null);

  const handleResetPassword = async () => {
    setResettingPassword(true);
    try {
      const { data } = await axios.post(
        `/api/owner/users/${organization._id}/reset-password`
      );
      setGeneratedPassword({
        password: data.password,
        emailSent: data.emailSent,
        email: organization.contactEmail,
      });
      toast[data.emailSent ? "success" : "warning"](data.message);
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Failed to generate a new password"
      );
    } finally {
      setResettingPassword(false);
      setShowPasswordConfirm(false);
    }
  };

  const fetchOrganization = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await axios.get(`/api/owner/organizations/${id}`);
      if (response.data.success) {
        setOrganization(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching organization:", error);
      toast.error("Failed to load organization details");
      router.push("/owner/organizations");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

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

  const openEditModal = () => {
    if (!organization) return;
    setEditForm({
      name: organization.name || "",
      slug: organization.slug || "",
      contactPerson: organization.contactPerson || "",
      contactEmail: organization.contactEmail || "",
      phone: organization.phone || "",
      address: organization.address || "",
      website: organization.website || "",
      registrationNumber: organization.registrationNumber || "",
      status: organization.status || "active",
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.put(`/api/owner/organizations/${organization._id}`, {
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
      fetchOrganization();
    } catch (error) {
      console.error("Error updating organization:", error);
      toast.error(
        error.response?.data?.error || "Failed to update organization"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (action) => {
    try {
      await axios.patch(`/api/owner/organizations/${organization._id}`, {
        action,
        previousStatus: organization.status,
      });
      toast.success(
        `Organization ${action === "deactivate" ? "deactivated" : "reactivated"} successfully`
      );
      setShowDeactivateConfirm(false);
      setShowReactivateConfirm(false);
      fetchOrganization();
    } catch (error) {
      console.error("Error changing status:", error);
      toast.error(
        error.response?.data?.error || "Failed to update status"
      );
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/owner/organizations/${organization._id}`);
      toast.success("Organization deleted permanently");
      router.push("/owner/organizations");
    } catch (error) {
      console.error("Error deleting organization:", error);
      toast.error("Failed to delete organization");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="text-center bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium text-sm sm:text-base">
            Loading organization details...
          </p>
        </div>
      </div>
    );
  }

  if (!organization) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push("/owner/organizations")}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-4 sm:mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Organizations
        </button>

        {/* Header */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-6">
          <div className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                    {organization.name}
                  </h1>
                  {organization.slug && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <Hash className="h-3.5 w-3.5" />
                      {organization.slug}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <StatusBadge status={organization.status} />
                    <span className="text-xs text-gray-400">&middot;</span>
                    <span className="text-xs text-gray-500">
                      Created {formatDate(organization.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                <button
                  onClick={openEditModal}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => setShowPasswordConfirm(true)}
                  disabled={resettingPassword}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                  {resettingPassword ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="h-4 w-4" />
                  )}
                  New Password &amp; Send Email
                </button>
                {organization.status === "active" ? (
                  <button
                    onClick={() => setShowDeactivateConfirm(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Deactivate
                  </button>
                ) : (
                  <button
                    onClick={() => setShowReactivateConfirm(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reactivate
                  </button>
                )}
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
              Contact Information
            </h2>
            <div className="space-y-3">
              {organization.contactPerson && (
                <DetailRow
                  icon={User}
                  label="Contact Person"
                  value={organization.contactPerson}
                />
              )}
              <DetailRow
                icon={Mail}
                label="Email"
                value={organization.contactEmail || "N/A"}
              />
              <DetailRow
                icon={Phone}
                label="Phone"
                value={organization.phone || "N/A"}
              />
              {organization.address && (
                <DetailRow
                  icon={MapPin}
                  label="Address"
                  value={organization.address}
                />
              )}
              {organization.website && (
                <div className="flex items-start gap-3 py-2">
                  <Globe className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Website</p>
                    <a
                      href={organization.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 break-all"
                    >
                      {organization.website}
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                  </div>
                </div>
              )}
              {organization.registrationNumber && (
                <DetailRow
                  icon={Hash}
                  label="Registration Number"
                  value={organization.registrationNumber}
                />
              )}
            </div>
          </div>

          {/* Creator & Metadata */}
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
              Creator & Metadata
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 py-2">
                {organization.createdByRole === "owner" ? (
                  <Shield className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <User className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p className="text-xs text-gray-500">Created By</p>
                  <p className="text-sm text-gray-900 font-medium">
                    {organization.createdByNameSnapshot || "Unknown"}
                    <span className="text-gray-400 mx-1">&mdash;</span>
                    <span
                      className={`font-medium ${
                        organization.createdByRole === "owner"
                          ? "text-amber-600"
                          : "text-purple-600"
                      }`}
                    >
                      {organization.createdByRole === "owner"
                        ? "Owner"
                        : "Admin"}
                    </span>
                  </p>
                </div>
              </div>

              <DetailRow
                icon={Calendar}
                label="Created"
                value={formatDateTime(organization.createdAt)}
              />
              <DetailRow
                icon={Clock}
                label="Last Updated"
                value={formatDateTime(organization.updatedAt)}
              />
              {organization.lastActivityAt && (
                <DetailRow
                  icon={Clock}
                  label="Last Activity"
                  value={formatDateTime(organization.lastActivityAt)}
                />
              )}

              <div className="flex items-start gap-3 py-2">
                <Building2 className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <StatusBadge status={organization.status} />
                </div>
              </div>

              <div className="flex items-start gap-3 py-2">
                <Hash className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Organization ID</p>
                  <p className="text-xs text-gray-400 font-mono break-all">
                    {organization._id}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-600 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowEditModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Edit Organization
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="sr-only">Close</span>
                  <span className="h-5 w-5 block">&times;</span>
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
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 sm:px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Update Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation */}
      {showDeactivateConfirm && (
        <div className="fixed inset-0 z-600 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeactivateConfirm(false)}
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
                  {organization.name}
                </span>
                ?
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowDeactivateConfirm(false)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleStatusChange("deactivate")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors"
                >
                  Deactivate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reactivate Confirmation */}
      {showReactivateConfirm && (
        <div className="fixed inset-0 z-600 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowReactivateConfirm(false)}
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
                  {organization.name}
                </span>
                ?
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowReactivateConfirm(false)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleStatusChange("reactivate")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors"
                >
                  Reactivate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {/* Confirm generating a new password */}
      {showPasswordConfirm && (
        <div className="fixed inset-0 z-600 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
            onClick={() => setShowPasswordConfirm(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <KeyRound className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Generate a new password?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              A new 8-character password will be generated for{" "}
              <span className="font-semibold text-gray-900">
                {organization.name}
              </span>{" "}
              and emailed to{" "}
              <span className="font-semibold text-gray-900">
                {organization.contactEmail}
              </span>
              . Their current password will stop working immediately.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowPasswordConfirm(false)}
                disabled={resettingPassword}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resettingPassword}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {resettingPassword && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Generate &amp; Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shows the generated password once, so it can still be delivered by
          hand if the email did not go out. */}
      {generatedPassword && (
        <div className="fixed inset-0 z-600 flex items-center justify-center p-4">
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

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-600 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
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
                  {organization.name}
                </span>
                ? This action cannot be undone.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
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

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-gray-900 break-words">{value}</p>
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
