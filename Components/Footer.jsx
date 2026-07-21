// components/Footer.jsx
"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { usePath } from "@/context/PathContext";
import logo from "@/public/logo-2.png";
import Link from "next/link";
import Image from "next/image";
import webData from "@/constants";
import { useSiteContent } from "@/context/SiteContentContext";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { showFooter } = usePath();
  const { settings } = useSiteContent();

  if (!showFooter) {
    return <></>;
  }

  // CMS-driven values with static fallbacks.
  const fSettings = settings?.footer || {};
  const brand = settings?.brand || webData.brand;
  const contact = settings?.contact || webData.contact;
  const footerLogo = settings?.logos?.footer || null;
  const footerColumns =
    Array.isArray(fSettings.columns) && fSettings.columns.length
      ? fSettings.columns
      : [
          {
            title: "Quick Links",
            links: [
              { name: "About Us", href: "/about-us" },
              { name: "Qualifications", href: "/qualification" },
              { name: "Professional Development", href: "/professional-dev" },
            ],
          },
          {
            title: "Support",
            links: [
              { name: `${brand.shortName} Logo Use`, href: "/logo-use" },
              { name: "Glossary of Terms", href: "/glossary-of-terms" },
              { name: "FAQs", href: "/FAQs" },
            ],
          },
        ];
  const bottomLinks =
    Array.isArray(fSettings.bottomLinks) && fSettings.bottomLinks.length
      ? fSettings.bottomLinks
      : [
          { name: "Privacy Policy", href: "/privacy-policy" },
          { name: "Terms of Service", href: "/terms-of-services" },
        ];
  const footerEmail = contact.infoEmail || contact.supportEmail;

  // CMS-driven footer appearance (Global Settings → Footer → Appearance).
  const fStyle = fSettings.style || {};
  const footerStyle = {
    backgroundColor: fStyle.bg || undefined,
    color: fStyle.text || undefined,
    ...(fStyle.align === "center" ? { textAlign: "center" } : {}),
  };
  const cols = parseInt(fStyle.columns, 10);
  const topGridStyle = Number.isNaN(cols)
    ? undefined
    : { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` };
  const FSEL = 'footer[data-cms-footer="on"]';
  const footerCss = [
    fStyle.heading ? `${FSEL} h3, ${FSEL} h4 { color: ${fStyle.heading}; }` : "",
    fStyle.link ? `${FSEL} a { color: ${fStyle.link}; }` : "",
    fStyle.linkHover ? `${FSEL} a:hover { color: ${fStyle.linkHover}; }` : "",
    fStyle.text ? `${FSEL} p { color: ${fStyle.text}; }` : "",
    fStyle.borderColor ? `${FSEL} .border-gray-800 { border-color: ${fStyle.borderColor} !important; }` : "",
  ].filter(Boolean).join("\n");

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setEmail("");
      }, 3000);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Simulate a small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const link = document.createElement("a");
      link.href = "/guide.pdf";
      link.download = `${webData.brand.shortName}_Guide.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <footer data-cms-footer="on" style={footerStyle} className="bg-gray-900 text-white pt-12 pb-8">
      {footerCss ? <style dangerouslySetInnerHTML={{ __html: footerCss }} /> : null}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12" style={topGridStyle}>
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center md:flex-none">
              <Link href="/" className="flex items-center">
                <div className="relative h-20 w-40">
                  {footerLogo ? (
                    <img
                      src={footerLogo}
                      alt={brand.name || "Logo"}
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
            <p className="text-gray-400 mb-6 max-w-md">
              {fSettings.description ||
                `${brand.shortName} is a UK based technical and safety certification platform, committed to advancing workplace safety and technical competence across industries. Registered in England and Wales, ${brand.shortName} operates in alignment with international standards, delivering globally recognized qualifications that support compliance, risk reduction, and professional credibility.`}
            </p>
          </div>

          {/* Footer Links */}
          {footerColumns.map((column, index) => (
            <motion.div
              key={column.title || index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="text-lg font-bold mb-4 text-white">{column.title}</h3>
              <ul className="space-y-3">
                {(column.links || []).map((link, li) => (
                  <li key={link.name || li}>
                    <Link
                      href={link.href || "#"}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}

          {/* Guide Section */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h3 className="text-lg font-bold mb-4 text-white">Guide</h3>
            <p className="text-gray-400 text-sm mb-4">
              Download our comprehensive guide to learn more about our
              qualifications and safety standards.
            </p>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed text-sm font-medium shadow-lg shadow-blue-500/20"
            >
              {isDownloading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Downloading...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download Guide
                </>
              )}
            </button>
          </motion.div> */}
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-t border-gray-800 mb-8">
          {/* <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-3 mb-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-bold">Contact Us</h4>
                <p className="text-gray-400">+447883382815</p>
              </div>
            </div>
          </div> */}

          {fSettings.showEmail !== false && footerEmail && (
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-3 mb-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-bold">Email Us</h4>
                <p className="text-gray-400">{footerEmail}</p>
              </div>
            </div>
          </div>
          )}

          {fSettings.showAddress !== false && (
          <div className="text-center md:text-right">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-3 md:flex-row-reverse">
              <div className="min-w-10 min-h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-bold">Visit Us</h4>
                <p className="text-gray-400">
                  {contact.address || "Address pending"}
                </p>
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} {fSettings.copyright || webData.ui.copyright}
            </p>
            <div className="flex space-x-6">
              {bottomLinks.map((link, i) => (
                <Link
                  key={link.name || i}
                  href={link.href || "#"}
                  className={`text-gray-400 hover:text-white transition-colors ${
                    i === bottomLinks.length - 1 ? "md:mr-15" : ""
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
