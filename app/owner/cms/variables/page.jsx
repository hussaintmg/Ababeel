"use client";

import { CmsVariablesProvider } from "@/context/CmsVariablesContext";
import VariablesWorkbench from "@/Components/owner/cms/dynamic/VariablesWorkbench";

export default function CmsVariablesPage() {
  return (
    <CmsVariablesProvider>
      <VariablesWorkbench />
    </CmsVariablesProvider>
  );
}
