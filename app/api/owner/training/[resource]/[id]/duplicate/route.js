import { duplicateResourceItem } from "@/lib/training/ownerCrud";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const { resource, id } = await params;
  return duplicateResourceItem(request, resource, id);
}
