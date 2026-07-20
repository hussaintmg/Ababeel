"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  ChevronRight,
  User,
  Home,
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const Sidebar = ({ isOpen, onClose, navLinks }) => {
  const { user } = useAuth();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const contentRef = React.useRef(null);
  // A plain `let` here was reset on every render, so clearTimeout never saw
  // the previous handle and the scroll debounce never actually debounced.
  const scrollTimeoutRef = React.useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const handleScroll = () => {
      setIsScrolling(true);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 300);
    };

    content.addEventListener("scroll", handleScroll);
    return () => {
      content.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  const toggleDropdown = (index) => {
    setOpenDropdown(openDropdown === index ? null : index);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
        onClick={onClose}
      />

      <div
        className="fixed inset-y-0 left-0 w-[85vw] max-w-xs bg-white z-50 lg:hidden flex flex-col shadow-2xl transform transition-transform duration-300"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(-100%)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/95 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Home size={18} className="text-blue-600" />
            </div>
            <span className="font-bold text-gray-800">Home</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content with enhanced scrollbar */}
        <div className="flex-1 overflow-hidden relative">
          {/* Top fade effect */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-linear-to-b from-white to-transparent z-10 pointer-events-none"></div>

          {/* Scrollable content */}
          <div
            ref={contentRef}
            className="h-full overflow-y-auto py-4 px-3 custom-scrollbar"
          >
            <nav className="space-y-1">
              {navLinks.map((item, index) => (
                <div key={index} className="mb-1">
                  {item.dropdown ? (
                    <div className="rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleDropdown(index)}
                        className="flex items-center justify-between w-full p-3 text-left bg-gray-50 hover:bg-blue-50 text-gray-800 hover:text-blue-700 transition-all duration-200 group rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <span className="font-medium text-sm">
                            {item.name}
                          </span>
                        </div>
                        <ChevronDown
                          size={16}
                          className={`transition-transform duration-300 ${
                            openDropdown === index ? "rotate-180" : ""
                          } text-gray-400 group-hover:text-blue-600`}
                        />
                      </button>

                      {openDropdown === index && (
                        <div className="mt-1 ml-6 pl-2 border-l-2 border-blue-200 animate-slideDown">
                          {item.dropdown.map((drop, i) => (
                            <Link
                              key={i}
                              href={`/qualification/${drop.id}`}
                              className="block py-2.5 px-3 text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 text-sm group/link"
                              onClick={onClose}
                            >
                              <div className="flex items-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-3 group-hover/link:bg-blue-500 transition-all duration-300"></div>
                                <span className="truncate">{drop.name}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.url}
                      className="flex items-center gap-3 p-3 text-gray-800 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                      onClick={onClose}
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <span className="font-medium text-sm">{item.name}</span>
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Bottom fade effect */}
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-linear-to-t from-white to-transparent z-10 pointer-events-none"></div>
        </div>

        {/* Footer */}
        <div
          className={`${user && user?.role !== "user" ? "" : "hidden"} border-t border-gray-100 bg-white/95 backdrop-blur-sm p-4`}
        >
          <Link
            href={user ? "/dasahboard" : "/login"}
            className="flex items-center justify-center gap-2 w-full py-3 bg-linear-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-[0.98] group"
            onClick={onClose}
          >
            {user ? (
              <>
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </>
            ) : (
              <>
                <User
                  size={16}
                  className="group-hover:scale-110 transition-transform"
                />
                <span>Login</span>
              </>
            )}
            <ChevronRight
              size={14}
              className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
            />
          </Link>
        </div>
      </div>

      <style jsx global>{`
        /* Modern Scrollbar */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(99, 102, 241, 0.5) transparent;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 10px;
          margin: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #6366f1, #8b5cf6);
          border-radius: 10px;
          opacity: 0.6;
          transition: all 0.3s ease;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          opacity: 1;
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-corner {
          background: transparent;
        }

        /* Hide scrollbar when not interacting */
        .custom-scrollbar:not(:hover)::-webkit-scrollbar-thumb {
          opacity: 0.3;
        }

        /* Smooth animations */
        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            max-height: 500px;
            transform: translateY(0);
          }
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }

        /* Mobile optimizations */
        @media (max-width: 640px) {
          .custom-scrollbar {
            padding-right: 2px;
          }

          .custom-scrollbar::-webkit-scrollbar {
            width: 3px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(99, 102, 241, 0.7);
          }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
