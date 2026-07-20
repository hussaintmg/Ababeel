// app/owner/pdf-template/[type]/page.js (Updated with Context)
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import pdfRequiredElements from "@/constants/pdfRequired";
import ConfirmationModal from "@/Components/ConfirmationModal";
import { useTemplates } from "@/context/TemplateContext";

export default function TemplatePage() {
  const params = useParams();
  const router = useRouter();
  const type = params.type;

  const {
    getTemplatesByType,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    setActiveTemplate,
    loading,
  } = useTemplates();
  const isValidType = pdfRequiredElements.some(
    (element) => element.toLowerCase().replace(/\s/g, "-") === type,
  );

  const typeTemplates = getTemplatesByType(type);

  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  if (!isValidType) {
    router.back();
    return null;
  }

  const handleDeleteClick = (id, name) => {
    setDeleteId(id);
    setDeleteName(name);
    setShowModal(true);
  };

  const handleConfirmDelete = async () => {
    setIsConfirming(true);
    try {
      await deleteTemplate(deleteId);
      setShowModal(false);
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setIsConfirming(false);
      setDeleteId(null);
      setDeleteName("");
    }
  };

  const handleAddTemplate = async () => {
    if (!newTemplateName.trim()) return;

    try {
      await addTemplate({
        type: getTypeDisplayName(),
        name: newTemplateName,
        isActive: typeTemplates.length === 0,
        designData: {},
      });
      setNewTemplateName("");
      setShowAddForm(false);
    } catch (error) {
      console.error("Add failed:", error);
    }
  };

  const handleSetActive = async (id) => {
    try {
      await setActiveTemplate(type, id);
    } catch (error) {
      console.error("Set active failed:", error);
    }
  };

  const handleEditClick = (id, currentName) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const handleSaveEdit = async (id) => {
    if (!editingName.trim()) return;
    try {
      await updateTemplate(id, { name: editingName });
      setEditingId(null);
      setEditingName("");
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const getTypeDisplayName = () => {
    const original = pdfRequiredElements.find(
      (el) => el.toLowerCase().replace(/\s/g, "-") === type,
    );
    return original || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <Link
            href="/owner/pdf-template"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Templates
          </Link>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {getTypeDisplayName()}
                  </h1>
                </div>
                <p className="text-gray-600 ml-13">
                  Manage templates for {getTypeDisplayName()}. Create, edit, or
                  customize your templates here.
                </p>
              </div>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add New Template
              </button>
            </div>
          </div>
        </div>

        {showAddForm && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Create New Template
            </h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Enter template name..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
              <button
                onClick={handleAddTemplate}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900">
              All Templates ({typeTemplates.length})
            </h3>
          </div>

          {typeTemplates.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 13h6m-3-3v6m-9 5h18a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-500">No templates created yet</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Create your first template →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {typeTemplates.map((template) => (
                <div
                  key={template._id}
                  className="px-4 py-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50/50 transition-colors gap-3 sm:gap-4 w-full"
                >
                  {/* LEFT CONTENT */}
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                      <svg
                        className="w-5 h-5 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>

                    <div className="flex-1 min-w-0 w-full">
                      {editingId === template._id ? (
                        <div className="flex items-center gap-2 w-full flex-wrap sm:flex-nowrap">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm w-full sm:w-auto flex-1 font-medium text-gray-800"
                            autoFocus
                          />
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleSaveEdit(template._id)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-green-100 bg-white"
                              title="Save Changes"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100 bg-white"
                              title="Cancel"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <h4 className="font-semibold text-gray-900 text-base sm:text-lg break-words leading-snug">
                          {template.name}
                        </h4>
                      )}

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-500 mt-1.5">
                        <span className="flex items-center gap-1.5">
                          📅 Created:{" "}
                          {
                            new Date(template.createdAt)
                              .toISOString()
                              .split("T")[0]
                          }
                        </span>
                        {template.isActive && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full border border-green-100 font-medium">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT ACTION BAR */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-3 sm:mt-0 pt-3 sm:pt-0 border-t border-gray-100 sm:border-t-0 shrink-0">
                    {/* SET ACTIVE / ACTIVE INDICATOR */}
                    <div className="flex-1 sm:flex-initial">
                      {!template.isActive ? (
                        <button
                          onClick={() => handleSetActive(template._id)}
                          className="px-3.5 py-1.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 shadow-sm active:scale-95 transition-all flex items-center gap-1.5 w-fit"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Set Active
                        </button>
                      ) : (
                        <span className="px-3.5 py-1.5 bg-green-100 border border-green-200 text-green-700 rounded-lg text-sm font-semibold flex items-center gap-1.5 w-fit">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Active
                        </span>
                      )}
                    </div>

                    {/* MANAGE ACTIONS */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Link
                        href={`/owner/pdf-template/${type}/edit/${template._id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg transition-all"
                        title="Edit Template Design"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-file"
                        >
                          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                          <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                        </svg>
                      </Link>

                      <button
                        onClick={() =>
                          handleEditClick(template._id, template.name)
                        }
                        className="p-2 text-purple-600 hover:bg-purple-50 border border-transparent hover:border-purple-100 rounded-lg transition-all"
                        title="Rename Template"
                      >
                        <svg
                          className="w-4.5 h-4.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>

                      <button
                        onClick={() =>
                          handleDeleteClick(template._id, template.name)
                        }
                        className="p-2 text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all"
                        title="Delete Template"
                      >
                        <svg
                          className="w-4.5 h-4.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Tip:</span> You can create
                multiple templates for this certificate type. Only one template
                can be active at a time. Click the edit icon to customize
                template design, or use the rename button to change template
                name.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Template"
        message={`Are you sure you want to delete "${deleteName}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        type="delete"
        isConfirming={isConfirming}
      />
    </div>
  );
}
