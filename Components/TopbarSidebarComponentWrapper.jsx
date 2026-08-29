"use client";

import React, { useState, useEffect } from "react";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import { usePath } from "@/context/PathContext";
import { useSiteContent } from "@/context/SiteContentContext";
import MaintenanceBar from "@/Components/cms/MaintenanceBar";
// import { qualificationsData } from "@/app/data/qualifications";

// const safetyCourses = Object.values(qualificationsData);

// const professionalDevItems = [
//   {
//     name: "CPD",
//     url: "/professional-dev/cpd",
//   },
//   {
//     name: "Our Professional Standards",
//     url: "/professional-dev/professional-standards",
//   },
//   {
//     name: "Flexible Learning Options",
//     url: "/professional-dev/flexible-learning",
//   },
//   {
//     name: "Networking Opportunities",
//     url: "/professional-dev/networking-opportunities",
//   },
//   {
//     name: "Skill Enhancement",
//     url: "/professional-dev/skill-enhancement",
//   },
// ];

// The built-in public navigation, used until the owner saves their own in the
// CMS. Kept in step with DEFAULT_GLOBAL_SETTINGS.topbar.navLinks so a site that
// has never opened the CMS and one that has both show the same menu.
const navLinks = [
  {
    name: "About",
    url: "/about-us",
    dropdown: [
      { name: "About Us", url: "/about-us" },
      { name: "Our Team", url: "/about/team" },
      { name: "Our Consultants", url: "/about/consultants" },
      { name: "Accreditations & Certifications", url: "/about/accreditations" },
    ],
  },
  { name: "Courses", url: "/courses" },
  { name: "Awarding Bodies", url: "/awarding-bodies" },
  { name: "Schedule", url: "/schedule" },
  { name: "Qualifications", url: "/qualification" },
  { name: "Certificate Verification", url: "/verify-certificate" },
  { name: "Contact Us", url: "/contact-us" },
];
const dashNavLinks = [
  { name: "Dashboard", url: "/dashboard" },
  {
    name: "References",
    dropdown: [
      { name: "New Reference", url: "/dashboard/course-reference/new" },
      { name: "All References", url: "/dashboard/course-reference/all" },
    ],
  },

  // Invoices, Transactions, Trainers, Deposit, and Training Resources removed.
];
const adminNavLinks = [
  { name: "Dashboard", url: "/admin" },
  { name: "Organizations", url: "/admin/organizations" },
  {
    name: "Default Courses",
    dropdown: [
      { name: "Add Course", url: "/admin/default-course/new" },
      {
        name: "Manage Courses",
        url: "/admin/default-course/all",
      },
    ],
  },
];
const ownerNavLinks = [
  { name: "Dashboard", url: "/owner" },
  { name: "Organizations", url: "/owner/organizations" },
  { name: "Users", url: "/owner/users" },
  {
    name: "Default Courses",
    dropdown: [
      { name: "Add Course", url: "/owner/default-course/new" },
      {
        name: "Manage Courses",
        url: "/owner/default-course/all",
      },
    ],
  },
  {
    name: "Training",
    dropdown: [
      { name: "Courses", url: "/owner/training/courses" },
      { name: "Course References", url: "/owner/training/sessions" },
      { name: "Awarding Bodies", url: "/owner/training/awarding-bodies" },
      { name: "Registrations", url: "/owner/registrations" },
    ],
  },
  { name: "Website CMS", url: "/owner/cms" },
];
export default function TopbarSidebarComponentWrapper() {
  const { isDashboard, isAdmin, isOwner, pathname, hasMounted } = usePath();
  const { settings } = useSiteContent();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleCloseSidebar = () => {
    setMobileOpen(false);
  };

  // Public navigation is CMS-managed; fall back to the built-in links if the
  // owner hasn't configured any.
  const publicNav =
    Array.isArray(settings?.topbar?.navLinks) && settings.topbar.navLinks.length > 0
      ? settings.topbar.navLinks
      : navLinks;

  // Purely a function of the current section, so it is derived during render
  // rather than mirrored into state by an effect.
  const TopbarLinks = isDashboard
    ? dashNavLinks
    : isAdmin
      ? adminNavLinks
      : isOwner
        ? ownerNavLinks
        : publicNav;

  return (
    <div className="sticky top-0 z-500">
      {/* Owner-only maintenance control strip */}
      <MaintenanceBar />
      {/* Topbar */}
      <Topbar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        navLinks={TopbarLinks}
      />
      {/* Sidebar */}
      <Sidebar
        isOpen={mobileOpen}
        onClose={handleCloseSidebar}
        navLinks={publicNav}
      />
    </div>
  );
}
