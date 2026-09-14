// Extracted from app/qualification/page.jsx; original layouts with typed CMS content.
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Image1 from "@/public/1.png";
import Image2 from "@/public/2.png";
import Image3 from "@/public/3.png";
import { webData } from "@/constants";
import Image4 from "@/public/4.png";
import Image5 from "@/public/5.png";
import Image6 from "@/public/6.png";
import Image7 from "@/public/7.png";
import Image8 from "@/public/8.png";
import Image9 from "@/public/9.png";
import Image10 from "@/public/10.png";
import Image11 from "@/public/11.png";
import Image12 from "@/public/12.png";
import Image13 from "@/public/13.png";
import defaults from "./qualification.defaults.json";
export default function PublicPage(cmsProps = {}) {
  const cms = {
    ...defaults,
    ...cmsProps
  };
  const qualifications = (Array.isArray(cms.qualifications_1) ? cms.qualifications_1 : []).map(entry => entry);
  const safetyImages = [{
    url: Image1,
    alt: "Image1"
  }, {
    url: Image2,
    alt: "Image2"
  }, {
    url: Image3,
    alt: "Image3"
  }, {
    url: Image4,
    alt: "Image4"
  }, {
    url: Image5,
    alt: "Image5"
  }, {
    url: Image6,
    alt: "Image6"
  }, {
    url: Image7,
    alt: "Image7"
  }, {
    url: Image8,
    alt: "Image8"
  }, {
    url: Image9,
    alt: "Image9"
  }, {
    url: Image10,
    alt: "Image10"
  }, {
    url: Image11,
    alt: "Image11"
  }, {
    url: Image12,
    alt: "Image12"
  }, {
    url: Image13,
    alt: "Image13"
  }];
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState(new Set());
  const handleImageError = index => {
    setImageErrors(prev => new Set(prev).add(index));
  };
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % safetyImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  return <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      {(cmsProps.section == null || cmsProps.section === 0) && <div className="max-w-7xl mx-auto">
        <motion.div initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.6
      }} className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">{cms.Heading_Our_Qualifications_2}</h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-500">{cms.Description_Discover_our_extensive_portfolio_of_safety_and_t_3}</p>
        </motion.div>

        {}
        <motion.div initial={{
        opacity: 0
      }} whileInView={{
        opacity: 1
      }} transition={{
        duration: 0.8
      }} viewport={{
        once: true
      }} className="mb-12">
          <div className="relative h-96 md:h-[500px] w-full rounded-2xl overflow-hidden shadow-xl">
            {}
            <motion.div key={currentIndex} initial={{
            opacity: 0,
            x: 100
          }} animate={{
            opacity: 1,
            x: 0
          }} exit={{
            opacity: 0,
            x: -100
          }} transition={{
            duration: 1
          }} className="absolute inset-0">
              <Image src={safetyImages[currentIndex].url} alt={safetyImages[currentIndex].alt} fill className="object-cover" priority />
              <div className="absolute inset-0 bg-linear-to-r from-blue-900/70 via-blue-900/40 to-transparent flex items-center">
                <div className="p-8 md:p-12 max-w-2xl">
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">{cms.Heading_Expert_Led_Safety___Technical_Programmes_4}</h3>
                  <p className="text-lg text-blue-100">{cms.Description_Industry_recognized_certifications_5}</p>
                </div>
              </div>
            </motion.div>

            {}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3 z-10">
              {safetyImages.map((_, index) => <button key={index} onClick={() => setCurrentIndex(index)} className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentIndex ? "bg-white scale-125" : "bg-white/50 hover:bg-white/80"}`} aria-label={`Go to slide ${index + 1}`} />)}
            </div>

            {}
            <div className="absolute top-6 right-6 bg-black/50 text-white px-3 py-1 rounded-full text-sm z-10">
              {currentIndex + 1}{cms.Text___6}{safetyImages.length}
            </div>
          </div>

          {}
          <div className="hidden lg:grid grid-cols-5 gap-4 mt-6">
            {safetyImages.slice(0, 5).map((image, index) => <div key={index} className={`relative h-32 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 ${index === currentIndex ? "ring-2 ring-blue-500 ring-offset-2" : "opacity-70 hover:opacity-100"}`} onClick={() => setCurrentIndex(index)}>
                {!imageErrors.has(index) ? <Image src={image.url} alt={image.alt} fill className="object-cover hover:scale-110 transition-transform duration-500" sizes="25vw" onError={() => handleImageError(index)} /> : <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm text-center px-2">
                      {image.alt}
                    </span>
                  </div>}
              </div>)}
          </div>
        </motion.div>

        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{
        once: true,
        margin: "-100px"
      }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {qualifications.map((qual, index) => <motion.div key={index} variants={itemVariants} whileHover={{
          scale: 1.02,
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        }} className="relative rounded-xl shadow-sm border border-gray-200 p-8 flex items-center justify-center text-center h-full min-h-[600px] overflow-hidden group">
              {}
              <div className="absolute inset-0">
                {!imageErrors.has(index) ? <Image src={qual.image} alt={qual.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" priority={index < 3} onError={() => handleImageError(index)} /> : <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold text-lg text-center px-4">
                      {qual.title}
                    </span>
                  </div>}
                {}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent group-hover:from-black/90 group-hover:via-black/50 group-hover:to-black/10 transition-all duration-300" />
              </div>

              {}
              <h3 className="relative z-10 text-lg font-bold text-white tracking-wide leading-relaxed drop-shadow-md uppercase px-4">
                {qual.title}
              </h3>
            </motion.div>)}
        </motion.div>

        <motion.div initial={{
        opacity: 0,
        y: 30
      }} whileInView={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.2,
        duration: 0.6
      }} viewport={{
        once: true
      }} className="text-center">
          <div className="bg-white rounded-2xl shadow-xl py-10 px-10 md:p-14 border border-gray-100 max-w-4xl mx-auto relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-50 rounded-full opacity-50 blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-50 rounded-full opacity-50 blur-3xl" />

            <h2 className="text-3xl font-bold text-gray-900 mb-6 relative z-10">{cms.Heading_Ready_to_elevate_your_Safety___Technical_Standar_7}</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto relative z-10">{cms.Description_Get_in_touch_with_us_to_learn_more_about_our_wor_8}</p>
            <Link href={cms.href__contact_us_9} className="relative z-10 inline-flex items-center justify-center p-4 border border-transparent text-lg font-semibold rounded-full text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">{cms.Text_Contact_Us_10}<ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </div>}
    </div>;
}
