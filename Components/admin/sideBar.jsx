// components/dashboard/Sidebar.jsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeMenuUrl, menuLinkIsActive } from "@/lib/navigation/activeMenu";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
  mobileOpen,
  setMobileOpen,
  menuItems = [],
}) => {
  const pathname = usePathname();
  const { user } = useAuth();
  const [openDropdowns, setOpenDropdowns] = useState({});

  const activeUrl = activeMenuUrl(pathname, menuItems);

  // Check if any dropdown item is active
  const isDropdownItemActive = (dropdownItems) => {
    if (!dropdownItems) return false;
    return dropdownItems.some((item) => menuLinkIsActive(item.url, activeUrl));
  };

  // Check if main menu item is active (for non-dropdown items)
  const isMainItemActive = (item) => !item.dropdown && menuLinkIsActive(item.url, activeUrl);

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

  // Reset manual toggles when route changes
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
    return menuLinkIsActive(subItemUrl, activeUrl);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
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
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 bg-white border border-gray-300 rounded-full shadow-md hover:shadow-lg transition-shadow"
            aria-label="Toggle sidebar"
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
            <div className="w-10 h-10 bg-linear-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
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
        <nav className="p-2 space-y-1 overflow-y-auto h-[calc(100%-4.5rem)]">
          {menuItems.map((item) => (
            <div key={item.id} className="relative">
              {item.dropdown ? (
                <>
                  <button
                    onClick={() => {
                      toggleDropdown(item.id);
                      if (!sidebarOpen) {
                        setSidebarOpen(true);
                      }
                    }}
                    className={`
                      w-full flex items-center justify-between p-3 rounded-lg
                      transition-colors duration-200
                      ${
                        isDropdownItemActive(item.dropdown)
                          ? "bg-blue-50/70 text-blue-700 font-medium border border-blue-100/60"
                          : "text-gray-700 hover:bg-gray-100/80 hover:text-blue-600"
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
                      <div className="ml-9 mt-1 space-y-1 pl-2 border-l border-gray-200">
                        {item.dropdown.map((subItem, index) => {
                          const active = isSubItemActive(subItem.url);
                          return (
                            <Link
                              key={index}
                              href={subItem.url}
                              className={`
                              flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all
                              ${
                                active
                                  ? "bg-blue-600 text-white font-semibold shadow-xs"
                                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50/70"
                              }
                            `}
                            >
                              <span className="truncate">{subItem.name}</span>
                              {active ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-white ml-2 shrink-0"></span>
                              ) : null}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                </>
              ) : (
                <Link
                  href={item.url}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg
                    transition-all duration-200
                    ${
                      isMainItemActive(item)
                        ? "bg-blue-600 text-white font-semibold shadow-xs"
                        : "text-gray-700 hover:bg-gray-100/80 hover:text-blue-600"
                    }
                  `}
                >
                  <div
                    className={`${
                      isMainItemActive(item) ? "text-white" : "text-gray-500"
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
      </aside>

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed z-39 bg-black/20 backdrop-blur-xs w-full h-screen top-0 left-0"
        ></div>
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`
        fixed top-14 md:top-16 left-0 h-[calc(100vh-55px)] md:h-[calc(100vh-55px)]
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
            onClick={() => setMobileOpen(false)}
          >
            <div className="w-10 h-10 bg-linear-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="overflow-hidden">
              <p className="font-medium text-gray-900 text-sm truncate">
                {user?.username || user?.email}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </Link>
        </div>

        {/* Mobile Menu */}
        <nav className="p-2 space-y-1 overflow-y-auto h-[calc(100%-4.5rem)]">
          {menuItems.map((item) => (
            <div key={item.id} className="relative">
              {item.dropdown ? (
                <>
                  <button
                    onClick={() => toggleDropdown(item.id)}
                    className={`
                      w-full flex items-center justify-between p-3 rounded-lg
                      transition-colors duration-200
                      ${
                        isDropdownItemActive(item.dropdown)
                          ? "bg-blue-50/70 text-blue-700 font-medium border border-blue-100/60"
                          : "text-gray-700 hover:bg-gray-100/80 hover:text-blue-600"
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
                    <div className="ml-9 mt-1 space-y-1 pl-2 border-l border-gray-200">
                      {item.dropdown.map((subItem, index) => {
                        const active = isSubItemActive(subItem.url);
                        return (
                          <Link
                            key={index}
                            href={subItem.url}
                            className={`
                              flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all
                              ${
                                active
                                  ? "bg-blue-600 text-white font-semibold shadow-xs"
                                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50/70"
                              }
                            `}
                            onClick={() => setMobileOpen(false)}
                          >
                            <span className="truncate">{subItem.name}</span>
                            {active ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-white ml-2 shrink-0"></span>
                            ) : null}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.url}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg
                    transition-all duration-200
                    ${
                      isMainItemActive(item)
                        ? "bg-blue-600 text-white font-semibold shadow-xs"
                        : "text-gray-700 hover:bg-gray-100/80 hover:text-blue-600"
                    }
                  `}
                  onClick={() => setMobileOpen(false)}
                >
                  <div
                    className={`${
                      isMainItemActive(item) ? "text-white" : "text-gray-500"
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
      </aside>
    </>
  );
};

export default Sidebar;
