"use client";

/**
 * No-code condition builder.
 *
 * Produces the `{ match, rules: [...] }` shape the condition engine evaluates.
 * Rules can be nested one level into AND/OR groups, and the right-hand side of
 * a comparison can be either a typed value or another variable.
 */
import { useState } from "react";
import { Plus, Trash2, Braces, GitBranch } from "lucide-react";
import VariablePicker from "@/Components/owner/cms/dynamic/VariablePicker";
import { OPERATORS, operatorArity, newRule, newGroup, describeConditions } from "@/lib/cms/conditions";
import { useCmsVariables } from "@/context/CmsVariablesContext";
import { typeIcon } from "@/lib/cms/types";

function VariableInput({ value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const { lookup } = useCmsVariables();
  const variable = lookup(String(value || ""));

  return (
    <div className="relative flex-1 min-w-[140px]">
      <div className="flex items-center gap-1">
        <span className="text-xs" aria-hidden>{variable ? typeIcon(variable.type) : "•"}</span>
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes("application/x-cms-variable")) e.preventDefault();
          }}
          onDrop={(e) => {
            const name = e.dataTransfer.getData("application/x-cms-variable");
            if (!name) return;
            e.preventDefault();
            onChange(name);
          }}
          placeholder={placeholder || "course.price"}
          className="flex-1 min-w-0 px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="p-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100"
          title="Pick a variable"
        >
          <Braces size={13} />
        </button>
      </div>
      {open ? (
        <div className="absolute z-50 mt-1 right-0">
          <VariablePicker
            fieldType={null}
            onClose={() => setOpen(false)}
            onPick={(name) => {
              onChange(name);
              setOpen(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function RuleRow({ rule, onChange, onRemove }) {
  const arity = operatorArity(rule.op);
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-2">
      <VariableInput value={rule.left} onChange={(v) => onChange({ ...rule, left: v })} />
      <select
        value={rule.op}
        onChange={(e) => onChange({ ...rule, op: e.target.value })}
        className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-blue-500"
      >
        {OPERATORS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {arity === 2 ? (
        rule.rightIsVariable ? (
          <VariableInput
            value={rule.right}
            onChange={(v) => onChange({ ...rule, right: v })}
            placeholder="user.role"
          />
        ) : (
          <input
            type="text"
            value={rule.right ?? ""}
            onChange={(e) => onChange({ ...rule, right: e.target.value })}
            placeholder="value"
            className="flex-1 min-w-[110px] px-2 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
          />
        )
      ) : null}
      {arity === 2 ? (
        <button
          type="button"
          onClick={() => onChange({ ...rule, rightIsVariable: !rule.rightIsVariable, right: "" })}
          className={`px-2 py-1 rounded-md text-[10px] font-medium ${rule.rightIsVariable ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
          title="Compare against another variable instead of a fixed value"
        >
          var
        </button>
      ) : null}
      <button
        type="button"
        onClick={onRemove}
        className="p-1.5 rounded hover:bg-red-50 text-red-500"
        title="Remove this condition"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

export default function ConditionBuilder({ value, onChange, allowNesting = true, title = "Show this block only if" }) {
  const group = value && Array.isArray(value.rules) ? value : { enabled: false, match: "all", rules: [] };
  const active = group.enabled !== false && group.rules.length > 0;

  const update = (patch) => onChange({ ...group, ...patch });
  const setRule = (i, next) => update({ rules: group.rules.map((r, idx) => (idx === i ? next : r)) });
  const removeRule = (i) => {
    const rules = group.rules.filter((_, idx) => idx !== i);
    onChange({ ...group, rules, enabled: rules.length > 0 });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
      <div className="flex items-center gap-2">
        <GitBranch size={14} className="text-gray-400" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{title}</span>
        {active ? (
          <span className="ml-auto text-[10px] text-gray-400 font-mono truncate max-w-[200px]" title={describeConditions(group)}>
            {describeConditions(group)}
          </span>
        ) : (
          <span className="ml-auto text-[10px] text-gray-400">always visible</span>
        )}
      </div>

      {group.rules.length ? (
        <>
          <div className="mt-2 flex items-center gap-1">
            <span className="text-[11px] text-gray-500">Match</span>
            {["all", "any"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => update({ match: m })}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${(group.match || "all") === m ? "bg-gray-900 text-white" : "bg-white text-gray-500 border border-gray-200"}`}
              >
                {m === "all" ? "AND" : "OR"}
              </button>
            ))}
          </div>
          <div className="mt-2 space-y-2">
            {group.rules.map((rule, i) =>
              Array.isArray(rule?.rules) ? (
                <div key={i} className="rounded-lg border border-blue-200 bg-blue-50/40 p-2">
                  <ConditionBuilder
                    value={rule}
                    onChange={(next) => setRule(i, next)}
                    allowNesting={false}
                    title="Nested group"
                  />
                  <button
                    type="button"
                    onClick={() => removeRule(i)}
                    className="mt-1 text-[11px] text-red-500 hover:underline"
                  >
                    Remove group
                  </button>
                </div>
              ) : (
                <RuleRow key={i} rule={rule} onChange={(next) => setRule(i, next)} onRemove={() => removeRule(i)} />
              )
            )}
          </div>
        </>
      ) : null}

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange({ ...group, enabled: true, rules: [...group.rules, newRule()] })}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-gray-300 text-[11px] text-gray-600 hover:border-blue-400 hover:text-blue-600"
        >
          <Plus size={12} /> Add condition
        </button>
        {allowNesting ? (
          <button
            type="button"
            onClick={() => onChange({ ...group, enabled: true, rules: [...group.rules, newGroup()] })}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-gray-300 text-[11px] text-gray-600 hover:border-blue-400 hover:text-blue-600"
          >
            <Plus size={12} /> Add AND/OR group
          </button>
        ) : null}
        {group.rules.length ? (
          <button
            type="button"
            onClick={() => onChange({ enabled: false, match: "all", rules: [] })}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-gray-400 hover:text-red-500"
          >
            Clear all
          </button>
        ) : null}
      </div>
    </div>
  );
}
