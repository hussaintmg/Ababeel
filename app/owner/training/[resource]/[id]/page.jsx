"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import ResourceForm from "@/Components/owner/training/ResourceForm";
import { getSpec } from "@/Components/owner/training/fieldSpecs";

// Static "new" is matched by Next before this segment, so an id is always an id.
export default function TrainingEditPage({ params }) {
  const { resource, id } = use(params);
  const spec = getSpec(resource);
  if (!spec) notFound();
  return <ResourceForm resource={resource} spec={spec} id={id} />;
}
