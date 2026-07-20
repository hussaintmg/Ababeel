// context/TemplateContext.js
"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────────────────────

const TemplateContext = createContext();

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Create a blank default page object
// Exported so editor page can import it directly
// ─────────────────────────────────────────────────────────────────────────────

export function createDefaultPage(pageNumber, existingConfig = null) {
  return {
    pageNumber,
    config: {
      format: existingConfig?.format || "A4",
      orientation: existingConfig?.orientation || "portrait",
      customWidth: existingConfig?.customWidth || 800,
      customHeight: existingConfig?.customHeight || 600,
      widthUnit: existingConfig?.widthUnit || "px",
      heightUnit: existingConfig?.heightUnit || "px",
      margin: existingConfig?.margin || 0,
      marginUnit: existingConfig?.marginUnit || "px",
      ...existingConfig,
    },
    backgroundImage: null,
    bgSize: "cover",
    bgPosition: "center center",
    elements: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOKS — two named exports to match both usage patterns:
//   useTemplates()  → used in existing pages
//   useTemplate()   → used in new editor page
// Both return the same context value
// ─────────────────────────────────────────────────────────────────────────────

export const useTemplates = () => {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error("useTemplates must be used within TemplateProvider");
  }
  return context;
};

export const useTemplate = () => {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error("useTemplate must be used within TemplateProvider");
  }
  return context;
};

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────────────────────────────────────

export const TemplateProvider = ({ children }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ref for debounced auto-save timer
  const autoSaveTimer = useRef(null);

  // ── Fetch all templates ──────────────────────────────────────────────────
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/templates");
      if (!response.ok) throw new Error("Failed to fetch templates");
      const data = await response.json();
      setTemplates(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch a single template by id ────────────────────────────────────────
  const fetchTemplateById = async (id) => {
    try {
      const response = await fetch(`/api/templates/${id}`);
      if (!response.ok) throw new Error("Failed to fetch template");
      const data = await response.json();
      return data.data || null;
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  // ── Filter templates by type ─────────────────────────────────────────────
  const getTemplatesByType = (type) => {
    const displayName = type
      .replace(/-/g, " ")
    return templates.filter((template) => template.type.toLowerCase() === displayName.toLowerCase());
  };

  // ── Get the single active template for a type ────────────────────────────
  const getActiveTemplateByType = (type) => {
    const displayName = type
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
    return (
      templates.find(
        (template) => template.type === displayName && template.isActive,
      ) || null
    );
  };

  // ── Add a new template ───────────────────────────────────────────────────
  const addTemplate = async (templateData) => {
    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateData),
      });
      if (!response.ok) throw new Error("Failed to add template");
      const data = await response.json();
      const newTemplate = data.data;
      setTemplates((prev) => [newTemplate, ...prev]);
      return newTemplate;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // ── Update a template (name, isActive, designData, or any field) ─────────
  const updateTemplate = async (id, updateData) => {
    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) throw new Error("Failed to update template");
      const data = await response.json();
      const updatedTemplate = data.data;

      setTemplates((prev) =>
        prev.map((t) => {
          // If this template became active, reflect deactivation of others
          if (
            updatedTemplate.isActive &&
            t.type === updatedTemplate.type &&
            t._id !== id
          ) {
            return { ...t, isActive: false };
          }
          return t._id === id ? updatedTemplate : t;
        }),
      );

      return updatedTemplate;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // ── Delete a template ────────────────────────────────────────────────────
  const deleteTemplate = async (id) => {
    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete template");
      setTemplates((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // ── Set active template ──────────────────────────────────────────────────
  // Single ?action=setActive request — no loop needed
  const setActiveTemplate = async (type, templateId) => {
    try {
      const response = await fetch(
        `/api/templates/${templateId}?action=setActive`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );
      if (!response.ok) throw new Error("Failed to set active template");
      const data = await response.json();

      const displayName = type
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

      // Update local state: deactivate all of same type, activate this one
      setTemplates((prev) =>
        prev.map((t) => {
          if (t.type !== displayName) return t;
          return { ...t, isActive: t._id === templateId };
        }),
      );

      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // ── Save designData to MongoDB (editor Save button) ──────────────────────
  const saveDesign = async (id, designData) => {
    return updateTemplate(id, { designData });
  };

  // ────────────────────────────────────────────────────────────────────────
  // LOCAL STORAGE DRAFT HELPERS
  // Key format: template_draft_<type>_<id>
  // ────────────────────────────────────────────────────────────────────────

  const saveDraft = (type, id, designData) => {
    try {
      const key = `template_draft_${type}_${id}`;
      localStorage.setItem(
        key,
        JSON.stringify({ designData, savedAt: Date.now() }),
      );
    } catch (err) {
      console.warn("saveDraft: localStorage write failed", err);
    }
  };

  const saveDraftDebounced = (type, id, designData, delayMs = 800) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveDraft(type, id, designData);
    }, delayMs);
  };

  const loadDraft = (type, id) => {
    try {
      const key = `template_draft_${type}_${id}`;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const clearDraft = (type, id) => {
    try {
      localStorage.removeItem(`template_draft_${type}_${id}`);
    } catch {
      // ignore
    }
  };

  // ── Fetch templates on mount ─────────────────────────────────────────────
  useEffect(() => {
    fetchTemplates();
  }, []);

  // ── Cleanup debounce timer on unmount ────────────────────────────────────
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  const value = {
    // State
    templates,
    loading,
    error,

    // CRUD
    fetchTemplates,
    fetchTemplateById,
    getTemplatesByType,
    getActiveTemplateByType,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    setActiveTemplate,

    // Design-specific save
    saveDesign,

    // localStorage draft
    saveDraft,
    saveDraftDebounced,
    loadDraft,
    clearDraft,

    // Helper factory (also exported separately for direct import)
    createDefaultPage,
  };

  return (
    <TemplateContext.Provider value={value}>
      {children}
    </TemplateContext.Provider>
  );
};
