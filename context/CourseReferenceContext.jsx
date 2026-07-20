"use client";

import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const CourseReferenceContext = createContext();

export const useCourseReference = () => {
  const context = useContext(CourseReferenceContext);
  if (!context) {
    throw new Error(
      "useCourseReference must be used within CourseReferenceProvider",
    );
  }
  return context;
};

export const CourseReferenceProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/course-ref", {
        withCredentials: true,
      });

      const data = response.data;

      if (data.success) {
        setCourses(data?.data);
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching courses:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch single course
  const fetchCourse = async (courseId) => {
    try {
      const response = await fetch(`/api/course-ref/${courseId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch course");
      }

      const data = await response.json();

      if (data.success) {
        return data.data;
      }
      return null;
    } catch (err) {
      console.error("Error fetching course:", err);
      return null;
    }
  };

  // Create new course
  const createCourse = async (courseData) => {
    try {
      const response = await axios.post("/api/course-ref/create", {
        courseData,
      });

      const data = await response.data;

      if (data.success) {
        // Refresh the courses list
        await fetchCourses();
        return { success: true, data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  //   // Update course
  //   const updateCourse = async (courseId, updates) => {
  //     try {
  //       const response = await fetch(`/api/course-ref/${courseId}`, {
  //         method: "PUT",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify(updates),
  //       });

  //       const data = await response.json();

  //       if (data.success) {
  //         // Update local state
  //         setCourses((prev) =>
  //           prev.map((course) =>
  //             course._id === courseId ? { ...course, ...updates } : course
  //           )
  //         );
  //         return { success: true, data: data.data };
  //       } else {
  //         return { success: false, error: data.error };
  //       }
  //     } catch (err) {
  //       return { success: false, error: err.message };
  //     }
  //   };

  //   // Delete course
  //   const deleteCourse = async (courseId) => {
  //     try {
  //       const response = await fetch(`/api/course-ref/${courseId}`, {
  //         method: "DELETE",
  //       });

  //       const data = await response.json();

  //       if (data.success) {
  //         // Remove from local state
  //         setCourses((prev) => prev.filter((course) => course._id !== courseId));
  //         return { success: true };
  //       } else {
  //         return { success: false, error: data.error };
  //       }
  //     } catch (err) {
  //       return { success: false, error: err.message };
  //     }
  //   };

  //   // Update course status
  //   const updateCourseStatus = async (courseId, status) => {
  //     return await updateCourse(courseId, { status });
  //   };

  // Add candidate to course

  // Add candidate to course
  const addCandidate = async (courseId, candidateData, userId) => {
    try {
      // Create FormData for file upload
      const formData = new FormData();

      // Add candidate data
      Object.keys(candidateData).forEach((key) => {
        if (key === "profilePicture" && candidateData[key]) {
          formData.append(key, candidateData[key]);
        } else if (key !== "profilePicture") {
          formData.append(key, candidateData[key]);
        }
      });

      // Add courseId and userId
      formData.append("courseId", courseId);
      formData.append("userId", userId || "");

      const response = await axios.post(
        "/api/course-ref/candidates/add",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      const data = await response.data;
      const updatedCourses = courses.map((course) => {
        if (course._id === courseId) {
          return {
            ...course,
            candidates: data.candidates.map((c) => c._id),
            candidatesCount: data.candidates.length,
          };
        }
        return course;
      });

      setCourses(updatedCourses);

      return {
        success: true,
        candidates: data.candidates,
        message: data.message || "Candidate added successfully",
      };
    } catch (error) {
      const backendMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to add candidate";
      return {
        success: false,
        error: backendMessage,
      };
    }
  };

  const updateCandidate = async (candidateId, candidateData, courseId) => {
    try {
      // Create FormData for file upload
      const formData = new FormData();

      // Add candidate data
      Object.keys(candidateData).forEach((key) => {
        if (key === "profilePicture" && candidateData[key]) {
          formData.append(key, candidateData[key]);
        } else if (
          key !== "profilePicture" &&
          candidateData[key] !== undefined &&
          candidateData[key] !== null
        ) {
          formData.append(key, candidateData[key]);
        }
      });

      // Add candidateId and courseId for identification
      formData.append("candidateId", candidateId);
      formData.append("courseId", courseId);

      const response = await axios.put(
        `/api/course-ref/candidates/update`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      const data = response.data;

      if (data.success) {
        // Update local candidates state with the updated candidate
        const updatedCandidate = data.candidate;

        // Update the specific candidate in the courses state
        const updatedCourses = courses.map((course) => {
          if (course._id === updatedCandidate.courseId) {
            return {
              ...course,
              candidates: course.candidates.map((cid) =>
                cid.toString() === candidateId ? candidateId : cid,
              ),
              // candidatesCount remains the same
            };
          }
          return course;
        });

        setCourses(updatedCourses);

        return {
          success: true,
          candidate: updatedCandidate,
          message: data.message || "Candidate updated successfully",
        };
      }
    } catch (error) {
      const backendMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to add candidate";
      return {
        success: false,
        error: backendMessage,
      };
    }
  };

  // Remove candidate from course
  const deleteCandidate = async (courseId, candidateId) => {
    try {
      let data;
      try {
        const response = await axios.delete(
          "/api/course-ref/candidates/delete",
          {
            data: { courseId, candidateId },
          },
        );
        data = response.data;
        if (data.success) {
          // Update local courses state
          const updatedCourses = courses.map((course) => {
            if (course._id === courseId) {
              // Remove candidate from course's candidates array
              const updatedCandidates = course.candidates.filter(
                (candId) => candId.toString() !== candidateId,
              );

              return {
                ...course,
                candidates: updatedCandidates,
                candidatesCount: updatedCandidates.length,
                updatedAt: new Date().toISOString(),
              };
            }
            return course;
          });

          setCourses(updatedCourses);
        } else {
          return {
            success: false,
            error: data.error || "Failed to delete candidate",
          };
        }
        return {
          success: true,
          message: data.message || "Candidate deleted successfully",
          deletedCandidate: data.deletedCandidate,
        };
      } catch (err) {
        console.log(err);
      }
    } catch (error) {
      console.error("Error deleting candidate:", error);
      return {
        success: false,
        error: error.message || "Failed to delete candidate",
      };
    }
  };

  // Filter courses
  const getFilteredCourses = (filters = {}) => {
    let filtered = [...courses];

    if (filters.status) {
      filtered = filtered.filter((course) => course.status === filters.status);
    }

    if (filters.trainerId) {
      filtered = filtered.filter(
        (course) => course.trainerId === filters.trainerId,
      );
    }

    if (filters.country) {
      filtered = filtered.filter(
        (course) => course.country === filters.country,
      );
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (course) =>
          course.courseName?.toLowerCase().includes(searchTerm) ||
          course.referenceNumber?.toLowerCase().includes(searchTerm) ||
          course.atcName?.toLowerCase().includes(searchTerm),
      );
    }

    return filtered;
  };

  // Get course by reference number
  const getCourseByReference = (referenceNumber) => {
    return courses.find((course) => course.referenceNumber === referenceNumber);
  };

  // Get user's courses
  const getUserCourses = (userId) => {
    return courses.filter(
      (course) => course.userId === userId || course.createdBy === userId,
    );
  };

  const updateCoursePayment = async (courseId, updates) => {
    try {
      const response = await axios.post(
        `/api/course-ref/${courseId}/payment`,
        updates,
      );
      const data = response.data;

      if (data.success) {
        // Update local state
        setCourses((prev) =>
          prev.map((course) =>
            course._id === courseId ? { ...course, ...updates } : course,
          ),
        );
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const addCandidateWithCSV = async (courseId, candidatesData, userId) => {
    try {
      const response = await axios.post(`/api/course-ref/candidates/csv`, {
        courseId,
        candidates: candidatesData,
        userId,
      });

      return response.data;
    } catch (error) {
      console.error("Error in bulk upload:", error);
      return {
        success: false,
        error:
          error.response?.data?.error ||
          error.message ||
          "Failed to upload candidates",
      };
    }
  };

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchCourses();
  }, []);

  // Context value
  const value = {
    courses,
    loading,
    error,
    fetchCourses,
    fetchCourse,
    createCourse,
    addCandidate,
    addCandidateWithCSV,
    updateCandidate,
    deleteCandidate,
    getFilteredCourses,
    getCourseByReference,
    getUserCourses,
    updateCoursePayment,
    refreshCourses: fetchCourses,
  };

  return (
    <CourseReferenceContext.Provider value={value}>
      {children}
    </CourseReferenceContext.Provider>
  );
};
