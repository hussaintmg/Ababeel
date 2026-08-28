"use client";

/**
 * Loads the CMS variable registry once for the whole owner builder, so every
 * fx picker, autocomplete list and data inspector shares one fetch.
 *
 * The registry describes the database. What it cannot know is what the page
 * being edited has asked for — its own data sources publish names like
 * `programmeCount` into the page context. The builder registers those through
 * `setPageSources`, and they are merged in here so every picker offers them
 * alongside the schema.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { sourceVariables, sourceTreeNode, PAGE_CATEGORY } from "@/lib/cms/sourceVariables";

const CmsVariablesContext = createContext(null);

export function CmsVariablesProvider({ children }) {
  const [state, setState] = useState({
    loading: true,
    error: "",
    variables: [],
    tree: [],
    categories: [],
    registry: { lastSyncedAt: null, modelCount: 0, variableCount: 0, deprecatedCount: 0 },
  });
  // What the page being edited publishes: { sources, dynamicRoute }.
  const [page, setPage] = useState({ sources: [], dynamicRoute: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      const res = await axios.get("/api/owner/cms/variables", { withCredentials: true });
      const d = res.data?.data || {};
      setState({
        loading: false,
        error: "",
        variables: d.variables || [],
        tree: d.tree || [],
        categories: d.categories || [],
        registry: d.state || { lastSyncedAt: null, modelCount: 0, variableCount: 0, deprecatedCount: 0 },
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err?.response?.data?.error || "Could not load variables",
      }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sync = useCallback(async () => {
    const res = await axios.post("/api/owner/cms/variables/sync", {}, { withCredentials: true });
    await load();
    return res.data?.data;
  }, [load]);

  /**
   * Registered by the page builder. Kept as one call so a re-render with an
   * unchanged config does not restart the memo below.
   */
  const setPageSources = useCallback((sources, dynamicRoute = null) => {
    setPage((prev) => {
      const same =
        JSON.stringify(prev.sources) === JSON.stringify(sources || []) &&
        JSON.stringify(prev.dynamicRoute) === JSON.stringify(dynamicRoute);
      return same ? prev : { sources: sources || [], dynamicRoute };
    });
  }, []);

  const pageVars = useMemo(
    () => sourceVariables(page.sources, state.tree, page.dynamicRoute),
    [page.sources, page.dynamicRoute, state.tree]
  );

  // The page's own names come first: they are the ones an author is looking
  // for, and they must win over a schema field that happens to share a name.
  const merged = useMemo(() => {
    if (!pageVars.length) return state;
    const taken = new Set(pageVars.map((v) => v.name));
    const node = sourceTreeNode(pageVars);
    return {
      ...state,
      variables: [...pageVars, ...state.variables.filter((v) => !taken.has(v.name))],
      tree: node ? [node, ...state.tree] : state.tree,
      categories: [{ name: PAGE_CATEGORY, count: pageVars.length }, ...state.categories],
    };
  }, [state, pageVars]);

  const byName = useMemo(
    () => new Map(merged.variables.map((v) => [v.name, v])),
    [merged.variables]
  );

  const value = useMemo(
    () => ({ ...merged, reload: load, sync, setPageSources, byName, lookup: (name) => byName.get(name) || null }),
    [merged, load, sync, setPageSources, byName]
  );

  return <CmsVariablesContext.Provider value={value}>{children}</CmsVariablesContext.Provider>;
}

/** Safe to call outside the provider — returns an empty registry instead of throwing. */
export function useCmsVariables() {
  return (
    useContext(CmsVariablesContext) || {
      loading: false,
      error: "",
      variables: [],
      tree: [],
      categories: [],
      registry: { lastSyncedAt: null, modelCount: 0, variableCount: 0, deprecatedCount: 0 },
      reload: () => {},
      sync: async () => null,
      setPageSources: () => {},
      byName: new Map(),
      lookup: () => null,
    }
  );
}
