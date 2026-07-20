"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Building2,
  DollarSign,
  Eye,
  Search,
  Loader2,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Calendar,
  FileText,
  UserCircle,
  Shield,
  User,
  Menu,
  X,
  Plus,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import CreateAdminForm from "@/Components/owner/CreateAdminForm";
import CreateOrganizationForm from "@/Components/owner/CreateOrganizationForm";

export default function OwnerOverviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("organizations");
  const [data, setData] = useState({
    organizations: [],
    admins: [],
    users: [],
    invoices: [],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [showCreateOrg, setShowCreateOrg] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/owner/users");
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    filterData();
  }, [searchTerm, activeTab, data]);

  const filterData = () => {
    let items = [];

    switch (activeTab) {
      case "organizations":
        items = data.organizations || [];
        break;
      case "admins":
        items = data.admins || [];
        break;
      case "users":
        items = data.users || [];
        break;
      default:
        items = [];
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(
        (item) =>
          item.firstName?.toLowerCase().includes(term) ||
          item.lastName?.toLowerCase().includes(term) ||
          item.username?.toLowerCase().includes(term) ||
          item.email?.toLowerCase().includes(term) ||
          item.name?.toLowerCase().includes(term) ||
          item.organizationName?.toLowerCase().includes(term)
      );
    }

    setFilteredData(items);
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const stats = {
    totalOrganizations: data.organizations?.length || 0,
    totalAdmins: data.admins?.length || 0,
    totalUsers: data.users?.length || 0,
    totalInvoices: data.invoices?.length || 0,
    paidInvoices:
      data.invoices?.filter((inv) => inv.paymentStatus === "paid")?.length || 0,
    pendingInvoices:
      data.invoices?.filter((inv) => inv.paymentStatus === "pending")?.length ||
      0,
    totalRevenue:
      data.invoices
        ?.filter((inv) => inv.paymentStatus === "paid")
        ?.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0) || 0,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="text-center bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium text-sm sm:text-base">
            Loading dashboard data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Owner Dashboard
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
              Manage organizations, admins, and users
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={fetchDashboardData}
              className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => setShowCreateAdmin(true)}
              className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium shadow-sm"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Admin</span>
            </button>
            <button
              onClick={() => setShowCreateOrg(true)}
              className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Create Organization</span>
            </button>
          </div>
        </div>

        {/* Stats Grid - Responsive */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <StatCard
            title="Organizations"
            value={stats.totalOrganizations}
            icon={Building2}
            color="blue"
          />
          <StatCard
            title="Admins"
            value={stats.totalAdmins}
            icon={Shield}
            color="purple"
          />
          <StatCard
            title="Users"
            value={stats.totalUsers}
            icon={UserCircle}
            color="green"
          />
          <StatCard
            title="Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={DollarSign}
            color="yellow"
          />
        </div>

        {/* Second Row Stats - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <StatCard
            title="Total Invoices"
            value={stats.totalInvoices}
            icon={FileText}
            color="indigo"
          />
          <StatCard
            title="Paid Invoices"
            value={stats.paidInvoices}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Pending Invoices"
            value={stats.pendingInvoices}
            icon={Clock}
            color="orange"
          />
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* Mobile Tabs Dropdown */}
          <div className="sm:hidden p-3 border-b border-gray-200">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <span className="font-medium text-gray-700 flex items-center">
                {activeTab === "organizations" && (
                  <Building2 className="h-4 w-4 mr-2 text-blue-600" />
                )}
                {activeTab === "admins" && (
                  <Shield className="h-4 w-4 mr-2 text-purple-600" />
                )}
                {activeTab === "users" && (
                  <UserCircle className="h-4 w-4 mr-2 text-green-600" />
                )}
                {activeTab === "organizations" && "Organizations"}
                {activeTab === "admins" && "Admins"}
                {activeTab === "users" && "Users"}
              </span>
              {mobileMenuOpen ? (
                <X className="h-4 w-4 text-gray-500" />
              ) : (
                <Menu className="h-4 w-4 text-gray-500" />
              )}
            </button>

            {mobileMenuOpen && (
              <div className="absolute z-10 mt-1 w-[calc(100%-5rem)] bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                <MobileTabButton
                  active={activeTab === "organizations"}
                  onClick={() => {
                    setActiveTab("organizations");
                    setMobileMenuOpen(false);
                  }}
                  icon={Building2}
                  label="Organizations"
                  count={stats.totalOrganizations}
                  color="blue"
                />
                <MobileTabButton
                  active={activeTab === "admins"}
                  onClick={() => {
                    setActiveTab("admins");
                    setMobileMenuOpen(false);
                  }}
                  icon={Shield}
                  label="Admins"
                  count={stats.totalAdmins}
                  color="purple"
                />
                <MobileTabButton
                  active={activeTab === "users"}
                  onClick={() => {
                    setActiveTab("users");
                    setMobileMenuOpen(false);
                  }}
                  icon={UserCircle}
                  label="Users"
                  count={stats.totalUsers}
                  color="green"
                />
              </div>
            )}
          </div>

          {/* Desktop Tabs - Hidden on mobile */}
          <div className="hidden sm:block border-b border-gray-200 bg-gray-50/50">
            <div className="flex">
              <TabButton
                active={activeTab === "organizations"}
                onClick={() => setActiveTab("organizations")}
                icon={Building2}
                label="Organizations"
                count={stats.totalOrganizations}
                color="blue"
              />
              <TabButton
                active={activeTab === "admins"}
                onClick={() => setActiveTab("admins")}
                icon={Shield}
                label="Admins"
                count={stats.totalAdmins}
                color="purple"
              />
              <TabButton
                active={activeTab === "users"}
                onClick={() => setActiveTab("users")}
                icon={UserCircle}
                label="Users"
                count={stats.totalUsers}
                color="green"
              />
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-3 sm:p-4 border-b border-gray-200 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 text-sm border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
              />
            </div>
          </div>

          {/* Tables - Responsive */}
          <div className="bg-white overflow-x-auto">
            {activeTab === "organizations" && (
              <OrganizationsTable
                organizations={filteredData}
                formatDate={formatDate}
              />
            )}
            {activeTab === "admins" && (
              <AdminsTable admins={filteredData} formatDate={formatDate} />
            )}
            {activeTab === "users" && (
              <UsersTable
                users={filteredData}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
                invoices={data.invoices}
              />
            )}
          </div>
        </div>
      </div>

      {/* Create Admin Form */}
      <CreateAdminForm
        isOpen={showCreateAdmin}
        onClose={() => setShowCreateAdmin(false)}
        onSuccess={fetchDashboardData}
      />

      {/* Create Organization Form */}
      <CreateOrganizationForm
        isOpen={showCreateOrg}
        onClose={() => setShowCreateOrg(false)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
}

function MobileTabButton({ active, onClick, icon: Icon, label, count, color }) {
  const colors = {
    blue: active ? "bg-blue-50 text-blue-600" : "text-gray-700",
    purple: active ? "bg-purple-50 text-purple-600" : "text-gray-700",
    green: active ? "bg-green-50 text-green-600" : "text-gray-700",
  };

  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-3 flex items-center justify-between ${colors[color]} hover:bg-gray-50 transition-colors`}
    >
      <div className="flex items-center">
        <Icon className="h-4 w-4 mr-3" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
        {count}
      </span>
    </button>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    green: "bg-green-50 text-green-600 border-green-100",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
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

function TabButton({ active, onClick, icon: Icon, label, count, color }) {
  const colors = {
    blue: active ? "border-blue-500 text-blue-600" : "text-gray-500",
    purple: active ? "border-purple-500 text-purple-600" : "text-gray-500",
    green: active ? "border-green-500 text-green-600" : "text-gray-500",
  };

  const badgeColors = {
    blue: active ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600",
    purple: active
      ? "bg-purple-100 text-purple-600"
      : "bg-gray-100 text-gray-600",
    green: active ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600",
  };

  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 sm:py-4 px-3 sm:px-4 md:px-6 text-xs sm:text-sm font-medium border-b-2 flex items-center justify-center gap-1 sm:gap-2 transition-all ${
        active
          ? colors[color]
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
      <span className="hidden xs:inline">{label}</span>
      <span
        className={`px-1.5 sm:px-2 py-0.5 text-xs rounded-full ${badgeColors[color]}`}
      >
        {count}
      </span>
    </button>
  );
}

function OrganizationsTable({ organizations, formatDate }) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full max-w-full w-full overflow-x-scroll divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
              Organization
            </th>
            <th className="hidden sm:table-cell px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact Email
            </th>
            <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
              Phone
            </th>
            <th className="hidden lg:table-cell px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created By
            </th>
            <th className="hidden lg:table-cell px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {organizations.length === 0 ? (
            <tr>
              <td
                colSpan="6"
                className="px-3 sm:px-4 md:px-6 py-8 sm:py-12 text-center text-gray-500 text-sm"
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
                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                  <div className="flex items-center">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <div className="ml-2 sm:ml-3 min-w-0">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {org.name}
                      </div>
                      {org.slug && (
                        <div className="sm:hidden text-[10px] text-gray-500 truncate">
                          {org.contactEmail || ""}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="hidden sm:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                  <div className="flex items-center text-xs sm:text-sm text-gray-900">
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{org.contactEmail || "N/A"}</span>
                  </div>
                </td>
                <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                  <div className="flex items-center text-xs sm:text-sm text-gray-900">
                    <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{org.phone || "N/A"}</span>
                  </div>
                </td>
                <td className="hidden lg:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                  <div className="flex items-center gap-1.5">
                    {org.createdByRole === "owner" ? (
                      <Shield className="h-3 w-3 text-amber-500 flex-shrink-0" />
                    ) : (
                      <User className="h-3 w-3 text-purple-500 flex-shrink-0" />
                    )}
                    <div className="text-xs sm:text-sm">
                      <span className="text-gray-600">
                        {org.createdByNameSnapshot || "System"}
                      </span>
                      {org.createdByRole && (
                        <>
                          <span className="text-gray-400 mx-0.5">&mdash;</span>
                          <span
                            className={`font-medium ${
                              org.createdByRole === "owner"
                                ? "text-amber-600"
                                : "text-purple-600"
                            }`}
                          >
                            {org.createdByRole === "owner" ? "Owner" : "Admin"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {org.createdAt && (
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {formatDate(org.createdAt)}
                    </div>
                  )}
                </td>
                <td className="hidden lg:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full ${
                      org.status === "active"
                        ? "bg-green-100 text-green-700"
                        : org.status === "suspended"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {org.status}
                  </span>
                </td>
                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                  <button
                    onClick={() => {
                      if (org.isLegacy) {
                        router.push(`/owner/users/${org._id}`);
                      }
                    }}
                    className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                      org.isLegacy
                        ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                        : "text-gray-400 bg-gray-50 cursor-default"
                    }`}
                  >
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline ml-1">
                      {org.isLegacy ? "View" : "Details"}
                    </span>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function AdminsTable({ admins, formatDate }) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
              Admin
            </th>
            <th className="hidden sm:table-cell px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
              Username
            </th>
            <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="hidden lg:table-cell px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {admins.length === 0 ? (
            <tr>
              <td
                colSpan="5"
                className="px-3 sm:px-4 md:px-6 py-8 sm:py-12 text-center text-gray-500 text-sm"
              >
                <Shield className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                No admins found
              </td>
            </tr>
          ) : (
            admins.map((admin) => (
              <tr
                key={admin._id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                  <div className="flex items-center">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-600 font-medium text-xs sm:text-sm">
                        {admin.username?.charAt(0) || "A"}
                      </span>
                    </div>
                    <div className="ml-2 sm:ml-3 min-w-0">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {admin.username}
                      </div>
                      <div className="sm:hidden text-[10px] text-gray-500 truncate">
                        {admin.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="hidden sm:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                  <div className="flex items-center text-xs sm:text-sm text-gray-900">
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{admin.username}</span>
                  </div>
                </td>
                <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                  {admin.email || "N/A"}
                </td>
                <td className="hidden lg:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                  {admin.authenticatedByOwner ? (
                    <span className="inline-flex items-center px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full bg-green-100 text-green-700">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                      Awaiting Activation
                    </span>
                  )}
                </td>
                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                  <button
                    onClick={() => router.push(`/owner/users/${admin._id}`)}
                    className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors whitespace-nowrap"
                  >
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4 xs:mr-1" />
                    <span className="hidden xs:inline">View</span>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function UsersTable({ users, formatDate, formatCurrency, invoices }) {
  const router = useRouter();

  const getTotalPurchases = (user) => {
    return invoices
      .filter(
        (invoice) =>
          invoice.clientId === user._id && invoice.paymentStatus === "paid"
      )
      .reduce(
        (total, invoice) =>
          total + (invoice.totalAmount || invoice.amount || 0),
        0
      );
  };

  const getInvoiceCount = (user) => {
    return invoices.filter((invoice) => invoice.clientId === user._id).length;
  };

  const getPaidCount = (user) => {
    return invoices.filter(
      (invoice) =>
        invoice.clientId === user._id && invoice.paymentStatus === "paid"
    ).length;
  };

  const getPendingCount = (user) => {
    return invoices.filter(
      (invoice) =>
        invoice.clientId === user._id && invoice.paymentStatus === "pending"
    ).length;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="hidden sm:table-cell px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="hidden lg:table-cell px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Paid
            </th>
            <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
              Invoices
            </th>
            <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.length === 0 ? (
            <tr>
              <td
                colSpan="5"
                className="px-3 sm:px-4 md:px-6 py-8 sm:py-12 text-center text-gray-500 text-sm"
              >
                <UserCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                No users found
              </td>
            </tr>
          ) : (
            users.map((user) => {
              const totalPaid = getTotalPurchases(user);
              const invoiceCount = getInvoiceCount(user);
              const paidCount = getPaidCount(user);
              const pendingCount = getPendingCount(user);

              return (
                <tr
                  key={user._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                    <div className="flex items-center">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                        {user.username?.charAt(0) || "U"}
                      </div>
                      <div className="ml-2 sm:ml-3 min-w-0">
                        <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                          {user.username}
                        </div>
                        <div className="sm:hidden text-[10px] text-gray-500 truncate">
                          {user.email}
                        </div>
                        <div className="lg:hidden text-[10px] text-green-600 font-medium">
                          {formatCurrency(totalPaid)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                    <div className="flex items-center text-xs sm:text-sm text-gray-600">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                  </td>
                  <td className="hidden lg:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                    <div className="text-xs sm:text-sm font-bold text-green-600">
                      {formatCurrency(totalPaid)}
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-medium text-gray-900">
                          {invoiceCount}
                        </span>
                        {paidCount > 0 && (
                          <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-green-100 text-green-700 rounded-full whitespace-nowrap">
                            {paidCount} paid
                          </span>
                        )}
                        {pendingCount > 0 && (
                          <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full whitespace-nowrap">
                            {pendingCount} pending
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                    <button
                      onClick={() => router.push(`/owner/users/${user._id}`)}
                      className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm whitespace-nowrap"
                    >
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4 xs:mr-1" />
                      <span className="hidden xs:inline">View</span>
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
