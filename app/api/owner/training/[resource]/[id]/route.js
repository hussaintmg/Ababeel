import {
  getResourceItem,
  updateResourceItem,
  deleteResourceItem,
} from "@/lib/training/ownerCrud";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { resource, id } = await params;
  return getResourceItem(request, resource, id);
}

export async function PATCH(request, { params }) {
  const { resource, id } = await params;
  return updateResourceItem(request, resource, id);
}

export async function DELETE(request, { params }) {
  const { resource, id } = await params;
  return deleteResourceItem(request, resource, id);
}
