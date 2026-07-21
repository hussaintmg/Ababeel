"use client";

import { useState, useEffect } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { usePath } from "@/context/PathContext";
import { useAuth } from "@/context/AuthContext";
import { useSiteContent } from "@/context/SiteContentContext";
import webData from "@/constants";

const WhatsAppButton = () => {
  const { isDashboard, isAdmin, isOwner } = usePath();
  const { user } = useAuth();
  const { settings } = useSiteContent();
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  // Live from the CMS contact settings (WhatsApp first, then phone), falling
  // back to the static default so updating the number in the CMS updates here.
  const phoneNumber =
    settings?.contact?.whatsapp ||
    settings?.contact?.phone ||
    webData.contact.whatsapp ||
    "";

  const whatsappUrl = `https://wa.me/${String(phoneNumber).replace(/\D/g, "")}`;

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        const shouldShow = isDashboard || isAdmin || isOwner;
        setIsVisible(shouldShow);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isDashboard, isAdmin, isOwner]);

  const handleClick = () => {
    // Open WhatsApp in new tab
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");

    // Optional: Track click event
    if (window.gtag) {
      window.gtag("event", "whatsapp_click", {
        event_category: "engagement",
        event_label: "whatsapp_button",
      });
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={`fixed right-5 z-50 ${user ? "bottom-20" : "bottom-2"}`}
        >
          <div className="relative">
            {/* Bubble effect when hovered */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute -top-2 -right-2 w-16 h-16 bg-green-500/20 rounded-full"
                />
              )}
            </AnimatePresence>

            {/* Tooltip */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="absolute right-20 top-1/2 -translate-y-1/2"
                >
                  <div className="bg-white text-gray-800 text-sm font-medium px-4 py-2 rounded-lg shadow-2xl border border-gray-200 whitespace-nowrap">
                    Chat with us on WhatsApp!
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45 w-3 h-3 bg-white border-r border-b border-gray-200" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main WhatsApp Button */}
            <motion.button
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={handleClick}
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="relative bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-full shadow-2xl shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300 group"
              aria-label="Chat on WhatsApp"
            >
              {/* Animated ring */}
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 border-2 border-green-400/50 rounded-full"
              />

              <FaWhatsapp className="w-7 h-7" />

              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 rounded-full transition-opacity duration-300" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WhatsAppButton;
