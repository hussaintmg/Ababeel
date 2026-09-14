// Extracted from app/privacy-policy/page.jsx; original layouts with typed CMS content.
"use client";

import { useState } from "react";
import { Shield, Lock, Eye, Database, UserCheck, FileText, Mail, Phone, Building, Calendar, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import webData from "@/constants";
import defaults from "./privacy-policy.defaults.json";
export default function PublicPage(cmsProps = {}) {
  const cms = {
    ...defaults,
    ...cmsProps
  };
  const [activeSection, setActiveSection] = useState("overview");
  const [expandedSections, setExpandedSections] = useState(["data-collection"]);
  const toggleSection = sectionId => {
    setExpandedSections(prev => prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]);
  };
  const navigationItems = [{
    id: "overview",
    label: cms.label_Overview_1,
    icon: Shield
  }, {
    id: "data-collection",
    label: cms.label_Data_Collection_2,
    icon: Database
  }, {
    id: "data-usage",
    label: cms.label_Data_Usage_3,
    icon: Eye
  }, {
    id: "data-protection",
    label: cms.label_Data_Protection_4,
    icon: Lock
  }, {
    id: "user-rights",
    label: cms.label_Your_Rights_5,
    icon: UserCheck
  }];
  return <div className=" bg-gradient-to-b from-gray-50 to-white">
      {}
      {(cmsProps.section == null || cmsProps.section === 0) && <div className="relative bg-gradient-to-r from-blue-900 to-blue-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-40 right-10 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-6">
              <Shield className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{cms.Heading_Privacy___Data_Protection_Policy_6}</h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">{cms.Description_At_7}{webData.brand.name}{cms.Description___we_are_committed_to_protecting_your_privacy_an_8}</p>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white text-sm font-medium px-6 py-3 rounded-full">
              <Calendar className="w-4 h-4" />{cms.Text_Last_Updated__December_1__2024_9}</div>
          </div>
        </div>
      </div>}

      {}
      {(cmsProps.section == null || cmsProps.section === 1) && <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {}
          <div className="lg:w-1/4">
            <div className="sticky top-24 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{cms.Heading_Policy_Sections_10}</h3>
              <nav className="space-y-2">
                {navigationItems.map(item => {
                const Icon = item.icon;
                return <button key={item.id} onClick={() => setActiveSection(item.id)} className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${activeSection === item.id ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"}`}>
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>;
              })}
              </nav>
            </div>
          </div>

          {}
          <div className="lg:w-3/4">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              {}
              <div className="border-b border-gray-200 p-6">
                <div className="flex flex-wrap gap-2">
                  {navigationItems.map(item => {
                  const Icon = item.icon;
                  return <button key={item.id} onClick={() => setActiveSection(item.id)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${activeSection === item.id ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"}`}>
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </button>;
                })}
                </div>
              </div>

              {}
              <div className="p-6 md:p-8">
                {}
                {activeSection === "overview" && <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Shield className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">{cms.Heading_Privacy_Policy_Overview_11}</h2>
                        <p className="text-gray-600 mb-4">{cms.Description_Welcome_to_12}{webData.brand.name}{cms.Description__s_Privacy_Policy__This_document_outlines_how_we_13}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
                      <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100">
                        <div className="inline-flex p-3 bg-blue-100 rounded-lg mb-4">
                          <Lock className="w-6 h-6 text-blue-600" />
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2">{cms.Heading_Data_Security_14}</h4>
                        <p className="text-sm text-gray-600">{cms.Description_Advanced_encryption_and_security_measures_to_pro_15}</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl border border-green-100">
                        <div className="inline-flex p-3 bg-green-100 rounded-lg mb-4">
                          <Eye className="w-6 h-6 text-green-600" />
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2">{cms.Heading_Transparency_16}</h4>
                        <p className="text-sm text-gray-600">{cms.Description_Clear_communication_about_how_we_collect_and_use_17}</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl border border-purple-100">
                        <div className="inline-flex p-3 bg-purple-100 rounded-lg mb-4">
                          <UserCheck className="w-6 h-6 text-purple-600" />
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2">{cms.Heading_User_Control_18}</h4>
                        <p className="text-sm text-gray-600">{cms.Description_Full_control_over_your_personal_data_and_privacy_19}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-3">{cms.Heading_Key_Principles_20}</h3>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600">{cms.Text_We_never_sell_your_personal_data_to_third_partie_21}</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600">{cms.Text_We_collect_only_necessary_data_for_service_provi_22}</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600">{cms.Text_You_have_the_right_to_access__modify__or_delete__23}</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600">{cms.Text_All_data_transfers_are_encrypted_and_secure_24}</span>
                        </li>
                      </ul>
                    </div>
                  </div>}

                {}
                {activeSection === "data-collection" && <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Database className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">{cms.Heading_Data_We_Collect_25}</h2>
                        <p className="text-gray-600 mb-4">{cms.Description_We_collect_various_types_of_information_to_provi_26}</p>
                      </div>
                    </div>

                    {}
                    <div className="space-y-4">
                      {[{
                    id: "personal-info",
                    title: cms.title_Personal_Information_27,
                    content: cms.content_When_you_register_for_our_certificatio_28,
                    icon: UserCheck
                  }, {
                    id: "certification-data",
                    title: cms.title_Certification_Progress___Performance_29,
                    content: cms.content_We_track_your_course_progress__quiz_sc_30,
                    icon: FileText
                  }, {
                    id: "technical-data",
                    title: cms.title_Technical_Information_31,
                    content: cms.content_Automatically_collected_data_includes__32,
                    icon: Eye
                  }, {
                    id: "communication-data",
                    title: cms.title_Communication_Data_33,
                    content: cms.content_Records_of_our_communications_includin_34,
                    icon: Mail
                  }].map(item => {
                    const Icon = item.icon;
                    const isExpanded = expandedSections.includes(item.id);
                    return <div key={item.id} className="border border-gray-200 rounded-xl overflow-hidden">
                            <button onClick={() => toggleSection(item.id)} className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg">
                                  <Icon className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="font-semibold text-gray-900">
                                  {item.title}
                                </span>
                              </div>
                              {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                            </button>
                            {isExpanded && <div className="px-6 py-4 bg-white">
                                <p className="text-gray-600">{item.content}</p>
                              </div>}
                          </div>;
                  })}
                    </div>

                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                      <h4 className="font-bold text-gray-900 mb-3">{cms.Heading_Data_Minimization_Principle_35}</h4>
                      <p className="text-gray-600 mb-3">{cms.Description_We_adhere_to_the_data_minimization_principle__co_36}</p>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-600">{cms.Text_Adequate___sufficient_to_fulfill_the_specified_p_37}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-600">{cms.Text_Relevant___has_a_rational_link_to_the_purpose_38}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-600">{cms.Text_Limited___collected_for_specified__explicit_purp_39}</span>
                        </li>
                      </ul>
                    </div>
                  </div>}

                {}
                {activeSection === "data-usage" && <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Eye className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">{cms.Heading_How_We_Use_Your_Data_40}</h2>
                        <p className="text-gray-600 mb-4">{cms.Description_Your_data_is_used_solely_for_legitimate_business_41}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[{
                    title: cms.title_Certification_Delivery_42,
                    description: cms.description_To_provide_access_to_courses__track_pr_43,
                    color: "blue"
                  }, {
                    title: cms.title_Communication_44,
                    description: cms.description_To_send_course_updates__reminders__and_45,
                    color: "green"
                  }, {
                    title: cms.title_Service_Improvement_46,
                    description: cms.description_To_analyze_usage_patterns_and_enhance__47,
                    color: "purple"
                  }, {
                    title: cms.title_Compliance_48,
                    description: cms.description_To_meet_regulatory_requirements_and_ma_49,
                    color: "orange"
                  }, {
                    title: cms.title_Support_Services_50,
                    description: cms.description_To_provide_technical_support_and_resol_51,
                    color: "red"
                  }, {
                    title: cms.title_Research___Development_52,
                    description: cms.description_To_develop_new_certification_modules_a_53,
                    color: "indigo"
                  }].map((item, index) => <div key={index} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 rounded-lg bg-${item.color}-100`}>
                              <div className={`w-6 h-6 rounded-full bg-${item.color}-500 flex items-center justify-center`}>
                                <span className="text-white font-bold text-sm">
                                  {index + 1}
                                </span>
                              </div>
                            </div>
                            <h4 className="font-bold text-gray-900">
                              {item.title}
                            </h4>
                          </div>
                          <p className="text-gray-600 text-sm">
                            {item.description}
                          </p>
                        </div>)}
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="font-bold text-gray-900 mb-3">{cms.Heading_Legal_Basis_for_Processing_54}</h4>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-1">{cms.Heading_Contractual_Necessity_55}</h5>
                            <p className="text-gray-600 text-sm">{cms.Description_Processing_is_necessary_for_the_performance_of_o_56}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-1">{cms.Heading_Legitimate_Interest_57}</h5>
                            <p className="text-gray-600 text-sm">{cms.Description_Processing_is_necessary_for_our_legitimate_busin_58}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <UserCheck className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-1">{cms.Heading_Consent_59}</h5>
                            <p className="text-gray-600 text-sm">{cms.Description_Processing_based_on_your_explicit_consent_for_sp_60}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>}

                {}
                {activeSection === "data-protection" && <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Lock className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">{cms.Heading_Data_Protection_Measures_61}</h2>
                        <p className="text-gray-600 mb-4">{cms.Description_We_implement_robust_security_measures_to_protect_62}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                      {}

                      <div className="space-y-6">
                        <h3 className="text-xl font-bold text-gray-900">{cms.Heading_Protection_Framework_63}</h3>
                        <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100">
                          <h4 className="font-bold text-gray-900 mb-4">{cms.Heading_Our_Security_Standards_64}</h4>
                          <div className="space-y-4">
                            {["Regular security certification for all employees", "Data breach response protocol", "Secure coding practices", "Vulnerability management program", "Incident monitoring and logging", "Business continuity planning"].map((item, index) => <div key={index} className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                </div>
                                <span className="text-gray-700">{item}</span>
                              </div>)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-100">
                      <h4 className="font-bold text-gray-900 mb-3">{cms.Heading____Data_Retention_Policy_65}</h4>
                      <p className="text-gray-600 mb-3">{cms.Description_We_retain_personal_data_only_for_as_long_as_nece_66}</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="bg-white p-3 rounded-lg">
                          <div className="font-semibold text-gray-900 mb-1">{cms.Text_Certification_Records_67}</div>
                          <div className="text-gray-600">{cms.Text_7_years_from_completion_68}</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <div className="font-semibold text-gray-900 mb-1">{cms.Text_User_Accounts_69}</div>
                          <div className="text-gray-600">{cms.Text_2_years_after_last_activity_70}</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <div className="font-semibold text-gray-900 mb-1">{cms.Text_Financial_Data_71}</div>
                          <div className="text-gray-600">{cms.Text_10_years_for_tax_purposes_72}</div>
                        </div>
                      </div>
                    </div>
                  </div>}

                {}
                {activeSection === "user-rights" && <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <UserCheck className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">{cms.Heading_Your_Data_Protection_Rights_73}</h2>
                        <p className="text-gray-600 mb-4">{cms.Description_You_have_comprehensive_rights_regarding_your_per_74}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[{
                    title: cms.title_Right_to_Access_75,
                    description: cms.description_Request_copies_of_your_personal_data_76,
                    color: "blue",
                    icon: "👁️"
                  }, {
                    title: cms.title_Right_to_Rectification_77,
                    description: cms.description_Request_correction_of_inaccurate_data_78,
                    color: "green",
                    icon: "✏️"
                  }, {
                    title: cms.title_Right_to_Erasure_79,
                    description: cms.description_Request_deletion_of_your_personal_data_80,
                    color: "red",
                    icon: "🗑️"
                  }, {
                    title: cms.title_Right_to_Restriction_81,
                    description: cms.description_Request_restriction_of_processing_82,
                    color: "yellow",
                    icon: "⏸️"
                  }, {
                    title: cms.title_Right_to_Portability_83,
                    description: cms.description_Request_transfer_of_data_to_another_or_84,
                    color: "purple",
                    icon: "📤"
                  }, {
                    title: cms.title_Right_to_Object_85,
                    description: cms.description_Object_to_processing_of_your_personal__86,
                    color: "orange",
                    icon: "🚫"
                  }].map((right, index) => <div key={index} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-300">
                          <div className="flex items-start gap-4">
                            <div className="text-2xl">{right.icon}</div>
                            <div>
                              <h4 className="font-bold text-gray-900 mb-2">
                                {right.title}
                              </h4>
                              <p className="text-gray-600 text-sm">
                                {right.description}
                              </p>
                            </div>
                          </div>
                        </div>)}
                    </div>

                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                      <h4 className="font-bold text-gray-900 mb-4">{cms.Heading_How_to_Exercise_Your_Rights_87}</h4>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 font-bold">{cms.Text_1_88}</span>
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-1">{cms.Heading_Submit_Request_89}</h5>
                            <p className="text-gray-600 text-sm">{cms.Description_Contact_our_Data_Protection_Officer_via_email_or_90}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 font-bold">{cms.Text_2_91}</span>
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-1">{cms.Heading_Identity_Verification_92}</h5>
                            <p className="text-gray-600 text-sm">{cms.Description_We_ll_verify_your_identity_to_ensure_data_securi_93}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 font-bold">{cms.Text_3_94}</span>
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-1">{cms.Heading_Response_Timeline_95}</h5>
                            <p className="text-gray-600 text-sm">{cms.Description_We_respond_to_all_legitimate_requests_within_30__96}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>}
              </div>

              {}
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">{cms.Heading_Policy_Updates_97}</h4>
                    <p className="text-gray-600 text-sm">{cms.Description_We_may_update_this_privacy_policy_periodically___98}</p>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-900 font-semibold">{cms.Text_Version__3_2_99}</div>
                    <div className="text-gray-600">{cms.Text_Effective__December_1__2024_100}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>}

      <style jsx global>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>;
}
