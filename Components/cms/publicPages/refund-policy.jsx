// Extracted from app/refund-policy/page.jsx; original layouts with typed CMS content.
"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useHasMounted from '@/utils/useHasMounted';
import { RefreshCw, Clock, CheckCircle, XCircle, DollarSign, Calendar, FileText, Shield, TrendingUp, Percent, CreditCard, Mail, AlertTriangle, Info, ChevronDown, ChevronUp, ArrowRight, Banknote, Receipt, HandCoins, Coins, CalendarDays, Scale, FileCheck, BookOpen, Calculator, BadgeCheck, TrendingDown, Globe, Phone, HelpCircle, ReceiptText, FileDigit, Download, Award, Users } from 'lucide-react';
import { webData } from '@/constants';
import defaults from "./refund-policy.defaults.json";
export default function PublicPage(cmsProps = {}) {
  const cms = {
    ...defaults,
    ...cmsProps
  };
  const [activeTab, setActiveTab] = useState('cancellation');
  const [progress, setProgress] = useState(0);
  const isVisible = useHasMounted();
  const currentDate = isVisible ? new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';
  useEffect(() => {
    const timer = setTimeout(() => setProgress(100), 500);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const current = window.scrollY;
      setProgress(Math.min(100, current / total * 100));
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const tabs = [{
    id: 'cancellation',
    label: cms.label_Cancellation_Policy_1,
    icon: CalendarDays
  }, {
    id: 'digital',
    label: cms.label_Digital_Materials_2,
    icon: FileText
  }, {
    id: 'company',
    label: cms.label_Company_Cancellation_3,
    icon: Shield
  }, {
    id: 'processing',
    label: cms.label_Processing_4,
    icon: RefreshCw
  }];
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };
  const itemVariants = {
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
  const tabContentVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.3
      }
    }
  };
  const fadeInUp = {
    hidden: {
      y: 40,
      opacity: 0
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.7,
        ease: "easeOut"
      }
    }
  };
  return <div className=" bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/30">
      {}
      {(cmsProps.section == null || cmsProps.section === 0) && <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => <motion.div key={i} className="absolute rounded-full" style={{
        background: `radial-gradient(circle, ${i % 3 === 0 ? 'rgba(59, 130, 246, 0.05)' : i % 3 === 1 ? 'rgba(139, 92, 246, 0.05)' : 'rgba(16, 185, 129, 0.05)'}, transparent)`
      }} initial={{
        x: `${i * 10 % 100}vw`,
        y: `${i * 8 % 100}vh`,
        width: 80 + i * 10,
        height: 80 + i * 10,
        opacity: 0
      }} animate={{
        y: [`${i * 8 % 100}vh`, `${(i * 8 + 15) % 100}vh`, `${i * 8 % 100}vh`],
        opacity: [0.1, 0.15, 0.1]
      }} transition={{
        duration: 20 + i * 2,
        repeat: Infinity,
        ease: "easeInOut",
        delay: i * 0.5
      }} />)}
      </div>}

      {}
      {(cmsProps.section == null || cmsProps.section === 1) && <div className="fixed top-0 left-0 w-full h-1.5 z-50 bg-gray-100">
        <motion.div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500" initial={{
        width: 0
      }} animate={{
        width: `${progress}%`
      }} transition={{
        type: "spring",
        stiffness: 100,
        damping: 30
      }} />
      </div>}

      {}
      {(cmsProps.section == null || cmsProps.section === 2) && <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
        <div className="relative container mx-auto px-4 py-20 md:py-28">
          <motion.div initial={{
          opacity: 0,
          y: 50
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 1,
          ease: "easeOut"
        }} className="max-w-6xl mx-auto text-center">
            <motion.div initial={{
            scale: 0,
            rotate: -180
          }} animate={{
            scale: 1,
            rotate: 0
          }} transition={{
            type: "spring",
            stiffness: 200,
            delay: 0.3
          }} className="inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-sm rounded-3xl mb-8">
              <motion.div animate={{
              rotate: 360
            }} transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}>
                <RefreshCw className="w-12 h-12 text-blue-300" />
              </motion.div>
            </motion.div>
            
            <motion.h1 initial={{
            opacity: 0,
            y: 30
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.4
          }} className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-200 to-purple-200">{cms.Heading_Refund_Policy_5}</motion.h1>
            
            <motion.p initial={{
            opacity: 0,
            y: 30
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.5
          }} className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">{cms.Description_Transparent_and_fair_refund_process_designed_for_6}{webData.brand.name}
            </motion.p>

            <motion.div initial={{
            opacity: 0,
            scale: 0.9
          }} animate={{
            opacity: 1,
            scale: 1
          }} transition={{
            delay: 0.6,
            type: "spring"
          }} className="inline-flex flex-col sm:flex-row items-center gap-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{cms.Text_Today_7}</div>
                <div className="text-sm text-blue-200">{currentDate}</div>
              </div>
              
              <div className="h-12 w-px bg-white/20 hidden sm:block"></div>
              
              <div className="text-center">
                <div className="text-3xl font-bold">{cms.Text_International_8}</div>
                <div className="text-sm text-blue-200">{cms.Text_Multi_Currency_Support_9}</div>
              </div>
              
              <div className="h-12 w-px bg-white/20 hidden sm:block"></div>
              
              <div className="text-center">
                <div className="text-3xl font-bold">{cms.Text_Fair_10}</div>
                <div className="text-sm text-blue-200">{cms.Text_Clear_Terms_11}</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>}

      {}
      {(cmsProps.section == null || cmsProps.section === 3) && <div className="container mx-auto px-4 py-12 -mt-10 relative">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-6xl mx-auto">
          {}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
            {[{
            icon: Percent,
            value: cms.value_100__12,
            label: cms.label_14__Days_Before_13,
            sublabel: 'Full Refund',
            color: 'emerald',
            delay: 0
          }, {
            icon: Calculator,
            value: cms.value_50__14,
            label: cms.label_7_14_Days_Before_15,
            sublabel: 'Partial Refund',
            color: 'amber',
            delay: 0.1
          }, {
            icon: XCircle,
            value: cms.value_0__16,
            label: cms.label___7_Days_Before_17,
            sublabel: 'No Refund',
            color: 'rose',
            delay: 0.2
          }, {
            icon: Clock,
            value: cms.value_5_10_18,
            label: cms.label_Processing_Days_19,
            sublabel: 'Via Stripe',
            color: 'blue',
            delay: 0.3
          }].map((stat, index) => <motion.div key={index} initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: stat.delay
          }} whileHover={{
            y: -5
          }} className={`bg-white rounded-2xl p-6 shadow-lg border border-${stat.color}-100`}>
                <div className={`inline-flex p-3 bg-${stat.color}-100 rounded-xl mb-4`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="font-semibold text-gray-900">{stat.label}</div>
                <div className="text-sm text-gray-600">{stat.sublabel}</div>
              </motion.div>)}
          </motion.div>

          {}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            {}
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="flex overflow-x-auto scrollbar-hide">
                {tabs.map((tab, index) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return <motion.button key={tab.id} initial={{
                  opacity: 0,
                  y: -10
                }} animate={{
                  opacity: 1,
                  y: 0
                }} transition={{
                  delay: index * 0.1
                }} onClick={() => setActiveTab(tab.id)} className={`shrink-0 px-6 py-4 font-medium text-sm md:text-base flex items-center gap-3 transition-all duration-300 relative ${isActive ? 'text-blue-700 bg-white border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>
                      <Icon className="w-5 h-5" />
                      {tab.label}
                    </motion.button>;
              })}
              </div>
            </div>

            {}
            <div className="p-6 md:p-10 min-h-[600px]">
              <AnimatePresence mode="wait">
                {}
                {activeTab === 'cancellation' && <motion.div key="cancellation" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
                    <div className="flex items-start gap-6">
                      <div className="p-4 bg-blue-100 rounded-2xl">
                        <CalendarDays className="w-10 h-10 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{cms.Heading_1__Cancellation_by_the_Client_20}</h2>
                        <p className="text-lg text-gray-600 mb-6">{cms.Description_Requests_for_cancellations_made_more_than_14_day_21}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {}
                      <motion.div initial={{
                    opacity: 0,
                    y: 20
                  }} animate={{
                    opacity: 1,
                    y: 0
                  }} transition={{
                    delay: 0.1
                  }} className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-6 border border-emerald-200 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-emerald-100 rounded-xl">
                            <CheckCircle className="w-6 h-6 text-emerald-600" />
                          </div>
                          <span className="px-3 py-1 text-sm font-bold bg-emerald-100 text-emerald-700 rounded-full">
                            {">"}{cms.Text_14_Days_22}</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{cms.Heading_Standard_Refund_23}</h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <span className="text-gray-700">{cms.Text_Full_refund_available_24}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-emerald-500" />
                            <span className="text-gray-700">{cms.Text_Minus__50_admin_fee_25}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-500" />
                            <span className="text-gray-700">{cms.Text_Processed_within_14_days_26}</span>
                          </div>
                        </div>
                      </motion.div>

                      {}
                      <motion.div initial={{
                    opacity: 0,
                    y: 20
                  }} animate={{
                    opacity: 1,
                    y: 0
                  }} transition={{
                    delay: 0.2
                  }} className="bg-gradient-to-br from-amber-50 to-white rounded-2xl p-6 border border-amber-200 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-amber-100 rounded-xl">
                            <Percent className="w-6 h-6 text-amber-600" />
                          </div>
                          <span className="px-3 py-1 text-sm font-bold bg-amber-100 text-amber-700 rounded-full">{cms.Text_7_14_Days_27}</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{cms.Heading_Partial_Refund_28}</h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Percent className="w-4 h-4 text-amber-500" />
                            <span className="text-gray-700">{cms.Text_50__refund_available_29}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-500" />
                            <span className="text-gray-700">{cms.Text_Valid_period_only_30}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-amber-500" />
                            <span className="text-gray-700">{cms.Text_No_shows_excluded_31}</span>
                          </div>
                        </div>
                      </motion.div>

                      {}
                      <motion.div initial={{
                    opacity: 0,
                    y: 20
                  }} animate={{
                    opacity: 1,
                    y: 0
                  }} transition={{
                    delay: 0.3
                  }} className="bg-gradient-to-br from-rose-50 to-white rounded-2xl p-6 border border-rose-200 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-rose-100 rounded-xl">
                            <XCircle className="w-6 h-6 text-rose-600" />
                          </div>
                          <span className="px-3 py-1 text-sm font-bold bg-rose-100 text-rose-700 rounded-full">
                            {"<"}{cms.Text_7_Days_32}</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{cms.Heading_No_Refund_33}</h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-rose-500" />
                            <span className="text-gray-700">{cms.Text_No_refund_available_34}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-rose-500" />
                            <span className="text-gray-700">{cms.Text_Includes_no_shows_35}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-500" />
                            <span className="text-gray-700">{cms.Text_Consider_rescheduling_36}</span>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {}
                    <motion.div initial={{
                  opacity: 0,
                  y: 20
                }} animate={{
                  opacity: 1,
                  y: 0
                }} transition={{
                  delay: 0.4
                }} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
                      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <Clock className="w-6 h-6 text-blue-600" />{cms.Heading_Cancellation_Timeline_37}</h3>
                      <div className="relative">
                        <div className="flex items-center justify-between mb-8 relative">
                          {}
                          <div className="absolute top-6 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 rounded-full"></div>
                          
                          {[{
                        days: '14+',
                        color: 'emerald',
                        label: cms.label_Full_Refund_38
                      }, {
                        days: '7-14',
                        color: 'amber',
                        label: cms.label_50__Refund_39
                      }, {
                        days: '< 7',
                        color: 'rose',
                        label: cms.label_No_Refund_40
                      }].map((point, index) => <div key={index} className="relative z-10 text-center">
                              <motion.div initial={{
                          scale: 0
                        }} animate={{
                          scale: 1
                        }} transition={{
                          delay: 0.5 + index * 0.1
                        }} className={`w-12 h-12 bg-${point.color}-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                                <div className="text-white font-bold">{point.days}</div>
                              </motion.div>
                              <div className="font-semibold text-gray-900">{point.label}</div>
                              <div className="text-sm text-gray-600">{point.days}{cms.Text_Days_41}</div>
                            </div>)}
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>}

                {}
                {activeTab === 'digital' && <motion.div key="digital" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
                    <div className="flex items-start gap-6">
                      <div className="p-4 bg-purple-100 rounded-2xl">
                        <FileText className="w-10 h-10 text-purple-600" />
                      </div>
                      <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{cms.Heading_2__Digital_Materials___Certification_42}</h2>
                        <p className="text-lg text-gray-600 mb-6">{cms.Description_Once_digital_certification_materials_have_been_a_43}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {}
                      <motion.div initial={{
                    opacity: 0,
                    x: -20
                  }} animate={{
                    opacity: 1,
                    x: 0
                  }} transition={{
                    delay: 0.1
                  }} className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-8 border border-purple-200 shadow-lg">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="p-3 bg-purple-100 rounded-xl">
                            <Download className="w-6 h-6 text-purple-600" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900">{cms.Heading_Digital_Materials_Policy_44}</h3>
                        </div>
                        <div className="space-y-4">
                          <div className="p-4 bg-white rounded-xl border border-purple-100">
                            <div className="flex items-center gap-3 mb-2">
                              <XCircle className="w-5 h-5 text-rose-500" />
                              <span className="font-semibold text-gray-900">{cms.Text_No_Refunds_After_Access_45}</span>
                            </div>
                            <p className="text-gray-600">{cms.Description_Once_you_access_digital_certification_materials__46}</p>
                          </div>
                          <div className="p-4 bg-white rounded-xl border border-purple-100">
                            <div className="flex items-center gap-3 mb-2">
                              <BookOpen className="w-5 h-5 text-blue-500" />
                              <span className="font-semibold text-gray-900">{cms.Text_Preview_Available_47}</span>
                            </div>
                            <p className="text-gray-600">{cms.Description_Review_course_outlines_and_sample_materials_befo_48}</p>
                          </div>
                          <div className="p-4 bg-white rounded-xl border border-purple-100">
                            <div className="flex items-center gap-3 mb-2">
                              <FileDigit className="w-5 h-5 text-green-500" />
                              <span className="font-semibold text-gray-900">{cms.Text_Lifetime_Access_49}</span>
                            </div>
                            <p className="text-gray-600">{cms.Description_Once_purchased__digital_materials_remain_accessi_50}</p>
                          </div>
                        </div>
                      </motion.div>

                      {}
                      <motion.div initial={{
                    opacity: 0,
                    x: 20
                  }} animate={{
                    opacity: 1,
                    x: 0
                  }} transition={{
                    delay: 0.2
                  }} className="bg-gradient-to-br from-amber-50 to-white rounded-2xl p-8 border border-amber-200 shadow-lg">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="p-3 bg-amber-100 rounded-xl">
                            <Award className="w-6 h-6 text-amber-600" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900">{cms.Heading_Certification_Policy_51}</h3>
                        </div>
                        <div className="space-y-4">
                          <div className="p-4 bg-white rounded-xl border border-amber-100">
                            <div className="flex items-center gap-3 mb-2">
                              <XCircle className="w-5 h-5 text-rose-500" />
                              <span className="font-semibold text-gray-900">{cms.Text_No_Refunds_After_Issuance_52}</span>
                            </div>
                            <p className="text-gray-600">{cms.Description_Once_certification_is_issued__refunds_cannot_be__53}</p>
                          </div>
                          <div className="p-4 bg-white rounded-xl border border-amber-100">
                            <div className="flex items-center gap-3 mb-2">
                              <BadgeCheck className="w-5 h-5 text-green-500" />
                              <span className="font-semibold text-gray-900">{cms.Text_Verification_Available_54}</span>
                            </div>
                            <p className="text-gray-600">{cms.Description_All_certificates_include_unique_verification_cod_55}</p>
                          </div>
                          <div className="p-4 bg-white rounded-xl border border-amber-100">
                            <div className="flex items-center gap-3 mb-2">
                              <FileCheck className="w-5 h-5 text-blue-500" />
                              <span className="font-semibold text-gray-900">{cms.Text_Digital___Physical_56}</span>
                            </div>
                            <p className="text-gray-600">{cms.Description_Receive_both_digital_certificate_and_optional_ph_57}</p>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {}
                    <motion.div initial={{
                  opacity: 0,
                  y: 20
                }} animate={{
                  opacity: 1,
                  y: 0
                }} transition={{
                  delay: 0.3
                }} className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-6 border border-amber-200">
                      <div className="flex items-start gap-4">
                        <AlertTriangle className="w-6 h-6 text-amber-600 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2">{cms.Heading_Important_Notice_58}</h4>
                          <p className="text-gray-700">{cms.Description_We_strongly_recommend_reviewing_all_course_mater_59}</p>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>}

                {}
                {activeTab === 'company' && <motion.div key="company" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
                    <div className="flex items-start gap-6">
                      <div className="p-4 bg-green-100 rounded-2xl">
                        <Shield className="w-10 h-10 text-green-600" />
                      </div>
                      <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{cms.Heading_3__Cancellation_by_60}{webData.brand.name}
                        </h2>
                        <p className="text-lg text-gray-600 mb-6">{cms.Description_If_we_must_cancel_a_session_due_to_unforeseen_ci_61}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {}
                      <motion.div initial={{
                    opacity: 0,
                    x: -20
                  }} animate={{
                    opacity: 1,
                    x: 0
                  }} transition={{
                    delay: 0.1
                  }} className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-8 border border-green-200 shadow-lg">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="p-3 bg-green-100 rounded-xl">
                            <DollarSign className="w-6 h-6 text-green-600" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900">{cms.Heading_Full_Refund_Option_62}</h3>
                        </div>
                        <div className="space-y-4">
                          <div className="p-4 bg-white rounded-xl border border-green-100">
                            <div className="flex items-center gap-3 mb-2">
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <span className="font-semibold text-gray-900">{cms.Text_100__Money_Back_63}</span>
                            </div>
                            <p className="text-gray-600">{cms.Description_Complete_refund_of_all_fees_paid_for_the_cancell_64}</p>
                          </div>
                          <div className="p-4 bg-white rounded-xl border border-green-100">
                            <div className="flex items-center gap-3 mb-2">
                              <CreditCard className="w-5 h-5 text-blue-500" />
                              <span className="font-semibold text-gray-900">{cms.Text_Original_Payment_Method_65}</span>
                            </div>
                            <p className="text-gray-600">{cms.Description_Refund_processed_back_to_your_original_payment_m_66}</p>
                          </div>
                          <div className="p-4 bg-white rounded-xl border border-green-100">
                            <div className="flex items-center gap-3 mb-2">
                              <Clock className="w-5 h-5 text-purple-500" />
                              <span className="font-semibold text-gray-900">{cms.Text_Priority_Processing_67}</span>
                            </div>
                            <p className="text-gray-600">{cms.Description_Expedited_processing_within_3_5_business_days__68}</p>
                          </div>
                        </div>
                      </motion.div>

                      {}
                      <motion.div initial={{
                    opacity: 0,
                    x: 20
                  }} animate={{
                    opacity: 1,
                    x: 0
                  }} transition={{
                    delay: 0.2
                  }} className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 border border-blue-200 shadow-lg">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="p-3 bg-blue-100 rounded-xl">
                            <Calendar className="w-6 h-6 text-blue-600" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900">{cms.Heading_Reschedule_Option_69}</h3>
                        </div>
                        <div className="space-y-4">
                          <div className="p-4 bg-white rounded-xl border border-blue-100">
                            <div className="flex items-center gap-3 mb-2">
                              <CalendarDays className="w-5 h-5 text-blue-500" />
                              <span className="font-semibold text-gray-900">{cms.Text_Next_Available_Date_70}</span>
                            </div>
                            <p className="text-gray-600">{cms.Description_Transfer_your_booking_to_the_next_scheduled_sess_71}</p>
                          </div>
                          <div className="p-4 bg-white rounded-xl border border-blue-100">
                            <div className="flex items-center gap-3 mb-2">
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <span className="font-semibold text-gray-900">{cms.Text_No_Additional_Cost_72}</span>
                            </div>
                            <p className="text-gray-600">{cms.Description_Reschedule_at_no_extra_charge_or_administrative__73}</p>
                          </div>
                          <div className="p-4 bg-white rounded-xl border border-blue-100">
                            <div className="flex items-center gap-3 mb-2">
                              <Users className="w-5 h-5 text-purple-500" />
                              <span className="font-semibold text-gray-900">{cms.Text_Priority_Placement_74}</span>
                            </div>
                            <p className="text-gray-600">{cms.Description_Guaranteed_spot_in_the_next_available_session__75}</p>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {}
                    <motion.div initial={{
                  opacity: 0,
                  y: 20
                }} animate={{
                  opacity: 1,
                  y: 0
                }} transition={{
                  delay: 0.3
                }} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8 border border-gray-200">
                      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6 text-amber-600" />{cms.Heading_Unforeseen_Circumstances_76}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[{
                      icon: '⚡',
                      title: cms.title_Technical_Issues_77,
                      desc: 'Platform failures or system outages'
                    }, {
                      icon: '👨‍🏫',
                      title: cms.title_Instructor_Unavailability_78,
                      desc: 'Unexpected illness or emergencies'
                    }, {
                      icon: '🌍',
                      title: cms.title_Force_Majeure_79,
                      desc: 'Natural disasters or events beyond control'
                    }, {
                      icon: '🔧',
                      title: cms.title_Venue_Issues_80,
                      desc: 'Unexpected venue closures'
                    }, {
                      icon: '📊',
                      title: cms.title_Low_Enrollment_81,
                      desc: 'Insufficient participants for session'
                    }, {
                      icon: '⚠️',
                      title: cms.title_Safety_Concerns_82,
                      desc: 'Health or safety regulations'
                    }].map((item, index) => <motion.div key={index} initial={{
                      opacity: 0,
                      scale: 0.9
                    }} animate={{
                      opacity: 1,
                      scale: 1
                    }} transition={{
                      delay: 0.4 + index * 0.05
                    }} className="bg-white p-4 rounded-xl border border-gray-200 text-center hover:shadow-md transition-shadow">
                            <div className="text-2xl mb-2">{item.icon}</div>
                            <div className="font-semibold text-gray-900 mb-1">{item.title}</div>
                            <div className="text-sm text-gray-600">{item.desc}</div>
                          </motion.div>)}
                      </div>
                    </motion.div>
                  </motion.div>}

                {}
                {activeTab === 'processing' && <motion.div key="processing" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
                    <div className="flex items-start gap-6">
                      <div className="p-4 bg-indigo-100 rounded-2xl">
                        <RefreshCw className="w-10 h-10 text-indigo-600" />
                      </div>
                      <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{cms.Heading_4__Processing_Refunds_83}</h2>
                        <p className="text-lg text-gray-600 mb-6">{cms.Description_Approved_refunds_will_be_processed_back_to_the_o_84}</p>
                      </div>
                    </div>

                    {}
                    <motion.div initial={{
                  opacity: 0,
                  y: 20
                }} animate={{
                  opacity: 1,
                  y: 0
                }} transition={{
                  delay: 0.1
                }} className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-8 border border-indigo-200 shadow-lg">
                      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <Clock className="w-6 h-6 text-indigo-600" />{cms.Heading_Processing_Timeline_85}</h3>
                      
                      <div className="relative">
                        {}
                        <div className="flex flex-col md:flex-row items-start justify-between mb-12 relative">
                          {}
                          <div className="absolute top-6 left-6 right-6 h-0.5 md:h-0.5 md:top-12 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500"></div>
                          
                          {[{
                        step: 'Approval',
                        days: '1-2 Days',
                        icon: CheckCircle,
                        color: 'emerald'
                      }, {
                        step: 'Processing',
                        days: '1-3 Days',
                        icon: RefreshCw,
                        color: 'blue'
                      }, {
                        step: 'Bank Transfer',
                        days: '3-5 Days',
                        icon: Banknote,
                        color: 'purple'
                      }].map((item, index) => <motion.div key={index} initial={{
                        opacity: 0,
                        y: 20
                      }} animate={{
                        opacity: 1,
                        y: 0
                      }} transition={{
                        delay: 0.2 + index * 0.1
                      }} className="flex flex-col items-center text-center mb-8 md:mb-0 relative z-10">
                              <div className={`w-16 h-16 bg-${item.color}-100 rounded-full flex items-center justify-center mb-4`}>
                                <item.icon className={`w-8 h-8 text-${item.color}-600`} />
                              </div>
                              <div className="font-bold text-gray-900">{item.step}</div>
                              <div className={`text-sm text-${item.color}-600 font-semibold`}>{item.days}</div>
                            </motion.div>)}
                        </div>

                        {}
                        <div className="text-center">
                          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full">
                            <Clock className="w-5 h-5 text-white" />
                            <span className="text-white font-bold text-lg">{cms.Text_Total__5_10_Business_Days_86}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {}
                      <motion.div initial={{
                    opacity: 0,
                    x: -20
                  }} animate={{
                    opacity: 1,
                    x: 0
                  }} transition={{
                    delay: 0.3
                  }} className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 border border-blue-200 shadow-lg">
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                          <CreditCard className="w-6 h-6 text-blue-600" />{cms.Heading_Supported_Payment_Methods_87}</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {[{
                        name: cms.name_Visa_88,
                        icon: '💳'
                      }, {
                        name: cms.name_MasterCard_89,
                        icon: '💳'
                      }, {
                        name: cms.name_American_Express_90,
                        icon: '💳'
                      }, {
                        name: cms.name_PayPal_91,
                        icon: '🔗'
                      }].map((method, index) => <motion.div key={index} initial={{
                        opacity: 0,
                        scale: 0.9
                      }} animate={{
                        opacity: 1,
                        scale: 1
                      }} transition={{
                        delay: 0.4 + index * 0.1
                      }} className="bg-white p-4 rounded-xl border border-gray-200 text-center hover:shadow-md transition-shadow">
                              <div className="text-2xl mb-2">{method.icon}</div>
                              <div className="font-semibold text-gray-900">{method.name}</div>
                            </motion.div>)}
                        </div>
                      </motion.div>

                      {}
                      <motion.div initial={{
                    opacity: 0,
                    x: 20
                  }} animate={{
                    opacity: 1,
                    x: 0
                  }} transition={{
                    delay: 0.4
                  }} className="bg-gradient-to-br from-amber-50 to-white rounded-2xl p-8 border border-amber-200 shadow-lg">
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                          <Info className="w-6 h-6 text-amber-600" />{cms.Heading_Important_Notes_92}</h3>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                              <Info className="w-3 h-3 text-amber-600" />
                            </div>
                            <span className="text-gray-700">{cms.Text_Processing_time_starts_after_approval_93}</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                              <Info className="w-3 h-3 text-amber-600" />
                            </div>
                            <span className="text-gray-700">{cms.Text_Weekends_and_holidays_not_included_94}</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                              <Info className="w-3 h-3 text-amber-600" />
                            </div>
                            <span className="text-gray-700">{cms.Text_International_transfers_may_take_longer_95}</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                              <Info className="w-3 h-3 text-amber-600" />
                            </div>
                            <span className="text-gray-700">{cms.Text_Contact_us_if_refund_not_received_in_10_days_96}</span>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>}
              </AnimatePresence>
            </div>
          </div>

          {}
          <motion.div initial={{
          opacity: 0,
          y: 40
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.5
        }} className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white shadow-2xl">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="lg:w-2/3">
                <h3 className="text-2xl font-bold mb-4">{cms.Heading_Need_Help_with_Refunds__97}</h3>
                <p className="text-blue-100 mb-6">{cms.Description_Our_support_team_is_here_to_help_you_understand__98}</p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a href={`mailto:${webData.contact.infoEmail || webData.contact.supportEmail}`} className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors">
                    <Mail className="w-5 h-5" />{cms.Text_Email_Support_99}</a>
                  <a href={cms.href_tel__447883382815_100} className="inline-flex items-center justify-center gap-2 bg-blue-700 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-800 transition-colors border border-blue-500">
                    <Phone className="w-5 h-5" />{cms.Text_Call_Support_101}</a>
                </div>
              </div>
              <div className="lg:w-1/3 text-center lg:text-right">
                <div className="text-sm text-blue-200 mb-2">{webData.brand.name}{cms.Text_Refund_Policy_102}</div>
                <div className="text-2xl font-bold">{cms.Text_Transparent___Fair_103}</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>}
    </div>;
}
