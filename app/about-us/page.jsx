"use client";

import Image from "next/image";
import useHasMounted from "@/utils/useHasMounted";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FaShieldAlt,
  FaAward,
  FaUsers,
  FaLightbulb,
  FaStar,
  FaRocket,
  FaHandshake,
  FaHeart,
  FaChartLine,
  FaGlobe,
  FaGraduationCap,
  FaBriefcase,
  FaCheckCircle,
} from "react-icons/fa";
import { webData } from "@/constants";

// Animation variants
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

const fadeInLeft = {
  hidden: { x: -30, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const fadeInRight = {
  hidden: { x: 30, opacity: 0 },
  visible: {
    x: 0,
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

const staggerContainer = {
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
      duration: 0.5,
    },
  },
};

export default function AboutPage() {
  // Gates the motion elements until hydration; see useHasMounted for why this
  // replaces the useState + useEffect pair.
  const isClient = useHasMounted();

  // Pre-defined sizes for floating elements to avoid hydration mismatch
  const floatingElementSizes = [
    { width: "w-1", height: "h-2" },
    { width: "w-2", height: "h-1" },
    { width: "w-3", height: "h-2" },
    { width: "w-3", height: "h-1" },
    { width: "w-3", height: "h-2" },
    { width: "w-1", height: "h-2" },
    { width: "w-3", height: "h-3" },
    { width: "w-3", height: "h-2" },
    { width: "w-3", height: "h-2" },
    { width: "w-2", height: "h-2" },
    { width: "w-1", height: "h-3" },
    { width: "w-2", height: "h-2" },
    { width: "w-1", height: "h-2" },
    { width: "w-2", height: "h-3" },
    { width: "w-1", height: "h-2" },
  ];

  // Pre-defined positions for floating elements
  const floatingElementPositions = [
    { top: "14.64%", left: "17.10%" },
    { top: "43.23%", left: "55.47%" },
    { top: "56.22%", left: "10.28%" },
    { top: "56.78%", left: "34.76%" },
    { top: "52.00%", left: "1.15%" },
    { top: "37.98%", left: "8.08%" },
    { top: "25.71%", left: "49.32%" },
    { top: "29.75%", left: "34.86%" },
    { top: "88.17%", left: "91.63%" },
    { top: "49.62%", left: "8.26%" },
    { top: "89.22%", left: "82.20%" },
    { top: "94.30%", left: "64.22%" },
    { top: "4.02%", left: "43.75%" },
    { top: "85.75%", left: "5.33%" },
    { top: "26.32%", left: "48.57%" },
  ];

  // Drift/timing for the floating elements. Derived deterministically from
  // the element index rather than Math.random(): calling random() during
  // render is impure and makes the server and client markup disagree, which
  // is why the positions above are pre-defined too.
  const floatingElementMotion = floatingElementPositions.map((_, i) => {
    const noise = (seed) => {
      const v = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453;
      return v - Math.floor(v);
    };
    return {
      driftX: (noise(1) * 50 - 25).toFixed(2),
      driftY: (noise(2) * 50 - 25).toFixed(2),
      duration: 15 + noise(3) * 10,
      delay: noise(4) * 5,
    };
  });

  const statsSectionSizes = [
    { width: "w-2", height: "h-3" },
    { width: "w-2", height: "h-3" },
    { width: "w-4", height: "h-5" },
    { width: "w-3", height: "h-4" },
    { width: "w-5", height: "h-2" },
    { width: "w-2", height: "h-3" },
    { width: "w-3", height: "h-4" },
    { width: "w-2", height: "h-3" },
  ];

  const statsSectionPositions = [
    { top: "29.01%", left: "18.24%" },
    { top: "74.31%", left: "86.98%" },
    { top: "33.70%", left: "89.88%" },
    { top: "14.66%", left: "82.40%" },
    { top: "40.52%", left: "59.14%" },
    { top: "29.47%", left: "82.97%" },
    { top: "59.91%", left: "54.69%" },
    { top: "60.57%", left: "72.59%" },
  ];

  const ctaSectionSizes = [
    { width: "w-5", height: "h-5" },
    { width: "w-2", height: "h-5" },
    { width: "w-2", height: "h-2" },
    { width: "w-2", height: "h-5" },
    { width: "w-4", height: "h-5" },
    { width: "w-2", height: "h-2" },
    { width: "w-2", height: "h-3" },
    { width: "w-2", height: "h-3" },
    { width: "w-2", height: "h-2" },
    { width: "w-4", height: "h-5" },
  ];

  const ctaSectionPositions = [
    { top: "85.29%", left: "86.26%" },
    { top: "56.58%", left: "53.59%" },
    { top: "51.95%", left: "7.62%" },
    { top: "89.44%", left: "93.50%" },
    { top: "58.43%", left: "3.94%" },
    { top: "35.13%", left: "13.29%" },
    { top: "18.02%", left: "26.28%" },
    { top: "72.81%", left: "89.61%" },
    { top: "87.92%", left: "47.88%" },
    { top: "6.81%", left: "45.00%" },
  ];

  // Don't render motion elements during SSR
  if (!isClient) {
    return (
      <div className="min-h-screen bg-linear-to-b from-gray-50 to-white">
        {/* Loading state */}
        <div className="flex items-center justify-center min-h-screen flex-col gap-4">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-4 text-blue-700 font-semibold">
            Loading About Page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative min-h-[120vh] pb-10 flex items-center justify-center overflow-hidden bg-linear-to-br from-blue-900 via-blue-800 to-blue-900">
        {/* Animated Background Elements - Now static during SSR */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
          {floatingElementSizes.map((size, i) => (
            <motion.div
              key={i}
              initial={{
                x: floatingElementPositions[i].left,
                y: floatingElementPositions[i].top,
                opacity: 0,
              }}
              animate={{
                x: [
                  floatingElementPositions[i].left,
                  `calc(${floatingElementPositions[i].left} + ${floatingElementMotion[i].driftX}vw)`,
                  floatingElementPositions[i].left,
                ],
                y: [
                  floatingElementPositions[i].top,
                  `calc(${floatingElementPositions[i].top} + ${floatingElementMotion[i].driftY}vh)`,
                  floatingElementPositions[i].top,
                ],
                opacity: [0, 0.3, 0],
              }}
              transition={{
                duration: floatingElementMotion[i].duration,
                repeat: Infinity,
                repeatType: "reverse",
                delay: floatingElementMotion[i].delay,
              }}
              className={`absolute ${size.width} ${size.height} rounded-full ${
                i % 3 === 0
                  ? "bg-blue-500"
                  : i % 3 === 1
                    ? "bg-cyan-500"
                    : "bg-indigo-500"
              } blur-xl opacity-10`}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full mb-8 border border-white/20"
            >
              <FaShieldAlt className="w-5 h-5 text-blue-300" />
              <span className="text-white font-semibold">
                Setting the Benchmark in Technical & Safety Certification.
              </span>
            </motion.div>

            <motion.h1
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight text-white"
            >
              About {webData.brand.name}
              <span className="block text-3xl md:text-4xl text-blue-200 mt-4">
                Pioneering Safety and Technical Education
              </span>
            </motion.h1>

            <motion.p
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              Structured qualification frameworks designed to assess competence,
              uphold industry standards and strengthen global professional
              credibility.
            </motion.p>

            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-4 justify-center"
            >
              <Link
                href="/contact-us"
                className="group bg-linear-to-r from-blue-500 to-cyan-500 text-white font-bold py-4 px-8 rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-3"
              >
                <FaHandshake className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span>Get in Touch</span>
              </Link>

              <Link
                href="/qualification"
                className="group bg-white/10 backdrop-blur-sm text-white font-bold py-4 px-8 rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/20 flex items-center gap-3"
              >
                <FaGraduationCap className="w-5 h-5" />
                <span>Explore Programs</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center text-blue-200"
          >
            <span className="text-sm mb-2">Scroll to explore</span>
            <div className="w-6 h-10 border-2 border-blue-300 rounded-full flex justify-center">
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1 h-3 bg-blue-400 rounded-full mt-2"
              />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInLeft}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 bg-linear-to-r from-blue-50 to-cyan-50 px-6 py-3 rounded-full">
                <FaRocket className="w-5 h-5 text-blue-600" />
                <span className="text-blue-700 font-semibold">Our Mission</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold text-gray-800">
                Creating Safer And Technically
                <span className="block bg-linear-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Competent Workplaces
                </span>
              </h2>

              <div className="space-y-4">
                <p className="text-gray-600 text-lg leading-relaxed">
                  To advance workplace safety and technical excellence through
                  comprehensive, industry aligned certification frameworks that
                  validate professional competence and regulatory compliance.
                </p>
                <p className="text-gray-600 text-lg leading-relaxed">
                  We believe every worker deserves to operate in a secure,
                  standards driven environment and every organization should be
                  built on qualified technical expertise and accountable safety
                  practices.
                </p>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Committed to protecting lives and strengthening industries
                  through credible technical and occupational safety
                  certifications.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInRight}
              className="relative"
            >
              <div className="relative h-125 rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1622612023350-b15f063eabe6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8c2FmZXR5fGVufDB8fDB8fHww"
                  alt="Safety Certification Session"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />

                {/* Floating elements */}
                <motion.div
                  initial={{ y: 0 }}
                  animate={{ y: [-20, 0, -20] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute top-8 left-8 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20"
                >
                  <FaShieldAlt className="w-8 h-8 text-white" />
                </motion.div>

                <motion.div
                  initial={{ y: 0 }}
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                  className="absolute bottom-8 right-8 bg-linear-to-r from-blue-500 to-cyan-500 p-4 rounded-xl shadow-lg"
                >
                  <span className="text-white font-bold text-sm">
                    SAFETY FIRST
                  </span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-linear-to-b from-white to-blue-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="max-w-6xl mx-auto"
          >
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-linear-to-r from-blue-100 to-cyan-100 px-6 py-3 rounded-full mb-6">
                <FaChartLine className="w-5 h-5 text-blue-600" />
                <span className="text-blue-700 font-semibold">Our Journey</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
                From Vision to
                <span className="block bg-linear-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Action
                </span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-6"
              >
                <motion.p
                  variants={itemVariants}
                  className="text-xl text-gray-700 leading-relaxed"
                >
                  Founded by a dedicated team of safety professionals and
                  educators, {webData.brand.name} began with a transformative vision: to
                  revolutionize workplace safety through innovative and
                  effective certification solutions.
                </motion.p>

                <motion.p
                  variants={itemVariants}
                  className="text-gray-600 leading-relaxed"
                >
                  Our journey started with identifying a crucial industry
                  gap—the disconnect between regulatory requirements and
                  on-ground implementation. With decades of combined experience
                  in occupational safety, our founders set out to bridge this
                  divide.
                </motion.p>

                <motion.p
                  variants={itemVariants}
                  className="text-gray-600 leading-relaxed"
                >
                  Today, we stand as a trusted partner for organizations
                  nationwide, having successfully trained thousands of
                  professionals, collaborated with numerous industry leaders,
                  and developed specialized programs that set new benchmarks in
                  safety education.
                </motion.p>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={scaleIn}
                className="relative"
              >
                <div className="bg-linear-to-br from-blue-600 to-cyan-600 rounded-3xl p-8 shadow-2xl">
                  <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                    <div className="text-4xl mb-4">&quot;</div>
                    <p className="text-white text-lg italic mb-6">
                      Safety isn&apos;t just about compliance; it&apos;s about creating a
                      mindset where every individual becomes a guardian of their
                      own wellbeing and that of their colleagues.
                    </p>
                    <div className="flex items-start p-4">
                      <div>
                        <div className="text-blue-200 text-sm">CEO Message</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating elements */}
                <motion.div
                  initial={{ y: 0 }}
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -top-4 -left-4 bg-white p-3 rounded-xl shadow-lg"
                >
                  <FaAward className="w-6 h-6 text-yellow-500" />
                </motion.div>

                <motion.div
                  initial={{ y: 0 }}
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                  className="absolute -bottom-4 -right-4 bg-linear-to-r from-green-500 to-emerald-500 p-3 rounded-xl shadow-lg"
                >
                  <FaStar className="w-6 h-6 text-white" />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-linear-to-r from-blue-50 to-cyan-50 px-6 py-3 rounded-full mb-6">
              <FaHeart className="w-5 h-5 text-blue-600" />
              <span className="text-blue-700 font-semibold">
                Our Principles
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Core Values That
              <span className="block bg-linear-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Guide Our Journey
              </span>
            </h2>

            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              The principles that guide every aspect of our certification
              programs
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              {
                title: "Integrity",
                description:
                  "We operate with transparency, fairness, and independence, ensuring every qualification is awarded with credibility and trust.",
                icon: <FaHandshake className="w-6 h-6" />,
                color: "from-blue-500 to-indigo-500",
              },
              {
                title: "Quality Assurance",
                description:
                  "We maintain rigorous approval and monitoring processes to uphold consistent standards across all approved centres.",
                icon: <FaCheckCircle className="w-6 h-6" />,
                color: "from-emerald-500 to-teal-500",
              },
              {
                title: "Excellence",
                description:
                  "We are committed to developing qualifications that meet high industry and regulatory expectations.",
                icon: <FaStar className="w-6 h-6" />,
                color: "from-yellow-500 to-orange-500",
              },
              {
                title: "Compliance",
                description:
                  "We align our frameworks with UK regulatory standards to ensure reliability and professional recognition.",
                icon: <FaShieldAlt className="w-6 h-6" />,
                color: "from-blue-600 to-cyan-600",
              },
              {
                title: "Industry Relevance",
                description:
                  "We collaborate with sector specialists to ensure our qualifications remain practical, current, and aligned with workforce needs.",
                icon: <FaBriefcase className="w-6 h-6" />,
                color: "from-purple-500 to-violet-500",
              },
              {
                title: "Accountability",
                description:
                  "We take responsibility for maintaining the integrity of our qualifications and the reputation of our approved centres.",
                icon: <FaAward className="w-6 h-6" />,
                color: "from-red-500 to-rose-500",
              },
            ].map((value, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -10 }}
                className="group"
              >
                <div className="bg-linear-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-500 h-full flex flex-col">
                  <div
                    className={`inline-flex p-4 rounded-2xl bg-linear-to-r ${value.color} text-white mb-6 group-hover:scale-110 transition-transform duration-500 w-fit`}
                  >
                    {value.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed grow">
                    {value.description}
                  </p>
                  <div className="mt-6 pt-6 border-t border-gray-100"></div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-blue-900 via-blue-800 to-blue-900" />
        {ctaSectionSizes.map((size, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.2, scale: 1 }}
            transition={{
              delay: i * 0.2,
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className={`absolute ${size.width} ${size.height} rounded-full ${
              i % 3 === 0
                ? "bg-blue-400"
                : i % 3 === 1
                  ? "bg-cyan-400"
                  : "bg-indigo-400"
            } blur-xl`}
            style={{
              top: ctaSectionPositions[i].top,
              left: ctaSectionPositions[i].left,
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
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring" }}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full mb-8"
            >
              <FaShieldAlt className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">
                Ready to Make Your Workplace Safer?
              </span>
            </motion.div>

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Join
              <span className="text-blue-200"> Us</span>
            </h2>

            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
              Partner with {webData.brand.name} for comprehensive safety certification
              solutions that protect your people and grow your business
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/contact-us"
                className="group bg-linear-to-r from-blue-500 to-cyan-500 text-white font-bold py-4 px-8 rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
              >
                <FaHandshake className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span>Contact Us Today</span>
              </Link>

              <Link
                href="/qualification"
                className="group bg-white/10 backdrop-blur-sm text-white font-bold py-4 px-8 rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/20 flex items-center justify-center gap-3"
              >
                <FaBriefcase className="w-5 h-5" />
                <span>Explore Programs</span>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="mt-12 pt-8 border-t border-white/20"
            >
              <div className="flex flex-wrap items-center justify-center gap-6 text-white/80 text-sm">
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="w-4 h-4 text-green-400" />
                  <span>Certified Trainers</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="w-4 h-4 text-green-400" />
                  <span>Industry-Recognized Programs</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="w-4 h-4 text-green-400" />
                  <span>Flexible Certification Options</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
