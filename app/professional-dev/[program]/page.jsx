// app/professional-dev/[program]/page.jsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import {
  FaArrowLeft,
  FaDownload,
  FaClock,
  FaCalendarAlt,
  FaUserTie,
  FaCertificate,
  FaBookOpen,
  FaCheckCircle,
  FaPlayCircle,
  FaStar,
  FaShieldAlt,
  FaChalkboardTeacher,
  FaRocket,
  FaGraduationCap,
  FaChartLine,
  FaLaptopHouse,
  FaUsers,
  FaTools,
} from "react-icons/fa";
import { professionalDevCategories } from "@/app/data/professional-dev";
import { webData } from "@/constants";

// Icon mapping
const categoryIcons = {
  cpd: FaGraduationCap,
  "professional-standards": FaChartLine,
  "flexible-learning": FaLaptopHouse,
  "networking-opportunities": FaUsers,
  "skill-enhancement": FaTools,
};

// Gradient colors
const gradientMap = {
  cpd: "from-green-500 to-emerald-600",
  "professional-standards": "from-blue-500 to-cyan-600",
  "flexible-learning": "from-purple-500 to-violet-600",
  "networking-opportunities": "from-orange-500 to-amber-600",
  "skill-enhancement": "from-indigo-500 to-blue-600",
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};

