import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useCommand } from "@/context/CommandContext";
import { CommandScope, CommandCategory } from "@/lib/commands/registry";
import {
  computeRangeSelection,
  toggleItemSelection,
  mergeRangeSelection,
  selectAllVisible,
  deselectVisible,
} from "@/lib/selection/selectionEngine";

/**
 * Reusable selection hook for tables, lists, and grids.
 *
 * Supports:
 * - Stable record IDs (never array indexes)
 * - Single click selection
 * - Ctrl/Cmd + Click toggle
 * - Shift + Click contiguous range selection based on visible/displayed items
 * - Keyboard navigation (ArrowUp, ArrowDown, Home, End)
 * - Shift + ArrowUp/ArrowDown range extension
 * - Spacebar to toggle selection on focused row
 * - Enter to activate primary action on focused row
 * - Escape to clear selection (when no overlay is active)
 * - Ctrl/Cmd + A to select all visible items (when table active and outside inputs)
 * - Contextual command registration with CommandRegistry
 */
export function useSelection({
  items = [],
  itemIdKey = "_id",
  onDeleteSelected = null,
  onActivateItem = null,
  onCopySelected = null,
  tableId = "collection",
  scope = CommandScope.TABLE,
  enabled = true,
}) {
  const { registerCommand, pushScope, popScope } = useCommand();

  const [selectedIds, setSelectedIds] = useState([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);

  // Anchor index for range (Shift+Click or Shift+Arrow) selection
  const lastAnchorIndexRef = useRef(-1);

  // Array of valid IDs currently visible/available
  const visibleIds = useMemo(() => {
    return items.map((item) => (typeof item === "object" && item !== null ? item[itemIdKey] : item)).filter(Boolean);
  }, [items, itemIdKey]);

  // Clean up selected IDs if items changed and any selected item is no longer in current dataset
  // Note: if user deliberately wants cross-page selection, callers can preserve, but we provide helpers
  const selectedCount = selectedIds.length;
  const isAllSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const isSomeSelected = visibleIds.some((id) => selectedIds.includes(id)) && !isAllSelected;

  const isSelected = useCallback(
    (id) => {
      return selectedIds.includes(id);
    },
    [selectedIds]
  );

  const selectSingle = useCallback((id, index = -1) => {
    setSelectedIds([id]);
    lastAnchorIndexRef.current = index;
    if (index >= 0) setFocusedIndex(index);
  }, []);

  const toggleSelect = useCallback((id, index = -1) => {
    setSelectedIds((prev) => toggleItemSelection(prev, id));
    lastAnchorIndexRef.current = index;
    if (index >= 0) setFocusedIndex(index);
  }, []);

  const selectRange = useCallback(
    (targetIndex) => {
      if (visibleIds.length === 0) return;
      const rangeIds = computeRangeSelection(visibleIds, lastAnchorIndexRef.current, targetIndex);
      setSelectedIds((prev) => mergeRangeSelection(prev, rangeIds));
      setFocusedIndex(targetIndex);
    },
    [visibleIds]
  );

  const selectAll = useCallback(() => {
    setSelectedIds(selectAllVisible(visibleIds));
  }, [visibleIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    lastAnchorIndexRef.current = -1;
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds((prev) => deselectVisible(prev, visibleIds));
    } else {
      setSelectedIds((prev) => mergeRangeSelection(prev, visibleIds));
    }
  }, [isAllSelected, visibleIds]);

  /**
   * Row click handler.
   * Ignores clicks originating from interactive child elements (buttons, inputs, links).
   */
  const handleRowClick = useCallback(
    (id, index, event) => {
      if (!event) return;

      // Ignore if clicking interactive controls inside the row
      const target = event.target;
      if (
        target.closest("button") ||
        target.closest("a") ||
        target.closest("input") ||
        target.closest("select") ||
        target.closest("textarea") ||
        target.closest('[role="menu"]')
      ) {
        return;
      }

      if (event.shiftKey) {
        // Contiguous range selection
        event.preventDefault();
        selectRange(index);
      } else if (event.ctrlKey || event.metaKey) {
        // Toggle individual
        event.preventDefault();
        toggleSelect(id, index);
      } else {
        // Single select or focus
        selectSingle(id, index);
      }
    },
    [selectRange, toggleSelect, selectSingle]
  );

  /**
   * Checkbox change handler.
   */
  const handleCheckboxChange = useCallback(
    (id, index, event) => {
      event?.stopPropagation();
      if (event?.shiftKey && lastAnchorIndexRef.current >= 0) {
        selectRange(index);
      } else {
        toggleSelect(id, index);
      }
    },
    [selectRange, toggleSelect]
  );

  /**
   * Table / List Keyboard Navigation Handler.
   */
  const handleKeyDown = useCallback(
    (e) => {
      if (!enabled || visibleIds.length === 0) return;

      const tag = e.target?.tagName?.toUpperCase();
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target?.isContentEditable) {
        return;
      }

      // Arrow Down
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = Math.min(visibleIds.length - 1, (focusedIndex < 0 ? 0 : focusedIndex) + 1);
        setFocusedIndex(nextIndex);
        if (e.shiftKey) {
          selectRange(nextIndex);
        }
        return;
      }

      // Arrow Up
      if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex = Math.max(0, focusedIndex - 1);
        setFocusedIndex(prevIndex);
        if (e.shiftKey) {
          selectRange(prevIndex);
        }
        return;
      }

      // Home
      if (e.key === "Home") {
        e.preventDefault();
        setFocusedIndex(0);
        if (e.shiftKey) selectRange(0);
        return;
      }

      // End
      if (e.key === "End") {
        e.preventDefault();
        const last = visibleIds.length - 1;
        setFocusedIndex(last);
        if (e.shiftKey) selectRange(last);
        return;
      }

      // Space: Toggle selection on focused row
      if (e.key === " " || e.key === "Spacebar") {
        if (focusedIndex >= 0 && focusedIndex < visibleIds.length) {
          e.preventDefault();
          const focusedId = visibleIds[focusedIndex];
          toggleSelect(focusedId, focusedIndex);
        }
        return;
      }

      // Enter: Activate primary action on focused row
      if (e.key === "Enter") {
        if (focusedIndex >= 0 && focusedIndex < items.length) {
          e.preventDefault();
          const item = items[focusedIndex];
          onActivateItem?.(item);
        }
        return;
      }

      // Delete: trigger delete on selected items
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length > 0) {
        e.preventDefault();
        onDeleteSelected?.(selectedIds);
        return;
      }

      // Escape: clear selection
      if (e.key === "Escape" && selectedIds.length > 0) {
        e.preventDefault();
        clearSelection();
        return;
      }

      // Ctrl/Cmd + A: Select all visible
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        selectAll();
        return;
      }
    },
    [
      enabled,
      visibleIds,
      focusedIndex,
      selectRange,
      toggleSelect,
      items,
      onActivateItem,
      selectedIds,
      onDeleteSelected,
      clearSelection,
      selectAll,
    ]
  );

  // Manage active scope when focused or has selection
  useEffect(() => {
    if (isFocused || selectedCount > 0) {
      pushScope(scope);
      return () => popScope(scope);
    }
  }, [isFocused, selectedCount, pushScope, popScope, scope]);

  // Register contextual commands for this table with CommandContext
  useEffect(() => {
    if (!enabled) return;

    const unregs = [];

    // Select All command
    unregs.push(
      registerCommand({
        id: `${tableId}.selectAll`,
        title: "Select All Visible",
        category: CommandCategory.SELECTION,
        scope,
        shortcut: "$mod+a",
        allowInEditable: false,
        isAvailable: () => isFocused || selectedCount > 0,
        isEnabled: () => visibleIds.length > 0,
        run: () => selectAll(),
      })
    );

    // Clear Selection command
    unregs.push(
      registerCommand({
        id: `${tableId}.clearSelection`,
        title: "Clear Selection",
        category: CommandCategory.SELECTION,
        scope,
        shortcut: "escape",
        allowInEditable: false,
        isAvailable: () => selectedCount > 0,
        isEnabled: () => selectedCount > 0,
        run: () => clearSelection(),
      })
    );

    // Delete Selected command
    if (onDeleteSelected) {
      unregs.push(
        registerCommand({
          id: `${tableId}.deleteSelected`,
          title: `Delete Selected (${selectedCount})`,
          category: CommandCategory.ACTIONS,
          scope,
          shortcut: "delete",
          allowInEditable: false,
          isDestructive: true,
          isAvailable: () => selectedCount > 0,
          isEnabled: () => selectedCount > 0,
          run: () => onDeleteSelected(selectedIds),
        })
      );
    }

    // Copy Selected command
    if (onCopySelected) {
      unregs.push(
        registerCommand({
          id: `${tableId}.copySelected`,
          title: `Copy Selected (${selectedCount})`,
          category: CommandCategory.ACTIONS,
          scope,
          shortcut: "$mod+c",
          allowInEditable: false,
          isAvailable: () => selectedCount > 0,
          isEnabled: () => selectedCount > 0,
          run: () => onCopySelected(selectedIds),
        })
      );
    }

    return () => {
      unregs.forEach((fn) => fn());
    };
  }, [
    enabled,
    tableId,
    scope,
    isFocused,
    selectedCount,
    visibleIds.length,
    selectedIds,
    onDeleteSelected,
    onCopySelected,
    registerCommand,
    selectAll,
    clearSelection,
  ]);

  return {
    selectedIds,
    setSelectedIds,
    selectedCount,
    focusedIndex,
    setFocusedIndex,
    isAllSelected,
    isSomeSelected,
    isSelected,
    selectSingle,
    toggleSelect,
    selectRange,
    selectAll,
    clearSelection,
    toggleSelectAll,
    handleRowClick,
    handleCheckboxChange,
    handleKeyDown,
    tableProps: {
      onKeyDown: handleKeyDown,
      onFocus: () => setIsFocused(true),
      onBlur: () => setIsFocused(false),
      tabIndex: 0,
    },
  };
}
