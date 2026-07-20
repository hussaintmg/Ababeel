'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useHasMounted from '@/utils/useHasMounted';
import { 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign,
  Calendar,
  FileText,
  Shield,
  TrendingUp,
  Percent,
  CreditCard,
  Mail,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Banknote,
  Receipt,
  HandCoins,
  Coins,
  CalendarDays,
  Scale,
  FileCheck,
  BookOpen,
  Calculator,
  BadgeCheck,
  TrendingDown,
  Globe,
  Phone,
  HelpCircle,
  ReceiptText,
  FileDigit,
  Download,
  Award,
  Users
} from 'lucide-react';
import { webData } from '@/constants';

export default function RefundPolicy() {
  const [activeTab, setActiveTab] = useState('cancellation');
  const [progress, setProgress] = useState(0);
  // True from hydration onward, which is what the mount animation was using
  // setIsVisible(true) in an effect to express.
  const isVisible = useHasMounted();

  // Formatted on the client only: the server and the browser can sit in
  // different time zones, so producing this during SSR risks a hydration
  // mismatch. Empty until mounted, matching the previous initial state.
  const currentDate = isVisible
    ? new Date().toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '';

  useEffect(() => {
    const timer = setTimeout(() => setProgress(100), 500);
    return () => clearTimeout(timer);
  }, []);

  // Scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const current = window.scrollY;
      setProgress(Math.min(100, (current / total) * 100));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const tabs = [
    { id: 'cancellation', label: 'Cancellation Policy', icon: CalendarDays },
    { id: 'digital', label: 'Digital Materials', icon: FileText },
    { id: 'company', label: 'Company Cancellation', icon: Shield },
    { id: 'processing', label: 'Processing', icon: RefreshCw },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
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
    hidden: { opacity: 0, scale: 0.95 },
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
    hidden: { y: 40, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        duration: 0.7,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/30">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              background: `radial-gradient(circle, ${
                i % 3 === 0 ? 'rgba(59, 130, 246, 0.05)' : 
                i % 3 === 1 ? 'rgba(139, 92, 246, 0.05)' : 
                'rgba(16, 185, 129, 0.05)'
              }, transparent)`
            }}
            initial={{ 
              x: `${(i * 10) % 100}vw`,
              y: `${(i * 8) % 100}vh`,
              width: 80 + (i * 10),
              height: 80 + (i * 10),
              opacity: 0
            }}
            animate={{
              y: [`${(i * 8) % 100}vh`, `${((i * 8) + 15) % 100}vh`, `${(i * 8) % 100}vh`],
              opacity: [0.1, 0.15, 0.1],
            }}
            transition={{
              duration: 20 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5
            }}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1.5 z-50 bg-gray-100">
        <motion.div 
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 30 }}
        />
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
        <div className="relative container mx-auto px-4 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="max-w-6xl mx-auto text-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
              className="inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-sm rounded-3xl mb-8"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw className="w-12 h-12 text-blue-300" />
              </motion.div>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-200 to-purple-200"
            >
              Refund Policy
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              Transparent and fair refund process designed for our international clients at {webData.brand.name}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, type: "spring" }}
              className="inline-flex flex-col sm:flex-row items-center gap-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6"
            >
              <div className="text-center">
                <div className="text-3xl font-bold">Today</div>
                <div className="text-sm text-blue-200">{currentDate}</div>
              </div>
              
              <div className="h-12 w-px bg-white/20 hidden sm:block"></div>
              
              <div className="text-center">
                <div className="text-3xl font-bold">International</div>
                <div className="text-sm text-blue-200">Multi-Currency Support</div>
              </div>
              
              <div className="h-12 w-px bg-white/20 hidden sm:block"></div>
              
              <div className="text-center">
                <div className="text-3xl font-bold">Fair</div>
                <div className="text-sm text-blue-200">Clear Terms</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 -mt-10 relative">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-6xl mx-auto"
        >
          {/* Quick Stats Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
            {[
              { 
                icon: Percent, 
                value: '100%', 
                label: '14+ Days Before', 
                sublabel: 'Full Refund',
                color: 'emerald',
                delay: 0
              },
              { 
                icon: Calculator, 
                value: '50%', 
                label: '7-14 Days Before', 
                sublabel: 'Partial Refund',
                color: 'amber',
                delay: 0.1
              },
              { 
                icon: XCircle, 
                value: '0%', 
                label: '< 7 Days Before', 
                sublabel: 'No Refund',
                color: 'rose',
                delay: 0.2
              },
              { 
                icon: Clock, 
                value: '5-10', 
                label: 'Processing Days', 
                sublabel: 'Via Stripe',
                color: 'blue',
                delay: 0.3
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: stat.delay }}
                whileHover={{ y: -5 }}
                className={`bg-white rounded-2xl p-6 shadow-lg border border-${stat.color}-100`}
              >
                <div className={`inline-flex p-3 bg-${stat.color}-100 rounded-xl mb-4`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="font-semibold text-gray-900">{stat.label}</div>
                <div className="text-sm text-gray-600">{stat.sublabel}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Main Policy Content */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Tabs Navigation */}
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="flex overflow-x-auto scrollbar-hide">
                {tabs.map((tab, index) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <motion.button
                      key={tab.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setActiveTab(tab.id)}
                      className={`shrink-0 px-6 py-4 font-medium text-sm md:text-base flex items-center gap-3 transition-all duration-300 relative ${
                        isActive
                          ? 'text-blue-700 bg-white border-b-2 border-blue-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6 md:p-10 min-h-[600px]">
              <AnimatePresence mode="wait">
                {/* Cancellation by Client Tab */}
                {activeTab === 'cancellation' && (
                  <motion.div
                    key="cancellation"
                    variants={tabContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-8"
                  >
                    <div className="flex items-start gap-6">
                      <div className="p-4 bg-blue-100 rounded-2xl">
                        <CalendarDays className="w-10 h-10 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                          1. Cancellation by the Client
                        </h2>
                        <p className="text-lg text-gray-600 mb-6">
                          Requests for cancellations made more than 14 days before the start of a certification course 
                          or assessment are eligible for a full refund, minus a small administrative fee of £50.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Full Refund Card */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-6 border border-emerald-200 shadow-lg"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-emerald-100 rounded-xl">
                            <CheckCircle className="w-6 h-6 text-emerald-600" />
                          </div>
                          <span className="px-3 py-1 text-sm font-bold bg-emerald-100 text-emerald-700 rounded-full">
                            {">"} 14 Days
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Standard Refund</h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <span className="text-gray-700">Full refund available</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-emerald-500" />
                            <span className="text-gray-700">Minus £50 admin fee</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-500" />
                            <span className="text-gray-700">Processed within 14 days</span>
                          </div>
                        </div>
                      </motion.div>

                      {/* Partial Refund Card */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-amber-50 to-white rounded-2xl p-6 border border-amber-200 shadow-lg"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-amber-100 rounded-xl">
                            <Percent className="w-6 h-6 text-amber-600" />
                          </div>
                          <span className="px-3 py-1 text-sm font-bold bg-amber-100 text-amber-700 rounded-full">
                            7-14 Days
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Partial Refund</h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Percent className="w-4 h-4 text-amber-500" />
                            <span className="text-gray-700">50% refund available</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-500" />
                            <span className="text-gray-700">Valid period only</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-amber-500" />
                            <span className="text-gray-700">No-shows excluded</span>
                          </div>
                        </div>
                      </motion.div>

                      {/* No Refund Card */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-br from-rose-50 to-white rounded-2xl p-6 border border-rose-200 shadow-lg"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-rose-100 rounded-xl">
                            <XCircle className="w-6 h-6 text-rose-600" />
                          </div>
                          <span className="px-3 py-1 text-sm font-bold bg-rose-100 text-rose-700 rounded-full">
                            {"<"} 7 Days
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">No Refund</h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-rose-500" />
                            <span className="text-gray-700">No refund available</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-rose-500" />
                            <span className="text-gray-700">Includes no-shows</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-500" />
                            <span className="text-gray-700">Consider rescheduling</span>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Timeline Visualization */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200"
                    >
                      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <Clock className="w-6 h-6 text-blue-600" />
                        Cancellation Timeline
                      </h3>
                      <div className="relative">
                        <div className="flex items-center justify-between mb-8 relative">
                          {/* Timeline Line */}
                          <div className="absolute top-6 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 rounded-full"></div>
                          
                          {[
                            { days: '14+', color: 'emerald', label: 'Full Refund' },
                            { days: '7-14', color: 'amber', label: '50% Refund' },
                            { days: '< 7', color: 'rose', label: 'No Refund' }
                          ].map((point, index) => (
                            <div key={index} className="relative z-10 text-center">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.5 + index * 0.1 }}
                                className={`w-12 h-12 bg-${point.color}-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg`}
                              >
                                <div className="text-white font-bold">{point.days}</div>
                              </motion.div>
                              <div className="font-semibold text-gray-900">{point.label}</div>
                              <div className="text-sm text-gray-600">{point.days} Days</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {/* Digital Materials Tab */}
                {activeTab === 'digital' && (
                  <motion.div
                    key="digital"
                    variants={tabContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-8"
                  >
                    <div className="flex items-start gap-6">
                      <div className="p-4 bg-purple-100 rounded-2xl">
                        <FileText className="w-10 h-10 text-purple-600" />
                      </div>
                      <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                          2. Digital Materials & Certification
                        </h2>
                        <p className="text-lg text-gray-600 mb-6">
                          Once digital certification materials have been accessed or a certification/award has been issued, 
                          no refunds will be granted.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Digital Materials Card */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-8 border border-purple-200 shadow-lg"
                      >
                        <div className="flex items-center gap-4 mb-6">
                          <div className="p-3 bg-purple-100 rounded-xl">
                            <Download className="w-6 h-6 text-purple-600" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900">Digital Materials Policy</h3>
                        </div>
                        <div className="space-y-4">
                          <div className="p-4 bg-white rounded-xl border border-purple-100">
                            <div className="flex items-center gap-3 mb-2">
                              <XCircle className="w-5 h-5 text-rose-500" />
                              <span className="font-semibold text-gray-900">No Refunds After Access</span>
                            </div>
                            <p className="text-gray-600">
                              Once you access digital certification materials, refunds are no longer available.
                            </p>
                          </div>
                          <div className="p-4 bg-white rounded-xl border border-purple-100">
                            <div className="flex items-center gap-3 mb-2">
                              <BookOpen className="w-5 h-5 text-blue-500" />
                              <span className="font-semibold text-gray-900">Preview Available</span>
                            </div>
                            <p className="text-gray-600">
                              Review course outlines and sample materials before purchase.
                            </p>
                          </div>
                          <div className="p-4 bg-white rounded-xl border border-purple-100">
                            <div className="flex items-center gap-3 mb-2">
                              <FileDigit className="w-5 h-5 text-green-500" />
                              <span className="font-semibold text-gray-900">Lifetime Access</span>
                            </div>
                            <p className="text-gray-600">
                              Once purchased, digital materials remain accessible indefinitely.
                            </p>
                          </div>
                        </div>
                      </motion.div>

                      {/* Certification Card */}
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-amber-50 to-white rounded-2xl p-8 border border-amber-200 shadow-lg"
                      >
                        <div className="flex items-center gap-4 mb-6">
                          <div className="p-3 bg-amber-100 rounded-xl">
                            <Award className="w-6 h-6 text-amber-600" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900">Certification Policy</h3>
                        </div>
                        <div className="space-y-4">
                          <div className="p-4 bg-white rounded-xl border border-amber-100">
                            <div className="flex items-center gap-3 mb-2">
                              <XCircle className="w-5 h-5 text-rose-500" />
                              <span className="font-semibold text-gray-900">No Refunds After Issuance</span>
                            </div>
                            <p className="text-gray-600">
                              Once certification is issued, refunds cannot be processed.
                            </p>
                          </div>
                          <div className="p-4 bg-white rounded-xl border border-amber-100">
                            <div className="flex items-center gap-3 mb-2">
                              <BadgeCheck className="w-5 h-5 text-green-500" />
                              <span className="font-semibold text-gray-900">Verification Available</span>
                            </div>
                            <p className="text-gray-600">
                              All certificates include unique verification codes.
                            </p>
                          </div>
                          <div className="p-4 bg-white rounded-xl border border-amber-100">
                            <div className="flex items-center gap-3 mb-2">
                              <FileCheck className="w-5 h-5 text-blue-500" />
                              <span className="font-semibold text-gray-900">Digital & Physical</span>
                            </div>
                            <p className="text-gray-600">
                              Receive both digital certificate and optional physical copy.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Important Notice */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-6 border border-amber-200"
                    >
                      <div className="flex items-start gap-4">
                        <AlertTriangle className="w-6 h-6 text-amber-600 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2">Important Notice</h4>
                          <p className="text-gray-700">
                            We strongly recommend reviewing all course materials and requirements before making a purchase. 
                            Once digital content is accessed or certification is issued, the transaction is considered complete.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {/* Company Cancellation Tab */}
                {activeTab === 'company' && (
                  <motion.div
                    key="company"
                    variants={tabContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-8"
                  >
                    <div className="flex items-start gap-6">
                      <div className="p-4 bg-green-100 rounded-2xl">
                        <Shield className="w-10 h-10 text-green-600" />
                      </div>
                      <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                           3. Cancellation by {webData.brand.name}
                        </h2>
                        <p className="text-lg text-gray-600 mb-6">
                          If we must cancel a session due to unforeseen circumstances, clients will be offered 
                          a full refund or the option to reschedule to the next available date.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Full Refund Option */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-8 border border-green-200 shadow-lg"
                      >
                        <div className="flex items-center gap-4 mb-6">
                          <div className="p-3 bg-green-100 rounded-xl">
                            <DollarSign className="w-6 h-6 text-green-600" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900">Full Refund Option</h3>
                        </div>
                        <div className="space-y-4">
                          <div className="p-4 bg-white rounded-xl border border-green-100">
                            <div className="flex items-center gap-3 mb-2">
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <span className="font-semibold text-gray-900">100% Money Back</span>
                            </div>
                            <p className="text-gray-600">
                              Complete refund of all fees paid for the cancelled session.
                            </p>
                          </div>
                          <div className="p-4 bg-white rounded-xl border border-green-100">
                            <div className="flex items-center gap-3 mb-2">
                              <CreditCard className="w-5 h-5 text-blue-500" />
                              <span className="font-semibold text-gray-900">Original Payment Method</span>
                            </div>
                            <p className="text-gray-600">
                              Refund processed back to your original payment method.
                            </p>
                          </div>
                          <div className="p-4 bg-white rounded-xl border border-green-100">
                            <div className="flex items-center gap-3 mb-2">
                              <Clock className="w-5 h-5 text-purple-500" />
                              <span className="font-semibold text-gray-900">Priority Processing</span>
                            </div>
                            <p className="text-gray-600">
                              Expedited processing within 3-5 business days.
                            </p>
                          </div>
                        </div>
                      </motion.div>

                      {/* Reschedule Option */}
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 border border-blue-200 shadow-lg"
                      >
                        <div className="flex items-center gap-4 mb-6">
                          <div className="p-3 bg-blue-100 rounded-xl">
                            <Calendar className="w-6 h-6 text-blue-600" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900">Reschedule Option</h3>
                        </div>
                        <div className="space-y-4">
                          <div className="p-4 bg-white rounded-xl border border-blue-100">
                            <div className="flex items-center gap-3 mb-2">
                              <CalendarDays className="w-5 h-5 text-blue-500" />
                              <span className="font-semibold text-gray-900">Next Available Date</span>
                            </div>
                            <p className="text-gray-600">
                              Transfer your booking to the next scheduled session.
                            </p>
                          </div>
                          <div className="p-4 bg-white rounded-xl border border-blue-100">
                            <div className="flex items-center gap-3 mb-2">
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <span className="font-semibold text-gray-900">No Additional Cost</span>
                            </div>
                            <p className="text-gray-600">
                              Reschedule at no extra charge or administrative fees.
                            </p>
                          </div>
                          <div className="p-4 bg-white rounded-xl border border-blue-100">
                            <div className="flex items-center gap-3 mb-2">
                              <Users className="w-5 h-5 text-purple-500" />
                              <span className="font-semibold text-gray-900">Priority Placement</span>
                            </div>
                            <p className="text-gray-600">
                              Guaranteed spot in the next available session.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Unforeseen Circumstances */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8 border border-gray-200"
                    >
                      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                        Unforeseen Circumstances
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                          { icon: '⚡', title: 'Technical Issues', desc: 'Platform failures or system outages' },
                          { icon: '👨‍🏫', title: 'Instructor Unavailability', desc: 'Unexpected illness or emergencies' },
                          { icon: '🌍', title: 'Force Majeure', desc: 'Natural disasters or events beyond control' },
                          { icon: '🔧', title: 'Venue Issues', desc: 'Unexpected venue closures' },
                          { icon: '📊', title: 'Low Enrollment', desc: 'Insufficient participants for session' },
                          { icon: '⚠️', title: 'Safety Concerns', desc: 'Health or safety regulations' }
                        ].map((item, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 + index * 0.05 }}
                            className="bg-white p-4 rounded-xl border border-gray-200 text-center hover:shadow-md transition-shadow"
                          >
                            <div className="text-2xl mb-2">{item.icon}</div>
                            <div className="font-semibold text-gray-900 mb-1">{item.title}</div>
                            <div className="text-sm text-gray-600">{item.desc}</div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {/* Processing Tab */}
                {activeTab === 'processing' && (
                  <motion.div
                    key="processing"
                    variants={tabContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-8"
                  >
                    <div className="flex items-start gap-6">
                      <div className="p-4 bg-indigo-100 rounded-2xl">
                        <RefreshCw className="w-10 h-10 text-indigo-600" />
                      </div>
                      <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                          4. Processing Refunds
                        </h2>
                        <p className="text-lg text-gray-600 mb-6">
                          Approved refunds will be processed back to the original payment method (Stripe) 
                          within 5–10 business days.
                        </p>
                      </div>
                    </div>

                    {/* Processing Timeline */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-8 border border-indigo-200 shadow-lg"
                    >
                      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <Clock className="w-6 h-6 text-indigo-600" />
                        Processing Timeline
                      </h3>
                      
                      <div className="relative">
                        {/* Timeline */}
                        <div className="flex flex-col md:flex-row items-start justify-between mb-12 relative">
                          {/* Connecting Line */}
                          <div className="absolute top-6 left-6 right-6 h-0.5 md:h-0.5 md:top-12 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500"></div>
                          
                          {[
                            { step: 'Approval', days: '1-2 Days', icon: CheckCircle, color: 'emerald' },
                            { step: 'Processing', days: '1-3 Days', icon: RefreshCw, color: 'blue' },
                            { step: 'Bank Transfer', days: '3-5 Days', icon: Banknote, color: 'purple' },
                          ].map((item, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 + index * 0.1 }}
                              className="flex flex-col items-center text-center mb-8 md:mb-0 relative z-10"
                            >
                              <div className={`w-16 h-16 bg-${item.color}-100 rounded-full flex items-center justify-center mb-4`}>
                                <item.icon className={`w-8 h-8 text-${item.color}-600`} />
                              </div>
                              <div className="font-bold text-gray-900">{item.step}</div>
                              <div className={`text-sm text-${item.color}-600 font-semibold`}>{item.days}</div>
                            </motion.div>
                          ))}
                        </div>

                        {/* Total Time */}
                        <div className="text-center">
                          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full">
                            <Clock className="w-5 h-5 text-white" />
                            <span className="text-white font-bold text-lg">Total: 5-10 Business Days</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Payment Methods */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 border border-blue-200 shadow-lg"
                      >
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                          <CreditCard className="w-6 h-6 text-blue-600" />
                          Supported Payment Methods
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { name: 'Visa', icon: '💳' },
                            { name: 'MasterCard', icon: '💳' },
                            { name: 'American Express', icon: '💳' },
                            { name: 'PayPal', icon: '🔗' },
                          ].map((method, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.4 + index * 0.1 }}
                              className="bg-white p-4 rounded-xl border border-gray-200 text-center hover:shadow-md transition-shadow"
                            >
                              <div className="text-2xl mb-2">{method.icon}</div>
                              <div className="font-semibold text-gray-900">{method.name}</div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>

                      {/* Important Notes */}
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gradient-to-br from-amber-50 to-white rounded-2xl p-8 border border-amber-200 shadow-lg"
                      >
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                          <Info className="w-6 h-6 text-amber-600" />
                          Important Notes
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                              <Info className="w-3 h-3 text-amber-600" />
                            </div>
                            <span className="text-gray-700">Processing time starts after approval</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                              <Info className="w-3 h-3 text-amber-600" />
                            </div>
                            <span className="text-gray-700">Weekends and holidays not included</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                              <Info className="w-3 h-3 text-amber-600" />
                            </div>
                            <span className="text-gray-700">International transfers may take longer</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                              <Info className="w-3 h-3 text-amber-600" />
                            </div>
                            <span className="text-gray-700">Contact us if refund not received in 10 days</span>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white shadow-2xl"
          >
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="lg:w-2/3">
                <h3 className="text-2xl font-bold mb-4">Need Help with Refunds?</h3>
                <p className="text-blue-100 mb-6">
                  Our support team is here to help you understand our refund policy and process any refund requests.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a 
                    href={`mailto:${webData.contact.infoEmail || webData.contact.supportEmail}`}
                    className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    Email Support
                  </a>
                  <a 
                    href="tel:+447883382815"
                    className="inline-flex items-center justify-center gap-2 bg-blue-700 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-800 transition-colors border border-blue-500"
                  >
                    <Phone className="w-5 h-5" />
                    Call Support
                  </a>
                </div>
              </div>
              <div className="lg:w-1/3 text-center lg:text-right">
                <div className="text-sm text-blue-200 mb-2">{webData.brand.name} Refund Policy</div>
                <div className="text-2xl font-bold">Transparent & Fair</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}