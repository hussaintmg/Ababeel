"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Building2,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  FileText,
  Phone,
  MapPin,
  Menu,
  X,
  Shield,
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  Hash,
  Award,
  Download,
  Users,
  PlusCircle,
  KeyRound,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import Link from "next/link";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { downloadInvoicePDF as generateInvoicePDF } from "@/utils/invoiceGenerator";

export default function UserDetailsPage() {
  const { userId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("invoices");
  const [invoiceFilter, setInvoiceFilter] = useState("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [fundsAmount, setFundsAmount] = useState("");
  const [fundsDescription, setFundsDescription] = useState("");
  const [addingFunds, setAddingFunds] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  // Holds the generated password so the owner can pass it on if the email
  // fails to send.
  const [generatedPassword, setGeneratedPassword] = useState(null);

  const handleResetPassword = async () => {
    setResettingPassword(true);
    try {
      const { data } = await axios.post(
        `/api/owner/users/${userId}/reset-password`
      );
      setGeneratedPassword({
        password: data.password,
        emailSent: data.emailSent,
        email: user?.email,
      });
      toast[data.emailSent ? "success" : "warning"](data.message);
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Failed to generate a new password"
      );
    } finally {
      setResettingPassword(false);
    }
  };
  const [allData, setAllData] = useState({
    organizations: [],
    admins: [],
    users: [],
    invoices: [],
  });
  const [referenceMap, setReferenceMap] = useState({});

  // Build reference map for the invoice generator
  useEffect(() => {
    const map = {};
    if (allData.organizations) {
      allData.organizations.forEach(org => { map[org._id] = org; });
    }
    invoices.forEach(inv => {
      if (inv.courseId && typeof inv.courseId === 'object') {
        map[inv.courseId._id] = inv.courseId;
      }
    });
    setReferenceMap(map);
  }, [allData, invoices]);

  useEffect(() => {
    fetchAllData();
  }, [userId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/owner/users");

      if (response.data.success) {
        setAllData(response.data.data);

        let foundUser = null;
        let role = null;

        const regularUser = response.data.data.users?.find(
          (u) => u._id === userId,
        );
        if (regularUser) {
          foundUser = regularUser;
          role = "user";
        }

        if (!foundUser) {
          const admin = response.data.data.admins?.find(
            (a) => a._id === userId,
          );
          if (admin) {
            foundUser = admin;
            role = "admin";
          }
        }

        if (!foundUser) {
          const organization = response.data.data.organizations?.find(
            (o) => o._id === userId,
          );
          if (organization) {
            foundUser = organization;
            role = "organization";
          }
        }

        if (foundUser) {
          setUser(foundUser);
          setUserRole(role);

          const userInvoices =
            response.data.data.invoices?.filter(
              (inv) => inv.clientId === userId,
            ) || [];

          const enrichedInvoices = userInvoices.map((inv) => {
            if (inv.courseId) {
              return {
                ...inv,
                displayName:
                  inv.courseId.courseName ||
                  inv.courseId.name ||
                  "Course Not Found",
                type: "Course",
                details: inv.courseId,
              };
            }
            return {
              ...inv,
              displayName: "Unknown Reference",
              type: "N/A",
              details: null,
            };
          });

          setInvoices(enrichedInvoices);

          const userTransactions = foundUser.transactions || [];

          const processedTransactions = userTransactions.map((t) => ({
            ...t,
            displayAmount:
              t.type === "payment" ? -Math.abs(t.amount) : Math.abs(t.amount),
            date: t.date ? new Date(t.date) : new Date(),
          }));

          processedTransactions.sort((a, b) => b.date - a.date);
          setTransactions(processedTransactions);
        } else {
          console.log("User not found in any role");
          toast.error("User not found");
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async (e) => {
    e.preventDefault();
    const amount = parseFloat(fundsAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }
    setAddingFunds(true);
    try {
      const response = await axios.post(
        `/api/owner/users/${userId}/add-funds`,
        {
          amount,
          description: fundsDescription.trim() || undefined,
        },
      );
      if (response.data.success) {
        toast.success(`£${amount.toFixed(2)} added successfully!`);
        // Update local user balance & transactions without full reload
        setUser((prev) => ({
          ...prev,
          accountBalance: response.data.newBalance,
        }));
        const newTx = {
          _id: `temp-${Date.now()}`,
          type: "deposit",
          amount,
          description:
            fundsDescription.trim() ||
            `Funds added by owner — £${amount.toFixed(2)}`,
          date: new Date(),
          referenceId: `OWN-${Date.now()}`,
          displayAmount: amount,
        };
        setTransactions((prev) => [newTx, ...prev]);
        setShowAddFundsModal(false);
        setFundsAmount("");
        setFundsDescription("");
      } else {
        toast.error(response.data.error || "Failed to add funds");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add funds");
    } finally {
      setAddingFunds(false);
    }
  };


  const downloadInvoicePDF = async (invoice) => {
    await generateInvoicePDF(invoice, referenceMap, setDownloadingId);
    toast.success("Invoice downloaded successfully!");
  };

  const filteredInvoices = invoices.filter((invoice) => {
    if (invoiceFilter === "paid") return invoice.paymentStatus === "paid";
    if (invoiceFilter === "pending") return invoice.paymentStatus === "pending";
    return true;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

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
    return new Date(date).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const userStats = {
    totalSpent: transactions
      .filter((t) => t.type === "payment")
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0),
    totalRefunds: transactions
      .filter((t) => t.type === "refund")
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0),
    netSpent: transactions.reduce((sum, t) => {
      if (t.type === "payment") return sum - Math.abs(t.amount || 0);
      if (t.type === "refund") return sum + Math.abs(t.amount || 0);
      return sum;
    }, 0),
    paidInvoices: invoices.filter((inv) => inv.paymentStatus === "paid").length,
    pendingInvoices: invoices.filter((inv) => inv.paymentStatus === "pending")
      .length,
    totalInvoices: invoices.length,
    accountBalance: user?.accountBalance || 0,
    totalTransactions: transactions.length,
  };

  const getRoleInfo = () => {
    switch (userRole) {
      case "admin":
        return {
          name: "Admin",
          icon: Shield,
          color: "purple",
          bg: "from-purple-500 to-indigo-600",
          lightBg: "bg-purple-50",
          textColor: "text-purple-700",
        };
      case "organization":
        return {
          name: "Organization",
          icon: Building2,
          color: "blue",
          bg: "from-blue-500 to-cyan-600",
          lightBg: "bg-blue-50",
          textColor: "text-blue-700",
        };
      default:
        return {
          name: "User",
          icon: User,
          color: "green",
          bg: "from-green-500 to-emerald-600",
          lightBg: "bg-green-50",
          textColor: "text-green-700",
        };
    }
  };

  const roleInfo = getRoleInfo();
  const RoleIcon = roleInfo.icon;
  const displayedTransactions = showAllTransactions
    ? transactions
    : transactions.slice(0, 10);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium text-sm sm:text-base">
            Loading user details...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="text-center bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md">
          <XCircle className="h-12 w-12 sm:h-16 sm:w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
            User Not Found
          </h2>
          <p className="text-gray-600 text-sm sm:text-base mb-6">
            The user you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <button
            onClick={() => router.back()}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-[calc(100vw-2rem)] md:w-full bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="w-full mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 sm:mb-6 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm sm:text-base">Back to Overview</span>
        </button>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
          <div className="sm:hidden flex items-center justify-between mb-4">
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full ${roleInfo.lightBg} ${roleInfo.textColor}`}
            >
              <RoleIcon className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">{roleInfo.name}</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 bg-gray-50 rounded-lg border border-gray-200"
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4 text-gray-500" />
              ) : (
                <Menu className="h-4 w-4 text-gray-500" />
              )}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="sm:hidden mb-4 grid grid-cols-2 gap-2">
              <MobileStatCard
                label="Balance"
                value={formatCurrency(userStats.accountBalance)}
                color={userStats.accountBalance >= 0 ? "green" : "red"}
                icon={Wallet}
              />
              <MobileStatCard
                label="Net Spent"
                value={formatCurrency(Math.abs(userStats.netSpent))}
                color={userStats.netSpent < 0 ? "red" : "green"}
                icon={CreditCard}
              />
              <MobileStatCard
                label="Payments"
                value={formatCurrency(userStats.totalSpent)}
                color="red"
                icon={TrendingDown}
              />
              <MobileStatCard
                label="Refunds"
                value={formatCurrency(userStats.totalRefunds)}
                color="green"
                icon={TrendingUp}
              />
            </div>
          )}

          <div className="flex flex-col lg:items-start lg:justify-between gap-4 lg:gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6 flex-1">
              <div className="relative">
                <div
                  className={`h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-full bg-gradient-to-br ${roleInfo.bg} flex items-center justify-center text-white text-2xl sm:text-3xl md:text-4xl font-bold shadow-lg flex-shrink-0`}
                >
                  {user.username?.toUpperCase().charAt(0) ||
                    user.firstName?.toUpperCase().charAt(0) ||
                    user.name?.toUpperCase().charAt(0) ||
                    "U"}
                </div>
                <div className="hidden sm:block absolute -bottom-2 -right-2">
                  <div
                    className={`p-1.5 rounded-full ${roleInfo.lightBg} border-2 border-white`}
                  >
                    <RoleIcon className={`h-3 w-3 ${roleInfo.textColor}`} />
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2 flex-wrap">
                  <h1 className="max-[280px]:text-base text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.username || user.name || "User"}
                  </h1>
                  <span
                    className={`hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${roleInfo.lightBg} ${roleInfo.textColor}`}
                  >
                    <RoleIcon className="h-3 w-3 mr-1" />
                    {roleInfo.name}
                  </span>
                </div>

                <div className="space-y-2">
                  {user.email && (
                    <div className="flex items-center justify-center sm:justify-start text-gray-600">
                      <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="max-[280px]:text-xs text-sm sm:text-base truncate">
                        {user.email}
                      </span>
                    </div>
                  )}

                  {user.atcDetails?.atcNumber && (
                    <div className="flex items-center justify-center sm:justify-start text-gray-600">
                      <Award className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="text-sm sm:text-base truncate">
                        {user.atcDetails.atcNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Account actions */}
            <div className="flex flex-wrap justify-end gap-2 mt-2 mb-1">
              {(userRole === "admin" || userRole === "organization") && (
                <button
                  onClick={handleResetPassword}
                  disabled={resettingPassword}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:scale-95 transition-all shadow-sm disabled:opacity-50"
                >
                  {resettingPassword ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="h-4 w-4" />
                  )}
                  New Password &amp; Send Email
                </button>
              )}
              <button
                onClick={() => setShowAddFundsModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 active:scale-95 transition-all shadow-sm"
              >
                <PlusCircle className="h-4 w-4" />
                Add Funds
              </button>
            </div>

            <div className="hidden w-full sm:grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard
                label="Balance"
                value={formatCurrency(userStats.accountBalance)}
                icon={Wallet}
                color={userStats.accountBalance >= 0 ? "green" : "red"}
              />
              <StatCard
                label="Net Spent"
                value={formatCurrency(Math.abs(userStats.netSpent))}
                icon={CreditCard}
                color={userStats.netSpent < 0 ? "red" : "green"}
              />
              <StatCard
                label="Payments"
                value={formatCurrency(userStats.totalSpent)}
                icon={TrendingDown}
                color="red"
              />
              <StatCard
                label="Refunds"
                value={formatCurrency(userStats.totalRefunds)}
                icon={TrendingUp}
                color="green"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-6">
          <div className="border-b border-gray-200 bg-gray-50/50">
            <div className="flex px-4 sm:px-6">
              <button
                onClick={() => setActiveTab("invoices")}
                className={`flex items-center gap-2 py-3 sm:py-4 px-3 sm:px-5 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "invoices"
                    ? "border-blue-600 text-blue-600 bg-blue-50/50"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Invoices</span>
                {invoices.length > 0 && (
                  <span
                    className={`max-[350px]:hidden ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                      activeTab === "invoices"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {invoices.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("transactions")}
                className={`flex items-center gap-2 py-3 sm:py-4 px-3 sm:px-5 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "transactions"
                    ? "border-blue-600 text-blue-600 bg-blue-50/50"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Transactions</span>
                {transactions.length > 0 && (
                  <span
                    className={`max-[350px]:hidden  ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                      activeTab === "transactions"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {transactions.length}
                  </span>
                )}
              </button>

              {/* Trainers tab removed along with the trainer feature. */}
            </div>
          </div>

          {activeTab === "invoices" && (
            <div className="divide-y divide-gray-200">
              <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                      Invoice History
                    </h2>
                  </div>

                  {invoices.length > 0 && (
                    <select
                      value={invoiceFilter}
                      onChange={(e) => setInvoiceFilter(e.target.value)}
                      className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                    >
                      <option value="all">All Invoices</option>
                      <option value="paid">Paid Invoices</option>
                      <option value="pending">Pending Invoices</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <SummaryItem
                    label="Total Invoices"
                    value={invoices.length.toString()}
                    color="text-gray-900"
                  />
                  <SummaryItem
                    label="Paid"
                    value={invoices
                      .filter((i) => i.paymentStatus === "paid")
                      .length.toString()}
                    color="text-green-600"
                  />
                  <SummaryItem
                    label="Pending"
                    value={invoices
                      .filter((i) => i.paymentStatus === "pending")
                      .length.toString()}
                    color="text-yellow-600"
                  />
                  <SummaryItem
                    label="Total Amount"
                    value={formatCurrency(
                      invoices.reduce(
                        (sum, inv) =>
                          sum + (inv.totalAmount || inv.amount || 0),
                        0,
                      ),
                    )}
                    color="text-blue-600"
                  />
                </div>
              </div>

              {filteredInvoices.length === 0 ? (
                <div className="p-8 sm:p-12 text-center">
                  <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm sm:text-base">
                    No invoices found
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => (
                    <div key={invoice._id} className="p-4 hover:bg-gray-50">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-mono font-medium text-gray-900">
                              {invoice.invoiceNumber || "N/A"}
                            </span>
                            <StatusBadge status={invoice.paymentStatus} />
                          </div>

                          {invoice.type && invoice.type !== "N/A" && (
                            <div className="flex items-center gap-2 mt-1 mb-1">
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-blue-100 text-blue-700"
                              >
                                {invoice.type}
                              </span>
                              <p className="text-xs sm:text-sm text-gray-700 truncate font-medium">
                                {invoice.displayName}
                              </p>
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            {formatDate(
                              invoice.invoiceDate || invoice.createdAt,
                            )}
                            {invoice.dueDate &&
                              ` • Due ${formatDate(invoice.dueDate)}`}
                          </div>
                          {invoice.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                              {invoice.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <div className="text-right">
                            <div className="text-sm font-bold text-gray-900">
                              {formatCurrency(
                                invoice.totalAmount || invoice.amount,
                              )}
                            </div>
                            {invoice.amountPaid > 0 && (
                              <div className="text-xs text-green-600">
                                Paid: {formatCurrency(invoice.amountPaid)}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => downloadInvoicePDF(invoice)}
                              disabled={downloadingId === invoice._id}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {downloadingId === invoice._id ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Downloading...
                                </>
                              ) : (
                                <>
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "transactions" && (
            <div className="divide-y divide-gray-200">
              <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Receipt className="h-5 w-5 text-gray-500" />
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                      Transaction History
                    </h2>
                    <span className="text-center px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      {transactions.length} total
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <SummaryItem
                    label="Current Balance"
                    value={formatCurrency(userStats.accountBalance)}
                    color={
                      userStats.accountBalance >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  />
                  <SummaryItem
                    label="Total Payments"
                    value={formatCurrency(userStats.totalSpent)}
                    color="text-red-600"
                  />
                  <SummaryItem
                    label="Total Refunds"
                    value={formatCurrency(userStats.totalRefunds)}
                    color="text-green-600"
                  />
                  <SummaryItem
                    label="Net Activity"
                    value={formatCurrency(Math.abs(userStats.netSpent))}
                    color={
                      userStats.netSpent < 0 ? "text-red-600" : "text-green-600"
                    }
                  />
                </div>
              </div>

              {transactions.length === 0 ? (
                <div className="p-8 sm:p-12 text-center">
                  <Receipt className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm sm:text-base">
                    No transactions found
                  </p>
                </div>
              ) : (
                <>
                  <div className="sm:hidden">
                    {displayedTransactions.map((transaction, index) => (
                      <div
                        key={transaction._id || index}
                        className="p-4 border-b border-gray-100 hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <TransactionTypeBadge type={transaction.type} />
                          <span className="text-xs text-gray-500">
                            {formatDateTime(transaction.date)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {transaction.description || "No description"}
                        </p>
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-base font-bold flex items-center ${
                              transaction.type === "payment"
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {transaction.type === "payment" ? "-" : "+"}
                            {formatCurrency(Math.abs(transaction.amount || 0))}
                          </span>
                          {transaction.referenceId && (
                            <span className="text-xs font-mono text-gray-400">
                              Ref: {transaction.referenceId}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden sm:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date & Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reference
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {displayedTransactions.map((transaction, index) => (
                          <tr
                            key={transaction._id || index}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDateTime(transaction.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <TransactionTypeBadge type={transaction.type} />
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                              <div className="line-clamp-2">
                                {transaction.description || "N/A"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`text-sm font-bold flex items-center ${
                                  transaction.type === "payment"
                                    ? "text-red-600"
                                    : "text-green-600"
                                }`}
                              >
                                {transaction.type === "payment" ? "−" : "+"}
                                {formatCurrency(
                                  Math.abs(transaction.amount || 0),
                                )}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                              {transaction.referenceId ||
                                transaction.transactionId ||
                                "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {transactions.length > 10 && (
                    <div className="p-4 border-t border-gray-200 text-center">
                      <button
                        onClick={() =>
                          setShowAllTransactions(!showAllTransactions)
                        }
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium px-4 py-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        {showAllTransactions
                          ? "Show Less"
                          : `Show All ${transactions.length} Transactions`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ─── Add Funds Modal ──────────────────────────────────────────── */}
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

      {showAddFundsModal && (
        <div className="fixed inset-0 z-5000 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-xl">
                  <Wallet className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Add Funds</h2>
                  <p className="text-xs text-gray-500">
                    {user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user?.username || user?.name || "User"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddFundsModal(false);
                  setFundsAmount("");
                  setFundsDescription("");
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Current Balance */}
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">
                Current Account Balance
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(user?.accountBalance || 0)}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleAddFunds} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Amount (£) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    £
                  </span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={fundsAmount}
                    onChange={(e) => setFundsAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                {fundsAmount && parseFloat(fundsAmount) > 0 && (
                  <p className="mt-1.5 text-xs text-green-600 font-medium">
                    New balance will be:{" "}
                    {formatCurrency(
                      (user?.accountBalance || 0) + parseFloat(fundsAmount),
                    )}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={fundsDescription}
                  onChange={(e) => setFundsDescription(e.target.value)}
                  placeholder="e.g. Course refund, bonus credit..."
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddFundsModal(false);
                    setFundsAmount("");
                    setFundsDescription("");
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    addingFunds || !fundsAmount || parseFloat(fundsAmount) <= 0
                  }
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {addingFunds ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-4 w-4" />
                      Add Funds
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileStatCard({ label, value, color, icon: Icon }) {
  const colors = {
    green: "bg-green-50 text-green-700 border-green-200",
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <div className={`p-3 rounded-lg border ${colors[color] || colors.blue}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-gray-600">{label}</p>
        <Icon className="h-3 w-3" />
      </div>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  const colors = {
    green: "bg-green-50 text-green-600 border-green-100",
    red: "bg-red-50 text-red-600 border-red-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  };

  return (
    <div
      className={`bg-white rounded-lg p-4 border ${colors[color] || colors.blue} shadow-sm`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">{label}</p>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}

function SummaryItem({ label, value, color }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-sm sm:text-base font-bold ${color}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const statusConfig = {
    paid: {
      bg: "bg-green-100",
      text: "text-green-800",
      icon: CheckCircle,
      label: "Paid",
    },
    pending: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      icon: Clock,
      label: "Pending",
    },
    cancelled: {
      bg: "bg-red-100",
      text: "text-red-800",
      icon: XCircle,
      label: "Cancelled",
    },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </span>
  );
}

function TransactionTypeBadge({ type }) {
  const typeConfig = {
    payment: {
      bg: "bg-red-100",
      text: "text-red-800",
      icon: TrendingDown,
      label: "Payment",
    },
    refund: {
      bg: "bg-green-100",
      text: "text-green-800",
      icon: TrendingUp,
      label: "Refund",
    },
  };

  const config = typeConfig[type] || {
    bg: "bg-gray-100",
    text: "text-gray-800",
    icon: Clock,
    label: type || "Unknown",
  };
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium \${config.bg} \${config.text}`}
    >
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </span>
  );
}