const fadeInUp = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const scaleIn = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export default function ProgramPage() {
  const params = useParams();
  const router = useRouter();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDownloadSuccess, setShowDownloadSuccess] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  // Get params and program data
  useEffect(() => {
    if (params?.program) {
      const foundProgram = professionalDevCategories.find(
        (cat) => cat.id === params.program,
      );
      setProgram(foundProgram);
      setLoading(false);

      // Add to view history
      const viewHistory = JSON.parse(
        localStorage.getItem("programViews") || "[]",
      );
      if (!viewHistory.includes(params.program)) {
        viewHistory.push(params.program);
        localStorage.setItem("programViews", JSON.stringify(viewHistory));
      }
    }
  }, [params]);

  // Handle scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle enrollment - redirect to contact page
  const handleEnrollNow = () => {
    router.push(
      `/contact-us?subject=Enrollment for ${program?.title}&program=${program?.id}`,
    );
  };

  // Handle consultation - redirect to contact page
  const handleScheduleConsultation = () => {
    router.push(
      `/contact-us?subject=Consultation for ${program?.title}&type=consultation`,
    );
  };

  const handleDownloadPDF = async () => {
    try {
      /* ---------------- Loading Overlay ---------------- */
      const overlay = document.createElement("div");
      overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      backdrop-filter: blur(8px);
    `;

      overlay.innerHTML = `
      <div style="
        background: linear-gradient(145deg, #111827, #1f2937);
        color: white;
        padding: 50px 40px;
        border-radius: 24px;
        width: 90%;
        max-width: 420px;
        text-align: center;
        font-family: 'Inter', system-ui, sans-serif;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
      ">
        <div style="
          width: 80px;
          height: 80px;
          border: 4px solid rgba(16, 185, 129, 0.2);
          border-top-color: #10b981;
          border-right-color: #10b981;
          border-radius: 50%;
          margin: 0 auto 28px;
          animation: spin 1.2s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;
          position: relative;
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 40px;
            height: 40px;
            border: 3px solid rgba(16, 185, 129, 0.1);
            border-radius: 50%;
          "></div>
        </div>
        <h3 style="
          margin: 0 0 12px;
          font-size: 26px;
          font-weight: 700;
          background: linear-gradient(135deg, #10b981, #059669);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        ">Generating PDF Brochure</h3>
        <p style="
          margin: 0;
          color: #9ca3af;
          font-size: 15px;
          line-height: 1.6;
        ">
          Preparing ${program.title} details across multiple pages...
        </p>
        <div style="
          margin-top: 24px;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        ">
          <div style="
            width: 60%;
            height: 100%;
            background: linear-gradient(90deg, #10b981, #059669);
            border-radius: 2px;
            animation: progress 2s ease-in-out infinite;
          "></div>
        </div>
      </div>
      <style>
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes progress { 0%, 100% { transform: translateX(-100%); } 50% { transform: translateX(100%); } }
      </style>
    `;
      document.body.appendChild(overlay);

      /* ---------------- Imports ---------------- */
      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      /* ---------------- PDF Container ---------------- */
      const pdfContent = document.createElement("div");
      // Using width 794px (A4 width at 96 DPI) and CSS Reset for correct padding
      pdfContent.style.cssText = `
      position: absolute;
      left: -9999px;
      width: 794px; 
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1f2937;
      line-height: 1.5;
      overflow: visible;
    `;

      /* ---------------- Enhanced PDF Content with Fixed Padding ---------------- */
      pdfContent.innerHTML = `
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { -webkit-font-smoothing: antialiased; }
      </style>

      <!-- Header Section -->
      <section style="
        padding: 60px;
        border-bottom-right-radius: 80px;
        background: linear-gradient(135deg, #059669, #047857, #065f46);
        color: white;
        position: relative;
        overflow: hidden;
      ">
        <div style="
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 70%);
          pointer-events: none;
        "></div>
        
        <div style="position: relative; z-index: 2;">
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(10px);
            padding: 10px 24px;
            border-radius: 50px;
            margin-bottom: 24px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            font-size: 14px;
            font-weight: 600;
          ">
            <span style="width: 8px; height: 8px; background: #10b981; border-radius: 50%;"></span>
            Professional Development Program
          </div>
          
          <h1 style="
            margin: 0 0 16px;
            font-size: 46px;
            font-weight: 800;
            line-height: 1.1;
            text-shadow: 0 4px 15px rgba(0,0,0,0.2);
          ">
            ${program.title}
          </h1>
          <p style="
            margin: 0;
            font-size: 20px;
            opacity: 0.95;
            font-weight: 400;
            color: rgba(255, 255, 255, 0.9);
            max-width: 90%;
          ">
            ${program.subtitle || "Comprehensive Career Advancement Program"}
          </p>
        </div>
      </section>

      <!-- Program Stats -->
      <section style="padding: 40px 60px;">
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
          ${[
            {
              label: "Total Courses",
              val: program.programs.length,
              color: "#10b981",
              bg: "#d1fae5",
            },
            {
              label: "Duration",
              val: `${program.programs.length * 2} Weeks`,
              color: "#2563eb",
              bg: "#dbeafe",
            },
            {
              label: "CPD Credits",
              val: "40+",
              color: "#7c3aed",
              bg: "#ede9fe",
            },
            { label: "Format", val: "Hybrid", color: "#d97706", bg: "#fef3c7" },
          ]
            .map(
              (stat) => `
            <div style="
              padding: 24px;
              background: white;
              border-radius: 16px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
              border: 1px solid #f3f4f6;
              text-align: center;
            ">
              <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 700; margin-bottom: 8px;">
                ${stat.label}
              </div>
              <div style="
                font-size: 32px;
                font-weight: 800;
                color: ${stat.color};
              ">
                ${stat.val}
              </div>
            </div>
          `,
            )
            .join("")}
        </div>
      </section>

      <!-- Program Overview -->
      <section style="
        padding: 40px 60px;
      ">
        <div style="
          background: white;
          padding: 40px;
          border-radius: 24px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
          border-left: 6px solid #059669;
        ">
          <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
             <div style="width: 40px; height: 40px; background: #ecfdf5; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px;">📘</div>
             <h2 style="font-size: 24px; font-weight: 800; color: #111827;">Program Overview</h2>
          </div>
          <p style="
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 24px;
            line-height: 1.7;
          ">
            ${program.description}
          </p>
          <div style="
            background: #f0fdf4;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #bbf7d0;
            color: #065f46;
            font-size: 14px;
          ">
            <strong>✓ Key Benefit:</strong> Expert-led certification with industry-recognized certification designed to accelerate your career in safety and technical management.
          </div>
        </div>
      </section>

      <!-- Course Modules -->
      <section style="
        padding: 20px 60px 60px 60px;
      ">
        <div style="
          background: white;
          padding: 40px;
          border-radius: 24px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
        ">
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f3f4f6;
          ">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="width: 48px; height: 48px; background: #3b82f6; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px;">📚</div>
              <div>
                <h2 style="font-size: 24px; font-weight: 800; color: #111827;">Course Modules</h2>
                <p style="color: #6b7280; font-size: 14px;">Curriculum Structure</p>
              </div>
            </div>
            <div style="background: #eff6ff; color: #2563eb; padding: 8px 16px; border-radius: 50px; font-weight: 700; font-size: 14px;">
              ${program.programs.length} Modules
            </div>
          </div>

          <div style="display: grid; gap: 16px;">
            ${program.programs
              .map(
                (course, i) => `
              <div style="
                padding: 24px;
                background: ${i % 2 === 0 ? "#f9fafb" : "#ffffff"};
                border-radius: 16px;
                border: 1px solid #e5e7eb;
                display: flex;
                align-items: center;
                gap: 20px;
                break-inside: avoid;
              ">
                <div style="
                  width: 40px;
                  height: 40px;
                  background: #2563eb;
                  color: white;
                  border-radius: 10px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: 700;
                  flex-shrink: 0;
                ">
                  ${i + 1}
                </div>
                
                <div style="flex: 1;">
                  <strong style="display: block; font-size: 18px; color: #1f2937; margin-bottom: 6px;">
                    ${course}
                  </strong>
                  <div style="display: flex; gap: 16px; font-size: 12px; color: #6b7280;">
                    <span>⏱ 2 Weeks</span>
                    <span>📄 Certificate</span>
                    <span>🎓 5 CPD Credits</span>
                  </div>
                </div>

                <div style="
                  padding: 6px 12px;
                  background: #ecfdf5;
                  color: #059669;
                  border-radius: 20px;
                  font-size: 12px;
                  font-weight: 600;
                ">
                  Included
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section style="padding: 0 60px 60px 60px;">
        <h2 style="font-size: 24px; font-weight: 800; color: #111827; margin-bottom: 24px;">Why Choose This Program?</h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;">
          ${program.features
            .map(
              (f, i) => `
            <div style="
              padding: 24px;
              background: white;
              border-radius: 16px;
              border: 1px solid #e5e7eb;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
              display: flex;
              gap: 16px;
              break-inside: avoid;
            ">
              <div style="
                width: 40px; height: 40px; 
                background: ${i % 3 === 0 ? "#d1fae5" : i % 3 === 1 ? "#dbeafe" : "#ede9fe"};
                color: ${i % 3 === 0 ? "#059669" : i % 3 === 1 ? "#2563eb" : "#7c3aed"};
                border-radius: 10px; 
                display: flex; align-items: center; justify-content: center;
                font-size: 20px; flex-shrink: 0;
              ">
                ${i === 0 ? "🎯" : i === 1 ? "💼" : "📈"}
              </div>
              <div>
                <strong style="display: block; font-size: 16px; color: #1f2937; margin-bottom: 6px;">
                  ${f.title}
                </strong>
                <p style="font-size: 13px; color: #6b7280; line-height: 1.5;">
                  ${f.description}
                </p>
              </div>
            </div>
          `,
            )
            .join("")}
        </div>
      </section>

      <!-- Footer -->
      <section style="
        padding: 60px;
        background: #1f2937;
        color: white;
        text-align: center;
        margin-top: 40px;
      ">
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 28px; font-weight: 800; margin-bottom: 10px; color: white;">${webData.brand.name} Professional Development</h3>
          <p style="color: #9ca3af; max-width: 600px; margin: 0 auto;">
            Empowering safety professionals with cutting-edge knowledge and practical skills.
          </p>
        </div>
        <div style="
          background: rgba(255,255,255,0.1);
          padding: 16px;
          border-radius: 12px;
          display: inline-block;
          margin-bottom: 20px;
        ">
          <div style="font-weight: 600;">📧 ${webData.contact.infoEmail || webData.contact.supportEmail}</div>
        </div>
        <div style="font-size: 12px; color: #4b5563; border-top: 1px solid #374151; padding-top: 20px;">
          © ${new Date().getFullYear()} ${webData.brand.name}. Document ID: ${webData.documents.certificatePrefix}-PRO-${program.id.toUpperCase()}-${new Date().getFullYear()}
        </div>
      </section>
    `;

      document.body.appendChild(pdfContent);

      /* ---------------- Rendering & Pagination Logic ---------------- */
      // Higher scale (3) for better text readability
      const canvas = await html2canvas(pdfContent, {
        scale: 3,
        backgroundColor: "#ffffff", // ensure white bg
        useCORS: true,
        logging: false,
        windowWidth: 794,
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm (slightly less than 297 to avoid cutting edges)

      // Calculate ratio
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(
        canvas.toDataURL("image/png", 1.0),
        "PNG",
        0,
        position,
        imgWidth,
        imgHeight,
      );
      heightLeft -= pageHeight;

      // Loop to add remaining pages
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(
          canvas.toDataURL("image/png", 1.0),
          "PNG",
          0,
          position,
          imgWidth,
          imgHeight,
        );
        heightLeft -= pageHeight;
      }

      // Clean up DOM
      document.body.removeChild(pdfContent);
      document.body.removeChild(overlay);

      // Feedback
      if (setShowDownloadSuccess) setShowDownloadSuccess(true);
      setTimeout(
        () => setShowDownloadSuccess && setShowDownloadSuccess(false),
        3000,
      );

      pdf.save(`${webData.brand.name}_${program.title.replace(/\W+/g, "_")}_Brochure.pdf`);
    } catch (err) {
      console.error("PDF Error:", err);
      alert("Failed to generate PDF. Please try again.");
      const overlay = document.querySelector(
        'div[style*="position: fixed; inset: 0"]',
      );
      if (overlay) overlay.remove();
    }
  };

  // Loading state - FIXED: Centered properly
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-50 to-emerald-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center flex flex-col items-center justify-center"
        >
          <div className="relative">
            <div className="w-20 h-20 border-4 border-green-200 rounded-full"></div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 left-0 w-20 h-20 border-4 border-green-600 rounded-full border-t-transparent"
            ></motion.div>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-green-700 font-semibold text-lg"
          >
            Loading Program Details...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="text-6xl mb-4">📄</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Program Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The requested program could not be found. Please check the URL or
            return to the programs page.
          </p>
          <Link
            href="/professional-dev"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold text-lg group"
          >
            <FaArrowLeft className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" />
            Back to Programs
          </Link>
        </motion.div>
      </div>
    );
  }

  const IconComponent = categoryIcons[program.id] || FaGraduationCap;
  const gradient = gradientMap[program.id] || "from-green-500 to-emerald-600";

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white">
      {/* Download Success Modal */}
      <AnimatePresence>
        {showDownloadSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed top-4 right-4 z-5000"
          >
            <div className="bg-linear-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl">
              <div className="flex items-center gap-3">
                <FaCheckCircle className="w-6 h-6" />
                <div>
                  <p className="font-semibold">PDF Downloaded Successfully!</p>
                  <p className="text-sm opacity-90">
                    Check your downloads folder
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section with FIXED Padding */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden bg-linear-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: Math.random() * 100 + "vw",
                y: Math.random() * 100 + "vh",
                opacity: 0,
              }}
              animate={{
                x: [null, (Math.random() - 0.5) * 100 + "vw"],
                y: [null, (Math.random() - 0.5) * 100 + "vh"],
                opacity: [0, 0.4, 0],
              }}
              transition={{
                duration: 20 + Math.random() * 10,
                repeat: Infinity,
                repeatType: "reverse",
                delay: Math.random() * 5,
              }}
              className={`absolute w-${Math.floor(Math.random() * 3) + 1} h-${
                Math.floor(Math.random() * 3) + 1
              } rounded-full ${
                i % 3 === 0
                  ? "bg-green-500"
                  : i % 3 === 1
                    ? "bg-blue-500"
                    : "bg-purple-500"
              } blur-xl opacity-10`}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-7xl mx-auto"
          >
            {/* Navigation */}
            <motion.div variants={itemVariants} className="mb-8">
              <Link
                href="/professional-dev"
                className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors duration-300 group"
              >
                <FaArrowLeft className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" />
                <span>Back to All Programs</span>
              </Link>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left Content */}
              <div className="space-y-6">
                <motion.div variants={itemVariants}>
                  <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full mb-6 border border-white/20">
                    <div
                      className={`p-2 rounded-lg bg-linear-to-r ${gradient}`}
                    >
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white font-semibold">
                      Professional Development Program
                    </span>
                  </div>
                </motion.div>

                <motion.h1
                  variants={itemVariants}
                  className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-white"
                >
                  {program.title}
                  <span className="block text-2xl sm:text-3xl lg:text-4xl text-green-300 mt-3 lg:mt-4">
                    {program.subtitle || "Career Advancement Program"}
                  </span>
                </motion.h1>

                <motion.p
                  variants={itemVariants}
                  className="text-lg sm:text-xl text-white/90 leading-relaxed"
                >
                  {program.description}
                </motion.p>

                {/* Stats */}
                <motion.div
                  variants={containerVariants}
                  className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-4"
                >
                  {[
                    {
                      value: `${program.programs.length}`,
                      label: "Courses",
                      icon: <FaBookOpen className="w-4 h-4" />,
                    },
                    {
                      value: `${program.programs.length * 2} Weeks`,
                      label: "Duration",
                      icon: <FaClock className="w-4 h-4" />,
                    },
                    {
                      value: "Industry",
                      label: "Recognition",
                      icon: <FaCertificate className="w-4 h-4" />,
                    },
                    {
                      value: "Expert",
                      label: "Instructors",
                      icon: <FaChalkboardTeacher className="w-4 h-4" />,
                    },
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20"
                    >
                      <div className="flex items-center gap-2 mb-1 sm:mb-2">
                        <div className="text-green-300">{stat.icon}</div>
                        <div className="text-lg sm:text-xl font-bold text-white">
                          {stat.value}
                        </div>
                      </div>
                      <div className="text-white/80 text-xs sm:text-sm">
                        {stat.label}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  variants={containerVariants}
                  className="flex flex-wrap gap-3 sm:gap-4 pt-6"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleEnrollNow}
                    className="group bg-linear-to-r from-green-500 to-emerald-500 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 sm:gap-3 flex-1 sm:flex-none min-w-35 justify-center"
                  >
                    <FaRocket className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform" />
                    <span className="text-sm sm:text-base">Enroll Now</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownloadPDF}
                    className="group bg-linear-to-r from-gray-800 to-gray-900 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl hover:from-gray-900 hover:to-black transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 sm:gap-3 flex-1 sm:flex-none min-w-35 justify-center border border-gray-700"
                  >
                    <FaDownload className="w-4 h-4 sm:w-5 sm:h-5 group-hover:animate-bounce" />
                    <span className="text-sm sm:text-base">
                      Download Brochure
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleScheduleConsultation}
                    className="group bg-white/10 backdrop-blur-sm text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/20 flex items-center gap-2 sm:gap-3 flex-1 sm:flex-none min-w-35 justify-center"
                  >
                    <FaCalendarAlt className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-base">
                      Schedule Consultation
                    </span>
                  </motion.button>
                </motion.div>
              </div>

              {/* Right Visual */}
              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="relative mt-8 lg:mt-0"
              >
                <div className="relative bg-linear-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-white/10 overflow-hidden">
                  {/* Floating Elements */}
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: 0 }}
                      animate={{ y: [0, -20, 0] }}
                      transition={{
                        duration: 3 + i,
                        repeat: Infinity,
                        delay: i * 0.5,
                      }}
                      className={`absolute w-12 h-12 sm:w-16 sm:h-16 rounded-2xl ${
                        i % 2 === 0
                          ? "bg-linear-to-br from-green-400/30 to-emerald-400/30"
                          : "bg-linear-to-br from-blue-400/30 to-cyan-400/30"
                      }`}
                      style={{
                        top: `${20 + i * 15}%`,
                        left: `${i * 20}%`,
                        transform: `rotate(${i * 45}deg)`,
                      }}
                    />
                  ))}

                  <div className="relative z-10">
                    <div className="text-center mb-6 sm:mb-8">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.7, type: "spring" }}
                        className="inline-flex p-3 sm:p-4 rounded-2xl bg-linear-to-r from-white/10 to-transparent mb-3 sm:mb-4"
                      >
                        <FaStar className="w-8 h-8 sm:w-12 sm:h-12 text-green-300" />
                      </motion.div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">
                        Program Highlights
                      </h3>
                      <p className="text-white/80 text-sm sm:text-base">
                        Everything you need for professional growth
                      </p>
                    </div>

                    {/* Highlights */}
                    <motion.div
                      variants={containerVariants}
                      className="space-y-3 sm:space-y-4"
                    >
                      {program.features.map((feature, index) => (
                        <motion.div
                          key={index}
                          variants={itemVariants}
                          whileHover={{ x: 10 }}
                          className="flex items-center gap-3 bg-white/5 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-white/10"
                        >
                          <div className="text-xl sm:text-2xl">
                            {feature.icon}
                          </div>
                          <div>
                            <div className="text-white font-semibold text-sm sm:text-base">
                              {feature.title}
                            </div>
                            <div className="text-white/70 text-xs sm:text-sm">
                              {feature.description}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center text-green-200"
          >
            <span className="text-xs sm:text-sm mb-1 sm:mb-2">
              Scroll to explore
            </span>
            <div className="w-5 h-8 sm:w-6 sm:h-10 border-2 border-green-300 rounded-full flex justify-center">
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1 h-2 sm:h-3 bg-green-400 rounded-full mt-2"
              />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Program Details Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Overview Card */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 mb-6 sm:mb-8 border border-gray-100"
              >
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-3">
                  <div
                    className={`p-2 sm:p-3 rounded-xl bg-linear-to-r ${gradient}`}
                  >
                    <FaBookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  Program Overview
                </h2>
                <div className="prose prose-lg max-w-none text-gray-600">
                  <p className="mb-4 sm:mb-6 text-base sm:text-lg leading-relaxed">
                    {program.description}
                  </p>
                  <p className="text-base sm:text-lg leading-relaxed">
                    This comprehensive professional development program by
                    {` ${webData.brand.name}`} is designed to provide the latest industry
                    knowledge, practical skills, and professional certification
                    for safety professionals. Our expert instructors with years
                    of industry experience will guide you through the most
                    current professional standards and best practices.
                  </p>
                </div>
              </motion.div>

              {/* Modules Section */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 mb-6 sm:mb-8 border border-gray-100"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
                      Course Modules
                    </h2>
                    <p className="text-gray-600 text-sm sm:text-base">
                      Comprehensive curriculum designed for professional growth
                    </p>
                  </div>
                  <div className="bg-linear-to-r from-green-100 to-emerald-100 text-green-700 px-3 sm:px-4 py-1 sm:py-2 rounded-full font-semibold text-sm sm:text-base">
                    {program.programs.length} Modules
                  </div>
                </div>

                <motion.div
                  variants={containerVariants}
                  className="space-y-3 sm:space-y-4"
                >
                  {program.programs.map((module, index) => (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      whileHover={{ x: 5 }}
                      onMouseEnter={() => setHoveredCard(index)}
                      onMouseLeave={() => setHoveredCard(null)}
                      className="group"
                    >
                      <div
                        className={`flex items-center p-4 sm:p-6 rounded-2xl transition-all duration-300 ${
                          hoveredCard === index
                            ? "bg-linear-to-r from-green-50 to-emerald-50 border border-green-200 shadow-lg"
                            : "bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <div
                          className={`shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mr-3 sm:mr-4 ${
                            hoveredCard === index
                              ? "bg-linear-to-r from-green-600 to-emerald-600"
                              : "bg-linear-to-r from-gray-200 to-gray-300"
                          } transition-all duration-300`}
                        >
                          <span
                            className={`font-bold text-base sm:text-lg ${
                              hoveredCard === index
                                ? "text-white"
                                : "text-gray-600"
                            }`}
                          >
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1">
                            {module}
                          </h3>
                          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <FaClock className="w-3 h-3" /> 2 Weeks
                            </span>
                            <span className="flex items-center gap-1">
                              <FaPlayCircle className="w-3 h-3" /> 8 Sessions
                            </span>
                            <span className="flex items-center gap-1">
                              <FaStar className="w-3 h-3 text-yellow-500" />{" "}
                              Certificate
                            </span>
                          </div>
                        </div>
                        <motion.div
                          animate={{
                            x: hoveredCard === index ? 5 : 0,
                            opacity: hoveredCard === index ? 1 : 0.5,
                          }}
                          className="text-green-600"
                        >
                          <FaArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 transform rotate-180" />
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 sm:top-8 lg:top-24 space-y-6 sm:space-y-8">
                {/* Program Details Card */}
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={scaleIn}
                  className="bg-white rounded-3xl shadow-2xl p-4 sm:p-6 border border-gray-100"
                >
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
                    <FaShieldAlt className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    Program Details
                  </h3>

                  <div className="space-y-3 sm:space-y-4">
                    {[
                      {
                        icon: <FaClock className="w-3 h-3 sm:w-4 sm:h-4" />,
                        title: "Duration",
                        value: "Self-Paced Learning",
                        color: "from-blue-500 to-cyan-500",
                      },
                      {
                        icon: (
                          <FaCalendarAlt className="w-3 h-3 sm:w-4 sm:h-4" />
                        ),
                        title: "Format",
                        value: "Online & In-person",
                        color: "from-purple-500 to-violet-500",
                      },
                      {
                        icon: (
                          <FaCertificate className="w-3 h-3 sm:w-4 sm:h-4" />
                        ),
                        title: "Certification",
                        value: "Professional Certificate",
                        color: "from-green-500 to-emerald-500",
                      },
                      {
                        icon: <FaUserTie className="w-3 h-3 sm:w-4 sm:h-4" />,
                        title: "Support",
                        value: "24/7 Online Support",
                        color: "from-orange-500 to-amber-500",
                      },
                    ].map((detail, index) => (
                      <motion.div
                        key={index}
                        initial={{ x: -20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center p-3 sm:p-4 rounded-xl bg-linear-to-r from-gray-50 to-gray-100 hover:shadow-md transition-shadow"
                      >
                        <div
                          className={`p-2 sm:p-3 rounded-lg bg-linear-to-r ${detail.color} mr-3 sm:mr-4`}
                        >
                          <div className="text-white">{detail.icon}</div>
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm text-gray-500">
                            {detail.title}
                          </div>
                          <div className="font-semibold text-gray-800 text-sm sm:text-base">
                            {detail.value}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* CPD Credits Card */}
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={scaleIn}
                  className="bg-linear-to-br from-green-600 to-emerald-600 text-white rounded-3xl shadow-2xl p-4 sm:p-6"
                >
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="inline-flex p-2 sm:p-3 rounded-xl bg-white/20 backdrop-blur-sm mb-3 sm:mb-4">
                      <FaCertificate className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">
                      CPD Credits
                    </h3>
                    <p className="opacity-90 text-sm sm:text-base">
                      Earn CPD credits for professional certification renewal
                    </p>
                  </div>

                  <div className="bg-white/20 backdrop-blur-sm p-3 sm:p-4 rounded-xl text-center">
                    <div className="text-2xl sm:text-3xl font-bold mb-1">
                      40+
                    </div>
                    <div className="text-sm opacity-90">CPD Hours</div>
                    <div className="text-xs opacity-80 mt-1 sm:mt-2">
                      Available upon completion
                    </div>
                  </div>
                </motion.div>

                {/* Enrollment Card */}
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={scaleIn}
                  className="bg-white rounded-3xl shadow-2xl p-4 sm:p-6 border border-gray-100"
                >
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
                    Start Your Journey
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">
                    Take the first step towards professional excellence
                  </p>

                  <div className="space-y-2 sm:space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleEnrollNow}
                      className="w-full bg-linear-to-r from-green-600 to-emerald-600 text-white font-bold py-2 sm:py-3 px-3 sm:px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base"
                    >
                      Enroll Now
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDownloadPDF}
                      className="w-full bg-linear-to-r from-gray-800 to-gray-900 text-white font-bold py-2 sm:py-3 px-3 sm:px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-700 text-sm sm:text-base"
                    >
                      <div className="flex items-center justify-center gap-1 sm:gap-2">
                        <FaDownload className="w-3 h-3 sm:w-4 sm:h-4" />
                        Download Brochure
                      </div>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleScheduleConsultation}
                      className="w-full bg-linear-to-r from-blue-600 to-cyan-600 text-white font-bold py-2 sm:py-3 px-3 sm:px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base"
                    >
                      <div className="flex items-center justify-center gap-1 sm:gap-2">
                        <FaCalendarAlt className="w-3 h-3 sm:w-4 sm:h-4" />
                        Schedule Consultation
                      </div>
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Programs */}
      <section className="py-12 sm:py-16 lg:py-20 bg-linear-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-8 sm:mb-12 lg:mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-linear-to-r from-green-50 to-emerald-50 px-4 sm:px-6 py-2 sm:py-3 rounded-full mb-4 sm:mb-6">
              <FaRocket className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              <span className="text-green-700 font-semibold text-sm sm:text-base">
                More Programs
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-4 sm:mb-6">
              Explore More
              <span className="block bg-linear-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Professional Programs
              </span>
            </h2>

            <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
              Discover other professional development programs to advance your
              career
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          >
            {professionalDevCategories
              .filter((cat) => cat.id !== program.id)
              .slice(0, 3)
              .map((category, index) => {
                const CatIcon = categoryIcons[category.id] || FaGraduationCap;
                const catGradient =
                  gradientMap[category.id] || "from-green-500 to-emerald-600";

                return (
                  <motion.div
                    key={category.id}
                    variants={itemVariants}
                    whileHover={{ y: -5 }}
                    className="group"
                  >
                    <Link
                      href={`/professional-dev/${category.id}`}
                      className="block"
                    >
                      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden">
                        <div
                          className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-linear-to-r ${catGradient} flex items-center justify-center mb-4 sm:mb-6`}
                        >
                          <CatIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                        </div>

                        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3 group-hover:text-green-600 transition-colors">
                          {category.title}
                        </h3>

                        <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6 line-clamp-3">
                          {category.description}
                        </p>

                        <div className="flex items-center justify-between pt-4 sm:pt-6 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <FaBookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                            <span className="text-green-600 font-semibold text-sm sm:text-base">
                              {category.programs.length} Courses
                            </span>
                          </div>
                          <FaArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 transform rotate-180 group-hover:translate-x-1 sm:group-hover:translate-x-2 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-8 sm:mt-12 lg:mt-16"
          >
            <Link
              href="/professional-dev"
              className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold text-base sm:text-lg group"
            >
              <span>View All Professional Programs</span>
              <FaArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 transform rotate-180 group-hover:translate-x-1 sm:group-hover:translate-x-2 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 sm:py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10" />
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.3, scale: 1 }}
            transition={{
              delay: i * 0.2,
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className={`absolute w-${Math.floor(Math.random() * 4) + 2} h-${
              Math.floor(Math.random() * 4) + 2
            } rounded-full ${
              i % 3 === 0
                ? "bg-green-400"
                : i % 3 === 1
                  ? "bg-teal-400"
                  : "bg-emerald-400"
            } blur-xl`}
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-12 shadow-2xl border border-green-200">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring" }}
                className="inline-flex items-center gap-2 bg-linear-to-r from-green-100 to-emerald-100 px-4 sm:px-6 py-2 sm:py-3 rounded-full mb-6 sm:mb-8"
              >
                <FaRocket className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                <span className="text-green-700 font-semibold text-sm sm:text-base">
                  Ready to Transform Your Career?
                </span>
              </motion.div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-4 sm:mb-6">
                Start Your Professional
                <span className="block bg-linear-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Development Today
                </span>
              </h2>

              <p className="text-gray-600 text-base sm:text-lg mb-6 sm:mb-10 max-w-2xl mx-auto">
                Take the first step towards career excellence with our
                professional development program
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEnrollNow}
                  className="group bg-linear-to-r from-green-600 to-emerald-600 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base"
                >
                  <FaRocket className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform" />
                  <span>Enroll Now</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDownloadPDF}
                  className="group bg-linear-to-r from-gray-800 to-gray-900 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl hover:from-gray-900 hover:to-black transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base border border-gray-700"
                >
                  <FaDownload className="w-4 h-4 sm:w-5 sm:h-5 group-hover:animate-bounce" />
                  <span>Download Brochure</span>
                </motion.button>
              </div>

              <div className="mt-6 sm:mt-10 text-gray-500 text-xs sm:text-sm">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 flex-wrap">
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                    <span>Industry-Recognized Certification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                    <span>Flexible Learning Schedule</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                    <span>Career Support Services</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
