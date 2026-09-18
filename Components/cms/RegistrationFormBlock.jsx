"use client";

import React, { useState, useEffect } from "react";
import RegistrationForm from "@/app/registration/RegistrationForm";
import { Loader2 } from "lucide-react";

export default function RegistrationFormBlock({ p = {}, s = {}, data = null, sampleMode = false }) {
  const [courses, setCourses] = useState([]);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load courses and form fields
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [cRes, fRes] = await Promise.all([
          fetch("/api/courses?published=true&limit=100").then((r) => r.json()).catch(() => null),
          fetch("/api/registration/fields").then((r) => r.json()).catch(() => null),
        ]);

        if (isMounted) {
          if (cRes?.data) {
            setCourses(Array.isArray(cRes.data) ? cRes.data : cRes.data.courses || []);
          }
          if (fRes?.data) {
            setFields(Array.isArray(fRes.data) ? fRes.data : []);
          }
        }
      } catch (e) {
        console.warn("Could not load registration block data:", e?.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const isInsideContainer = s?._inContainer || false;

  // Determine initial course from data context, dynamic variable, or defaultCourse prop
  let initialCourse = null;
  if (data?.course) {
    initialCourse = data.course;
  } else if (p.defaultCourse && courses.length > 0) {
    initialCourse =
      courses.find(
        (c) =>
          c._id === p.defaultCourse ||
          (c.slug && c.slug.toLowerCase() === p.defaultCourse.toLowerCase())
      ) || null;
  }

  const formData = {
    fields: fields.length > 0 ? fields : (sampleMode ? [
      { key: "fullName", label: "Full Name", type: "text", required: true, width: "half" },
      { key: "email", label: "Email Address", type: "email", required: true, width: "half" },
      { key: "phone", label: "Phone Number", type: "phone", required: true, width: "half" },
      { key: "city", label: "City / Location", type: "text", required: false, width: "half" },
    ] : []),
    course: initialCourse,
    session: data?.session || null,
    courses: courses.length > 0 ? courses : (sampleMode && initialCourse ? [initialCourse] : []),
    copy: {
      submitLabel: p.submitLabel || "Submit Registration Request",
      paymentNotice: p.paymentNotice || "Our training team will review your application and confirm your enrollment place.",
      successTitle: p.successTitle || "Registration Received!",
      successMessage: p.successMessage || "Thank you for registering. Our team will verify your submission.",
    },
    config: {
      courseQueryParam: p.courseQueryParam || "course",
      allowChangeCourse: p.allowChangeCourse !== false,
      allowFlexibleIntake: p.allowFlexibleIntake !== false,
      showReceiptUpload: p.showReceiptUpload !== false,
      enableStripe: p.enableStripe !== false,
      isCompact: isInsideContainer,
    },
  };

  if (loading && courses.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 text-sm">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-blue-600" />
        Loading registration form...
      </div>
    );
  }

  return (
    <div className={`w-full ${isInsideContainer ? "p-0" : ""}`}>
      <RegistrationForm data={formData} />
    </div>
  );
}
