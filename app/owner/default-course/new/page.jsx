"use client";
import CreateCourseForm from "@/Components/owner/CreateCourseForm";
import CSVUploadForm from "@/Components/owner/CSVUploadForm";
import { ArrowLeft, Upload, FileText, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams, usePathname } from "next/navigation";

function CreateCourseContent() {
  const [activeTab, setActiveTab] = useState('manual');
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const editId = searchParams?.get("edit") || searchParams?.get("id") || searchParams?.get("courseId");
  const isEditing = Boolean(editId);
  const isDefaultCourse = pathname?.includes("/default-course");
  const backUrl = isDefaultCourse ? "/owner/default-course/all" : "/owner/courses/all";

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href={backUrl}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Back to Manage Courses"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {isEditing ? "Edit Course" : "Create New Course"}
              </h1>
              <p className="text-gray-600 mt-1">
                {isEditing
                  ? "Modify course syllabus, pricing, certification, and details"
                  : "Add a new course to your academy"}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation (only show in create mode) */}
        {!isEditing && (
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`inline-flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'manual'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  Manual Entry
                </button>
                <button
                  onClick={() => setActiveTab('csv')}
                  className={`inline-flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'csv'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  CSV Upload
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            {isEditing || activeTab === 'manual' ? (
              <CreateCourseForm editId={editId} redirectUrl={backUrl} />
            ) : (
              <CSVUploadForm />
            )}
          </div>

          {/* Instructions Section */}
          <div className="space-y-6">
            {isEditing ? (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 md:p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Course Editing Tips</h3>
                <ul className="space-y-3 text-blue-800 text-sm">
                  <li className="flex items-start">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-2 mt-0.5 shrink-0">
                      <span className="text-blue-600 text-xs font-bold">1</span>
                    </div>
                    <span>All course fields (name, slug, level, awarding body, curriculum, syllabus, and FAQs) can be edited.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-2 mt-0.5 shrink-0">
                      <span className="text-blue-600 text-xs font-bold">2</span>
                    </div>
                    <span>Click between the tabs above the form (Basic Info, Curriculum, Media, FAQs) to edit all sections.</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-2 mt-0.5 shrink-0">
                      <span className="text-blue-600 text-xs font-bold">3</span>
                    </div>
                    <span>Click <strong>&quot;Update Course&quot;</strong> to save changes and immediately return to Manage Courses.</span>
                  </li>
                </ul>
              </div>
            ) : activeTab === 'manual' ? (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 md:p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">Course Guidelines</h3>
                  <ul className="space-y-2 text-blue-800">
                    <li className="flex items-start">
                      <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-2 mt-0.5">
                        <span className="text-blue-600 text-xs">1</span>
                      </div>
                      <span className="text-sm">Course name should be clear and descriptive</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-2 mt-0.5">
                        <span className="text-blue-600 text-xs">2</span>
                      </div>
                      <span className="text-sm">Set a reasonable price for your course</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-2 mt-0.5">
                        <span className="text-blue-600 text-xs">3</span>
                      </div>
                      <span className="text-sm">Select the currency based on your target audience</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-2 mt-0.5">
                        <span className="text-blue-600 text-xs">4</span>
                      </div>
                      <span className="text-sm">Add description to attract students</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-4 md:p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-3">Currency Tips</h3>
                  <ul className="space-y-2 text-green-800">
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      <span className="text-sm">Search countries by name or currency</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      <span className="text-sm">Popular currencies are shown first</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      <span className="text-sm">Price will auto-format with selected symbol</span>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 md:p-6">
                  <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    CSV Format Requirements
                  </h3>
                  <div className="space-y-3 text-purple-800">
                    <div>
                      <p className="font-medium text-sm mb-1">Required Columns:</p>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-1">
                          <span className="text-purple-600">•</span>
                          <code className="bg-purple-100 px-2 py-0.5 rounded">name</code>
                          <span className="text-xs">(Course name)</span>
                        </li>
                        <li className="flex items-center gap-1">
                          <span className="text-purple-600">•</span>
                          <code className="bg-purple-100 px-2 py-0.5 rounded">price</code>
                          <span className="text-xs">(Numeric value)</span>
                        </li>
                        <li className="flex items-center gap-1">
                          <span className="text-purple-600">•</span>
                          <code className="bg-purple-100 px-2 py-0.5 rounded">description</code>
                          <span className="text-xs">(Course description)</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <p className="font-medium text-sm mb-1">Optional Columns:</p>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-1">
                          <span className="text-purple-600">•</span>
                          <code className="bg-purple-100 px-2 py-0.5 rounded">currency</code>
                          <span className="text-xs">(PKR, USD, EUR)</span>
                        </li>
                        <li className="flex items-center gap-1">
                          <span className="text-purple-600">•</span>
                          <code className="bg-purple-100 px-2 py-0.5 rounded">country</code>
                          <span className="text-xs">(Country name)</span>
                        </li>
                        <li className="flex items-center gap-1">
                          <span className="text-purple-600">•</span>
                          <code className="bg-purple-100 px-2 py-0.5 rounded">categories</code>
                          <span className="text-xs">(Comma separated)</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 md:p-6">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-3">CSV Upload Tips</h3>
                  <ul className="space-y-2 text-yellow-800">
                    <li className="flex items-start">
                      <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center mr-2 mt-0.5">
                        <span className="text-yellow-600 text-xs">1</span>
                      </div>
                      <span className="text-sm">Use the provided CSV template to ensure correct format</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center mr-2 mt-0.5">
                        <span className="text-yellow-600 text-xs">2</span>
                      </div>
                      <span className="text-sm">Maximum file size: 5MB</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center mr-2 mt-0.5">
                        <span className="text-yellow-600 text-xs">3</span>
                      </div>
                      <span className="text-sm">You can preview data before final upload</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center mr-2 mt-0.5">
                        <span className="text-yellow-600 text-xs">4</span>
                      </div>
                      <span className="text-sm">Download sample CSV for reference</span>
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateCoursePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span>Loading course editor...</span>
          </div>
        </div>
      }
    >
      <CreateCourseContent />
    </Suspense>
  );
}