import { reorderResource } from "@/lib/training/ownerCrud";

// Static segment, so Next matches this before [id] — a resource can never have
// an item whose id is literally "reorder".
export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const { resource } = await params;
  return reorderResource(request, resource);
}
