"use client";

import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import axios from "axios";
import { useContactReference } from "@/context/ContactReferenceContext";
import {
  Mail,
  User,
  Building,
  Phone,
  Calendar,
  Search,
  Filter,
  Eye,
  Trash2,
  Reply,
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageSquare,
  Globe,
  Download,
  RefreshCw,
  ChevronRight,
  Clock,
  Tag,
} from "lucide-react";
import { useState, useMemo } from "react";

const DashboardEnquiries = () => {
  const { user } = useAuth();
  const { enquiries, loading, fetchEnquiries, setEnquiries } = useContactReference();
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Data is now fetched and refreshed by ContactReferenceContext

  // Filter enquiries whenever search term, status filter, or enquiries change.
  // Purely derived from those three, so computed during render.
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((enquiry) => {
      // Search filter
      const matchesSearch =
        enquiry.fullname
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        enquiry.email
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        enquiry.company
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        enquiry.message
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        enquiry.inquiry_type
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === "all" || enquiry.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, enquiries]);

  const markAsRead = async (id) => {
    try {
      // Make API call to update status
      await axios.patch(`/api/enquiries/${id}`, {
        status: "read"
      });

      // Update local state
      setEnquiries(prevEnquiries =>
        prevEnquiries.map(enquiry =>
          enquiry._id === id ? { ...enquiry, status: "read" } : enquiry
        )
      );

      // If viewing this enquiry, update it
      if (selectedEnquiry && selectedEnquiry._id === id) {
        setSelectedEnquiry(prev => ({ ...prev, status: "read" }));
      }

      toast.success("Marked as read");
    } catch (error) {
      console.error(error);
      toast.error("Failed to mark as read");
    }
  };

  const markAsUnread = async (id) => {
    try {
      // Make API call to update status
      await axios.patch(`/api/enquiries/${id}`, {
        status: "pending"
      });

      // Update local state
      setEnquiries(prevEnquiries =>
        prevEnquiries.map(enquiry =>
          enquiry._id === id ? { ...enquiry, status: "pending" } : enquiry
        )
      );

      // If viewing this enquiry, update it
      if (selectedEnquiry && selectedEnquiry._id === id) {
        setSelectedEnquiry(prev => ({ ...prev, status: "pending" }));
      }

      toast.success("Marked as unread");
    } catch (error) {
      console.error(error);
      toast.error("Failed to mark as unread");
    }
  };

  const deleteEnquiry = async (id) => {
    if (!confirm("Are you sure you want to delete this enquiry?")) return;

    try {
      await axios.delete(`/api/enquiries/${id}`);
      
      // Remove from state
      setEnquiries(prev => prev.filter(enquiry => enquiry._id !== id));
      
      // If viewing this enquiry, close it
      if (selectedEnquiry && selectedEnquiry._id === id) {
        setSelectedEnquiry(null);
      }

      toast.success("Enquiry deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete enquiry");
    }
  };

  // Format date for mobile
  const formatShortDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 animate-spin mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-gray-600">Loading enquiries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 md:px-8 py-4 sm:py-5 lg:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 truncate">
                Contact Enquiries
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 truncate">
                Manage all contact form submissions
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                {filteredEnquiries.length}/{enquiries.length}
              </div>
              <button
                onClick={fetchEnquiries}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex-shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="w-full px-4 sm:px-6 md:px-8 py-4 sm:py-5 lg:py-6">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-5">
          {/* Mobile Filter Toggle */}
          <div className="sm:hidden flex items-center justify-between mb-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-gray-600 bg-gray-100 px-3 py-2 rounded-lg text-sm"
            >
              <Filter size={16} />
              <span>Filters & Search</span>
              <ChevronRight className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-90' : ''}`} />
            </button>
            <div className="text-xs text-gray-500">
              {filteredEnquiries.length} results
            </div>
          </div>

          {/* Desktop View */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search enquiries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Unread</option>
                  <option value="read">Read</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                  className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Filters (Expandable) */}
          {showFilters && (
            <div className="sm:hidden space-y-3 mt-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search enquiries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Unread</option>
                <option value="read">Read</option>
              </select>

              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setShowFilters(false);
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Enquiries List */}
      <div className="w-full px-4 sm:px-6 md:px-8 pb-6 sm:pb-8 lg:pb-10">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Desktop Table Header */}
          <div className="hidden md:block bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 text-xs sm:text-sm font-medium text-gray-700">
              <div className="col-span-4">Contact</div>
              <div className="col-span-3">Company</div>
              <div className="col-span-2">Inquiry Type</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-1 text-center">Actions</div>
            </div>
          </div>

          {/* Enquiries List */}
          <div className="divide-y divide-gray-200">
            {filteredEnquiries.length > 0 ? (
              filteredEnquiries.map((enquiry) => (
                <div key={enquiry._id}>
                  {/* Desktop View */}
                  <div
                    className={`hidden md:block px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors ${
                      enquiry.status === "pending" ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Contact Info */}
                      <div className="col-span-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                              {enquiry.fullname}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">
                              {enquiry.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Company */}
                      <div className="col-span-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <Building className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span className="text-sm sm:text-base text-gray-900 truncate">
                            {enquiry.company || "N/A"}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 truncate">
                          {enquiry.country}
                        </div>
                      </div>

                      {/* Inquiry Type */}
                      <div className="col-span-2">
                        <span
                          className={`inline-flex px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                            enquiry.inquiry_type === "Organization"
                              ? "bg-purple-100 text-purple-800"
                              : enquiry.inquiry_type === "Training"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {enquiry.inquiry_type}
                        </span>
                      </div>

                      {/* Date */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span className="text-sm sm:text-base text-gray-900 whitespace-nowrap">
                            {new Date(enquiry.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">
                          {new Date(enquiry.created_at).toLocaleTimeString()}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="col-span-1">
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                          <button
                            onClick={() => setSelectedEnquiry(enquiry)}
                            className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>

                          {enquiry.status === "pending" ? (
                            <button
                              onClick={() => markAsRead(enquiry._id)}
                              className="p-1.5 sm:p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              title="Mark as Read"
                            >
                              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => markAsUnread(enquiry._id)}
                              className="p-1.5 sm:p-2 text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors"
                              title="Mark as Unread"
                            >
                              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => deleteEnquiry(enquiry._id)}
                            className="p-1.5 sm:p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Card View */}
                  <div
                    className={`md:hidden p-4 hover:bg-gray-50 transition-colors ${
                      enquiry.status === "pending" ? "bg-blue-50/50" : ""
                    }`}
                  >
                    {/* Header with Name and Status */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-900 text-sm truncate">
                            {enquiry.fullname}
                          </h3>
                          <p className="text-xs text-gray-600 truncate">
                            {enquiry.email}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap ${
                          enquiry.status === "pending"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {enquiry.status === "pending" ? (
                          <Clock size={10} />
                        ) : (
                          <CheckCircle size={10} />
                        )}
                        {enquiry.status === "pending" ? "New" : "Read"}
                      </span>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-gray-50 p-2 rounded min-w-0">
                        <p className="text-[10px] text-gray-500 mb-0.5">Company</p>
                        <p className="text-xs font-medium text-gray-700 truncate flex items-center gap-1">
                          <Building className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{enquiry.company || "N/A"}</span>
                        </p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded min-w-0">
                        <p className="text-[10px] text-gray-500 mb-0.5">Country</p>
                        <p className="text-xs font-medium text-gray-700 truncate flex items-center gap-1">
                          <Globe className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{enquiry.country || "N/A"}</span>
                        </p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded min-w-0">
                        <p className="text-[10px] text-gray-500 mb-0.5">Phone</p>
                        <p className="text-xs font-medium text-gray-700 truncate flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{enquiry.phone || "N/A"}</span>
                        </p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded min-w-0">
                        <p className="text-[10px] text-gray-500 mb-0.5">Date</p>
                        <p className="text-xs font-medium text-gray-700 truncate flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{formatShortDate(enquiry.created_at)}</span>
                        </p>
                      </div>
                    </div>

                    {/* Inquiry Type Badge */}
                    <div className="mb-3">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          enquiry.inquiry_type === "Organization"
                            ? "bg-purple-100 text-purple-800"
                            : enquiry.inquiry_type === "Training"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {enquiry.inquiry_type}
                      </span>
                    </div>

                    {/* Message Preview */}
                    <div className="bg-gray-50 p-2 rounded mb-3">
                      <p className="text-[10px] text-gray-500 mb-1">Message</p>
                      <p className="text-xs text-gray-700 line-clamp-2">
                        {enquiry.message}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedEnquiry(enquiry)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                      >
                        <Eye size={14} />
                        View
                      </button>

                      {enquiry.status === "pending" ? (
                        <button
                          onClick={() => markAsRead(enquiry._id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium"
                        >
                          <CheckCircle size={14} />
                          Mark Read
                        </button>
                      ) : (
                        <button
                          onClick={() => markAsUnread(enquiry._id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-xs font-medium"
                        >
                          <AlertCircle size={14} />
                          Unread
                        </button>
                      )}

                      <button
                        onClick={() => deleteEnquiry(enquiry._id)}
                        className="flex-shrink-0 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 sm:px-6 py-8 sm:py-10 lg:py-12 text-center">
                <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 mb-1 sm:mb-2">
                  No enquiries found
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  {searchTerm || statusFilter !== "all"
                    ? "Try changing your filters"
                    : "No contact form submissions yet"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enquiry Details Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] relative top-1/2 -translate-y-1/2 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-5 lg:p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">Enquiry Details</h2>
                <button
                  onClick={() => setSelectedEnquiry(null)}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5 lg:p-6">
              <div className="space-y-4 sm:space-y-5 lg:space-y-6">
                {/* Contact Info */}
                <div>
                  <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 mb-2 sm:mb-3 lg:mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-600">Full Name</p>
                        <p className="text-sm sm:text-base font-medium truncate">{selectedEnquiry.fullname}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-600">Email</p>
                        <p className="text-sm sm:text-base font-medium truncate">{selectedEnquiry.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-600">Phone</p>
                        <p className="text-sm sm:text-base font-medium truncate">{selectedEnquiry.phone || "N/A"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-600">Country</p>
                        <p className="text-sm sm:text-base font-medium truncate">{selectedEnquiry.country || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company Info */}
                {selectedEnquiry.company && (
                  <div>
                    <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 mb-2 sm:mb-3 lg:mb-4">Company Information</h3>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Building className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">Company</p>
                        <p className="text-sm sm:text-base font-medium">{selectedEnquiry.company}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Message */}
                <div>
                  <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 mb-2 sm:mb-3 lg:mb-4">Message</h3>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedEnquiry.message}
                    </p>
                  </div>
                </div>

                {/* Metadata */}
                <div>
                  <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 mb-2 sm:mb-3 lg:mb-4">Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Inquiry Type</p>
                      <span
                        className={`inline-flex px-2 sm:px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                          selectedEnquiry.inquiry_type === "Organization"
                            ? "bg-purple-100 text-purple-800"
                            : selectedEnquiry.inquiry_type === "Training"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {selectedEnquiry.inquiry_type}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Date Submitted</p>
                      <p className="text-sm sm:text-base font-medium">
                        {new Date(selectedEnquiry.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Status</p>
                      <span className={`inline-flex px-2 sm:px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                        selectedEnquiry.status === "pending" 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-green-100 text-green-800"
                      }`}>
                        {selectedEnquiry.status === "pending" ? "Unread" : "Read"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                <button
                  onClick={() => setSelectedEnquiry(null)}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Close
                </button>
                {selectedEnquiry.status === "pending" ? (
                  <button
                    onClick={() => {
                      markAsRead(selectedEnquiry._id);
                      setSelectedEnquiry(null);
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    Mark as Read
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      markAsUnread(selectedEnquiry._id);
                      setSelectedEnquiry(null);
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                  >
                    Mark as Unread
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardEnquiries;