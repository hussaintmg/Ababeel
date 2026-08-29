"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import ResourceForm from "@/Components/owner/training/ResourceForm";
import { getSpec } from "@/Components/owner/training/fieldSpecs";

export default function TrainingCreatePage({ params }) {
  const { resource } = use(params);
  const spec = getSpec(resource);
  if (!spec) notFound();
  return <ResourceForm resource={resource} spec={spec} />;
}
