// app/admin/layout.jsx
"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/Components/admin/sideBar";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { CourseProvider } from "@/context/CourseContext";
import { usePath } from "@/context/PathContext";
import DashboardTheme from "@/Components/cms/DashboardTheme";

import {
  BookOpen,
  FolderOpen,
  FileChartColumn,
  MessageSquareText,
  MonitorCog,
  Building2,
} from "lucide-react";

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
  const { adminSideBarOpen, setAdminSideBarOpen } = usePath();
  const pathname = usePathname();

  // Sync local sidebar state with context
  useEffect(() => {
    setSidebarOpen(adminSideBarOpen);
  }, [adminSideBarOpen]);

  // Update context when local sidebar state changes
  const handleSidebarToggle = (newState) => {
    setSidebarOpen(newState);
    setAdminSideBarOpen(newState);
  };

  // Close mobile sidebar when route changes
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  // Close mobile sidebar on larger screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Admin Page...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect will be handled by middleware
    return null;
  }

  // Sidebar menu items data
  const menuItems = [
    {
      id: "admin",
      name: "Main Panel",
      icon: <MonitorCog size={20} />,
      url: "/admin",
      dropdown: null,
    },
    {
      id: "organizations",
      name: "Organizations",
      icon: <Building2 size={20} />,
      url: "/admin/organizations",
      dropdown: null,
    },
    {
      id: "course",
      name: "Default Course",
      icon: <FileChartColumn size={20} />,
      url: null,
      dropdown: [
        {
          name: "New Default Course",
          url: "/admin/default-course/new",
        },
        { name: "All Default Course", url: "/admin/default-course/all" },
      ],
    },
    {
      id: "enquiries",
      name: "Enquiries",
      icon: <MessageSquareText size={20} />,
      url: "/admin/enquiries",
      dropdown: null
    },
    // Add Training Resources, Trainers, and Training Test removed.
  ];

  return (
    <div className="cms-dash min-h-screen bg-gray-50">
      <DashboardTheme />
        <CourseProvider>
            {/* Mobile Sidebar Overlay */}
            {mobileSidebarOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                onClick={() => setAdminSideBarOpen(false)}
              />
            )}

            <div className="flex">
              {" "}
              {/* Topbar ki height ke liye padding */}
              {/* Sidebar */}
              <Sidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={handleSidebarToggle}
                mobileOpen={adminSideBarOpen}
                setMobileOpen={setAdminSideBarOpen}
                menuItems={menuItems}
              />
              {/* Main Content */}
              <main
                className={`flex-1 w-full transition-all duration-300 min-h-screen ${
                  sidebarOpen ? "lg:ml-64" : "lg:ml-20"
                }`}
              >
                <div className="p-4 md:p-6 lg:pl-8">{children}</div>
              </main>
            </div>
        </CourseProvider>
    </div>
  );
}
