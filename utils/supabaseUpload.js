/**
 * Frontend helper to upload files directly to Supabase Storage without server buffering.
 *
 * Flow:
 * 1. Calls /api/upload/presigned to get a short-lived presigned PUT URL.
 * 2. Uploads the raw File/Blob directly to Supabase Storage via PUT.
 * 3. Returns { url, publicId, key, name, size, type }.
 */
export async function uploadToSupabase(file, folder = "uploads", onProgress = null) {
  if (!file) {
    throw new Error("No file provided for upload");
  }

  const filename = file.name || "file.bin";
  const contentType = file.type || "application/octet-stream";

  // Step 1: Request presigned URL from backend
  const presignRes = await fetch("/api/upload/presigned", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filename,
      contentType,
      folder,
    }),
  });

  const presignData = await presignRes.json();
  if (!presignRes.ok || !presignData.success) {
    throw new Error(presignData.error || "Failed to generate upload URL");
  }

  const { uploadUrl, publicUrl, key } = presignData;

  // Step 2: Direct upload to Supabase Storage
  if (onProgress && typeof XMLHttpRequest !== "undefined") {
    // XHR for upload progress tracking
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", contentType);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          onProgress(pct);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          if (onProgress) onProgress(100);
          resolve();
        } else {
          reject(new Error(`Direct upload failed with status ${xhr.status}: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during direct upload to storage"));
      xhr.send(file);
    });
  } else {
    // Standard fetch for direct upload
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": contentType,
      },
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text().catch(() => "");
      throw new Error(`Direct upload failed (${uploadRes.status}): ${errText || uploadRes.statusText}`);
    }
  }

  return {
    url: publicUrl,
    publicId: key,
    key,
    name: filename,
    size: file.size,
    type: contentType,
  };
}

export default uploadToSupabase;
