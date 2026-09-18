"use client";

import { useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import {
  extractImageFilesFromClipboard,
  validateImageFile,
} from "@/lib/clipboard/imageUpload";
import { isEditableTarget } from "@/lib/commands/keyboard";

/**
 * Hook to support pasting screenshots and images directly into upload dropzones or active editors.
 *
 * @param {Object} options
 * @param {Function} options.onImagePasted Callback `(file: File, previewUrl: string) => Promise<void> | void`
 * @param {React.RefObject} [options.targetRef] Optional DOM element ref to bind paste event to (binds to window if null)
 * @param {number} [options.maxSizeMB=25] Maximum allowed file size in MB
 * @param {string[]} [options.allowedTypes] Allowed MIME types
 * @param {boolean} [options.enabled=true] Whether clipboard paste is active
 * @param {boolean} [options.allowInsideEditable=false] Whether to intercept image paste even inside text inputs
 */
export function useClipboardPaste({
  onImagePasted,
  targetRef = null,
  maxSizeMB = 25,
  allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml"],
  enabled = true,
  allowInsideEditable = false,
}) {
  const createdUrlsRef = useRef(new Set());

  // Clean up any created object URLs on unmount
  useEffect(() => {
    const urls = createdUrlsRef.current;
    return () => {
      urls.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      });
      urls.clear();
    };
  }, []);

  const handlePaste = useCallback(
    async (e) => {
      if (!enabled) return;

      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      // Extract image files
      const imageFiles = extractImageFilesFromClipboard(clipboardData);
      if (imageFiles.length === 0) {
        // No image files in clipboard, let native text paste proceed normally!
        return;
      }

      // If user is actively typing inside an input/textarea and the clipboard ALSO contains text,
      // preserve native text paste unless allowInsideEditable is true.
      const isTargetEditable = isEditableTarget(e.target, e);
      const hasText = Boolean(clipboardData.getData("text/plain"));

      if (isTargetEditable && hasText && !allowInsideEditable) {
        // Do not hijack text paste
        return;
      }

      // We have an image file and should handle it
      e.preventDefault();
      e.stopPropagation();

      const file = imageFiles[0]; // Take primary pasted image

      // Validate
      const validation = validateImageFile(file, { maxSizeMB, allowedTypes });
      if (!validation.valid) {
        toast.error(validation.error || "Invalid image");
        return;
      }

      // Create preview URL
      let previewUrl = "";
      try {
        previewUrl = URL.createObjectURL(file);
        createdUrlsRef.current.add(previewUrl);
      } catch (err) {
        console.warn("Could not create object URL for pasted image:", err);
      }

      try {
        await onImagePasted(file, previewUrl);
      } catch (err) {
        console.error("Error handling pasted image:", err);
        toast.error(err?.message || "Failed to process pasted image");
      }
    },
    [enabled, maxSizeMB, allowedTypes, allowInsideEditable, onImagePasted]
  );

  useEffect(() => {
    if (!enabled) return;

    const targetNode = targetRef?.current || (typeof window !== "undefined" ? window : null);
    if (!targetNode) return;

    targetNode.addEventListener("paste", handlePaste);
    return () => {
      targetNode.removeEventListener("paste", handlePaste);
    };
  }, [enabled, targetRef, handlePaste]);

  return {
    handlePaste,
  };
}
