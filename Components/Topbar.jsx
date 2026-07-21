"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, ChevronDown, User, LayoutDashboard, LogOut } from "lucide-react";
import logo from "@/public/logo.png";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { usePath } from "@/context/PathContext";
import { useRouter } from "next/navigation";
import { useSiteContent } from "@/context/SiteContentContext";

// Build the scoped CSS overrides for the topbar from its style settings. Only
// emits a rule when a value is set, so unset options keep the Tailwind defaults.
// Higher specificity than Tailwind utilities so overrides win.
const SEL = 'header[data-cms-topbar="on"]';
function buildTopbarCss(s = {}) {
  const r = [];
  // Nav links
  if (s.text) r.push(`${SEL} nav a, ${SEL} nav button { color: ${s.text}; }`);
  if (s.hover) r.push(`${SEL} nav a:hover, ${SEL} nav button:hover { color: ${s.hover}; }`);
  if (s.hoverBg) r.push(`${SEL} nav a:hover, ${SEL} nav button:hover { background-color: ${s.hoverBg}; }`);
  if (s.activeText) r.push(`${SEL} nav a[aria-current="page"] { color: ${s.activeText}; }`);
  if (s.activeBg) r.push(`${SEL} nav a[aria-current="page"] { background-color: ${s.activeBg}; }`);
  // Nav dropdown menus
  if (s.ddBg) r.push(`${SEL} .cms-dropdown { background-color: ${s.ddBg}; }`);
  if (s.ddText) r.push(`${SEL} .cms-dropdown a { color: ${s.ddText}; }`);
  if (s.ddHover) r.push(`${SEL} .cms-dropdown a:hover { color: ${s.ddHover}; }`);
  if (s.ddHoverBg) r.push(`${SEL} .cms-dropdown a:hover { background-color: ${s.ddHoverBg}; }`);
  // Login / Dashboard button (override the gradient)
  if (s.btnBg) r.push(`${SEL} [data-cms-navbtn] { background-image: none; background-color: ${s.btnBg}; }`);
  if (s.btnText) r.push(`${SEL} [data-cms-navbtn] { color: ${s.btnText}; }`);
  if (s.btnHoverBg) r.push(`${SEL} [data-cms-navbtn]:hover { background-image: none; background-color: ${s.btnHoverBg}; }`);
  // User dropdown menu
  if (s.menuBg) r.push(`${SEL} .cms-usermenu { background-color: ${s.menuBg}; }`);
  if (s.menuText) r.push(`${SEL} .cms-usermenu a, ${SEL} .cms-usermenu button, ${SEL} .cms-usermenu p { color: ${s.menuText}; }`);
  if (s.menuHover) r.push(`${SEL} .cms-usermenu a:hover, ${SEL} .cms-usermenu button:hover { background-color: ${s.menuHover}; }`);
  return r.join("\n");
}

