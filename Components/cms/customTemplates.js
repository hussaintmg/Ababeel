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
    /* quota / private mode â€” ignore */
  }
}

// Convert a database CmsCustomSection record into a template card object
export function formatSdkSectionAsTemplate(sec) {
  if (!sec) return null;
  if (sec.kind === "template") return { ...sec.template, id: sec.sectionId, custom: true, persistence: "server" };
  const sectionId = sec.sectionId || sec._id || `sdk_${Date.now()}`;
  return {
    id: sectionId,
    name: sec.name || "Custom Code Section",
    category: sec.category || "Custom Sections",
    desc: sec.description || "Custom SDK Section with scoped code & styles",
    custom: true,
    persistence: "server",
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

// Server-confirmed templates replace their cache; only explicitly local drafts survive.
export async function fetchRemoteCustomSections() {
  const local = loadCustomTemplates();
  const res = await axios.get("/api/owner/cms/custom-sections");
  const sections = res.data?.data?.sections || res.data?.sections;
  if (!Array.isArray(sections)) throw new Error("Invalid section library response");
  const remote = sections.map(formatSdkSectionAsTemplate).filter(Boolean);
  const ids = new Set(remote.map(t => t.id));
  const drafts = local.filter(t => t.persistence === "local" || (!t.persistence && !t.isSdkCustom)).filter(t => !ids.has(t.id)).map(t => ({...t,persistence:"local",desc:"Local draft — not saved to server"}));
  const merged = [...remote,...drafts]; persist(merged); return merged;
}

export async function saveCustomTemplate(name, blocks, dataSources = []) {
  const id = `ct_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`;
  const template = {version:2,id,name:name || "My template",category:"My Templates",custom:true,blocks:JSON.parse(JSON.stringify(blocks || [])),dataSources:JSON.parse(JSON.stringify(dataSources))};
  await axios.post("/api/owner/cms/custom-sections", {sectionId:id,name:template.name,kind:"template",template});
  const saved={...template,persistence:"server"}; persist([saved,...loadCustomTemplates()]); return saved;
}

export async function saveSdkCustomTemplate(payload) {
  const sectionId=payload.sectionId || `sdk_sec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`;
  const res=await axios.post("/api/owner/cms/custom-sections", {...payload,sectionId});
  const record=res.data?.data?.section || res.data?.section;
  if(!record) throw new Error("Server did not confirm the saved section");
  const template=formatSdkSectionAsTemplate(record);
  persist([template,...loadCustomTemplates().filter(t=>t.id!==sectionId)]); return template;
}

export async function deleteCustomTemplate(id) {
  const local=loadCustomTemplates();
  if(local.find(t=>t.id===id)?.persistence!=="local") await axios.delete(`/api/owner/cms/custom-sections?sectionId=${encodeURIComponent(id)}`);
  const next=local.filter(t=>t.id!==id); persist(next); return next;
}
