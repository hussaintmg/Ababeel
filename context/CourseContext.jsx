"use client";

import { createContext, useState, useContext, useEffect } from "react";
import { createApiClient } from "@/utils/api";
import { toast } from "react-toastify";

const CourseContext = createContext();

export function CourseProvider({ children }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const api = createApiClient();

  // Fetch all courses
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/courses");
      if (response.data.success) {
        setCourses(response.data.courses || []);
        return response.data.courses || [];
      }
    } catch (error) {
      console.error("Failed to fetch courses:", error);
      setCourses([defaultCourses]);
    } finally {
      setLoading(false);
    }
    return [];
  };

  // Create new course
  const createCourse = async (courseData) => {
    try {
      const response = await api.post("/api/courses/create", courseData);
      if (response.data.success) {
        toast.success("Course created successfully!");
        // Add new course to the list
        setCourses((prev) => [response.data.course, ...prev]);
        return response.data.course;
      }
    } catch (error) {
      console.error("Failed to create course:", error);
      // Error is handled by interceptor
      throw error;
    }
  };

  // Delete course
  const deleteCourse = async (id) => {
    try {
      try {
        const response = await api.post("/api/courses/delete", { id });

        if (response.data.success) {
          toast.success("Course deleted successfully!");
          // Remove course from the list
          setCourses((prev) => prev.filter((course) => course.id !== id));
          return true;
        }
      } catch (error) {
        console.error("Failed to delete course:", error);
        throw error;
      }
    } catch (error) {
      console.error("Failed to delete course:", error);
      throw error;
    }
    return false;
  };

  // Refresh courses
  const refreshCourses = async () => {
    setRefreshing(true);
    await fetchCourses();
    setRefreshing(false);
  };

  // Initial load and auto-refresh
  useEffect(() => {
    fetchCourses();
  }, []);

  const value = {
    courses,
    loading,
    refreshing,
    fetchCourses,
    createCourse,
    deleteCourse,
    refreshCourses,
  };

  return (
    <CourseContext.Provider value={value}>{children}</CourseContext.Provider>
  );
}

export const useCourses = () => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error("useCourses must be used within a CourseProvider");
  }
  return context;
};
