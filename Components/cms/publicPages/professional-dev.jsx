// Extracted from app/professional-dev/page.jsx; original layouts with typed CMS content.
"use client";

import { useEffect, useState } from "react";
import { professionalDevCategories as originalCategories } from "@/app/data/professional-dev";
import defaults from "./professional-dev.defaults.json";
export default function PublicPage(cmsProps = {}) {
  const cms = {
    ...defaults,
    ...cmsProps
  };
  const professionalDevCategories = (Array.isArray(cms.Programmes_1) ? cms.Programmes_1 : []).map(entry => ({
    ...entry,
    programs: (Array.isArray(entry.programs) ? entry.programs : []).map(entry => entry.value)
  })).map(item => ({
    ...item,
    icon: originalCategories.find(original => original.id === item.id)?.icon || originalCategories[0].icon
  }));
  const [activeTab, setActiveTab] = useState(professionalDevCategories[0]?.id || "cpd");
  useEffect(() => {
    console.log(activeTab);
  }, [activeTab]);
  const activeCategory = professionalDevCategories.find(cat => cat.id === activeTab);
  const formatContent = content => {
    return content.split("\n\n").map((paragraph, index) => {
      if (paragraph.trim() === "") return null;
      if (paragraph.includes(":") && !paragraph.startsWith("•")) {
        const [heading, ...rest] = paragraph.split(":");
        return <div key={index} className="mb-4">
            <h4 className="text-lg font-semibold text-green-700 mb-2">
              {heading.trim()}{cms.Heading___2}</h4>
            <p className="text-gray-700">{rest.join(":").trim()}</p>
          </div>;
      }
      if (paragraph.includes("•")) {
        const lines = paragraph.split("\n");
        return <div key={index} className="mb-4">
            {lines.map((line, lineIndex) => <div key={lineIndex} className="flex gap-2 mb-1">
                {line.trim().startsWith("•") ? <>
                    <span className="text-green-600 mt-1 shrink-0">{cms.Text___3}</span>
                    <span className="text-gray-700 grow">
                      {line.replace("•", "").trim()}
                    </span>
                  </> : <span className="text-gray-700">{line.trim()}</span>}
              </div>)}
          </div>;
      }
      return <p key={index} className="text-gray-700 mb-4">
          {paragraph}
        </p>;
    });
  };
  return <div className="min-h-screen bg-linear-to-b from-gray-50 to-white">
      {}
      {(cmsProps.section == null || cmsProps.section === 0) && <div className="container mx-auto px-4 py-8 md:py-12">
        {}
        <div className="text-center mb-10 md:mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">{cms.Heading_Professional_Development_Programs_4}</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">{cms.Description_Comprehensive_development_opportunities_for_safe_5}</p>
        </div>
        <div className="mb-10 md:mb-16">
          <div className="flex flex-wrap gap-3 justify-center">
            {professionalDevCategories.map(category => {
            const IconComponent = category.icon;
            const isActive = activeTab === category.id;
            return <button key={category.id} onClick={() => setActiveTab(category.id)} className={`
                    flex items-center justify-center
                    px-5 py-4
                    min-w-35 max-w-50
                    w-full
                    sm:w-auto
                    rounded-xl
                    transition-all duration-300
                    hover:scale-105 hover:shadow-lg
                    ${isActive ? "bg-linear-to-r from-green-600 to-emerald-600 text-white shadow-lg transform scale-105" : "bg-white text-gray-700 border-2 border-gray-200 hover:border-green-300 hover:shadow-md"}
                  `}>
                  <div className="flex flex-col items-center justify-center gap-2 w-full">
                    <IconComponent className="w-5 h-5 shrink-0" />
                    <span className="font-semibold text-sm text-center leading-tight">
                      {category.title}
                    </span>
                  </div>
                </button>;
          })}
          </div>
        </div>

        {}
        {activeCategory && <div id="content" className="max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
              {}
              <div className="bg-linear-to-r from-green-50 to-emerald-50 p-8 border-b border-gray-200">
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  {}
                  <div className="bg-linear-to-r from-green-600 to-emerald-600 p-5 rounded-2xl shadow-lg">
                    <activeCategory.icon className="w-10 h-10 text-white" />
                  </div>

                  {}
                  <div className="grow">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                      <div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">
                          {activeCategory.title}
                        </h2>
                        <p className="text-green-700 font-medium text-lg">
                          {activeCategory.tagline}
                        </p>
                      </div>
                      <div className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold">
                        {activeCategory.programs.length}{cms.Text_Programs_6}</div>
                    </div>
                    <p className="text-gray-700 text-lg leading-relaxed">
                      {activeCategory.description}
                    </p>
                  </div>
                </div>
              </div>

              {}
              <div className="p-8">
                {}
                <div className="mb-10">
                  <div className="prose prose-lg max-w-none">
                    {formatContent(activeCategory.content)}
                  </div>
                </div>

                {}
                <div className="mt-10 pt-8 border-t border-gray-200">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">{cms.Heading_Available_Programs_7}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeCategory.programs.map((program, index) => <button key={index} onClick={() => {
                  setActiveTab(professionalDevCategories.filter(p => {
                    if (p?.title === program) return p;
                  })[0]?.id);
                  const scrollToContent = () => {
                    const el = document.getElementById("content");
                    if (!el) return;
                    const y = el.getBoundingClientRect().top + window.scrollY - 50;
                    window.scrollTo({
                      top: y,
                      behavior: "smooth"
                    });
                  };
                  scrollToContent();
                }} className="cursor-pointer group flex items-center gap-4 p-5 rounded-xl border-2 border-gray-200 hover:border-green-300 hover:bg-green-50/50 transition-all duration-300">
                        <div className="shrink-0">
                          <div className="w-3 h-3 rounded-full bg-linear-to-r from-green-500 to-emerald-500 group-hover:scale-125 transition-transform duration-300" />
                        </div>
                        <div>
                          <div className="cursor-pointer text-lg font-semibold text-gray-800 group-hover:text-green-700 transition-colors duration-300">
                            {program}
                          </div>
                        </div>
                      </button>)}
                  </div>
                </div>
              </div>
            </div>
          </div>}

        {}
        <div className="mt-12 md:mt-20">
          <div className="text-center mb-10">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">{cms.Heading_Platform_Statistics_8}</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">{cms.Description_Connecting_professionals_with_quality_developmen_9}</p>
          </div>

          <div className="grid grid-cols-1 min-[300px]:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[{
            value: `${professionalDevCategories.reduce((acc, cat) => acc + cat.programs.length, 0)}+`,
            label: cms.label_Total_Programs_10,
            icon: "📚",
            color: "from-green-500 to-emerald-500"
          }, {
            value: `${professionalDevCategories.length}`,
            label: cms.label_Categories_11,
            icon: "🏷️",
            color: "from-blue-500 to-cyan-500"
          }, {
            value: cms.value_50__12,
            label: cms.label_Verified_Providers_13,
            icon: "✅",
            color: "from-purple-500 to-violet-500"
          }, {
            value: cms.value_Safety_14,
            label: cms.label_Industry_Focus_15,
            icon: "🛡️",
            color: "from-orange-500 to-amber-500"
          }].map((stat, index) => <div key={index} className="bg-white rounded-2xl shadow-lg p-6 text-center border border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="text-4xl mb-3">{stat.icon}</div>
                <div className={`text-3xl font-bold bg-linear-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                  {stat.value}
                </div>
                <div className="text-gray-700 font-medium">{stat.label}</div>
              </div>)}
          </div>
        </div>
      </div>}
    </div>;
}
