"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronDown,
  Search,
  User,
  Camera,
  Edit,
  Trash2,
  X,
  Plus,
} from "lucide-react";
import { fetchCountries } from "@/utils/countries";
import { useCourseReference } from "@/context/CourseReferenceContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import ConfirmationModal from "@/Components/ConfirmationModal";
import { useInvoices } from "@/context/InvoiceContext";

export default function AddCandidatesPage() {
  const { id: courseId } = useParams();
  const { user } = useAuth();
  const { fetchInvoices } = useInvoices();
  const router = useRouter();

  const {
    courses,
    addCandidate,
    updateCandidate,
    deleteCandidate,
    addCandidateWithCSV,
  } = useCourseReference();
  const [course, setCourse] = useState({});

  useEffect(() => {
    if (courses.length) {
      const foundCourse = courses.find((c) => c._id === courseId);
      setCourse(foundCourse || {});
    }
  }, [courses, courseId]);

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [allCountries, setAllCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [editingCandidate, setEditingCandidate] = useState(null);

  // Confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState(null);
  const [deleteCandidateInfo, setDeleteCandidateInfo] = useState(null);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadStats, setUploadStats] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [parsedData, setParsedData] = useState([]);
  const uploadFileInputRef = useRef(null);

  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    id: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    country: "",
    email: "",
    assessmentMarks1: "",
    assessmentMarks2: "",
    marks: "",
    profilePicture: null,
  });

  const [profilePreview, setProfilePreview] = useState(null);

  useEffect(() => {
    if (courseId) {
      fetchCourseAndCandidates();
    }
  }, [courseId]);

  useEffect(() => {
    loadCountries();
  }, []);

  const fetchCourseAndCandidates = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`/api/course-ref/candidates`, {
        courseId,
      });
      const data = res.data;

      if (data.success) {
        setCandidates(data.candidates);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch candidates");
    } finally {
      setLoading(false);
    }
  };

  const loadCountries = async () => {
    try {
      const countries = await fetchCountries();
      if (Array.isArray(countries)) {
        setAllCountries(countries);
        setFilteredCountries(countries);
      } else {
        console.error("Countries data is not an array:", countries);
        setAllCountries([]);
        setFilteredCountries([]);
      }
    } catch (error) {
      console.error("Error loading countries:", error);
      setAllCountries([]);
      setFilteredCountries([]);
    }
  };

  const handleCountrySearch = (searchTerm) => {
    setCountrySearch(searchTerm);

    if (searchTerm.trim() === "") {
      setFilteredCountries(allCountries);
    } else {
      const filtered = allCountries.filter((country) =>
        country.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredCountries(filtered);
    }
  };

  const selectCountry = (country) => {
    setFormData({ ...formData, country: country.name });
    setShowCountryDropdown(false);
    setCountrySearch("");
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.warn("File size should be less than 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.warn("Please select an image file");
        return;
      }

      setFormData({ ...formData, profilePicture: file });

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "assessmentMarks1" || name === "assessmentMarks2") {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue > 50) {
        newValue = "50";
        toast.warn(
          `${name.replace(
            "assessmentMarks",
            "Assessment Marks ",
          )} cannot exceed 50`,
        );
      }
    }

    const updatedFormData = { ...formData, [name]: newValue };
    setFormData(updatedFormData);

    if (name === "assessmentMarks1" || name === "assessmentMarks2") {
      const marks1 =
        parseFloat(
          name === "assessmentMarks1" ? newValue : formData.assessmentMarks1,
        ) || 0;
      const marks2 =
        parseFloat(
          name === "assessmentMarks2" ? newValue : formData.assessmentMarks2,
        ) || 0;
      const sum = marks1 + marks2;

      if (!isNaN(sum)) {
        const marks = (marks1 + marks2).toFixed(1);

        setFormData({
          ...updatedFormData,
          marks,
        });
      }
    }
  };

  const validateForm = () => {
    if (!formData.id) {
      toast.error("ID is required");
      return false;
    }
    if (!formData.firstName.trim()) {
      toast.error("First Name is required");
      return false;
    }
    if (!formData.lastName.trim()) {
      toast.error("Last Name is required");
      return false;
    }
    if (!formData.dateOfBirth) {
      toast.error("Date of Birth is required");
      return false;
    }
    if (!formData.country.trim()) {
      toast.error("Country is required");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (
      !formData.assessmentMarks1 ||
      isNaN(parseFloat(formData.assessmentMarks1))
    ) {
      toast.error("Please enter valid Assessment Marks 1");
      return false;
    }
    if (
      !formData.assessmentMarks2 ||
      isNaN(parseFloat(formData.assessmentMarks2))
    ) {
      toast.error("Please enter valid Assessment Marks 2");
      return false;
    }

    const marks1 = parseFloat(formData.assessmentMarks1);
    const marks2 = parseFloat(formData.assessmentMarks2);

    if (marks1 > 50 || marks2 > 50) {
      toast.error("Assessment marks cannot exceed 50");
      return false;
    }

    return true;
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const result = await addCandidate(courseId, formData, user?._id);

      if (result.success) {
        setCandidates(result.candidates || []);
        resetForm();
        toast.success(result.message || "Candidate added successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        toast.error(result.error || "Failed to add candidate", {
          position: "top-right",
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error("Error adding candidate:", error);
      toast.error("Failed to add candidate", {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setSubmitting(false);
      fetchInvoices();
    }
  };

  const resetForm = () => {
    setFormData({
      id: "",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      country: "",
      email: "",
      assessmentMarks1: "",
      assessmentMarks2: "",
      marks: "",
      profilePicture: null,
    });
    setProfilePreview(null);
    setEditingCandidate(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEditCandidate = (candidate) => {
    setEditingCandidate(candidate);
    setFormData({
      id: candidate.traineeId,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      dateOfBirth: candidate.dateOfBirth?.split("T")[0] || "",
      country: candidate.country || "",
      email: candidate.email || "",
      assessmentMarks1: candidate.assessmentMarks1?.toString() || "",
      assessmentMarks2: candidate.assessmentMarks2?.toString() || "",
      marks: candidate.marks?.toString() || "",
      profilePicture: null,
    });
    setProfilePreview(candidate.profile?.url || null);
  };

  const handleUpdateCandidate = async (e) => {
    e.preventDefault();

    if (!editingCandidate || !validateForm()) return;

    setSubmitting(true);

    try {
      const candidateData = {
        id: formData.id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        country: formData.country,
        email: formData.email,
        assessmentMarks1: formData.assessmentMarks1,
        assessmentMarks2: formData.assessmentMarks2,
        marks: formData.marks,
        profilePicture: formData.profilePicture,
      };

      const result = await updateCandidate(
        editingCandidate._id,
        candidateData,
        courseId,
      );

      if (result.success) {
        setCandidates((prevCandidates) =>
          prevCandidates.map((candidate) =>
            candidate._id === editingCandidate._id
              ? result.candidate
              : candidate,
          ),
        );

        resetForm();

        toast.success(result.message || "Candidate updated successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        toast.error(result.error || "Failed to update candidate", {
          position: "top-right",
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error("Error updating candidate:", error);
      toast.error("An unexpected error occurred", {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (candidate) => {
    setCandidateToDelete(candidate._id);
    setDeleteCandidateInfo({
      name: `${candidate.firstName} ${candidate.lastName}`,
      email: candidate.email,
    });
    setShowDeleteModal(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!courseId || !candidateToDelete) {
      toast.error("Missing information for deletion", {
        position: "top-right",
        autoClose: 3000,
      });
      setShowDeleteModal(false);
      return;
    }

    try {
      const result = await deleteCandidate(courseId, candidateToDelete);

      if (result.success) {
        setCandidates((prevCandidates) =>
          prevCandidates.filter(
            (candidate) => candidate._id !== candidateToDelete,
          ),
        );

        if (editingCandidate && editingCandidate._id === candidateToDelete) {
          resetForm();
        }

        toast.success(`${deleteCandidateInfo.name} deleted successfully!`, {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        toast.error(result.error || "Failed to delete candidate", {
          position: "top-right",
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error("Error in delete handler:", error);
      toast.error("An unexpected error occurred", {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setShowDeleteModal(false);
      setCandidateToDelete(null);
      setDeleteCandidateInfo(null);
      fetchInvoices();
    }
  };

  // Close delete modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setCandidateToDelete(null);
    setDeleteCandidateInfo(null);
  };

  const handleSubmitAllCandidates = async () => {
    if (candidates.length === 0) {
      toast.warning("Please add at least one candidate before proceeding", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    // No payment step: finishing takes the user straight to their course
    // reference, where candidate ID cards and certificates can be downloaded.
    toast.success("Candidates saved. You can now download their documents.", {
      position: "top-right",
      autoClose: 4000,
    });
    router.push(`/dashboard/course-reference/${courseId}/candidates/edit`);
  };

  const handleNext = () => {
    handleSubmitAllCandidates();
  };

  const handleUploadClick = () => {
    setShowUploadModal(true);
    setUploadFile(null);
    setUploadStats(null);
    setParsedData([]);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadStats(null);
    setParsedData([]);
    if (uploadFileInputRef.current) {
      uploadFileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload only CSV files");
      if (uploadFileInputRef.current) {
        uploadFileInputRef.current.value = "";
      }
      return;
    }

    // Check file size
    if (file.size > process.env.NEXT_PUBLIC_MAX_FILE_SIZE_IN_MB * 1024 * 1024) {
      toast.error(`File size should be less than ${process.env.NEXT_PUBLIC_MAX_FILE_SIZE_IN_MB}MB`);
      if (uploadFileInputRef.current) {
        uploadFileInputRef.current.value = "";
      }
      return;
    }

    setUploadFile(file);
    parseFile(file);
  };

  const parseFile = async (file) => {
    setUploadLoading(true);
    setUploadStats(null);

    try {
      const reader = new FileReader();

      reader.onload = async (e) => {
        const content = e.target.result;
        let parsed = [];
        let errors = 0;
        let validRows = 0;
        let missingRequiredColumns = false;

        if (file.name.endsWith(".csv")) {
          // Parse CSV
          const lines = content.split("\n");
          if (lines.length < 2) {
            toast.error("CSV file is empty or invalid");
            setUploadLoading(false);
            return;
          }

          const headers = lines[0].split(",").map((h) =>
            h
              .trim()
              .toLowerCase()
              .replace(/^["']|["']$/g, ""),
          );

          // Required columns that must exist
          const requiredColumns = [
            "id",
            "firstname",
            "lastname",
            "dateofbirth",
            "country",
            "email",
            "assessmentmarks1",
            "assessmentmarks2",
          ];

          // Expected headers mapping (for flexibility in column names)
          const headerMap = {
            id: ["id", "traineeid", "studentid", "candidateid", "ID"],
            firstname: ["firstname", "first name", "fname", "First Name"],
            lastname: ["lastname", "last name", "lname", "Last Name"],
            dateofbirth: [
              "dateofbirth",
              "dob",
              "birthdate",
              "date of birth",
              "Date of Birth",
            ],
            country: ["country", "nationality", "Country"],
            email: ["email", "e-mail", "emailaddress", "Email"],
            assessmentmarks1: [
              "assessmentmarks1",
              "marks1",
              "assessment1",
              "a1",
              "Assessment Marks 1",
            ],
            assessmentmarks2: [
              "assessmentmarks2",
              "marks2",
              "assessment2",
              "a2",
              "Assessment Marks 2",
            ],
          };

          // Check if at least one required column exists
          let foundColumns = {};
          let hasRequiredColumns = false;

          requiredColumns.forEach((required) => {
            const variations = headerMap[required];
            const found = headers.some((header) =>
              variations.some((variation) => header === variation),
            );
            if (found) {
              hasRequiredColumns = true;
            }
          });

          if (!hasRequiredColumns) {
            toast.error(
              "CSV file doesn't match the required format. Please use the sample CSV template.",
            );
            setUploadStats({
              total: 0,
              valid: 0,
              errors: 0,
              message: "Invalid CSV format. Headers don't match.",
            });
            setUploadLoading(false);
            return;
          }

          // Map headers to our format
          const columnMapping = {};
          headers.forEach((header, index) => {
            const cleanHeader = header.trim().toLowerCase();

            for (const [key, variations] of Object.entries(headerMap)) {
              const match = variations.some(
                (v) => v.trim().toLowerCase() === cleanHeader,
              );

              if (match) {
                columnMapping[index] = key;
                break;
              }
            }
          });

          // Check if we have mapping for all required columns
          const mappedColumns = Object.values(columnMapping);
          const missingColumns = requiredColumns.filter(
            (col) => !mappedColumns.includes(col),
          );

          if (missingColumns.length > 0) {
            toast.warning(
              `Missing columns: ${missingColumns.join(", ")}. Some data may not be imported correctly.`,
            );
          }

          // Parse each row (skip header row)
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;

            // Handle quoted CSV values properly
            const values = lines[i].match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
            const rowData = {};
            let valid = true;
            let errorMessages = [];

            // Map values to fields
            Object.entries(columnMapping).forEach(([index, field]) => {
              let value = values[index]?.trim() || "";
              // Remove quotes if present
              value = value.replace(/^["']|["']$/g, "");
              rowData[field] = value;
            });

            // Validate required fields exist
            for (const field of requiredColumns) {
              if (!rowData[field] || rowData[field] === "") {
                valid = false;
                errorMessages.push(`Missing ${field}`);
                break;
              }
            }

            // Email validation
            if (rowData.email && !/^\S+@\S+\.\S+$/.test(rowData.email)) {
              valid = false;
              errorMessages.push("Invalid email format");
            }

            // Marks validation
            if (rowData.assessmentmarks1) {
              const num = parseFloat(rowData.assessmentmarks1);
              if (isNaN(num) || num < 0 || num > 50) {
                valid = false;
                errorMessages.push("Assessment marks 1 must be between 0-50");
              }
            }

            if (rowData.assessmentmarks2) {
              const num = parseFloat(rowData.assessmentmarks2);
              if (isNaN(num) || num < 0 || num > 50) {
                valid = false;
                errorMessages.push("Assessment marks 2 must be between 0-50");
              }
            }

            // Date validation
            if (rowData.dateofbirth) {
              const dob = rowData.dateofbirth.trim();

              let day, month, year;

              if (dob.includes("/")) {
                const parts = dob.split("/");
                if (parts.length === 3) {
                  day = parts[0];
                  month = parts[1];
                  year = parts[2];
                }
              } else if (dob.includes("-")) {
                const parts = dob.split("-");
                if (parts[0].length === 4) {
                  year = parts[0];
                  month = parts[1];
                  day = parts[2];
                } else {
                  day = parts[0];
                  month = parts[1];
                  year = parts[2];
                }
              }

              const parsedDate = new Date(year, month - 1, day);

              if (!year || isNaN(parsedDate.getTime())) {
                valid = false;
                errorMessages.push("Invalid date format");
              } else {
                const yyyy = parsedDate.getFullYear();
                const mm = String(parsedDate.getMonth() + 1).padStart(2, "0");
                const dd = String(parsedDate.getDate()).padStart(2, "0");

                rowData.dateofbirth = `${yyyy}-${mm}-${dd}`;
              }
            }

            if (valid) {
              parsed.push(rowData);
              validRows++;
            } else {
              errors++;
              console.error(`Row ${i} errors:`, errorMessages);
            }
          }
        }

        setParsedData(parsed);
        setUploadStats({
          total: parsed.length + errors,
          valid: validRows,
          errors: errors,
        });

        if (validRows === 0) {
          toast.error(
            "No valid rows found in the CSV file. Please check the format.",
          );
        } else if (errors > 0) {
          toast.warning(
            `${validRows} valid rows found. ${errors} rows have errors.`,
          );
        } else {
          toast.success(`Successfully parsed ${validRows} rows!`);
        }

        setUploadLoading(false);
      };

      reader.onerror = () => {
        toast.error("Error reading file");
        setUploadLoading(false);
      };

      reader.readAsText(file);
    } catch (error) {
      console.error("Error parsing file:", error);
      toast.error("Failed to parse file. Please check the format.");
      setUploadLoading(false);
    }
  };

  const handleSaveUploadedData = async () => {
    if (!parsedData.length) {
      toast.error("No valid data to save");
      return;
    }

    setSubmitting(true);

    try {
      const result = await addCandidateWithCSV(courseId, parsedData, user?._id);

      if (result.success) {
        // Refresh candidates list
        await fetchCourseAndCandidates();

        toast.success(result.message || "Candidates added successfully!");

        // Close modal and reset
        closeUploadModal();
      } else {
        toast.error(
          result.error || result.message || "Failed to add candidates",
        );

        // Show detailed errors if any
        if (result.results?.failed?.length > 0) {
          console.error("Failed candidates:", result.results.failed);
          result.results.failed.forEach((item) => {
            const d = item.data || {};

            const name =
              `${d.firstName || d.firstname || ""} ${d.lastName || d.lastname || ""}`.trim();
            const id = d.id || "N/A";
            const email = d.email || "";

            toast.error(
              `${name} (ID: ${id}${email ? `, Email: ${email}` : ""}) - ${item.error}`,
            );
          });
        }
      }
    } catch (error) {
      console.error("Error saving candidates:", error);
      toast.error("Failed to save candidates");
    } finally {
      setSubmitting(false);
    }
  };

  const downloadSampleCSV = () => {
    // Sample CSV content
    const sampleData = [
      [
        "ID",
        "First Name",
        "Last Name",
        "Date of Birth",
        "Country",
        "Email",
        "Assessment Marks 1",
        "Assessment Marks 2",
      ],
      [
        "1001",
        "John",
        "Doe",
        "1995-05-15",
        "United States",
        "john.doe@example.com",
        "45",
        "48",
      ],
      [
        "1002",
        "Jane",
        "Smith",
        "1998-08-22",
        "United Kingdom",
        "jane.smith@example.com",
        "42",
        "47",
      ],
      [
        "1003",
        "Ahmed",
        "Khan",
        "1996-03-10",
        "UAE",
        "ahmed.khan@example.com",
        "38",
        "44",
      ],
      [
        "1004",
        "Maria",
        "Garcia",
        "1997-11-30",
        "Spain",
        "maria.garcia@example.com",
        "49",
        "46",
      ],
      [
        "1005",
        "Wei",
        "Zhang",
        "1995-09-18",
        "China",
        "wei.zhang@example.com",
        "41",
        "43",
      ],
    ];

    // Convert to CSV string
    const csvContent = sampleData.map((row) => row.join(",")).join("\n");

    // Create BOM for UTF-8 to handle special characters
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    // Create download link
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", "sample_candidates.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!course || Object.keys(course).length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-2">
            Course not found
          </h2>
          <button
            onClick={() => router.back()}
            className="text-blue-500 hover:text-blue-700"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Add Candidates to Course
                </h1>
                <p className="text-gray-600 mt-2">
                  {course.courseName} - {course.referenceNumber}
                </p>
                <p className="text-gray-500 mt-1">
                  Added Candidates:{" "}
                  <span className="font-semibold">{candidates.length}</span>
                </p>
              </div>
              <button
                onClick={handleNext}
                disabled={candidates.length === 0}
                className={`px-6 py-3 rounded-lg font-medium lg:block hidden ${
                  candidates.length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Finish
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {editingCandidate ? "Edit Candidate" : "Add New Candidate"}
                  </h2>
                </div>

                <form
                  onSubmit={
                    editingCandidate
                      ? handleUpdateCandidate
                      : handleAddCandidate
                  }
                >
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Picture
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-300">
                          {profilePreview ? (
                            <img
                              src={profilePreview}
                              alt="Profile Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={triggerFileInput}
                          className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors shadow-md"
                        >
                          <Camera className="h-4 w-4" />
                        </button>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>

                      <div className="flex-1">
                        <p className="text-sm text-gray-500">
                          Upload a clear photo of the candidate. Max size: {process.env.NEXT_PUBLIC_MAX_FILE_SIZE_IN_MB}MB
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Supported formats: JPG, PNG, GIF
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* ... form fields remain the same ... */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ID *
                      </label>
                      <input
                        type="text"
                        name="id"
                        value={formData.id}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter ID"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter first name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter last name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        lang="en-GB"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        max={new Date().toISOString().split("T")[0]}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country *
                      </label>
                      <div className="relative">
                        <div className="flex items-center">
                          <input
                            type="text"
                            value={formData.country}
                            readOnly
                            onClick={() =>
                              setShowCountryDropdown(!showCountryDropdown)
                            }
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer bg-white"
                            placeholder="Select Country"
                            required
                          />

                          <div className="absolute right-0 flex items-center pr-3 space-x-1">
                            <button
                              type="button"
                              onClick={() =>
                                setShowCountryDropdown(!showCountryDropdown)
                              }
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <ChevronDown
                                className={`h-4 w-4 text-gray-500 transition-transform ${
                                  showCountryDropdown ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {showCountryDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            <div className="p-2 border-b border-gray-200">
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <Search className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                  type="text"
                                  value={countrySearch}
                                  onChange={(e) =>
                                    handleCountrySearch(e.target.value)
                                  }
                                  className="pl-9 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                  placeholder="Search countries..."
                                />
                              </div>
                            </div>

                            <ul>
                              {Array.isArray(filteredCountries) &&
                              filteredCountries.length > 0 ? (
                                filteredCountries.map((country) => (
                                  <li key={`${country.code}-${country.name}`}>
                                    <button
                                      type="button"
                                      onClick={() => selectCountry(country)}
                                      className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center gap-3 ${
                                        formData.country === country.name
                                          ? "bg-blue-50 font-medium"
                                          : ""
                                      }`}
                                    >
                                      <span className="text-lg">
                                        {country.flag}
                                      </span>
                                      <span>{country.name}</span>
                                    </button>
                                  </li>
                                ))
                              ) : (
                                <li className="px-4 py-3 text-sm text-gray-500 text-center">
                                  No countries found
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter email address"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assessment Marks 1 * (max 50)
                      </label>
                      <input
                        type="number"
                        name="assessmentMarks1"
                        value={formData.assessmentMarks1}
                        onChange={handleInputChange}
                        min="0"
                        max="50"
                        step="0.1"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="0 - 50"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum: 50 marks
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assessment Marks 2 * (max 50)
                      </label>
                      <input
                        type="number"
                        name="assessmentMarks2"
                        value={formData.assessmentMarks2}
                        onChange={handleInputChange}
                        min="0"
                        max="50"
                        step="0.1"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="0 - 50"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum: 50 marks
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Marks
                      </label>
                      <input
                        type="text"
                        name="marks"
                        value={formData.marks}
                        readOnly
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Sum of Assessment Marks 1 & 2 (max 100)
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end gap-5">
                    {editingCandidate && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="text-sm text-white flex items-center gap-1 bg-orange-500 hover:bg-orange-600 p-3 rounded-lg"
                      >
                        <X className="h-4 w-4" />
                        Cancel Edit
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${
                        submitting
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          {editingCandidate ? "Updating..." : "Adding..."}
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          {editingCandidate
                            ? "Update Candidate"
                            : "Add Candidate"}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 my-6 lg:hidden block">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Bulk Upload
                </h2>
                <button
                  onClick={handleUploadClick}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Plus className="h-5 w-5" />
                  Upload CSV
                </button>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Bulk upload multiple candidates at once
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Added Candidates ({candidates.length})
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Photo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Country
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Marks
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {candidates.length === 0 ? (
                        <tr>
                          <td
                            colSpan="6"
                            className="px-6 py-12 text-center text-gray-500"
                          >
                            <User className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                            <p>No candidates added yet</p>
                            <p className="text-sm mt-1">
                              Add your first candidate using the form above
                            </p>
                          </td>
                        </tr>
                      ) : (
                        candidates.map((candidate) => (
                          <tr key={candidate._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100">
                                {candidate.profile?.url ? (
                                  <img
                                    src={candidate.profile.url}
                                    alt={`${candidate.firstName} ${candidate.lastName}`}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center">
                                    <User className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {candidate.firstName} {candidate.lastName}
                              </div>
                              <div className="text-xs text-gray-500">
                                DOB:{" "}
                                {new Date(
                                  candidate.dateOfBirth,
                                ).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {candidate.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {candidate.country}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                Total:{" "}
                                <span className="font-semibold">
                                  {candidate.marks}/100
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                (A1: {candidate.assessmentMarks1} | A2:{" "}
                                {candidate.assessmentMarks2})
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditCandidate(candidate)}
                                  className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded hover:bg-blue-50"
                                  title="Edit Candidate"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => openDeleteModal(candidate)}
                                  className="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-50"
                                  title="Delete Candidate"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Course Summary
                </h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Course Name</p>
                    <p className="font-medium">{course.courseName}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Reference Number</p>
                    <p className="font-medium">{course.referenceNumber}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Sequence ID</p>
                    <p className="font-medium">{course.sequenceId}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Course Price</p>
                    <p className="font-medium">
                      {course.currencySymbol}
                      {course.coursePrice?.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">ATC Center</p>
                    <p className="font-medium">{course.atcName}</p>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500">Candidates Added</p>
                      <p className="font-medium text-lg">{candidates.length}</p>
                    </div>

                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              (candidates.length / 50) * 100,
                              100,
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {candidates.length} of unlimited candidates
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200 lg:hidden">
                    <button
                      onClick={handleNext}
                      disabled={candidates.length === 0}
                      className={`w-full py-3 rounded-lg font-medium ${
                        candidates.length === 0
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      Finish
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 mt-6 lg:block hidden">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Bulk Upload
                </h2>
                <button
                  onClick={handleUploadClick}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Plus className="h-5 w-5" />
                  Upload CSV
                </button>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Bulk upload multiple candidates at once
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        title="Delete Candidate"
        message={
          <div className="space-y-2">
            <p className="font-medium text-gray-900">
              Are you sure you want to delete this candidate?
            </p>
            {deleteCandidateInfo && (
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">Name:</span>{" "}
                  {deleteCandidateInfo.name}
                </p>
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  {deleteCandidateInfo.email}
                </p>
              </div>
            )}
            <p className="text-red-600 text-sm">
              This will also delete their profile picture. This
              action cannot be undone!
            </p>
          </div>
        }
        confirmText="Yes, Delete"
        cancelText="Cancel"
        type="delete"
      />
      {showUploadModal && (
        <div className="fixed inset-0 flex items-center justify-center z-500">
          <div
            className="absolute inset-0 -z-1 bg-black/30"
            onClick={() => {
              setShowUploadModal(false);
            }}
          ></div>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                Upload Candidates
              </h3>
              <button
                onClick={closeUploadModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  ref={uploadFileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="upload-file"
                />

                {!uploadFile ? (
                  <div>
                    <div className="mb-4">
                      <Camera className="h-12 w-12 mx-auto text-gray-400" />
                    </div>
                    <label
                      htmlFor="upload-file"
                      className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Select CSV File
                    </label>
                    <p className="text-sm text-gray-500 mt-4">
                      Supported formats: CSV (Max size: {process.env.NEXT_PUBLIC_MAX_FILE_SIZE_IN_MB}MB)
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-3 rounded-lg">
                          <Camera className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-3 text-left">
                          <p className="font-medium text-gray-900">
                            {uploadFile.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {(uploadFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setUploadFile(null);
                          setUploadStats(null);
                          setParsedData([]);
                          if (uploadFileInputRef.current) {
                            uploadFileInputRef.current.value = "";
                          }
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    {uploadLoading && (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <span className="ml-3 text-gray-600">
                          Parsing file...
                        </span>
                      </div>
                    )}

                    {uploadStats && !uploadLoading && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-gray-900 mb-3">
                          Upload Summary
                        </h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">
                              {uploadStats.total}
                            </p>
                            <p className="text-sm text-gray-500">Total Rows</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">
                              {uploadStats.valid}
                            </p>
                            <p className="text-sm text-gray-500">Valid</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-red-600">
                              {uploadStats.errors}
                            </p>
                            <p className="text-sm text-gray-500">Errors</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between gap-3 p-6 border-t bg-gray-50 rounded-b-xl">
              <div className="flex gap-2">
                <button
                  onClick={downloadSampleCSV}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Sample CSV
                </button>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={closeUploadModal}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Cancel
                </button>
                {uploadStats && uploadStats.valid > 0 && (
                  <button
                    onClick={handleSaveUploadedData}
                    disabled={submitting}
                    className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 ml-2 ${
                      submitting
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Save {uploadStats.valid}{" "}
                        {uploadStats.valid === 1 ? "Candidate" : "Candidates"}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
