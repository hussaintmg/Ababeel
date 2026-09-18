/**
 * Keyboard event normalization, platform detection, editable target guards,
 * and shortcut matching utilities.
 */

/**
 * Returns true if the user's platform is macOS.
 */
export function isMac() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  const platform = navigator.platform || navigator.userAgentData?.platform || "";
  return /Mac|iPhone|iPad|iPod/i.test(platform);
}

/**
 * Checks if an event target or any element in its composed path is editable.
 * Protects native typing in inputs, textareas, contenteditable elements,
 * comboboxes, and rich-text / code editors.
 */
export function isEditableTarget(target, event = null) {
  if (!target) return false;

  const isElementEditable = (node) => {
    if (!node || node.nodeType !== 1) return false;
    if (
      node.isContentEditable ||
      node.contentEditable === "true" ||
      node.contentEditable === true ||
      node.getAttribute?.("contenteditable") === "true" ||
      node.getAttribute?.("contenteditable") === ""
    ) {
      return true;
    }
    const tag = node.tagName?.toUpperCase();
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    const role = node.getAttribute?.("role");
    if (role === "textbox" || role === "searchbox" || role === "combobox") return true;
    return false;
  };

  if (event && typeof event.composedPath === "function") {
    const path = event.composedPath();
    for (const node of path) {
      if (isElementEditable(node)) return true;
    }
  }

  return isElementEditable(target);
}

/**
 * Checks if the key combination is a reserved browser/system shortcut that
 * application code must NEVER intercept (e.g. reload, close tab, address bar).
 */
export function isBrowserReserved(event) {
  const isCmdOrCtrl = event.metaKey || event.ctrlKey;
  const key = event.key?.toLowerCase();

  // Ctrl/Cmd + W (close tab), T (new tab), N (new window), Q (quit)
  if (isCmdOrCtrl && ["w", "t", "n", "q"].includes(key)) return true;

  // Ctrl/Cmd + R or F5 (reload page)
  if ((isCmdOrCtrl && key === "r") || key === "f5") return true;

  // Ctrl/Cmd + L (browser address bar)
  if (isCmdOrCtrl && key === "l") return true;

  // Ctrl/Cmd + Shift + I/J/C (dev tools)
  if (isCmdOrCtrl && event.shiftKey && ["i", "j", "c"].includes(key)) return true;

  // Ctrl + Tab / Ctrl + PageUp/PageDown (browser tab switching)
  if (event.ctrlKey && ["tab", "pageup", "pagedown"].includes(key)) return true;

  // Alt + Left / Right (browser history navigation)
  if (event.altKey && ["arrowleft", "arrowright"].includes(key)) return true;

  return false;
}

/**
 * Parses a shortcut string like "$mod+s", "shift+arrowdown", "ctrl+alt+k", or "escape"
 * into a normalized structure.
 */
export function parseShortcut(shortcutString) {
  if (!shortcutString || typeof shortcutString !== "string") return null;

  const parts = shortcutString
    .toLowerCase()
    .split("+")
    .map((p) => p.trim())
    .filter(Boolean);

  let mod = false;
  let ctrl = false;
  let meta = false;
  let shift = false;
  let alt = false;
  let key = "";

  for (const part of parts) {
    if (part === "$mod" || part === "mod" || part === "cmdorctrl") {
      mod = true;
    } else if (part === "ctrl" || part === "control") {
      ctrl = true;
    } else if (part === "meta" || part === "cmd" || part === "command") {
      meta = true;
    } else if (part === "shift") {
      shift = true;
    } else if (part === "alt" || part === "option") {
      alt = true;
    } else {
      key = part;
    }
  }

  return { mod, ctrl, meta, shift, alt, key };
}

/**
 * Checks whether a native KeyboardEvent matches a parsed shortcut or shortcut string.
 */
export function matchShortcut(event, shortcut) {
  if (!event || !shortcut) return false;

  // Ignore events during IME composition (Chinese, Japanese, dead keys, etc.)
  if (event.isComposing || event.keyCode === 229) return false;

  const parsed = typeof shortcut === "string" ? parseShortcut(shortcut) : shortcut;
  if (!parsed) return false;

  const mac = isMac();
  const eventMod = mac ? event.metaKey : event.ctrlKey;

  // Check $mod (Cmd on Mac, Ctrl on Windows/Linux)
  if (parsed.mod) {
    if (!eventMod) return false;
  } else {
    // Exact ctrl check
    if (parsed.ctrl !== event.ctrlKey) return false;
    // Exact meta check
    if (parsed.meta !== event.metaKey) return false;
  }

  // Exact shift check
  if (parsed.shift !== event.shiftKey) return false;

  // Exact alt check
  if (parsed.alt !== event.altKey) return false;

  // Normalize event key
  const eventKey = (event.key || "").toLowerCase();
  const targetKey = (parsed.key || "").toLowerCase();

  // Direct match or space special case
  if (targetKey === "space" && (eventKey === " " || eventKey === "spacebar" || eventKey === "space")) {
    return true;
  }
  if (targetKey === "esc" && eventKey === "escape") {
    return true;
  }
  if (targetKey === "del" && eventKey === "delete") {
    return true;
  }

  return eventKey === targetKey;
}

/**
 * Returns a user-friendly string for display in tooltips and the command palette.
 * e.g. "$mod+s" -> "Ctrl+S" (Windows) or "⌘S" (macOS).
 */
export function formatShortcut(shortcutString) {
  if (!shortcutString) return "";
  const parsed = parseShortcut(shortcutString);
  if (!parsed) return shortcutString;

  const mac = isMac();
  const tokens = [];

  if (parsed.mod) {
    tokens.push(mac ? "⌘" : "Ctrl");
  } else {
    if (parsed.ctrl) tokens.push(mac ? "⌃" : "Ctrl");
    if (parsed.meta) tokens.push(mac ? "⌘" : "Meta");
  }

  if (parsed.alt) tokens.push(mac ? "⌥" : "Alt");
  if (parsed.shift) tokens.push(mac ? "⇧" : "Shift");

  // Format the key nicely
  let displayKey = parsed.key.toUpperCase();
  if (parsed.key === "escape" || parsed.key === "esc") displayKey = "Esc";
  if (parsed.key === "arrowup") displayKey = "↑";
  if (parsed.key === "arrowdown") displayKey = "↓";
  if (parsed.key === "arrowleft") displayKey = "←";
  if (parsed.key === "arrowright") displayKey = "→";
  if (parsed.key === "space") displayKey = "Space";
  if (parsed.key === "enter") displayKey = mac ? "↵" : "Enter";
  if (parsed.key === "backspace") displayKey = mac ? "⌫" : "Backspace";
  if (parsed.key === "delete" || parsed.key === "del") displayKey = "Del";

  tokens.push(displayKey);

  return mac ? tokens.join("") : tokens.join("+");
}