export default function Topbar({ mobileOpen, setMobileOpen, navLinks }) {
  const { user, setUser } = useAuth();
  const { settings } = useSiteContent();
  const router = useRouter();
  const {
    isDashboard,
    dashboardSideBarOpen,
    setDashboardSideBarOpen,
    isAdmin,
    setAdminSideBarOpen,
    adminSideBarOpen,
    isOwner,
    setOwnerSideBarOpen,
    ownerSideBarOpen,
    isLogSign,
    pathname,
  } = usePath();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const dropdownRefs = useRef([]);
  const dropdownTimerRefs = useRef([]);
  const userMenuRef = useRef(null);

  // Updated hover handlers with better logic
  const handleMouseEnter = (index) => {
    // Clear any pending timeouts
    if (dropdownTimerRefs.current[index]) {
      clearTimeout(dropdownTimerRefs.current[index]);
    }
    // Clear all other dropdowns
    setOpenDropdown(index);
  };

  const handleMouseLeave = (index) => {
    // Set timeout only for current dropdown
    dropdownTimerRefs.current[index] = setTimeout(() => {
      setOpenDropdown((prev) => {
        // Only close if still on the same dropdown
        if (prev === index) {
          return null;
        }
        return prev;
      });
    }, 200); // Increased timeout for better UX
  };

  // Handle mouse enter for dropdown menu itself
  const handleDropdownMouseEnter = (index) => {
    // Clear timeout when entering dropdown
    if (dropdownTimerRefs.current[index]) {
      clearTimeout(dropdownTimerRefs.current[index]);
    }
  };

  // Handle mouse leave for dropdown menu
  const handleDropdownMouseLeave = (index) => {
    // Start timeout when leaving dropdown
    dropdownTimerRefs.current[index] = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  };

  // Close all dropdowns when clicking anywhere except dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside all dropdowns
      let isClickInsideDropdown = false;

      dropdownRefs.current.forEach((ref) => {
        if (ref && ref.contains(event.target)) {
          isClickInsideDropdown = true;
        }
      });

      if (!isClickInsideDropdown) {
        setOpenDropdown(null);
      }

      // User menu outside click
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Clear all timeouts on unmount
  useEffect(() => {
    return () => {
      dropdownTimerRefs.current.forEach((timer) => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);

  const handleLogout = async () => {
    try {
      await axios.get("/api/auth/logout", { withCredentials: true });
      setUserMenuOpen(false);
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // CMS-driven topbar appearance (Global Settings → Navigation → Appearance).
  const tb = settings?.topbar?.style || {};
  const barH = parseInt(tb.height, 10);
  const headerStyle = {
    backgroundColor: tb.bg || undefined,
    borderColor: tb.borderColor || undefined,
    boxShadow: tb.shadow === false ? "none" : undefined,
  };
  const containerMax = tb.container === "normal" ? "80rem" : tb.container === "full" ? "100%" : "88rem";
  const navJustify = tb.navAlign === "left" ? "flex-start" : tb.navAlign === "right" ? "flex-end" : "center";
  const logoH = parseInt(tb.logoHeight, 10);
  const tbCss = buildTopbarCss(tb);
  // Active-link detection (case-insensitive; "/" only matches home exactly).
  const isActive = (url) => {
    if (!url || !pathname) return false;
    if (url === "/") return pathname === "/";
    return pathname === url || pathname.startsWith(url + "/");
  };

  return (
    <header
      data-cms-topbar="on"
      style={headerStyle}
      className={`${
        isLogSign ? "hidden" : ""
      } w-full bg-white shadow-sm border-b border-gray-500`}
    >
      {tbCss ? <style dangerouslySetInnerHTML={{ __html: tbCss }} /> : null}
      <div className="mx-auto pl-2 pr-4" style={{ maxWidth: containerMax }}>
        {/* Main Container */}
        <div
          className="flex items-center justify-between h-14 md:h-16 lg:h-20"
          style={Number.isNaN(barH) ? undefined : { height: barH }}
        >
          {/* Mobile Menu Button */}
          <div className="flex items-center md:flex-none">
            <button
              onClick={() => {
                if (isDashboard) {
                  setDashboardSideBarOpen(!dashboardSideBarOpen);
                } else if (isOwner) {
                  setOwnerSideBarOpen(!ownerSideBarOpen);
                } else if (isAdmin) {
                  setAdminSideBarOpen(!adminSideBarOpen);
                } else {
                  setMobileOpen(!mobileOpen);
                }
              }}
              className="lg:hidden p-2 mr-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Menu"
            >
              <Menu size={22} className="text-gray-700" />
            </button>
          </div>

          {/* Logo */}
          <div className="flex items-center md:flex-none">
            <Link href="/" className="flex items-center">
              <div
                className="relative h-30 w-30"
                style={Number.isNaN(logoH) ? undefined : { height: logoH, width: logoH }}
              >
                {settings?.logos?.topbar ? (
                  // CMS-managed logo (may be an uploaded/external URL) so use a
                  // plain img to avoid next/image domain configuration.
                  <img
                    src={settings.logos.topbar}
                    alt={settings?.brand?.name || "Logo"}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Image
                    src={logo}
                    alt="Logo"
                    fill
                    className="object-contain"
                    priority
                    sizes="(max-width: 160px) 100vw, 160px"
                  />
                )}
              </div>
            </Link>
          </div>

          {/* Center: Desktop Navigation */}
          <nav className="hidden lg:flex items-center flex-1" style={{ justifyContent: navJustify }}>
            <div className="flex items-center gap-0 xl:gap-1">
              {navLinks.map((item, index) => (
                <div
                  key={index}
                  ref={(el) => {
                    dropdownRefs.current[index] = el;
                  }}
                  className="relative group"
                  onMouseEnter={() => handleMouseEnter(index)}
                  onMouseLeave={() => handleMouseLeave(index)}
                >
                  {item.dropdown ? (
                    <button
                      type="button"
                      className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50 whitespace-nowrap xl:px-4 cursor-pointer relative z-10"
                    >
                      {item.name}
                      <ChevronDown
                        size={16}
                        className={`ml-1 transition-transform duration-200 ${
                          openDropdown === index ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  ) : (
                    <Link
                      href={item.url}
                      aria-current={isActive(item.url) ? "page" : undefined}
                      className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50 whitespace-nowrap xl:px-4 relative z-10"
                    >
                      {item.name}
                    </Link>
                  )}

                  {/* Dropdown Menu with better positioning */}
                  {item.dropdown && openDropdown === index && (
                    <div
                      className="cms-dropdown absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden z-50 border-t-2 border-t-red-500"
                      onMouseEnter={() => handleDropdownMouseEnter(index)}
                      onMouseLeave={() => handleDropdownMouseLeave(index)}
                      style={{
                        animation: "fadeIn 0.2s ease-out",
                      }}
                    >
                      <div className="py-1">
                        {item.dropdown.map((drop, i) => (
                          <Link
                            key={i}
                            href={drop.url}
                            className="block px-4 py-3 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                            onClick={() => setOpenDropdown(null)}
                          >
                            <div className="flex items-center">
                              <span>{drop.name}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </nav>

          {/* Right: Login / Dashboard */}
          <div className="flex items-center justify-end md:flex-none">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* User Menu for logged in users */}
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  {/* Dashboard Button with User Menu */}
                  <button
                    data-cms-navbtn
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    onMouseEnter={() => {
                      // Close other dropdowns when hovering over user menu
                      setOpenDropdown(null);
                    }}
                    className="cursor-pointer inline-flex items-center gap-2 px-3 py-2.5 bg-linear-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 whitespace-nowrap shadow-sm hover:shadow relative z-10"
                  >
                    <LayoutDashboard size={16} />
                    <span className="max-[320px]:hidden">Dashboard</span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 ${
                        userMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* User Dropdown Menu */}
                  {userMenuOpen && (
                    <div
                      className="cms-usermenu w-55! absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden z-50 border-t-2 border-t-blue-500"
                      style={{
                        animation: "fadeIn 0.2s ease-out",
                      }}
                    >
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100 bg-linear-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-center gap-3">
                          <div className="min-w-8! h-8! bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {user.username || user.email}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {user.role || "user"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        {user.role !== "user" && (
                          <Link
                            href="/dashboard"
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <LayoutDashboard size={16} />
                            My Dashboard
                          </Link>
                        )}

                        {/* <Link
                          href="/certificates"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Certificates
                        </Link> */}
                        <Link
                          href="/profile"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <User size={16} />
                          Profile Settings
                        </Link>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          onClick={handleLogout}
                          className="cursor-pointer flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={16} />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Login Button for non-logged in users
                <>
                  {/* Desktop Login Button */}
                  <div className="hidden sm:block">
                    <Link
                      href="/login"
                      data-cms-navbtn
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 whitespace-nowrap shadow-sm hover:shadow"
                    >
                      <User size={16} />
                      <span>Login</span>
                    </Link>
                  </div>

                  {/* Mobile Login Button */}
                  <div className="sm:hidden">
                    <Link
                      href="/login"
                      data-cms-navbtn
                      className="inline-flex items-center gap-1 p-2.5 bg-linear-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
                    >
                      <User size={16} />
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Better hover transitions */
        .relative.group:hover .dropdown-content {
          display: block;
        }
      `}</style>
    </header>
  );
}
