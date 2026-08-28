"use client";

/**
 * Page data sources + dynamic route configuration.
 *
 * A data source is a visual query — model, filters, sort, limit — that
 * publishes its results into the page under a variable name. It is stored on
 * the page and executed server-side by the validated query engine.
 */
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Plus, Trash2, Database, Play, Loader2, Route, ChevronDown } from "lucide-react";
import { Label } from "@/Components/owner/cms/fields";

const OPS = [
  { value: "equals", label: "equals" },
  { value: "notEquals", label: "not equals" },
  { value: "gt", label: "greater than" },
  { value: "gte", label: "greater or equal" },
  { value: "lt", label: "less than" },
  { value: "lte", label: "less or equal" },
  { value: "contains", label: "contains" },
  { value: "startsWith", label: "starts with" },
  { value: "in", label: "is one of (comma separated)" },
  { value: "notIn", label: "is not one of" },
  { value: "exists", label: "exists" },
  { value: "notExists", label: "does not exist" },
];

const UNARY = new Set(["exists", "notExists"]);

function newSource(models) {
  const model = models[0];
  return {
    key: model ? model.collectionKey : "items",
    label: model ? `${model.label} list` : "Items",
    model: model?.name || "",
    mode: "list",
    match: "all",
    filters: [],
    sortField: "createdAt",
    sortDir: "desc",
    limit: 12,
    skip: 0,
    paginate: false,
    populate: [],
  };
}

/** Flatten a model descriptor's field tree into selectable dotted paths. */
function fieldPaths(model, fields = model?.fields, prefix = "", out = []) {
  for (const f of fields || []) {
    const path = prefix ? `${prefix}.${f.name}` : f.name;
    if (!f.isArray) out.push({ path, type: f.type });
    if (f.children?.length && !f.isArray && f.type === "Object") fieldPaths(model, f.children, path, out);
  }
  return out;
}

