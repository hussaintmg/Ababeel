"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import ResourceTable from "@/Components/owner/training/ResourceTable";
import { getSpec } from "@/Components/owner/training/fieldSpecs";

// One list screen for every training resource — see fieldSpecs.js for why the
// presentation lives in a spec rather than in ten copies of this file.
export default function TrainingListPage({ params }) {
  const { resource } = use(params);
  const spec = getSpec(resource);
  if (!spec) notFound();
  return <ResourceTable resource={resource} spec={spec} />;
}
