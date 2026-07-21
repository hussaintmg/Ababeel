"use client";

// Owner-created ("My") templates. Stored in the browser's localStorage so the
// owner can save any section (or a whole page) they've designed and re-insert
// it later on any page. Kept client-only and dependency-free.

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
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* quota / private mode — ignore */
  }
}

// Save a set of live blocks as a custom template. `blocks` are real page blocks
// (with _style); we deep-clone and strip ids so re-inserting mints fresh ones.
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

export function deleteCustomTemplate(id) {
  const next = loadCustomTemplates().filter((t) => t.id !== id);
  persist(next);
  return next;
}
