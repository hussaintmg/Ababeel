import { S3Client, PutObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import path from "path";
import crypto from "crypto";

let s3Client = null;

export function getS3Endpoint() {
  const rawEndpoint = (process.env.S3_ENDPOINT || "").trim().replace(/\/+$/, "");
  if (!rawEndpoint) return "";
  if (rawEndpoint.includes("supabase.co") && !rawEndpoint.includes("/storage/v1/s3")) {
    return `${rawEndpoint}/storage/v1/s3`;
  }
  return rawEndpoint;
}

export function getBucketName() {
  return process.env.S3_BUCKET || "SavedFiles";
}

export function getS3Client() {
  if (s3Client) return s3Client;

  const endpoint = getS3Endpoint();
  const region = process.env.S3_REGION || "ap-northeast-2";
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    console.warn("[s3] S3 credentials missing in environment variables.");
  }

  s3Client = new S3Client({
    forcePathStyle: true,
    region,
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return s3Client;
}

/**
 * Returns public CDN/storage URL for an object in Supabase Storage.
 */
export function getPublicUrl(key) {
  if (!key) return "";
  if (key.startsWith("http://") || key.startsWith("https://")) return key;

  const rawEndpoint = (process.env.S3_ENDPOINT || "").trim().replace(/\/+$/, "");
  // Supabase public URL structure: https://<project-ref>.supabase.co/storage/v1/object/public/<bucket>/<key>
  const baseOrigin = rawEndpoint.replace(/\/storage\/v1\/s3$/, "");
  const bucket = getBucketName();
  const cleanKey = key.replace(/^\/+/, "");

  return `${baseOrigin}/storage/v1/object/public/${bucket}/${cleanKey}`;
}

/**
 * Generate an S3 presigned PUT URL for direct browser uploads.
 */
export async function createPresignedUploadUrl({ folder = "uploads", filename = "", contentType = "application/octet-stream", expiresIn = 3600 }) {
  const client = getS3Client();
  const bucket = getBucketName();

  let ext = "";
  if (filename) {
    ext = path.extname(filename).toLowerCase();
  }
  if (!ext) {
    if (contentType.includes("png")) ext = ".png";
    else if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = ".jpg";
    else if (contentType.includes("webp")) ext = ".webp";
    else if (contentType.includes("pdf")) ext = ".pdf";
    else if (contentType.includes("mp4")) ext = ".mp4";
    else if (contentType.includes("webm")) ext = ".webm";
    else ext = ".bin";
  }

  const cleanFolder = folder ? folder.replace(/^\/+|\/+$/g, "") : "uploads";
  const uniqueId = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const key = `${cleanFolder}/${uniqueId}${ext}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn });
  const publicUrl = getPublicUrl(key);

  return {
    uploadUrl,
    publicUrl,
    key,
    bucket,
  };
}

/**
 * Delete an object from Supabase S3 storage.
 */
export async function deleteS3Object(key) {
  if (!key) return { success: false, message: "No key provided" };

  try {
    const client = getS3Client();
    const bucket = getBucketName();
    const cleanKey = key.replace(/^\/+/, "");

    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: cleanKey,
      })
    );

    return { success: true, message: "Object deleted successfully" };
  } catch (error) {
    console.error("[s3] DeleteObject error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Put an object directly from buffer (server-side fallback).
 */
export async function putS3Object(buffer, key, contentType = "application/octet-stream") {
  const client = getS3Client();
  const bucket = getBucketName();
  const cleanKey = key.replace(/^\/+/, "");

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: cleanKey,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return {
    key: cleanKey,
    url: getPublicUrl(cleanKey),
  };
}
