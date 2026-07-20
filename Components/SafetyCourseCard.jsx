// components/SafetyCourseCard.jsx (updated version)
"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const SafetyCourseCard = ({ course, index }) => {

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
      },
    },
    hover: {
      y: -10,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className={`rounded-2xl border-2 ${course.colorClass} overflow-hidden flex flex-col h-full transition-all duration-300`}
    >
      {/* Image Container - Using normal img tag instead of Next.js Image */}
      <div className="relative h-48 w-full overflow-hidden">
        <img
          src={course.image}
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent"></div>
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold rounded-full">
            {index < 3 ? "Most Popular" : "Professional"}
          </span>
        </div>
      </div>

      {/* Content Container */}
      <div className="p-6 flex flex-col grow">
        <div className="flex items-center mb-3">
          <div className={`w-3 h-3 rounded-full ${course.titleColor.replace('text', 'bg')} mr-2`}></div>
          <h3 className={`text-xl font-bold ${course.titleColor}`}>
            {course.title}
          </h3>
        </div>
        
        <p className="text-gray-600 mb-5 grow">
          {course.description}
        </p>
        
        <Link href={course.url} className="mt-auto">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`inline-block w-full text-center py-3 px-4 ${course.buttonColor} text-white font-medium rounded-lg shadow-md transition-colors cursor-pointer`}
          >
            {course.buttonText}
          </motion.div>
        </Link>
      </div>
    </motion.div>
  );
};

export default SafetyCourseCard;