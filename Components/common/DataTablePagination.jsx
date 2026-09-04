"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

/**
 * Reusable, responsive DataTablePagination component.
 * Provides:
 * - Live row counter ("Showing X to Y of Z {itemName}")
 * - Live rows-per-page selector (10, 20, 50, 100, 200)
 * - Complete pagination buttons (First, Prev, Page pills, Next, Last)
 */
export default function DataTablePagination({
  page = 1,
  pageSize = 20,
  totalItems = 0,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100, 200],
  itemName = "records",
  className = "",
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  // Generate page numbers window (up to 5 buttons centered around currentPage)
  const getPageNumbers = () => {
    const pages = [];
    const maxButtons = 5;

    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);

      if (currentPage <= 3) {
        start = 1;
        end = maxButtons;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - maxButtons + 1;
        end = totalPages;
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      onPageChange?.(newPage);
    }
  };

  const handlePageSizeChange = (e) => {
    const newSize = Number(e.target.value);
    onPageSizeChange?.(newSize);
  };

  return (
    <div
      className={`px-4 sm:px-6 py-4 bg-white border-t border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none ${className}`}
    >
      {/* Left side: Live count & Rows-per-page selector */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
        {/* Rows per page dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500 font-medium">Rows per page:</span>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            aria-label="Rows per page"
            className="bg-gray-50 border border-gray-300 text-gray-800 text-sm font-semibold rounded-lg px-2.5 py-1.5 hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="h-4 w-px bg-gray-200 hidden sm:block" />

        {/* Live item counter */}
        <div>
          Showing <span className="font-semibold text-gray-900">{startItem}</span>{" "}
          to <span className="font-semibold text-gray-900">{endItem}</span> of{" "}
          <span className="font-semibold text-gray-900">{totalItems}</span>{" "}
          {itemName}
        </div>
      </div>

      {/* Right side: Page navigation */}
      <div className="flex items-center gap-1.5 self-center md:self-auto">
        {/* First Page button */}
        <button
          type="button"
          onClick={() => handlePageChange(1)}
          disabled={currentPage <= 1}
          title="First Page"
          className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous Page button */}
        <button
          type="button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          title="Previous Page"
          className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Ellipsis if needed at start */}
        {pageNumbers[0] > 1 && (
          <>
            <button
              type="button"
              onClick={() => handlePageChange(1)}
              className="px-3 py-1.5 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              1
            </button>
            {pageNumbers[0] > 2 && (
              <span className="px-1 text-gray-400 text-sm">…</span>
            )}
          </>
        )}

        {/* Page pills */}
        {pageNumbers.map((p) => {
          const isActive = p === currentPage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => handlePageChange(p)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-xs shadow-blue-500/30"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {p}
            </button>
          );
        })}

        {/* Ellipsis if needed at end */}
        {pageNumbers[pageNumbers.length - 1] < totalPages && (
          <>
            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
              <span className="px-1 text-gray-400 text-sm">…</span>
            )}
            <button
              type="button"
              onClick={() => handlePageChange(totalPages)}
              className="px-3 py-1.5 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Next Page button */}
        <button
          type="button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          title="Next Page"
          className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last Page button */}
        <button
          type="button"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage >= totalPages}
          title="Last Page"
          className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
