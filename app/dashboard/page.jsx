// app/dashboard/page.jsx
"use client";

import { useMemo } from "react";
import {
  FileDigit,
  FileText,
  Users,
  BookOpen,
  Settings,
  Briefcase,
  Calendar,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCourseReference } from "@/context/CourseReferenceContext";
import { webData } from "@/constants";

export default function DashboardPage() {
  const { user } = useAuth();
  const { courses } = useCourseReference();

  // The dashboard is scoped to course references: payment, invoices, trainers,
  // deposits, and training resources were removed from the product.
  const stats = useMemo(() => {
    const list = courses || [];
    const totalCandidates = list.reduce(
      (sum, c) => sum + (c.candidatesCount || c.candidates?.length || 0),
      0
    );
    const active = list.filter(
      (c) => c.status === "active" || c.status === "completed"
    ).length;

    return {
      courseReferences: list.length,
      totalCandidates,
      activeReferences: active,
    };
  }, [courses]);

  const recentActivities = useMemo(() => {
    const list = courses || [];
    return list
      .slice()
      .sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      )
      .slice(0, 5)
      .map((course, index) => ({
        id: `course-${course._id || index}`,
        title: `Course reference: ${course.courseName || course.name || "Untitled"}`,
        time: course.createdAt ? new Date(course.createdAt) : new Date(),
        link: `/dashboard/course-reference/${course._id}/candidates/edit`,
      }));
  }, [courses]);

  // Format relative time
  const formatRelativeTime = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} sec ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour${Math.floor(diffInSeconds / 3600) > 1 ? "s" : ""} ago`;
    return `${Math.floor(diffInSeconds / 86400)} day${Math.floor(diffInSeconds / 86400) > 1 ? "s" : ""} ago`;
  };

  // Stats cards data
  const statCards = [
    {
      id: 1,
      title: "Course References",
      value: stats.courseReferences.toString(),
      icon: <FileDigit className="w-6 h-6" />,
      color: "bg-linear-to-r from-blue-500 to-cyan-600",
      link: "/dashboard/course-reference/all",
      linkText: "View All",
    },
    {
      id: 2,
      title: "Total Candidates",
      value: stats.totalCandidates.toString(),
      icon: <Users className="w-6 h-6" />,
      color: "bg-linear-to-r from-purple-500 to-indigo-600",
      link: "/dashboard/course-reference/all",
      linkText: "View All",
    },
    {
      id: 3,
      title: "Active References",
      value: stats.activeReferences.toString(),
      icon: <CheckCircle className="w-6 h-6" />,
      color: "bg-linear-to-r from-green-500 to-emerald-600",
      link: "/dashboard/course-reference/all",
      linkText: "View All",
    },
  ];

  // Quick actions
  const quickActions = [
    {
      name: "Create New Course Reference",
      icon: <BookOpen size={20} />,
      url: "/dashboard/course-reference/new",
      color: "bg-blue-100 text-blue-600",
    },
    {
      name: "All Course References",
      icon: <FileText size={20} />,
      url: "/dashboard/course-reference/all",
      color: "bg-purple-100 text-purple-600",
    },
  ];

  // Role-based admin cards - ONLY show based on user role
  const adminCards = [
    {
      role: "owner",
      title: "Owner Dashboard",
      description: "Access complete owner controls and analytics",
      icon: <Briefcase className="w-8 h-8" />,
      url: "/owner",
      color: "from-red-500 to-orange-500",
    },
    {
      role: "admin",
      title: "Admin Panel",
      description: "Manage users, settings, and system configuration",
      icon: <Settings className="w-8 h-8" />,
      url: "/admin",
      color: "from-blue-500 to-cyan-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-linear-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Welcome back, {user?.username || "User"}!
            </h1>
            <p className="text-blue-100">
              Here&apos;s what&apos;s happening with your account today.
            </p>
          </div>
          <div className="mt-4 md:mt-0 bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <p className="text-sm">Account Type</p>
            <p className="text-xl font-bold">
              {user?.role?.toUpperCase() || "USER"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div
            key={card.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-lg ${card.color} text-white`}>
                {card.icon}
              </div>
              <Link
                href={card.link}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
              >
                {card.linkText}
              </Link>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              {card.title}
            </h3>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Business Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Account Summary
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Account ID</span>
              <span className="font-medium text-right">
                {webData.documents.certificatePrefix}-ID-
                {user?._id?.toString().slice(-6).toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Name</span>
              <span className="font-medium text-right">{user?.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email</span>
              <span className="font-medium text-right break-all">
                {user?.email}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Role</span>
              <span className="font-medium text-right">
                {user?.role?.toUpperCase() || "USER"}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions & Admin Access */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  href={action.url}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer group"
                >
                  <div className={`p-2 rounded-lg ${action.color}`}>
                    {action.icon}
                  </div>
                  <span className="font-medium text-gray-700 group-hover:text-blue-600">
                    {action.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Admin/Owner Access - Only show if user has role */}
          {adminCards.filter((card) => card.role === user?.role).length > 0 && (
            <div className="bg-linear-to-br from-gray-900 to-black rounded-xl shadow-lg p-6 text-white">
              <h2 className="text-lg font-bold mb-4">Administration Access</h2>
              <div className="space-y-3">
                {adminCards
                  .filter((card) => card.role === user?.role)
                  .map((card, index) => (
                    <Link
                      key={index}
                      href={card.url}
                      className={`block bg-linear-to-r ${card.color} rounded-xl p-4 hover:shadow-lg transition-shadow cursor-pointer`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                          {card.icon}
                        </div>
                        <div>
                          <h3 className="font-bold">{card.title}</h3>
                          <p className="text-sm text-white/80">
                            {card.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Recent Activity
            </h2>
            <div className="space-y-3">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <Link
                    key={activity.id}
                    href={activity.link}
                    className="group flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                      <div className="flex items-center gap-2 min-w-0">
                        <BookOpen className="w-4 h-4 text-gray-600 flex-shrink-0" />
                        <span className="text-sm truncate">{activity.title}</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-3">
                      {formatRelativeTime(activity.time)}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <Calendar className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    No recent activity
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    Start by creating a course reference.
                  </p>
                  <Link
                    href="/dashboard/course-reference/new"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Create Course Reference
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
