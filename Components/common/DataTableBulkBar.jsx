"use client";

import React from "react";
import { CheckSquare, X } from "lucide-react";

/**
 * Floating / Sticky Bulk Action Bar.
 * Appears when items are selected across pages, with action buttons and clear options.
 */
export default function DataTableBulkBar({
  selectedCount = 0,
  onClearSelection,
  actions,
  children,
  itemName = "items",
  className = "",
}) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={`bg-blue-50/90 backdrop-blur border border-blue-200 rounded-xl px-4 py-3 mb-4 flex flex-wrap items-center justify-between gap-3 shadow-xs transition-all animate-fadeIn ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
          <CheckSquare className="w-4 h-4" />
        </div>
        <div>
          <span className="font-semibold text-blue-950 text-sm">
            {selectedCount}
          </span>{" "}
          <span className="text-blue-800 text-sm font-medium">
            {selectedCount === 1 ? itemName.replace(/s$/, "") : itemName} selected across pages
          </span>
        </div>
        <button
          type="button"
          onClick={onClearSelection}
          className="inline-flex items-center gap-1 ml-2 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-100 hover:bg-blue-200/80 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
        >
          <X className="w-3 h-3" />
          Deselect all
        </button>
      </div>

      {/* Action Buttons slot */}
      <div className="flex flex-wrap items-center gap-2.5 ml-auto">
        {actions}
        {children}
      </div>
    </div>
  );
}
