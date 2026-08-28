"use client";

/**
 * Loads the CMS variable registry once for the whole owner builder, so every
 * fx picker, autocomplete list and data inspector shares one fetch.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";

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

  const byName = useMemo(
    () => new Map(state.variables.map((v) => [v.name, v])),
    [state.variables]
  );

  const value = useMemo(
    () => ({ ...state, reload: load, sync, byName, lookup: (name) => byName.get(name) || null }),
    [state, load, sync, byName]
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
      byName: new Map(),
      lookup: () => null,
    }
  );
}
