"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  BookOpen,
  RefreshCw,
  Target,
  Building2,
  Users,
} from "lucide-react";
import axios from "axios";

export default function OwnerDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [coursesCount, setCoursesCount] = useState(0);
  const [orgsCount, setOrgsCount] = useState(0);
  const [adminsCount, setAdminsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCoursesCount = async () => {
    try {
      const response = await axios.get("/api/courses/default");
      if (response.data.success) {
        setCoursesCount(response.data.data?.length || 0);
      }
    } catch (error) {
      console.error("Error fetching courses count:", error);
    }
  };

  const fetchOwnerData = async () => {
    try {
      const response = await axios.get("/api/owner/users");
      if (response.data.success) {
        setOrgsCount(response.data.data?.organizations?.length || 0);
        setAdminsCount(response.data.data?.admins?.length || 0);
      }
    } catch (error) {
      console.error("Error fetching owner data:", error);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchCoursesCount(), fetchOwnerData()]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const quickActions = [
    {
      title: "Manage Courses",
      description: "Edit and update training courses",
      icon: BookOpen,
      count: coursesCount,
      route: "/owner/default-course/all",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      title: "Organizations",
      description: "Manage your organizations",
      icon: Building2,
      count: orgsCount,
      route: "/owner/organizations",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Manage Users",
      description: "View and manage users",
      icon: Users,
      count: adminsCount,
      route: "/owner/users",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Owner Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome back,{" "}
              <span className="font-semibold text-gray-800">
                {user?.username?.split(/[\s\-_]/)[0] || "Owner"}
              </span>
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all hover:shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </header>

      <main className="p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-linear-to-r from-blue-500 to-blue-600 rounded-xl shadow">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-500">Total</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{orgsCount}</h3>
            <p className="text-gray-600 font-medium">Organizations</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-linear-to-r from-purple-500 to-purple-600 rounded-xl shadow">
                <Users className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-500">Total</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{adminsCount}</h3>
            <p className="text-gray-600 font-medium">Admins</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-linear-to-r from-emerald-500 to-green-500 rounded-xl shadow">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-500">Active</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{coursesCount}</h3>
            <p className="text-gray-600 font-medium">Training Courses</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Training Courses</h2>
              <p className="text-gray-600">Manage your course catalog</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                {coursesCount} Active
              </span>
              <button
                onClick={() => router.push("/owner/default-course/all")}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow-sm"
              >
                Manage Courses
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Course Management</h3>
                  <p className="text-gray-600 text-sm">Add, edit, and manage training courses</p>
                </div>
              </div>
            </div>
            <div className="bg-linear-to-r from-emerald-500 to-green-500 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <Target className="h-8 w-8 opacity-90" />
                <span className="text-2xl font-bold">{coursesCount}</span>
              </div>
              <h3 className="font-bold mb-2">Active Courses</h3>
              <p className="text-emerald-100 text-sm opacity-90">Ready for enrollment</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
              <p className="text-gray-600">Common tasks and shortcuts</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <div
                key={index}
                onClick={() => action.route && router.push(action.route)}
                className="bg-white rounded-xl shadow border border-gray-100 p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 ${action.iconBg} rounded-xl`}>
                    <action.icon className={`h-6 w-6 ${action.iconColor}`} />
                  </div>
                  {action.count !== undefined && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      {action.count}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{action.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{action.description}</p>
                <div className="flex items-center text-blue-600 font-medium text-sm">
                  <span>Access now</span>
                  <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {loading && (
        <div className="fixed inset-0 bg-black/30 bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center">
            <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-700 font-medium">Loading dashboard data...</p>
          </div>
        </div>
      )}
    </div>
  );
}
