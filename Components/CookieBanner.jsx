"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

/**
 * CookieBanner Component
 *
 * A modern, production-ready cookie consent banner.
 * Features:
 * - LocalStorage persistence (only shows once)
 * - Framer Motion animations (slide up, fade out)
 * - Glassmorphism UI (backdrop-blur, subtle shadows)
 * - Mobile responsive design
 */
const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the user has already accepted cookies
    const cookiesAccepted = localStorage.getItem("cookiesAccepted");

    if (cookiesAccepted !== "true") {
      // Small delay to make it feel more organic/modern
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    // Save preference to localStorage
    localStorage.setItem("cookiesAccepted", "true");
    setIsVisible(false);
  };

  const handleClose = () => {
    // Just hide for this session if they click X, but don't save to localStorage
    // Or we could decide to save it - usually "Accept" is the trigger for persistence.
    // For this implementation, we'll keep it simple: persistent only on Accept All.
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            opacity: { duration: 0.2 },
          }}
          className="fixed bottom-6 left-0 right-0 z-100 flex justify-center px-4 pointer-events-none"
        >
          <div className="bg-white/95 backdrop-blur-xl border border-blue-50/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-3xl p-5 md:p-6 w-full max-w-3xl pointer-events-auto relative group overflow-hidden">
            {/* Subtle Gradient Accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-right from-blue-400 to-blue-600 opacity-80" />

            <div className="flex flex-col md:flex-row items-center gap-5 md:gap-8">
              {/* Icon Section */}
              <div className="hidden md:flex shrink-0 w-14 h-14 bg-blue-50 rounded-2xl items-center justify-center text-blue-600">
                <Cookie size={32} />
              </div>

              {/* Text Section */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-1.5">
                  <Cookie size={18} className="md:hidden text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                    Cookies & Privacy
                  </h3>
                </div>
                <p className="text-gray-600 text-[14px] leading-relaxed max-w-xl">
                  We use cookies to improve your experience, analyze traffic,
                  and personalize content. By continuing to use our site, you
                  agree to our use of cookies.
                  <Link
                    href="/privacy-policy"
                    className="ml-1.5 text-blue-600 hover:text-blue-700 font-semibold hover:underline decoration-2 underline-offset-4"
                  >
                    Learn More
                  </Link>
                </p>
              </div>

              {/* Actions Section */}
              <div className="flex shrink-0 w-full md:w-auto gap-3">
                <button
                  onClick={handleAccept}
                  className="flex-1 md:flex-none px-10 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all duration-300 shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5 active:scale-95 text-sm uppercase tracking-wider"
                >
                  Accept All
                </button>

                {/* Optional Close Button for better UX */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;
