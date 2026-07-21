'use client';

import CmsPageContent from "@/Components/cms/CmsPageContent";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Scale, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  User,
  Building,
  Globe,
  Clock,
  BookOpen,
  Mail,
  ChevronRight,
  ChevronDown,
  FileCheck,
  Lock,
  Users,
  Target,
  Zap,
  Award,
  TrendingUp,
  HeartHandshake,
  CreditCard,
  PoundSterling,
  Copyright,
  Database,
  Gavel,
  MapPin,
  Phone,
  Mail as MailIcon,
  ExternalLink,
  Download,
  Printer,
  Eye,
  EyeOff,
  Search,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { webData } from '@/constants';

function TermsAndConditionsInner() {
  const [activeSection, setActiveSection] = useState('introduction');
  const [expandedArticles, setExpandedArticles] = useState(['1']);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const contentRef = useRef(null);

  // Mock business information - Replace with your actual details
  const businessInfo = {
    name: webData.brand.name,
    address: webData.contact.address,
    phone: webData.contact.phone,
    email: webData.contact.infoEmail
  };

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.body.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleArticle = (articleId) => {
    setExpandedArticles(prev =>
      prev.includes(articleId)
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    );
  };

  const navigationSections = [
    { id: 'introduction', label: 'Introduction', icon: FileText },
    { id: 'payment', label: 'Payment Terms', icon: CreditCard },
    { id: 'international', label: 'International Payments', icon: Globe },
    { id: 'ip', label: 'Intellectual Property', icon: Copyright },
    { id: 'data', label: 'Data Protection', icon: Database },
    { id: 'governing', label: 'Governing Law', icon: Gavel },
  ];

  // Terms sections data
  const termsSections = [
    {
      id: 'introduction',
      title: '1. Introduction',
      content: 'These terms and conditions govern the use of services provided by ' + businessInfo.name + ', a company registered in England and Wales.',
      details: [
        'Registered Office: ' + businessInfo.address,
        'These terms constitute a legally binding agreement between you (the customer) and ' + businessInfo.name,
        'By using our services, you acknowledge that you have read, understood, and agreed to be bound by these terms',
        'We reserve the right to update these terms at any time, with changes becoming effective upon posting on our website'
      ],
      icon: FileText,
      color: 'blue'
    },
    {
      id: 'payment',
      title: '2. Payment Terms',
      content: 'All payments for certification, assessment, and certification services are processed securely via Stripe Payment Systems.',
      details: [
        'Fees must be paid in full before access to any assessments or certifications is granted',
        'Payment confirmation will be sent via email within 24 hours of successful transaction',
        'For corporate clients, invoices will be issued with 30-day payment terms',
        'Late payments may incur additional administrative fees of £50 per month',
        'Refund requests must be submitted in writing within 14 days of purchase',
        'Digital products (online courses) are non-refundable once accessed'
      ],
      icon: CreditCard,
      color: 'green'
    },
    {
      id: 'international',
      title: '3. International Payments & Currencies',
      content: 'We accept payments in various currencies via Stripe to accommodate our international clients.',
      details: [
        'Accepted currencies: GBP (£), EUR (€), USD ($), CAD (C$), AUD (A$), NZD (NZ$)',
        'All prices displayed on our website are in GBP unless otherwise specified',
        'Currency conversion rates are applied by Stripe at the time of transaction',
        'Your bank or card issuer may charge additional conversion fees for which we are not responsible',
        'International transactions may be subject to additional verification for security purposes',
        'Refunds for international payments will be processed in the original currency of payment'
      ],
      icon: Globe,
      color: 'purple'
    },
    {
      id: 'ip',
      title: '4. Intellectual Property Rights',
      content: 'All certification materials, course content, logos, trademarks, and awarding criteria remain the sole and exclusive property of ' + businessInfo.name + '.',
      details: [
        'Certification materials are provided for individual use and may not be reproduced, distributed, or shared',
        'Unauthorized distribution of course materials is strictly prohibited and may result in legal action',
        'Certificates and qualifications are issued under license and remain our intellectual property',
        'You may not use our branding, logos, or trademarks without prior written permission',
        'All course content is copyright protected under UK and international law',
        'Breach of intellectual property rights may result in immediate termination of services and legal proceedings'
      ],
      icon: Copyright,
      color: 'amber'
    },
    {
      id: 'data',
      title: '5. Data Protection & Privacy',
      content: 'We process all personal data in strict accordance with the UK General Data Protection Regulation (GDPR) and the Data Protection Act 2018.',
      details: [
        'Your payment information is handled securely by Stripe and is never stored on our servers',
        'We retain personal data only for as long as necessary to provide our services and comply with legal obligations',
        'You have the right to access, correct, or delete your personal data at any time',
        'Certification records and certification data are stored securely for a minimum of 7 years as required by awarding bodies',
        'We implement appropriate technical and organizational measures to protect against unauthorized access',
        'For detailed information on how we handle your data, please refer to our Privacy Policy'
      ],
      icon: Database,
      color: 'indigo'
    },
    {
      id: 'governing',
      title: '6. Governing Law & Jurisdiction',
      content: 'These terms and conditions are governed by and construed in accordance with the laws of England and Wales.',
      details: [
        'Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts of England and Wales',
        'If any provision of these terms is found to be invalid, the remaining provisions shall remain in full force and effect',
        'Our failure to enforce any right or provision will not be considered a waiver of those rights',
        'These terms constitute the entire agreement between you and ' + businessInfo.name,
        'For international clients, these terms take precedence over any conflicting local legislation',
        'All communications regarding legal matters should be sent to our registered office address'
      ],
      icon: Gavel,
      color: 'red'
    }
  ];

  // Framer Motion variants
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
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const fadeInUp = {
    hidden: { y: 30, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.6 }
    }
  };

  const handleAcceptTerms = () => {
    setAcceptedTerms(true);
    // In a real application, you would save this to your database
    localStorage.setItem('termsAccepted', 'true');
  };

  const filteredSections = termsSections.filter(section => 
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.details.some(detail => detail.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-blue-50">
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 z-50">
        <motion.div 
          className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-red-600"
          style={{ width: `${scrollProgress}%` }}
          transition={{ type: "spring", stiffness: 100 }}
        />
      </div>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full"
              initial={{ 
                x: `${(i * 7) % 100}vw`,
                y: `${(i * 5) % 100}vh`,
                opacity: 0.3 
              }}
              animate={{
                y: ['0px', '-25px', '0px'],
                opacity: [0.3, 0.7, 0.3]
              }}
              transition={{
                // Index-derived like the offsets above; Math.random() here is
                // impure during render and varies between server and client.
                duration: 4 + ((i * 3) % 7) * 0.5,
                repeat: Infinity,
                delay: i * 0.1
              }}
            />
          ))}
        </div>

        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-6xl mx-auto"
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-12">
              <div className="lg:w-2/3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-3xl mb-6"
                >
                  <Scale className="w-10 h-10" />
                </motion.div>
                
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200"
                >
                  Terms & Conditions
                </motion.h1>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl text-blue-100 mb-6 leading-relaxed"
                >
                  Legal Agreement for {businessInfo.name}
                </motion.p>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-wrap items-center gap-3 text-sm"
                >
                  <span className="px-3 py-1 bg-white/10 rounded-full border border-white/20">UK Law Compliant</span>
                  <span className="px-3 py-1 bg-white/10 rounded-full border border-white/20">GDPR Ready</span>
                  <span className="px-3 py-1 bg-white/10 rounded-full border border-white/20">Secure Payments</span>
                </motion.div>
              </div>

              {/* Business Info Card */}
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="lg:w-1/3 w-full"
              >
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                  <h3 className="font-bold text-white text-lg mb-4">Registered Business</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Building className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-blue-100 font-medium">Company Name</p>
                        <p className="text-white">{businessInfo.name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-blue-100 font-medium">Registered Office</p>
                        <p className="text-white">{businessInfo.address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MailIcon className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-blue-100 font-medium">Contact Email</p>
                        <p className="text-white">{businessInfo.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Stats Bar */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {[
                { label: 'Last Updated', value: 'Jan 15, 2024', icon: Clock },
                { label: 'Version', value: '3.1', icon: FileCheck },
                { label: 'Sections', value: '6', icon: FileText },
                { label: 'Legal Status', value: 'Active', icon: Shield },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/10 rounded-lg">
                        <Icon className="w-4 h-4 text-blue-300" />
                      </div>
                      <div>
                        <p className="text-xs text-blue-200">{stat.label}</p>
                        <p className="text-white font-bold">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 -mt-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Static Navigation Sidebar */}
          <div className="lg:w-1/4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Navigation</h3>
              </div>
              
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search terms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              
              <nav className="space-y-2 mb-8">
                {navigationSections.map((section, index) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <motion.button
                      key={section.id}
                      onClick={() => {
                        setActiveSection(section.id);
                        document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 group ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 shadow-sm'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                        isActive ? 'bg-white' : 'bg-gray-100 group-hover:bg-gray-200'
                      }`}>
                        <Icon className={`w-4 h-4 ${
                          isActive ? 'text-blue-600' : 'text-gray-500'
                        }`} />
                      </div>
                      <span className="font-medium">{section.label}</span>
                      {isActive && (
                        <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                      )}
                    </motion.button>
                  );
                })}
              </nav>

              {/* Quick Actions */}
              <div className="space-y-3">
                <button
                  onClick={handleAcceptTerms}
                  className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                    acceptedTerms
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {acceptedTerms ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Terms Accepted
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Accept Terms
                    </>
                  )}
                </button>
                
                <Link
                  href="/privacy-policy"
                  className="w-full px-4 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  <Shield className="w-5 h-5" />
                  Privacy Policy
                </Link>
              </div>

              {/* Contact Info */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MailIcon className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{businessInfo.email}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{businessInfo.phone}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{businessInfo.address}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Content Area */}
          <div className="lg:w-3/4">
            <motion.div 
              ref={contentRef}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-8"
            >
              {/* Quick Summary Cards */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="inline-flex p-3 bg-blue-100 rounded-xl mb-4">
                    <PoundSterling className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Secure Payments</h4>
                  <p className="text-sm text-gray-600">
                    All transactions processed securely via Stripe with multiple currency support.
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl border border-green-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="inline-flex p-3 bg-green-100 rounded-xl mb-4">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">UK GDPR Compliant</h4>
                  <p className="text-sm text-gray-600">
                    Full compliance with UK GDPR and Data Protection Act 2018.
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl border border-purple-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="inline-flex p-3 bg-purple-100 rounded-xl mb-4">
                    <Copyright className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">IP Protected</h4>
                  <p className="text-sm text-gray-600">
                    All materials copyright protected under UK and international law.
                  </p>
                </div>
              </motion.div>

              {/* Terms Content */}
              <motion.div 
                variants={itemVariants}
                className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden"
              >
                {/* Mobile Navigation */}
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-4 lg:hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Terms & Conditions</h3>
                  </div>
                  <div className="flex overflow-x-auto gap-2 pb-2">
                    {navigationSections.map((section) => {
                      const Icon = section.icon;
                      return (
                        <button
                          key={section.id}
                          onClick={() => {
                            setActiveSection(section.id);
                            document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                            activeSection === section.id
                              ? 'bg-blue-100 text-blue-700'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {section.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Content Sections */}
                <div className="p-6 md:p-10">
                  {filteredSections.map((section, index) => (
                    <motion.section
                      key={section.id}
                      id={section.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.2 }}
                      className={`mb-12 pb-12 ${index < filteredSections.length - 1 ? 'border-b border-gray-200' : ''}`}
                    >
                      <div className="flex items-start gap-6 mb-8">
                        <div className={`p-4 bg-gradient-to-br from-${section.color}-100 to-${section.color}-50 rounded-2xl`}>
                          <section.icon className={`w-8 h-8 text-${section.color}-600`} />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                            {section.title}
                          </h2>
                          <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                            {section.content}
                          </p>
                          
                          {/* Interactive Details */}
                          <div className="space-y-4">
                            {section.details.map((detail, detailIndex) => (
                              <motion.div
                                key={detailIndex}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: detailIndex * 0.05 }}
                                className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-white hover:shadow-sm transition-all duration-300"
                              >
                                <div className={`w-6 h-6 rounded-full bg-${section.color}-100 flex items-center justify-center shrink-0 mt-0.5`}>
                                  <CheckCircle className={`w-3 h-3 text-${section.color}-600`} />
                                </div>
                                <span className="text-gray-700 flex-1">{detail}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Section-specific additional info */}
                      {section.id === 'payment' && (
                        <motion.div
                          variants={fadeInUp}
                          initial="hidden"
                          animate="visible"
                          className="mt-8"
                        >
                          <div className="bg-gradient-to-r from-green-50 to-white rounded-2xl border border-green-200 p-6">
                            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                              <CreditCard className="w-5 h-5 text-green-600" />
                              Payment Security
                            </h4>
                            <p className="text-gray-700 mb-4">
                              All payments are processed through Stripe, a PCI-DSS compliant payment processor. 
                              We never store your credit card information on our servers.
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">PCI DSS Level 1</span>
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">3D Secure</span>
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">Encrypted</span>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {section.id === 'data' && (
                        <motion.div
                          variants={fadeInUp}
                          initial="hidden"
                          animate="visible"
                          className="mt-8"
                        >
                          <div className="bg-gradient-to-r from-indigo-50 to-white rounded-2xl border border-indigo-200 p-6">
                            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                              <Database className="w-5 h-5 text-indigo-600" />
                              Your Data Rights
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h5 className="font-semibold text-gray-900 mb-2">Under UK GDPR you have:</h5>
                                <ul className="space-y-2 text-sm text-gray-700">
                                  <li className="flex items-start gap-2">
                                    <ChevronRight className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                    Right to access your data
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <ChevronRight className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                    Right to rectification
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <ChevronRight className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                    Right to erasure
                                  </li>
                                </ul>
                              </div>
                              <div>
                                <h5 className="font-semibold text-gray-900 mb-2">Our Commitments:</h5>
                                <ul className="space-y-2 text-sm text-gray-700">
                                  <li className="flex items-start gap-2">
                                    <ChevronRight className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                    Data Protection Officer appointed
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <ChevronRight className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                    Regular security audits
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <ChevronRight className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                    Breach notification procedures
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </motion.section>
                  ))}
                </div>

                {/* Footer Section */}
                <div className="border-t border-gray-200 p-6 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-2">Legal Disclaimer</h4>
                      <p className="text-sm text-gray-600">
                        This document constitutes the complete terms and conditions governing your use of our services. 
                        For any clarifications, please contact us at {businessInfo.email}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">3.1</div>
                          <div className="text-sm text-gray-600">Version</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Contact Card */}
              <motion.div
                variants={itemVariants}
                className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl"
              >
                <h3 className="text-2xl font-bold mb-4">Need Legal Clarification?</h3>
                <p className="text-blue-100 mb-6">
                  Contact our team for any questions regarding these terms and conditions.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link 
                    href={`mailto:${businessInfo.email}`}
                    className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
                  >
                    <Mail className="w-5 h-5" />
                    Email Us
                  </Link>
                  <Link 
                    href={`tel:${businessInfo.phone.replace(/[^0-9+]/g, '')}`}
                    className="inline-flex items-center justify-center gap-2 bg-blue-800 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-900 transition-colors shadow-lg border border-blue-700"
                  >
                    <Phone className="w-5 h-5" />
                    Call Us
                  </Link>
                </div>
              </motion.div>

              {/* Acceptance Banner */}
              <AnimatePresence>
                {!acceptedTerms && (
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="sticky bottom-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-2xl"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg mb-1">Important: Please Confirm</h4>
                          <p className="text-green-100">
                            By continuing to use our services, you must accept these Terms & Conditions.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleAcceptTerms}
                        className="bg-white text-green-600 font-bold px-6 py-3 rounded-xl hover:bg-green-50 transition-colors shadow-lg shrink-0"
                      >
                        I Accept Terms & Conditions
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default function TermsAndConditions(props) {
  return (
    <CmsPageContent pageKey="terms-of-services">
      <TermsAndConditionsInner {...props} />
    </CmsPageContent>
  );
}
