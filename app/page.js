"use client";

import CmsPageContent from "@/Components/cms/CmsPageContent";
import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import bannar from "@/public/bannar.webp";
import bannarV2 from "@/public/bannerv2.webp";
import FAQ from "@/Components/FAQ";
import { motion } from "framer-motion";
import webData from "@/constants";

const HomePageInner = () => {
  const images = [
    // {
    //   id: 1,
    //   image:
    //     "https://plus.unsplash.com/premium_photo-1677529102407-0d075eb2cbb9?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8SGVhbHRoJTIwYW5kJTIwU2FmZXR5JTIwYXQlMjBXb3JrfGVufDB8fDB8fHww",
    //   text: "Health and Safety at Work",
    //   subtext:
    //     "A health and safety at work course equips participants with knowledge to create safer working environments",
    //   color: "from-green-700/30 to-emerald-900/30",
    //   textColor: "text-white",
    // },
    // {
    //   id: 3,
    //   image:
    //     "https://plus.unsplash.com/premium_photo-1661490061456-00879b843549?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8RmlyZSUyMFNhZmV0eSUyMFRyYWluaW5nfGVufDB8fDB8fHww",
    //   text: "Fire Safety Training",
    //   subtext:
    //     "People suffer fatalities or severe injuries as a result of workplace fires every year. Our training prevents these incidents",
    //   color: "from-orange-600/30 to-red-800/30",
    //   textColor: "text-white",
    // },
    // {
    //   id: 4,
    //   image:
    //     "https://plus.unsplash.com/premium_photo-1663054750793-00d34894aeb0?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8UmlzayUyMEFzc2Vzc21lbnQlMjBUcmFpbmluZ3xlbnwwfHwwfHx8MA%3D%3D",
    //   text: "Risk Assessment Training",
    //   subtext:
    //     "The Level 2 Award in Risk Assessment Training is an advanced course that builds professional competency in identifying workplace hazards",
    //   color: "from-blue-800/30 to-blue-900/30",
    //   textColor: "text-white",
    // },
    // {
    //   id: 5,
    //   image:
    //     "https://images.unsplash.com/photo-1598894163140-1233de455ff2?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fENoZW1pY2FsJTIwU2FmZXR5JTIwQ291cnNlfGVufDB8fDB8fHww",
    //   text: "Chemical Safety Course",
    //   subtext:
    //     "The Chemical Safety Course is specialized training for handling, storing, and managing hazardous chemicals",
    //   color: "from-purple-700/30 to-purple-900/30",
    //   textColor: "text-white",
    // },
    {
      id: 1,
      image:
        "https://plus.unsplash.com/premium_photo-1714138490052-65c64d8db2e0?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8U2V0dGluZyUyMENlcnRpZmljYXRpb24lMjBTdGFuZGFyZHN8ZW58MHx8MHx8fDA%3D",
      text: "Setting Certification Standards",
      subtext:
        "Developing and awarding safety and technical qualifications that uphold UK industry and regulatory expectations.",
      color: "from-blue-700/30 to-blue-900/30",
      textColor: "text-white",
    },
    {
      id: 2,
      image: bannar,
      text: "Recognised. Regulated. Respected.",
      subtext:
        "Independent qualification frameworks designed to ensure quality, compliance, and professional credibility.",
      color: "from-green-700/30 to-green-900/30",
      textColor: "text-white",
      backgroundPosition: "top center",
    },
    {
      id: 3,
      image:
        "https://plus.unsplash.com/premium_photo-1677529102407-0d075eb2cbb9?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8QXdhcmRpbmclMjBFeGNlbGxlbmNlJTIwaW4lMjBTYWZldHl8ZW58MHx8MHx8fDA%3D",
      text: "Awarding Excellence in Safety",
      subtext:
        "Robust quality assurance processes that safeguard competence across approved centres.",
      color: "from-amber-700/30 to-amber-900/30",
      textColor: "text-white",
    },
    {
      id: 4,
      image:
        "https://images.unsplash.com/photo-1698434401311-4d9ef9ac9c7f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8SW50ZWdyaXR5JTIwaW4lMjBRdWFsaWZpY2F0aW9uJTIwRnJhbWV3b3Jrc3xlbnwwfHwwfHx8MA%3D%3D",
      text: "Integrity in Qualification Frameworks",
      subtext:
        "Structured governance and transparent certification processes that maintain industry trust.",
      color: "from-red-700/30 to-red-900/30",
      textColor: "text-white",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const nextSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1,
    );
    setTimeout(() => setIsTransitioning(false), 500);
  }, [images.length, isTransitioning]);

  const prevSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1,
    );
    setTimeout(() => setIsTransitioning(false), 500);
  }, [images.length, isTransitioning]);

  // Auto slide functionality. Declared after nextSlide so the interval always
  // closes over the current callback rather than a stale hoisted binding.
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [nextSlide]);

  const goToSlide = (index) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevSlide, nextSlide]);

  return (
    <>
      <div className="relative w-full h-[90vh] overflow-hidden group">
        {/* Slides Container */}
        <div className="relative w-full h-full">
          {images.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentIndex ? "opacity-100" : "opacity-0"
              }`}
              style={{
                transition: "opacity 0.8s ease-in-out",
              }}
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url(${
                    typeof slide.image === "string"
                      ? slide.image
                      : slide.image.src
                  })`,
                  backgroundPosition: `${slide.backgroundPosition}`,
                }}
              >
                {/* Overlay Gradient */}
                <div
                  className={`absolute inset-0 bg-linear-to-r ${slide.color}`}
                />
              </div>

              {/* Content - Only visible for active slide */}
              {index === currentIndex && (
                <div className="relative h-full flex items-center px-4 md:px-8 lg:px-16 xl:px-24">
                  <div className="max-w-3xl w-full text-left">
                    {/* Animated Text */}
                    <div className="mb-4">
                      <h1
                        className={`text-2xl md:text-4xl lg:text-5xl font-bold ${slide.textColor} animate-fadeInUp`}
                        style={{ animationDelay: "0.2s" }}
                      >
                        {slide.text}
                      </h1>
                    </div>

                    <div className="overflow-hidden mb-6">
                      <p
                        className={`text-base md:text-lg lg:text-xl ${slide.textColor} opacity-90 animate-fadeInUp`}
                        style={{ animationDelay: "0.4s" }}
                      >
                        {slide.subtext}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm p-1.5 md:p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 z-20 cursor-pointer"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm p-1.5 md:p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 z-20 cursor-pointer"
          aria-label="Next slide"
        >
          <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 flex gap-1.5 md:gap-2 z-20">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all duration-300 cursor-pointer ${
                index === currentIndex
                  ? "bg-white scale-125"
                  : "bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Custom CSS for animations */}
        <style jsx global>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fadeInUp {
            animation: fadeInUp 0.8s ease-out forwards;
            opacity: 0;
            animation-fill-mode: forwards;
          }

          /* Ensure images load properly */
          .bg-cover {
            background-size: cover;
            background-position: center;
          }

          /* Mobile optimizations */
          @media (max-width: 640px) {
            .animate-fadeInUp {
              animation: fadeInUp 0.6s ease-out forwards;
            }
          }
        `}</style>
      </div>

      {/* About Us Section - Replacing SafetyHomePage */}
      <AboutUsSection />
      <FAQ />
    </>
  );
};

// AboutUsSection Component - Fixed with vertical animations
const AboutUsSection = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center mb-6">
            <div className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold text-lg">
              {webData.brand.shortName}.co.uk
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
            <span className="text-blue-600">ABOUT</span> US
          </h1>
          <div className="w-24 h-1 bg-blue-600 mx-auto mb-8"></div>
        </motion.div>

        {/* Main Content Section - Fixed overflow */}
        <div className="flex flex-col lg:flex-row gap-12 items-start mb-16">
          {/* Left Column - Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2"
          >
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                {webData.brand.shortName}: Developing and Awarding UK Safety & Technical
                Qualifications:
              </h2>
              <div className="space-y-6">
                <div className="text-base md:text-lg text-gray-700 leading-relaxed">
                  <div className="font-semibold">
                    {webData.brand.shortName} Qualifications is a UK-based awarding organisation
                    specialising in safety and technical qualifications.
                  </div>{" "}
                  We are committed to developing, regulating, and awarding
                  high-quality qualifications that meet industry standards and
                  regulatory expectations. Our focus is to ensure that every
                  certification issued under {webData.brand.shortName} reflects competence,
                  compliance, and professional excellence.
                </div>

                <div className="bg-blue-50 p-6 rounded-xl border-l-4 border-blue-500">
                  <p className="text-gray-700 italic">
                    &quot;Our certification pathways address real world industry
                    needs, helping organizations reduce incidents while
                    strengthening workforce capability.&quot;
                  </p>
                </div>

                <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                  With a strong UK foundation and a global outlook, {webData.brand.shortName}
                  empowers individuals and organizations to meet evolving safety
                  and technical requirements with confidence. Our UK-backed
                  certifications are designed to be relevant, practical and
                  internationally accepted helping professionals remain capable,
                  compliant, and competitive wherever they operate.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Image and Features */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2"
          >
            <div className="space-y-8">
              {/* Feature Image */}
              <div className="relative h-72 md:h-96 rounded-2xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-blue-900/20 z-10"></div>
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${bannarV2.src})`,
                  }}
                ></div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 z-20">
                  <h3 className="text-white text-2xl font-bold">
                    Global Safety Standards
                  </h3>
                  <p className="text-blue-100">
                    Internationally recognized certifications
                  </p>
                </div>
              </div>

              {/* Key Points - Fixed grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  className="bg-white p-6 rounded-xl shadow-md border border-gray-100"
                >
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 p-3 rounded-lg mr-4 flex-shrink-0">
                      <span className="text-blue-600 font-bold text-xl">
                        UK
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900">UK Registered</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Registered in England and Wales with UK regulatory
                    compliance
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  className="bg-white p-6 rounded-xl shadow-md border border-gray-100"
                >
                  <div className="flex items-center mb-4">
                    <div className="bg-green-100 p-3 rounded-lg mr-4 flex-shrink-0">
                      <span className="text-green-600 font-bold text-xl">
                        🌍
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900">
                      Global Recognition
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Internationally accepted certifications across industries
                    worldwide
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Mission Statement Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl p-8 md:p-12 text-white mb-16"
        >
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Mission</h2>
            <p className="text-xl text-blue-100 leading-relaxed">
              To develop and award high-quality safety and technical
              qualifications that uphold UK standards, promote compliance, and
              support professional competence across industries.
            </p>
          </div>
        </motion.div>

        {/* Values Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Our Core Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Integrity",
                description:
                  "We operate with transparency, fairness, and independence, ensuring every qualification is awarded with credibility and trust.",
                icon: "🤝",
                color: "bg-indigo-50 border-indigo-100",
              },
              {
                title: "Quality Assurance",
                description:
                  "We maintain rigorous approval and monitoring processes to uphold consistent standards across all approved centres.",
                icon: "✅",
                color: "bg-emerald-50 border-emerald-100",
              },
              {
                title: "Excellence",
                description:
                  "We are committed to developing qualifications that meet high industry and regulatory expectations.",
                icon: "⭐",
                color: "bg-yellow-50 border-yellow-100",
              },
              {
                title: "Compliance",
                description:
                  "We align our frameworks with UK regulatory standards to ensure reliability and professional recognition.",
                icon: "📋",
                color: "bg-blue-50 border-blue-100",
              },
              {
                title: "Industry Relevance",
                description:
                  "We collaborate with sector specialists to ensure our qualifications remain practical, current, and aligned with workforce needs.",
                icon: "🎯",
                color: "bg-purple-50 border-purple-100",
              },
              {
                title: "Accountability",
                description:
                  "We take responsibility for maintaining the integrity of our qualifications and the reputation of our approved centres.",
                icon: "🛡️",
                color: "bg-red-50 border-red-100",
              },
            ].map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className={`${value.color} p-6 rounded-2xl border shadow-sm text-center flex flex-col items-center`}
              >
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const HomePage = () => (
  <CmsPageContent pageKey="home">
    <HomePageInner />
  </CmsPageContent>
);

export default HomePage;
