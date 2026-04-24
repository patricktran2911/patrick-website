"use client";

import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";

type EditablePrimitive = string | number | boolean;
export type EditableValue = EditablePrimitive | EditableObject | EditableValue[];
export type EditableObject = { [key: string]: EditableValue };

interface JsonFieldEditorProps {
  label: string;
  path: string;
  value: EditableValue;
  onChange: (nextValue: EditableValue) => void;
  depth?: number;
}

function isObjectValue(value: EditableValue): value is EditableObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatLabel(label: string) {
  return label
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function createEmptyValue(sample: EditableValue | undefined): EditableValue {
  if (typeof sample === "string" || sample === undefined) return "";
  if (typeof sample === "number") return 0;
  if (typeof sample === "boolean") return false;

  if (Array.isArray(sample)) {
    return sample.length > 0 ? [createEmptyValue(sample[0])] : [];
  }

  return Object.fromEntries(
    Object.entries(sample).map(([key, value]) => [key, createEmptyValue(value)])
  );
}

function getFieldHint(path: string) {
  if (path.endsWith(".iconKey")) {
    return "Use an icon key already supported by the site component map.";
  }

  if (path.endsWith(".logoBg")) {
    return "Tailwind utility class used behind the project logo.";
  }

  if (path.endsWith(".resumeFileId")) {
    return "Google Drive file ID used for the public resume links.";
  }

  if (path.endsWith(".favicon")) {
    return "Public path to the favicon asset.";
  }

  return null;
}

function PrimitiveField({
  label,
  path,
  value,
  onChange,
}: {
  label: string;
  path: string;
  value: EditablePrimitive;
  onChange: (nextValue: EditablePrimitive) => void;
}) {
  const hint = getFieldHint(path);
  const multiline =
    typeof value === "string" &&
    (value.includes("\n") ||
      value.length > 72 ||
      /(description|intro|body|subtitle|message|text|title)$/i.test(path));

  return (
    <label className="block space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-white/86">{formatLabel(label)}</span>
        <span className="text-[11px] uppercase tracking-[0.24em] text-white/30">
          {typeof value}
        </span>
      </div>

      {typeof value === "boolean" ? (
        <button
          type="button"
          onClick={() => onChange(!value)}
          className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
            value
              ? "border-cyan-400/35 bg-cyan-400/12 text-white"
              : "border-white/10 bg-slate-950/35 text-white/62"
          }`}
        >
          <span>{value ? "Enabled" : "Disabled"}</span>
          <span
            className={`h-6 w-11 rounded-full p-1 transition ${
              value ? "bg-cyan-300/20" : "bg-white/10"
            }`}
          >
            <span
              className={`block h-4 w-4 rounded-full bg-white transition ${
                value ? "translate-x-5" : ""
              }`}
            />
          </span>
        </button>
      ) : multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={Math.min(8, Math.max(3, value.split("\n").length + 1))}
          className="min-h-[112px] w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/45 focus:ring-2 focus:ring-cyan-400/12"
        />
      ) : (
        <input
          type={typeof value === "number" ? "number" : "text"}
          value={value}
          onChange={(event) =>
            onChange(typeof value === "number" ? Number(event.target.value) : event.target.value)
          }
          className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 text-sm text-white outline-none transition focus:border-cyan-400/45 focus:ring-2 focus:ring-cyan-400/12"
        />
      )}

      {hint && <p className="text-xs leading-5 text-white/42">{hint}</p>}
    </label>
  );
}

export default function JsonFieldEditor({
  label,
  path,
  value,
  onChange,
  depth = 0,
}: JsonFieldEditorProps) {
  if (Array.isArray(value)) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white">{formatLabel(label)}</h3>
            <p className="text-xs text-white/40">{value.length} item(s)</p>
          </div>
          <button
            type="button"
            onClick={() => onChange([...value, createEmptyValue(value[0])])}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-400/22 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-100 transition hover:-translate-y-0.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add item
          </button>
        </div>

        {value.length > 0 ? (
          <div className="space-y-3">
            {value.map((item, index) => (
              <motion.div
                key={`${path}-${index}`}
                layout
                className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {formatLabel(label)} {index + 1}
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/28">
                      {path}[{index}]
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:border-rose-300/25 hover:bg-rose-400/10 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Remove ${label} ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <JsonFieldEditor
                  label={`${label} ${index + 1}`}
                  path={`${path}[${index}]`}
                  value={item}
                  onChange={(nextItem) =>
                    onChange(value.map((entry, itemIndex) => (itemIndex === index ? nextItem : entry)))
                  }
                  depth={depth + 1}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-slate-950/25 px-4 py-8 text-center text-sm text-white/42">
            No items yet. Use the add button to create one.
          </div>
        )}
      </div>
    );
  }

  if (isObjectValue(value)) {
    return (
      <div
        className={`rounded-[28px] border border-white/8 ${
          depth === 0 ? "bg-white/[0.03] p-5 sm:p-6" : "bg-slate-950/25 p-4"
        }`}
      >
        {depth === 0 && (
          <div className="mb-5 border-b border-white/8 pb-4">
            <p className="text-xs font-medium uppercase tracking-[0.32em] text-cyan-200/70">
              Section editor
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{formatLabel(label)}</h2>
            <p className="mt-1 text-sm leading-6 text-white/46">
              Edit the structured fields below. Arrays support adding and removing repeatable items.
            </p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(value).map(([entryKey, entryValue]) => {
            const fullWidth =
              Array.isArray(entryValue) ||
              isObjectValue(entryValue) ||
              (typeof entryValue === "string" && entryValue.length > 80);

            return (
              <div key={`${path}.${entryKey}`} className={fullWidth ? "md:col-span-2" : ""}>
                <JsonFieldEditor
                  label={entryKey}
                  path={`${path}.${entryKey}`}
                  value={entryValue}
                  onChange={(nextValue) =>
                    onChange({
                      ...value,
                      [entryKey]: nextValue,
                    })
                  }
                  depth={depth + 1}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return <PrimitiveField label={label} path={path} value={value} onChange={onChange} />;
}
