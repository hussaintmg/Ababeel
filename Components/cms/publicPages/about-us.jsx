// Extracted from app/about-us/page.jsx; original layouts with typed CMS content.
"use client";

import Image from "next/image";
import useHasMounted from "@/utils/useHasMounted";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaShieldAlt, FaAward, FaUsers, FaLightbulb, FaStar, FaRocket, FaHandshake, FaHeart, FaChartLine, FaGlobe, FaGraduationCap, FaBriefcase, FaCheckCircle } from "react-icons/fa";
import { webData } from "@/constants";
import defaults from "./about-us.defaults.json";
export default function PublicPage(cmsProps = {}) {
  const cms = {
    ...defaults,
    ...cmsProps
  };
  const fadeInUp = {
    hidden: {
      y: 30,
      opacity: 0
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };
  const fadeInLeft = {
    hidden: {
      x: -30,
      opacity: 0
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };
  const fadeInRight = {
    hidden: {
      x: 30,
      opacity: 0
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };
  const scaleIn = {
    hidden: {
      scale: 0.8,
      opacity: 0
    },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };
  const staggerContainer = {
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
      y: 20,
      opacity: 0
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };
  const isClient = useHasMounted();
  const floatingElementSizes = [{
    width: "w-1",
    height: "h-2"
  }, {
    width: "w-2",
    height: "h-1"
  }, {
    width: "w-3",
    height: "h-2"
  }, {
    width: "w-3",
    height: "h-1"
  }, {
    width: "w-3",
    height: "h-2"
  }, {
    width: "w-1",
    height: "h-2"
  }, {
    width: "w-3",
    height: "h-3"
  }, {
    width: "w-3",
    height: "h-2"
  }, {
    width: "w-3",
    height: "h-2"
  }, {
    width: "w-2",
    height: "h-2"
  }, {
    width: "w-1",
    height: "h-3"
  }, {
    width: "w-2",
    height: "h-2"
  }, {
    width: "w-1",
    height: "h-2"
  }, {
    width: "w-2",
    height: "h-3"
  }, {
    width: "w-1",
    height: "h-2"
  }];
  const floatingElementPositions = [{
    top: "14.64%",
    left: "17.10%"
  }, {
    top: "43.23%",
    left: "55.47%"
  }, {
    top: "56.22%",
    left: "10.28%"
  }, {
    top: "56.78%",
    left: "34.76%"
  }, {
    top: "52.00%",
    left: "1.15%"
  }, {
    top: "37.98%",
    left: "8.08%"
  }, {
    top: "25.71%",
    left: "49.32%"
  }, {
    top: "29.75%",
    left: "34.86%"
  }, {
    top: "88.17%",
    left: "91.63%"
  }, {
    top: "49.62%",
    left: "8.26%"
  }, {
    top: "89.22%",
    left: "82.20%"
  }, {
    top: "94.30%",
    left: "64.22%"
  }, {
    top: "4.02%",
    left: "43.75%"
  }, {
    top: "85.75%",
    left: "5.33%"
  }, {
    top: "26.32%",
    left: "48.57%"
  }];
  const floatingElementMotion = floatingElementPositions.map((_, i) => {
    const noise = seed => {
      const v = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453;
      return v - Math.floor(v);
    };
    return {
      driftX: (noise(1) * 50 - 25).toFixed(2),
      driftY: (noise(2) * 50 - 25).toFixed(2),
      duration: 15 + noise(3) * 10,
      delay: noise(4) * 5
    };
  });
  const statsSectionSizes = [{
    width: "w-2",
    height: "h-3"
  }, {
    width: "w-2",
    height: "h-3"
  }, {
    width: "w-4",
    height: "h-5"
  }, {
    width: "w-3",
    height: "h-4"
  }, {
    width: "w-5",
    height: "h-2"
  }, {
    width: "w-2",
    height: "h-3"
  }, {
    width: "w-3",
    height: "h-4"
  }, {
    width: "w-2",
    height: "h-3"
  }];
  const statsSectionPositions = [{
    top: "29.01%",
    left: "18.24%"
  }, {
    top: "74.31%",
    left: "86.98%"
  }, {
    top: "33.70%",
    left: "89.88%"
  }, {
    top: "14.66%",
    left: "82.40%"
  }, {
    top: "40.52%",
    left: "59.14%"
  }, {
    top: "29.47%",
    left: "82.97%"
  }, {
    top: "59.91%",
    left: "54.69%"
  }, {
    top: "60.57%",
    left: "72.59%"
  }];
  const ctaSectionSizes = [{
    width: "w-5",
    height: "h-5"
  }, {
    width: "w-2",
    height: "h-5"
  }, {
    width: "w-2",
    height: "h-2"
  }, {
    width: "w-2",
    height: "h-5"
  }, {
    width: "w-4",
    height: "h-5"
  }, {
    width: "w-2",
    height: "h-2"
  }, {
    width: "w-2",
    height: "h-3"
  }, {
    width: "w-2",
    height: "h-3"
  }, {
    width: "w-2",
    height: "h-2"
  }, {
    width: "w-4",
    height: "h-5"
  }];
  const ctaSectionPositions = [{
    top: "85.29%",
    left: "86.26%"
  }, {
    top: "56.58%",
    left: "53.59%"
  }, {
    top: "51.95%",
    left: "7.62%"
  }, {
    top: "89.44%",
    left: "93.50%"
  }, {
    top: "58.43%",
    left: "3.94%"
  }, {
    top: "35.13%",
    left: "13.29%"
  }, {
    top: "18.02%",
    left: "26.28%"
  }, {
    top: "72.81%",
    left: "89.61%"
  }, {
    top: "87.92%",
    left: "47.88%"
  }, {
    top: "6.81%",
    left: "45.00%"
  }];
  if (!isClient) {
    return <div className="min-h-screen bg-linear-to-b from-gray-50 to-white">
        {}
        <div className="flex items-center justify-center min-h-screen flex-col gap-4">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-4 text-blue-700 font-semibold">{cms.Description_Loading_About_Page____1}</p>
        </div>
      </div>;
  }
  return <div className=" bg-linear-to-b from-gray-50 to-white">
      {}
      {(cmsProps.section == null || cmsProps.section === 0) && <section className="relative min-h-[120vh] pb-10 flex items-center justify-center overflow-hidden bg-linear-to-br from-blue-900 via-blue-800 to-blue-900">
        {}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
          {floatingElementSizes.map((size, i) => <motion.div key={i} initial={{
          x: floatingElementPositions[i].left,
          y: floatingElementPositions[i].top,
          opacity: 0
        }} animate={{
          x: [floatingElementPositions[i].left, `calc(${floatingElementPositions[i].left} + ${floatingElementMotion[i].driftX}vw)`, floatingElementPositions[i].left],
          y: [floatingElementPositions[i].top, `calc(${floatingElementPositions[i].top} + ${floatingElementMotion[i].driftY}vh)`, floatingElementPositions[i].top],
          opacity: [0, 0.3, 0]
        }} transition={{
          duration: floatingElementMotion[i].duration,
          repeat: Infinity,
          repeatType: "reverse",
          delay: floatingElementMotion[i].delay
        }} className={`absolute ${size.width} ${size.height} rounded-full ${i % 3 === 0 ? "bg-blue-500" : i % 3 === 1 ? "bg-cyan-500" : "bg-indigo-500"} blur-xl opacity-10`} />)}
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8
        }} className="max-w-4xl mx-auto text-center">
            <motion.div initial={{
            scale: 0
          }} animate={{
            scale: 1
          }} transition={{
            delay: 0.3,
            type: "spring"
          }} className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full mb-8 border border-white/20">
              <FaShieldAlt className="w-5 h-5 text-blue-300" />
              <span className="text-white font-semibold">{cms.Text_Setting_the_Benchmark_in_Technical___Safety_Cert_2}</span>
            </motion.div>

            <motion.h1 initial={{
            y: 40,
            opacity: 0
          }} animate={{
            y: 0,
            opacity: 1
          }} transition={{
            delay: 0.4
          }} className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight text-white">{cms.Heading_About_3}{webData.brand.name}
              <span className="block text-3xl md:text-4xl text-blue-200 mt-4">{cms.Text_Pioneering_Safety_and_Technical_Education_4}</span>
            </motion.h1>

            <motion.p initial={{
            y: 30,
            opacity: 0
          }} animate={{
            y: 0,
            opacity: 1
          }} transition={{
            delay: 0.5
          }} className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">{cms.Description_Structured_qualification_frameworks_designed_to__5}</motion.p>

            <motion.div initial={{
            y: 40,
            opacity: 0
          }} animate={{
            y: 0,
            opacity: 1
          }} transition={{
            delay: 0.6
          }} className="flex flex-wrap gap-4 justify-center">
              <Link href={cms.href__contact_us_6} className="group bg-linear-to-r from-blue-500 to-cyan-500 text-white font-bold py-4 px-8 rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-3">
                <FaHandshake className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span>{cms.Text_Get_in_Touch_7}</span>
              </Link>

              <Link href={cms.href__qualification_8} className="group bg-white/10 backdrop-blur-sm text-white font-bold py-4 px-8 rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/20 flex items-center gap-3">
                <FaGraduationCap className="w-5 h-5" />
                <span>{cms.Text_Explore_Programs_9}</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {}
        <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        delay: 1
      }} className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
          <motion.div animate={{
          y: [0, 10, 0]
        }} transition={{
          duration: 2,
          repeat: Infinity
        }} className="flex flex-col items-center text-blue-200">
            <span className="text-sm mb-2">{cms.Text_Scroll_to_explore_10}</span>
            <div className="w-6 h-10 border-2 border-blue-300 rounded-full flex justify-center">
              <motion.div animate={{
              y: [0, 12, 0]
            }} transition={{
              duration: 2,
              repeat: Infinity
            }} className="w-1 h-3 bg-blue-400 rounded-full mt-2" />
            </div>
          </motion.div>
        </motion.div>
      </section>}

      {}
      {(cmsProps.section == null || cmsProps.section === 1) && <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{
            once: true
          }} variants={fadeInLeft} className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-linear-to-r from-blue-50 to-cyan-50 px-6 py-3 rounded-full">
                <FaRocket className="w-5 h-5 text-blue-600" />
                <span className="text-blue-700 font-semibold">{cms.Text_Our_Mission_11}</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold text-gray-800">{cms.Heading_Creating_Safer_And_Technically_12}<span className="block bg-linear-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{cms.Text_Competent_Workplaces_13}</span>
              </h2>

              <div className="space-y-4">
                <p className="text-gray-600 text-lg leading-relaxed">{cms.Description_To_advance_workplace_safety_and_technical_excell_14}</p>
                <p className="text-gray-600 text-lg leading-relaxed">{cms.Description_We_believe_every_worker_deserves_to_operate_in_a_15}</p>
                <p className="text-gray-600 text-lg leading-relaxed">{cms.Description_Committed_to_protecting_lives_and_strengthening__16}</p>
              </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{
            once: true
          }} variants={fadeInRight} className="relative">
              <div className="relative h-125 rounded-3xl overflow-hidden shadow-2xl">
                <Image src={cms.src_https___images_unsplash_com_photo_1622_17} alt={cms.alt_Safety_Certification_Session_18} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority />
                <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />

                {}
                <motion.div initial={{
                y: 0
              }} animate={{
                y: [-20, 0, -20]
              }} transition={{
                duration: 3,
                repeat: Infinity
              }} className="absolute top-8 left-8 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                  <FaShieldAlt className="w-8 h-8 text-white" />
                </motion.div>

                <motion.div initial={{
                y: 0
              }} animate={{
                y: [0, -20, 0]
              }} transition={{
                duration: 4,
                repeat: Infinity,
                delay: 1
              }} className="absolute bottom-8 right-8 bg-linear-to-r from-blue-500 to-cyan-500 p-4 rounded-xl shadow-lg">
                  <span className="text-white font-bold text-sm">{cms.Text_SAFETY_FIRST_19}</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>}

      {}
      {(cmsProps.section == null || cmsProps.section === 2) && <section className="py-20 bg-linear-to-b from-white to-blue-50">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{
          once: true
        }} variants={fadeInUp} className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-linear-to-r from-blue-100 to-cyan-100 px-6 py-3 rounded-full mb-6">
                <FaChartLine className="w-5 h-5 text-blue-600" />
                <span className="text-blue-700 font-semibold">{cms.Text_Our_Journey_20}</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">{cms.Heading_From_Vision_to_21}<span className="block bg-linear-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{cms.Text_Action_22}</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{
              once: true
            }} className="space-y-6">
                <motion.p variants={itemVariants} className="text-xl text-gray-700 leading-relaxed">{cms.Description_Founded_by_a_dedicated_team_of_safety_profession_23}{webData.brand.name}{cms.Description_began_with_a_transformative_vision__to_revolutio_24}</motion.p>

                <motion.p variants={itemVariants} className="text-gray-600 leading-relaxed">{cms.Description_Our_journey_started_with_identifying_a_crucial_i_25}</motion.p>

                <motion.p variants={itemVariants} className="text-gray-600 leading-relaxed">{cms.Description_Today__we_stand_as_a_trusted_partner_for_organiz_26}</motion.p>
              </motion.div>

              <motion.div initial="hidden" whileInView="visible" viewport={{
              once: true
            }} variants={scaleIn} className="relative">
                <div className="bg-linear-to-br from-blue-600 to-cyan-600 rounded-3xl p-8 shadow-2xl">
                  <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                    <div className="text-4xl mb-4">{cms.Text___27}</div>
                    <p className="text-white text-lg italic mb-6">{cms.Description_Safety_isn_t_just_about_compliance__it_s_about_c_28}</p>
                    <div className="flex items-start p-4">
                      <div>
                        <div className="text-blue-200 text-sm">{cms.Text_CEO_Message_29}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {}
                <motion.div initial={{
                y: 0
              }} animate={{
                y: [0, -10, 0]
              }} transition={{
                duration: 3,
                repeat: Infinity
              }} className="absolute -top-4 -left-4 bg-white p-3 rounded-xl shadow-lg">
                  <FaAward className="w-6 h-6 text-yellow-500" />
                </motion.div>

                <motion.div initial={{
                y: 0
              }} animate={{
                y: [0, -15, 0]
              }} transition={{
                duration: 4,
                repeat: Infinity,
                delay: 0.5
              }} className="absolute -bottom-4 -right-4 bg-linear-to-r from-green-500 to-emerald-500 p-3 rounded-xl shadow-lg">
                  <FaStar className="w-6 h-6 text-white" />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>}

      {}
      {(cmsProps.section == null || cmsProps.section === 3) && <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{
          once: true
        }} variants={fadeInUp} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-linear-to-r from-blue-50 to-cyan-50 px-6 py-3 rounded-full mb-6">
              <FaHeart className="w-5 h-5 text-blue-600" />
              <span className="text-blue-700 font-semibold">{cms.Text_Our_Principles_30}</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">{cms.Heading_Core_Values_That_31}<span className="block bg-linear-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{cms.Text_Guide_Our_Journey_32}</span>
            </h2>

            <p className="text-gray-600 text-lg max-w-2xl mx-auto">{cms.Description_The_principles_that_guide_every_aspect_of_our_ce_33}</p>
          </motion.div>

          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{
          once: true
        }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[{
            title: cms.title_Integrity_34,
            description: cms.description_We_operate_with_transparency__fairness_35,
            icon: <FaHandshake className="w-6 h-6" />,
            color: "from-blue-500 to-indigo-500"
          }, {
            title: cms.title_Quality_Assurance_36,
            description: cms.description_We_maintain_rigorous_approval_and_moni_37,
            icon: <FaCheckCircle className="w-6 h-6" />,
            color: "from-emerald-500 to-teal-500"
          }, {
            title: cms.title_Excellence_38,
            description: cms.description_We_are_committed_to_developing_qualifi_39,
            icon: <FaStar className="w-6 h-6" />,
            color: "from-yellow-500 to-orange-500"
          }, {
            title: cms.title_Compliance_40,
            description: cms.description_We_align_our_frameworks_with_UK_regula_41,
            icon: <FaShieldAlt className="w-6 h-6" />,
            color: "from-blue-600 to-cyan-600"
          }, {
            title: cms.title_Industry_Relevance_42,
            description: cms.description_We_collaborate_with_sector_specialists_43,
            icon: <FaBriefcase className="w-6 h-6" />,
            color: "from-purple-500 to-violet-500"
          }, {
            title: cms.title_Accountability_44,
            description: cms.description_We_take_responsibility_for_maintaining_45,
            icon: <FaAward className="w-6 h-6" />,
            color: "from-red-500 to-rose-500"
          }].map((value, index) => <motion.div key={index} variants={itemVariants} whileHover={{
            y: -10
          }} className="group">
                <div className="bg-linear-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-500 h-full flex flex-col">
                  <div className={`inline-flex p-4 rounded-2xl bg-linear-to-r ${value.color} text-white mb-6 group-hover:scale-110 transition-transform duration-500 w-fit`}>
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
              </motion.div>)}
          </motion.div>
        </div>
      </section>}

      {}
      {(cmsProps.section == null || cmsProps.section === 4) && <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-blue-900 via-blue-800 to-blue-900" />
        {ctaSectionSizes.map((size, i) => <motion.div key={i} initial={{
        opacity: 0,
        scale: 0
      }} animate={{
        opacity: 0.2,
        scale: 1
      }} transition={{
        delay: i * 0.2,
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse"
      }} className={`absolute ${size.width} ${size.height} rounded-full ${i % 3 === 0 ? "bg-blue-400" : i % 3 === 1 ? "bg-cyan-400" : "bg-indigo-400"} blur-xl`} style={{
        top: ctaSectionPositions[i].top,
        left: ctaSectionPositions[i].left
      }} />)}

        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="max-w-4xl mx-auto text-center">
            <motion.div initial={{
            scale: 0
          }} whileInView={{
            scale: 1
          }} viewport={{
            once: true
          }} transition={{
            type: "spring"
          }} className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full mb-8">
              <FaShieldAlt className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">{cms.Text_Ready_to_Make_Your_Workplace_Safer__46}</span>
            </motion.div>

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">{cms.Heading_Join_47}<span className="text-blue-200">{cms.Text_Us_48}</span>
            </h2>

            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">{cms.Description_Partner_with_49}{webData.brand.name}{cms.Description_for_comprehensive_safety_certification_solutions_50}</p>

            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: 0.3
          }} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={cms.href__contact_us_51} className="group bg-linear-to-r from-blue-500 to-cyan-500 text-white font-bold py-4 px-8 rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3">
                <FaHandshake className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span>{cms.Text_Contact_Us_Today_52}</span>
              </Link>

              <Link href={cms.href__qualification_53} className="group bg-white/10 backdrop-blur-sm text-white font-bold py-4 px-8 rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/20 flex items-center justify-center gap-3">
                <FaBriefcase className="w-5 h-5" />
                <span>{cms.Text_Explore_Programs_54}</span>
              </Link>
            </motion.div>

            <motion.div initial={{
            opacity: 0
          }} whileInView={{
            opacity: 1
          }} viewport={{
            once: true
          }} transition={{
            delay: 0.5
          }} className="mt-12 pt-8 border-t border-white/20">
              <div className="flex flex-wrap items-center justify-center gap-6 text-white/80 text-sm">
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="w-4 h-4 text-green-400" />
                  <span>{cms.Text_Certified_Trainers_55}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="w-4 h-4 text-green-400" />
                  <span>{cms.Text_Industry_Recognized_Programs_56}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="w-4 h-4 text-green-400" />
                  <span>{cms.Text_Flexible_Certification_Options_57}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>}
    </div>;
}
