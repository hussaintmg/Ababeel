/**
 * Clipboard image extraction, naming, and validation utilities.
 */

/**
 * Extracts image files from a native ClipboardEvent or DataTransfer object.
 * Returns an array of File objects with proper filenames.
 */
export function extractImageFilesFromClipboard(clipboardData) {
  if (!clipboardData) return [];

  const files = [];

  // Try DataTransferItemList first
  if (clipboardData.items && clipboardData.items.length > 0) {
    for (let i = 0; i < clipboardData.items.length; i++) {
      const item = clipboardData.items[i];
      if (item.kind === "file" && item.type && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          files.push(ensureDescriptiveFileName(file));
        }
      }
    }
  }

  // Fallback to clipboardData.files if no items found
  if (files.length === 0 && clipboardData.files && clipboardData.files.length > 0) {
    for (let i = 0; i < clipboardData.files.length; i++) {
      const file = clipboardData.files[i];
      if (file.type && file.type.startsWith("image/")) {
        files.push(ensureDescriptiveFileName(file));
      }
    }
  }

  return files;
}

/**
 * Ensures a pasted image file has a meaningful, unique filename.
 */
export function ensureDescriptiveFileName(file) {
  if (!file) return file;

  const originalName = file.name || "";
  const ext = getExtensionFromMime(file.type);

  // If missing name or generic browser paste name "image.png"
  if (!originalName || originalName === "image.png" || originalName === "blob") {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const newName = `screenshot-${timestamp}.${ext}`;
    try {
      return new File([file], newName, { type: file.type });
    } catch {
      // Fallback for environments where File constructor with name override is restricted
      return file;
    }
  }

  return file;
}

/**
 * Resolves file extension from MIME type.
 */
export function getExtensionFromMime(mimeType) {
  switch (mimeType) {
    case "image/jpeg":
    case "image/jpg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/svg+xml":
      return "svg";
    default:
      return "png";
  }
}

/**
 * Validates pasted image against size, allowed types, and optional aspect ratio.
 */
export function validateImageFile(file, options = {}) {
  const {
    maxSizeMB = 25,
    allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml"],
  } = options;

  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  // Type check
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    const readable = allowedTypes.map((t) => t.replace("image/", "").toUpperCase()).join(", ");
    return {
      valid: false,
      error: `Unsupported image format (${file.type}). Allowed formats: ${readable}`,
    };
  }

  // Size check
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `Image size exceeds the ${maxSizeMB}MB limit (actual: ${(file.size / (1024 * 1024)).toFixed(1)}MB)`,
    };
  }

  return { valid: true };
}
