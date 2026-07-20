import connectDB from "@/utils/db";
import AuditLog from "@/models/AuditLog";

export async function writeAuditLog({
  action,
  entityType,
  entityId,
  performedByUserId,
  performedByRole,
  details = {},
  ipAddress = "",
}) {
  try {
    await connectDB();
    await AuditLog.create({
      action,
      entityType,
      entityId,
      performedByUserId,
      performedByRole,
      details,
      ipAddress,
    });
  } catch (err) {
    console.error("Audit log write failed:", err.message);
  }
}

export function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
