// components/SafetyHomePage.jsx
"use client";

import { motion } from "framer-motion";
import SafetyCourseCard from "./SafetyCourseCard";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SafetyHomePage = () => {
  const router = useRouter();

  // Safety courses data array
  const safetyCourses = [
    {
      id: 1,
      title: "Risk Assessment",
      description:
        "The Level 2 Award in Risk Assessment Training is an advanced course that builds on foundational knowledge to provide comprehensive risk management skills for workplace safety.",
      image:
        "https://plus.unsplash.com/premium_photo-1663099526286-fcedc89d7ce8?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8UmlzayUyMEFzc2Vzc21lbnR8ZW58MHx8MHx8fDA%3D",
      buttonText: "Learn More",
      colorClass: "bg-blue-50 border-blue-100",
      titleColor: "text-blue-700",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
      url: "/qualification/risk-assessment",
    },
    {
      id: 3,
      title: "Fire Safety",
      description:
        "People suffer fatalities or severe injuries as a result of workplace fires every year. This course teaches prevention, evacuation procedures, and fire extinguisher use.",
      image:
        "https://images.unsplash.com/photo-1692085654401-8d61c49d5017?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8RmlyZSUyMFNhZmV0eXxlbnwwfHwwfHx8MA%3D%3D",
      buttonText: "Learn More",
      colorClass: "bg-blue-50 border-blue-100",
      titleColor: "text-blue-700",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
      url: "/qualification/fire-safety",
    },
    {
      id: 5,
      title: "Chemical Safety",
      description:
        "The Safqual Chemical Safety Course is a specialized training program for handling, storing, and disposing of hazardous chemicals safely.",
      image:
        "https://plus.unsplash.com/premium_photo-1661584130129-a9d0c14b22f5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8Q2hlbWljYWwlMjBTYWZldHl8ZW58MHx8MHx8fDA%3D",
      buttonText: "Learn More",
      colorClass: "bg-blue-50 border-blue-100",
      titleColor: "text-blue-700",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
      url: "/qualification/chemical-safety",
    },
    {
      id: 6,
      title: "Incident Investigation",
      description:
        "The Incident Investigation course is an indispensable program for learning systematic approaches to investigate workplace incidents and prevent recurrence.",
      image:
        "https://images.unsplash.com/photo-1766786289653-15e7245f8e47?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8SW5jaWRlbnQlMjBJbnZlc3RpZ2F0aW9ufGVufDB8fDB8fHww",
      buttonText: "Learn More",
      colorClass: "bg-blue-50 border-blue-100",
      titleColor: "text-blue-700",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
      url: "/qualification/security-management",
    },
    {
      id: 7,
      title: "Electrical Safety",
      description:
        "The Electrical Safety course is designed to provide participants with comprehensive knowledge of electrical hazards and safe work practices.",
      image:
        "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8RWxlY3RyaWNhbCUyMFNhZmV0eXxlbnwwfHwwfHx8MA%3D%3D",
      buttonText: "Learn More",
      colorClass: "bg-blue-50 border-blue-100",
      titleColor: "text-blue-700",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
      url: "/qualification/electrical-safety",
    },
    {
      id: 8,
      title: "Scaffolding Safety",
      description:
        "Scaffolding Safety course is a crucial component of any training program for construction workers to prevent falls and structural failures.",
      image:
        "https://plus.unsplash.com/premium_photo-1663099416724-133678233c0e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8U2NhZmZvbGRpbmclMjBTYWZldHl8ZW58MHx8MHx8fDA%3D",
      buttonText: "Learn More",
      colorClass: "bg-blue-50 border-blue-100",
      titleColor: "text-blue-700",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
      url: "/qualification/scaffolding-safety",
    },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Safety Training <span className="text-blue-600">Courses</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Comprehensive safety training programs designed to protect your
          workforce and ensure regulatory compliance.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/qualification">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            >
              Browse All Courses
            </motion.div>
          </Link>
          <Link href="/contact-us">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-white text-blue-600 font-medium rounded-lg border border-blue-600 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              Contact Us
            </motion.div>
          </Link>
        </div>
      </motion.div>

      {/* Courses Grid */}
      <div className="max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-3xl font-bold text-gray-900 mb-8 text-center"
        >
          Our Safety Training Programs
        </motion.h2>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {safetyCourses.map((course, index) => (
            <SafetyCourseCard key={course.id} course={course} index={index} />
          ))}
        </motion.div>
      </div>

      {/* Footer Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="mt-16 pt-8 border-t border-gray-200"
      >
      </motion.div>
    </div>
  );
};

export default SafetyHomePage;
