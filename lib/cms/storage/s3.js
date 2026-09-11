/**
 * S3 / Supabase Storage provider for scroll-animation frames.
 */
import {
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getS3Client, getBucketName, getPublicUrl } from "../../s3.js";

export class S3StorageProvider {
  name = "s3";

  resolveKey(key) {
    const clean = String(key || "").replace(/^\/+/, "");
    if (!clean) throw new Error("Empty storage key");
    return `scroll-frames/${clean}`;
  }

  async put(buffer, key) {
    const s3Key = this.resolveKey(key);
    const client = getS3Client();
    const bucket = getBucketName();

    let contentType = "image/webp";
    if (key.endsWith(".png")) contentType = "image/png";
    else if (key.endsWith(".jpg") || key.endsWith(".jpeg")) contentType = "image/jpeg";
    else if (key.endsWith(".json")) contentType = "application/json";

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: s3Key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    return getPublicUrl(s3Key);
  }

  async delete(key) {
    const s3Key = this.resolveKey(key);
    const client = getS3Client();
    const bucket = getBucketName();

    try {
      await client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: s3Key,
        })
      );
      return true;
    } catch (err) {
      console.error("[s3] delete error:", err);
      return false;
    }
  }

  async deletePrefix(prefix) {
    const s3Prefix = this.resolveKey(prefix);
    const client = getS3Client();
    const bucket = getBucketName();

    try {
      const list = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: s3Prefix,
        })
      );

      const objects = list.Contents?.map((o) => ({ Key: o.Key })) || [];
      if (!objects.length) return 0;

      await client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: objects },
        })
      );

      return objects.length;
    } catch (err) {
      console.error("[s3] deletePrefix error:", err);
      return 0;
    }
  }

  async list(prefix) {
    const s3Prefix = this.resolveKey(prefix);
    const client = getS3Client();
    const bucket = getBucketName();

    try {
      const list = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: s3Prefix,
        })
      );

      return (list.Contents || []).map((o) => o.Key.replace(`${s3Prefix}/`, "")).sort();
    } catch (err) {
      console.error("[s3] list error:", err);
      return [];
    }
  }

  async size(prefix) {
    const s3Prefix = this.resolveKey(prefix);
    const client = getS3Client();
    const bucket = getBucketName();

    try {
      const list = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: s3Prefix,
        })
      );

      return (list.Contents || []).reduce((acc, o) => acc + (o.Size || 0), 0);
    } catch (err) {
      console.error("[s3] size error:", err);
      return 0;
    }
  }
}
