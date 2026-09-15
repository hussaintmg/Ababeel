"use client";

import axios from "axios";

// Owner-created ("My") templates. Stored in localStorage and synced with
// the database via /api/owner/cms/custom-sections so custom code sections
// and author-designed templates persist across sessions, devices, and browsers.

const KEY = "ababeel_cms_custom_templates_v1";

export function loadCustomTemplates() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function persist(list) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* quota / private mode — ignore */
  }
}

// Convert a database CmsCustomSection record into a template card object
export function formatSdkSectionAsTemplate(sec) {
  if (!sec) return null;
  const sectionId = sec.sectionId || sec._id || `sdk_${Date.now()}`;
  return {
    id: sectionId,
    name: sec.name || "Custom Code Section",
    category: sec.category || "Custom Sections",
    desc: sec.description || "Custom SDK Section with scoped code & styles",
    custom: true,
    isSdkCustom: true,
    sdkData: {
      sectionId,
      name: sec.name,
      category: sec.category,
      description: sec.description,
      code: sec.code,
      css: sec.css,
      fields: sec.fields || [],
      options: sec.options || {},
      defaultProps: sec.defaultProps || {},
      previewHtml: sec.previewHtml || "",
    },
    blocks: [
      {
        type: "sdkCustomSection",
        props: {
          _sectionId: sectionId,
          _name: sec.name,
          _code: sec.code || "",
          _css: sec.css || "",
          _fields: sec.fields || [],
          _options: sec.options || {},
          ...(sec.defaultProps || {}),
        },
        style: {},
      },
    ],
  };
}

// Fetch custom sections from the backend API, merge with local cache, and persist
export async function fetchRemoteCustomSections() {
  const localList = loadCustomTemplates();
  try {
    const res = await axios.get("/api/owner/cms/custom-sections");
    const sections = res.data?.data?.sections || res.data?.sections || [];
    if (Array.isArray(sections)) {
      const remoteTemplates = sections.map(formatSdkSectionAsTemplate).filter(Boolean);
      // Map remote by ID
      const remoteMap = new Map(remoteTemplates.map((t) => [t.id, t]));
      // Keep local standard custom templates that are not SDK sections or not on remote yet
      const keptLocal = localList.filter((lt) => !remoteMap.has(lt.id));
      const merged = [...remoteTemplates, ...keptLocal];
      persist(merged);
      return merged;
    }
  } catch (err) {
    console.warn("Could not sync remote custom sections (using local cache):", err?.message);
  }
  return localList;
}

// Save a set of live blocks as a standard custom template (non-SDK or multi-block)
export function saveCustomTemplate(name, blocks) {
  const list = loadCustomTemplates();
  const tpl = {
    id: `ct_${Date.now().toString(36)}`,
    name: name || "My template",
    category: "My Templates",
    desc: `${(blocks || []).length} block(s) • saved ${new Date().toLocaleDateString()}`,
    custom: true,
    // Store in the same shape createBlocksFromTemplate expects: {type, props, style}
    blocks: (blocks || []).map((b) => ({
      type: b.type,
      props: structuredClone(b.props || {}),
      style: structuredClone(b._style || {}),
    })),
  };
  const next = [tpl, ...list];
  persist(next);
  return tpl;
}

// Save or update an SDK custom section to backend API and local storage
export async function saveSdkCustomTemplate(payload) {
  const sectionId =
    payload.sectionId || `sdk_sec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const cleanPayload = {
    ...payload,
    sectionId,
  };

  let savedRecord = null;
  try {
    const res = await axios.post("/api/owner/cms/custom-sections", cleanPayload);
    savedRecord = res.data?.data?.section || res.data?.section || cleanPayload;
  } catch (err) {
    console.warn("API save failed, persisting locally in browser:", err?.message);
    savedRecord = cleanPayload;
  }

  const tpl = formatSdkSectionAsTemplate(savedRecord);
  const list = loadCustomTemplates();
  const filtered = list.filter((t) => t.id !== sectionId);
  const next = [tpl, ...filtered];
  persist(next);
  return tpl;
}

// Delete a custom template by id (both local and server if it's an SDK section)
export async function deleteCustomTemplate(id) {
  try {
    await axios.delete(`/api/owner/cms/custom-sections?sectionId=${encodeURIComponent(id)}`);
  } catch (err) {
    console.warn("Remote delete failed, removing locally:", err?.message);
  }
  const next = loadCustomTemplates().filter((t) => t.id !== id);
  persist(next);
  return next;
}
