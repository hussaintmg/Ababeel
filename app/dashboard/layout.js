// app/dashboard/layout.jsx
"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/Components/dashboard/sideBar";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { CourseProvider } from "@/context/CourseContext";
import { CourseReferenceProvider } from "@/context/CourseReferenceContext";
import { usePath } from "@/context/PathContext";
import WhatsAppButton from "@/Components/WhatsAppButton";
import DashboardTheme from "@/Components/cms/DashboardTheme";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
  const { dashboardSideBarOpen, setDashboardSideBarOpen } = usePath();
  const pathname = usePathname();

  // Sync local sidebar state with context
  useEffect(() => {
    setSidebarOpen(dashboardSideBarOpen);
  }, [dashboardSideBarOpen]);

  // Update context when local sidebar state changes
  const handleSidebarToggle = (newState) => {
    setSidebarOpen(newState);
    setDashboardSideBarOpen(newState);
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
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect will be handled by middleware
    return null;
  }

  return (
    <div className="cms-dash min-h-screen bg-gray-50">
      <DashboardTheme />
        <CourseProvider>
          <CourseReferenceProvider>
                {/* Mobile Sidebar Overlay */}
                {mobileSidebarOpen && (
                  <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setDashboardSideBarOpen(false)}
                  />
                )}

                <div className="flex">
                  {" "}
                  {/* Topbar ki height ke liye padding */}
                  {/* Sidebar */}
                  <Sidebar
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={handleSidebarToggle}
                    mobileOpen={dashboardSideBarOpen}
                    setMobileOpen={setDashboardSideBarOpen}
                  />
                  {/* Main Content */}
                  <main
                    className={`flex-1 transition-all duration-300 overflow-hidden min-h-screen ${
                      sidebarOpen
                        ? "lg:ml-64 lg:max-w-[100vw-256px]"
                        : "lg:ml-20 lg:max-w-[100vw-80px]"
                    }`}
                  >
                    <div className="p-4 md:p-6 lg:pl-8">{children}</div>
                  </main>
                </div>
                <WhatsAppButton />
          </CourseReferenceProvider>
        </CourseProvider>
    </div>
  );
}
