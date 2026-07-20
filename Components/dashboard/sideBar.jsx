// components/dashboard/Sidebar.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  CreditCard,
  Users,
  Upload,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Settings,
  BarChart3,
  FileDigit,
  Wallet,
  Briefcase,
  FileChartColumn,
  Home,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
  mobileOpen,
  setMobileOpen,
}) => {
  const pathname = usePathname();
  const { user } = useAuth();
  const [openDropdowns, setOpenDropdowns] = useState({});
  const sidebarRef = useRef(null);

  // Sidebar menu items data
  const menuItems = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      url: "/dashboard",
      dropdown: null,
    },
    {
      id: "course-reference",
      name: "Course Reference",
      icon: <FileChartColumn size={20} />,
      url: null,
      dropdown: [
        {
          name: "New Course Reference",
          url: "/dashboard/course-reference/new",
        },
        {
          name: "All Course References",
          url: "/dashboard/course-reference/all",
        },
      ],
    },

    // Invoices, Transactions, Trainers, Deposit, and Training Resources were
    // removed: payment is not part of the flow, and the dashboard is scoped to
    // creating course references and downloading candidate documents.
  ];

  // Role-based quick access
  const roleQuickAccess = {
    owner: [
      {
        name: "Go to Owner Panel",
        url: "/owner",
        icon: <Briefcase size={18} />,
      },
    ],
    admin: [
      {
        name: "Go to Admin Panel",
        url: "/admin",
        icon: <Settings size={18} />,
      },
    ],
    user: [{ name: "Go to Home", url: "/", icon: <Home size={18} /> }],
    organization: [{ name: "Go to Home", url: "/", icon: <Home size={18} /> }],
    trainee: [{ name: "Go to Home", url: "/", icon: <Home size={18} /> }],
  };

  // Check if any dropdown item is active
  const isDropdownItemActive = (dropdownItems) => {
    if (!dropdownItems) return false;
    return dropdownItems.some(
      (item) => pathname === item.url || pathname.startsWith(item.url + "/"),
    );
  };

  // Check if main menu item is active (for non-dropdown items)
  const isMainItemActive = (item) => {
    if (item.url && !item.dropdown) {
      if (item.url === "/dashboard") {
        return pathname === "/dashboard";
      }
      return pathname === item.url || pathname.startsWith(item.url + "/");
    }
    return false;
  };

  // Check if dropdown should be open based on active route
  const shouldDropdownBeOpen = (dropdownItems, itemId) => {
    if (isDropdownItemActive(dropdownItems)) {
      return true;
    }
    return openDropdowns[itemId] || false;
  };

  const toggleDropdown = (id) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Handle dropdown click in collapsed sidebar
  const handleDropdownClickInCollapsedSidebar = (itemId) => {
    if (!sidebarOpen) {
      // Open sidebar and immediately open the dropdown
      setSidebarOpen(true);
      // Open the dropdown without delay
      setOpenDropdowns((prev) => ({
        ...prev,
        [itemId]: true,
      }));
    } else {
      // If sidebar is already open, just toggle the dropdown
      toggleDropdown(itemId);
    }
  };

  // Reset manual toggles when the route changes, so a dropdown left open on
  // the previous page does not stay open here. shouldDropdownBeOpen() already
  // forces the active section open during render, so this only needs to clear
  // stale state — done by comparing against the last path during render
  // instead of writing state from an effect.
  const [lastPathname, setLastPathname] = useState(null);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    const newOpenDropdowns = {};
    menuItems.forEach((item) => {
      if (item.dropdown) {
        newOpenDropdowns[item.id] = isDropdownItemActive(item.dropdown);
      }
    });
    setOpenDropdowns(newOpenDropdowns);
  }

  // Check if current path is active for sub items
  const isSubItemActive = (subItemUrl) => {
    return pathname === subItemUrl || pathname.startsWith(subItemUrl + "/");
  };

  // Handle sidebar toggle
  const handleSidebarToggle = () => {
    const newSidebarState = !sidebarOpen;
    setSidebarOpen(newSidebarState);

    // If closing the sidebar, close all dropdowns
    if (!newSidebarState) {
      setOpenDropdowns({});
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        ref={sidebarRef}
        className={`
        fixed top-16 md:top-20 left-0 h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]
        bg-white border-r border-gray-200 z-30
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? "w-64" : "w-20"}
        hidden lg:block
      `}
      >
        {/* Toggle Button */}
        <div className="absolute -right-3 top-6">
          <button
            onClick={handleSidebarToggle}
            className="p-1.5 bg-white border border-gray-300 rounded-full shadow-md hover:shadow-lg transition-shadow"
          >
            {sidebarOpen ? (
              <ChevronLeft size={16} className="text-gray-600" />
            ) : (
              <ChevronRight size={16} className="text-gray-600" />
            )}
          </button>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-gray-100">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 bg-linear-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {user?.username || user?.email}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            )}
          </Link>
        </div>

        {/* Menu Items */}
        <nav
          className={`p-2 space-y-1 overflow-y-auto ${
            sidebarOpen ? "h-[calc(100%-10rem)]" : "h-[calc(100%-5rem)]"
          }`}
        >
          {menuItems.map((item) => (
            <div key={item.id} className="relative">
              {item.dropdown ? (
                <>
                  <button
                    onClick={() =>
                      handleDropdownClickInCollapsedSidebar(item.id)
                    }
                    className={`
                      w-full flex items-center justify-between p-3 rounded-lg
                      transition-colors duration-200
                      hover:bg-blue-50 hover:text-blue-600
                      ${
                        isDropdownItemActive(item.dropdown)
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`${
                          isDropdownItemActive(item.dropdown)
                            ? "text-blue-600"
                            : "text-gray-500"
                        }`}
                      >
                        {item.icon}
                      </div>
                      {sidebarOpen && (
                        <span className="font-medium text-sm">{item.name}</span>
                      )}
                    </div>
                    {sidebarOpen && (
                      <div
                        className={`${
                          isDropdownItemActive(item.dropdown)
                            ? "text-blue-600"
                            : "text-gray-400"
                        }`}
                      >
                        {shouldDropdownBeOpen(item.dropdown, item.id) ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </div>
                    )}
                  </button>

                  {sidebarOpen &&
                    shouldDropdownBeOpen(item.dropdown, item.id) && (
                      <div className="ml-10 mt-1 space-y-1">
                        {item.dropdown.map((subItem, index) => (
                          <Link
                            key={index}
                            href={subItem.url}
                            className={`
                            block px-3 py-2 rounded text-sm transition-colors
                            ${
                              isSubItemActive(subItem.url)
                                ? "bg-blue-100 text-blue-600 font-medium"
                                : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                            }
                          `}
                            onClick={() => {
                              // If sidebar is collapsed, open it when clicking a dropdown item
                              if (!sidebarOpen) {
                                setSidebarOpen(true);
                              }
                            }}
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                </>
              ) : (
                <Link
                  href={item.url}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg
                    transition-colors duration-200
                    hover:bg-blue-50 hover:text-blue-600
                    ${
                      isMainItemActive(item)
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700"
                    }
                  `}
                  onClick={() => {
                    // If sidebar is collapsed, keep it collapsed for non-dropdown items
                    // This allows users to navigate without expanding sidebar
                  }}
                >
                  <div
                    className={`${
                      isMainItemActive(item) ? "text-blue-600" : "text-gray-500"
                    }`}
                  >
                    {item.icon}
                  </div>
                  {sidebarOpen && (
                    <span className="font-medium text-sm">{item.name}</span>
                  )}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Quick Access based on Role */}
        {sidebarOpen && roleQuickAccess[user?.role] && (
          <div className="p-4 border-t border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Quick Access
            </h3>
            <div className="space-y-1">
              {roleQuickAccess[user.role].map((access, index) => (
                <Link
                  key={index}
                  href={access.url}
                  className="flex items-center gap-2 p-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  {access.icon}
                  <span>{access.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </aside>
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed z-39 bg-black/10 backdrop-blur-sm w-full h-screen top-0 left-0"
        ></div>
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`
        fixed top-14 md:top-16 left-0 h-[calc(100vh-55px)]
        bg-white border-r border-gray-200 z-50
        transition-transform duration-300 ease-in-out
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        w-64 lg:hidden
      `}
      >
        {/* Mobile Sidebar Content */}
        <div className="p-4 border-b border-gray-100">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 bg-linear-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {user?.username || user?.email}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            )}
          </Link>
        </div>

        {/* Mobile Menu */}
        <nav className="p-2 space-y-1 overflow-y-auto h-[calc(100%-10rem)]">
          {menuItems.map((item) => (
            <div key={item.id} className="relative">
              {item.dropdown ? (
                <>
                  <button
                    onClick={() => toggleDropdown(item.id)}
                    className={`
                      w-full flex items-center justify-between p-3 rounded-lg
                      transition-colors duration-200
                      hover:bg-blue-50 hover:text-blue-600
                      ${
                        isDropdownItemActive(item.dropdown)
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`${
                          isDropdownItemActive(item.dropdown)
                            ? "text-blue-600"
                            : "text-gray-500"
                        }`}
                      >
                        {item.icon}
                      </div>
                      <span className="font-medium text-sm">{item.name}</span>
                    </div>
                    <div
                      className={`${
                        isDropdownItemActive(item.dropdown)
                          ? "text-blue-600"
                          : "text-gray-400"
                      }`}
                    >
                      {shouldDropdownBeOpen(item.dropdown, item.id) ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </div>
                  </button>

                  {shouldDropdownBeOpen(item.dropdown, item.id) && (
                    <div className="ml-10 mt-1 space-y-1">
                      {item.dropdown.map((subItem, index) => (
                        <Link
                          key={index}
                          href={subItem.url}
                          className={`
                            block px-3 py-2 rounded text-sm transition-colors
                            ${
                              isSubItemActive(subItem.url)
                                ? "bg-blue-100 text-blue-600 font-medium"
                                : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                            }
                          `}
                          onClick={() => setMobileOpen(false)}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.url}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg
                    transition-colors duration-200
                    hover:bg-blue-50 hover:text-blue-600
                    ${
                      isMainItemActive(item)
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700"
                    }
                  `}
                  onClick={() => setMobileOpen(false)}
                >
                  <div
                    className={`${
                      isMainItemActive(item) ? "text-blue-600" : "text-gray-500"
                    }`}
                  >
                    {item.icon}
                  </div>
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Mobile Quick Access */}
        {roleQuickAccess[user?.role] && (
          <div className="p-4 border-t border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Quick Access
            </h3>
            <div className="space-y-1">
              {roleQuickAccess[user.role].map((access, index) => (
                <Link
                  key={index}
                  href={access.url}
                  className="flex items-center gap-2 p-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {access.icon}
                  <span>{access.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