export default function DataSourcesPanel({
  sources,
  onChange,
  dynamicRoute,
  onDynamicRouteChange,
  pageKey,
  isCustom,
}) {
  const [models, setModels] = useState([]);
  const [descriptors, setDescriptors] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [testing, setTesting] = useState("");
  const [results, setResults] = useState({});

  useEffect(() => {
    axios
      .get("/api/owner/cms/data/query", { withCredentials: true })
      .then((res) => setModels(res.data?.data?.models || []))
      .catch(() => setModels([]));
  }, []);

  const loadDescriptor = async (name) => {
    if (!name || descriptors[name]) return;
    try {
      const res = await axios.get(`/api/owner/cms/data/query?model=${encodeURIComponent(name)}`, {
        withCredentials: true,
      });
      setDescriptors((d) => ({ ...d, [name]: res.data?.data }));
    } catch {
      /* the select simply falls back to free-text field names */
    }
  };

  useEffect(() => {
    sources.forEach((s) => loadDescriptor(s.model));
    if (dynamicRoute?.model) loadDescriptor(dynamicRoute.model);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sources, dynamicRoute?.model]);

  const update = (i, patch) => onChange(sources.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const remove = (i) => onChange(sources.filter((_, idx) => idx !== i));

  const test = async (source) => {
    setTesting(source.key);
    try {
      const res = await axios.post(
        "/api/owner/cms/data/query",
        { source, context: {} },
        { withCredentials: true }
      );
      const data = res.data?.data;
      setResults((r) => ({ ...r, [source.key]: data }));
      if (data?.error) toast.error(data.error);
      else toast.success(`${Array.isArray(data?.data) ? data.data.length : data?.data ? 1 : 0} record(s) returned`);
    } catch (e) {
      toast.error(e?.response?.data?.error || "Query failed");
    } finally {
      setTesting("");
    }
  };

  const routeModelFields = useMemo(() => {
    const d = descriptors[dynamicRoute?.model];
    return d ? fieldPaths(d.model) : [];
  }, [descriptors, dynamicRoute?.model]);

  return (
    <div className="space-y-4">
      {/* ---------------- data sources ---------------- */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
          <Database size={15} className="text-blue-600" />
          <span className="text-sm font-medium text-gray-800">Page data</span>
          <span className="text-xs text-gray-400">{sources.length} source{sources.length === 1 ? "" : "s"}</span>
          <button
            type="button"
            onClick={() => onChange([...sources, newSource(models)])}
            disabled={!models.length}
            className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus size={13} /> Add data
          </button>
        </div>

        {!sources.length ? (
          <p className="px-4 py-6 text-center text-xs text-gray-400">
            No data yet. Add a source to expose records — e.g. <code className="font-mono">courses</code> — then bind them in your blocks.
          </p>
        ) : null}

        <div className="divide-y divide-gray-100">
          {sources.map((source, i) => {
            const descriptor = descriptors[source.model];
            const paths = descriptor ? fieldPaths(descriptor.model) : [];
            const open = expanded === i;
            const result = results[source.key];
            return (
              <div key={i}>
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : i)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-gray-50"
                >
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? "" : "-rotate-90"}`} />
                  <code className="text-xs font-mono text-blue-700">{source.key}</code>
                  <span className="text-xs text-gray-400">
                    {source.mode === "single" ? "one" : source.mode === "count" ? "how many" : `up to ${source.limit}`} · {source.model}
                  </span>
                  {result ? (
                    <span className="ml-auto text-[11px] text-gray-400">
                      {result.error
                        ? "error"
                        : source.mode === "count"
                        ? `${result.data ?? 0}`
                        : `${Array.isArray(result.data) ? result.data.length : result.data ? 1 : 0} record(s)`}
                    </span>
                  ) : null}
                </button>

                {open ? (
                  <div className="px-4 pb-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Label>Variable name</Label>
                        <input
                          value={source.key}
                          onChange={(e) => update(i, { key: e.target.value.replace(/[^a-zA-Z0-9_$]/g, "") })}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <Label>Source</Label>
                        <select
                          value={source.model}
                          onChange={(e) => {
                            update(i, { model: e.target.value });
                            loadDescriptor(e.target.value);
                          }}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {models.map((m) => (
                            <option key={m.name} value={m.name}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>Returns</Label>
                        <select
                          value={source.mode}
                          onChange={(e) => update(i, { mode: e.target.value })}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="list">A list</option>
                          <option value="single">A single record</option>
                          <option value="count">How many (a number)</option>
                        </select>
                      </div>
                    </div>

                    {/* filters */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-2.5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Filter</span>
                        <select
                          value={source.match || "all"}
                          onChange={(e) => update(i, { match: e.target.value })}
                          className="px-1.5 py-0.5 border border-gray-300 rounded text-[11px] bg-white"
                        >
                          <option value="all">match all</option>
                          <option value="any">match any</option>
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            update(i, {
                              filters: [...(source.filters || []), { field: paths[0]?.path || "", op: "equals", value: "", dynamic: false }],
                            })
                          }
                          className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded border border-dashed border-gray-300 text-[11px] text-gray-600 hover:border-blue-400"
                        >
                          <Plus size={11} /> Add filter
                        </button>
                      </div>
                      {(source.filters || []).map((f, fi) => (
                        <div key={fi} className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          <select
                            value={f.field}
                            onChange={(e) => {
                              const filters = [...source.filters];
                              filters[fi] = { ...f, field: e.target.value };
                              update(i, { filters });
                            }}
                            className="flex-1 min-w-[120px] px-2 py-1 border border-gray-300 rounded text-[11px] bg-white"
                          >
                            <option value="">field…</option>
                            {paths.map((p) => (
                              <option key={p.path} value={p.path}>
                                {p.path}
                              </option>
                            ))}
                          </select>
                          <select
                            value={f.op}
                            onChange={(e) => {
                              const filters = [...source.filters];
                              filters[fi] = { ...f, op: e.target.value };
                              update(i, { filters });
                            }}
                            className="px-2 py-1 border border-gray-300 rounded text-[11px] bg-white"
                          >
                            {OPS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                          {!UNARY.has(f.op) ? (
                            <input
                              value={f.value ?? ""}
                              onChange={(e) => {
                                const filters = [...source.filters];
                                filters[fi] = { ...f, value: e.target.value };
                                update(i, { filters });
                              }}
                              placeholder={f.dynamic ? "params.slug" : "value"}
                              className="flex-1 min-w-[100px] px-2 py-1 border border-gray-300 rounded text-[11px]"
                            />
                          ) : null}
                          {!UNARY.has(f.op) ? (
                            <button
                              type="button"
                              onClick={() => {
                                const filters = [...source.filters];
                                filters[fi] = { ...f, dynamic: !f.dynamic, value: "" };
                                update(i, { filters });
                              }}
                              title="Take the value from the page context (route params, user…)"
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${f.dynamic ? "bg-blue-600 text-white" : "bg-white border border-gray-300 text-gray-500"}`}
                            >
                              var
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => update(i, { filters: source.filters.filter((_, x) => x !== fi) })}
                            className="p-1 rounded hover:bg-red-50 text-red-500"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <Label>Sort by</Label>
                        <select
                          value={source.sortField}
                          onChange={(e) => update(i, { sortField: e.target.value })}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
                        >
                          {paths.map((p) => (
                            <option key={p.path} value={p.path}>
                              {p.path}
                            </option>
                          ))}
                          {!paths.length ? <option value="createdAt">createdAt</option> : null}
                        </select>
                      </div>
                      <div>
                        <Label>Direction</Label>
                        <select
                          value={source.sortDir}
                          onChange={(e) => update(i, { sortDir: e.target.value })}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
                        >
                          <option value="desc">descending</option>
                          <option value="asc">ascending</option>
                        </select>
                      </div>
                      <div>
                        <Label>Limit</Label>
                        <input
                          type="number"
                          min={1}
                          max={200}
                          value={source.limit}
                          onChange={(e) => update(i, { limit: e.target.value })}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <Label>Skip</Label>
                        <input
                          type="number"
                          min={0}
                          value={source.skip}
                          onChange={(e) => update(i, { skip: e.target.value })}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    {descriptor?.populate?.length ? (
                      <div>
                        <Label>Load related records</Label>
                        <div className="flex flex-wrap gap-1.5">
                          {descriptor.populate.map((p) => {
                            const on = (source.populate || []).includes(p.path);
                            return (
                              <button
                                key={p.path}
                                type="button"
                                onClick={() =>
                                  update(i, {
                                    populate: on
                                      ? source.populate.filter((x) => x !== p.path)
                                      : [...(source.populate || []), p.path],
                                  })
                                }
                                className={`px-2 py-1 rounded-md text-[11px] border ${on ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300"}`}
                                title={`Resolve ${p.path} into the full ${p.ref} record`}
                              >
                                {p.path} → {p.ref}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => test(source)}
                        disabled={testing === source.key}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-700 hover:border-blue-400 hover:text-blue-600"
                      >
                        {testing === source.key ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                        Test query
                      </button>
                      <label className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={!!source.paginate}
                          onChange={(e) => update(i, { paginate: e.target.checked })}
                        />
                        Count total (pagination)
                      </label>
                      <button
                        type="button"
                        onClick={() => remove(i)}
                        className="ml-auto inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    </div>

                    {result ? (
                      <pre className="max-h-48 overflow-auto rounded-lg bg-gray-900 text-gray-100 text-[11px] p-3">
                        {JSON.stringify(result.data, null, 2)?.slice(0, 4000)}
                      </pre>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------------- dynamic route ---------------- */}
      {isCustom ? (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
            <Route size={15} className="text-indigo-600" />
            <span className="text-sm font-medium text-gray-800">Page template (dynamic route)</span>
            <button
              type="button"
              onClick={() =>
                onDynamicRouteChange({
                  enabled: !dynamicRoute?.enabled,
                  model: dynamicRoute?.model || models[0]?.name || "",
                  lookupField: dynamicRoute?.lookupField || "slug",
                  paramName: dynamicRoute?.paramName || "slug",
                  itemKey: dynamicRoute?.itemKey || "item",
                })
              }
              className={`ml-auto relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${dynamicRoute?.enabled ? "bg-indigo-600" : "bg-gray-300"}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${dynamicRoute?.enabled ? "translate-x-5" : "translate-x-1"}`} />
            </button>
          </div>
          <div className="p-4">
            {dynamicRoute?.enabled ? (
              <>
                <p className="mb-3 text-xs text-gray-500">
                  This page becomes a template rendered once per record at{" "}
                  <code className="font-mono text-indigo-700">/{pageKey}/[{dynamicRoute.paramName || "slug"}]</code>.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <Label>Data source</Label>
                    <select
                      value={dynamicRoute.model || ""}
                      onChange={(e) => {
                        onDynamicRouteChange({ ...dynamicRoute, model: e.target.value });
                        loadDescriptor(e.target.value);
                      }}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
                    >
                      {models.map((m) => (
                        <option key={m.name} value={m.name}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Look up by</Label>
                    <select
                      value={dynamicRoute.lookupField || "slug"}
                      onChange={(e) => onDynamicRouteChange({ ...dynamicRoute, lookupField: e.target.value })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
                    >
                      {routeModelFields.map((p) => (
                        <option key={p.path} value={p.path}>
                          {p.path}
                        </option>
                      ))}
                      {!routeModelFields.length ? <option value="slug">slug</option> : null}
                    </select>
                  </div>
                  <div>
                    <Label>URL parameter</Label>
                    <input
                      value={dynamicRoute.paramName || "slug"}
                      onChange={(e) => onDynamicRouteChange({ ...dynamicRoute, paramName: e.target.value.replace(/[^a-zA-Z0-9_$]/g, "") })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label>Item variable</Label>
                    <input
                      value={dynamicRoute.itemKey || "item"}
                      onChange={(e) => onDynamicRouteChange({ ...dynamicRoute, itemKey: e.target.value.replace(/[^a-zA-Z0-9_$]/g, "") })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-gray-400">
                Turn this on to render one page per record — e.g. <code className="font-mono">/courses/react-masterclass</code>.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
