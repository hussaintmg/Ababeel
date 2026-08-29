import { listResource, createResource } from "@/lib/training/ownerCrud";

// Owner CRUD for every training resource. One route, driven by the registry in
// lib/training/resources.js — see the note there on why these are not ten
// separate route folders.
export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { resource } = await params;
  return listResource(request, resource);
}

export async function POST(request, { params }) {
  const { resource } = await params;
  return createResource(request, resource);
}
