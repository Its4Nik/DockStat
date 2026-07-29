/**
 * Widget configuration panel — renders form fields from a widget's
 * JSON Schema `configSchema`, editing the per-instance `PlacedWidget.config`.
 *
 * Renders three sections:
 *   1. Data Inputs — maps each widget input to a data-pipe output key
 *   2. Display     — schema-driven fields, with rich editors for
 *                    thresholds/color-stops (instead of raw JSON)
 *   3. (footer)    — Done button
 */

import { Button, Input, Toggle } from "@dockstat/ui"
import { cn } from "@sglara/cn"
import { Plus, Trash2, X } from "lucide-react"
import { useMemo } from "react"
import type { PlacedWidget, WidgetConfig, WidgetDefinition } from "widgets/client"

const DATA_INPUT_MAP_KEY = "dataInputMap"

interface WidgetConfigPanelProps {
  widget?: WidgetDefinition
  placed: PlacedWidget | null
  /** Output keys produced by the dashboard's data-pipe (for input mapping) */
  availableOutputKeys: string[]
  onChange: (patch: Record<string, unknown>) => void
  onClose: () => void
}

interface SchemaProp {
  type: "object" | "string" | "number" | "boolean" | "array"
  title?: string
  description?: string
  default?: unknown
  enum?: unknown[]
  format?: string
  minimum?: number
  maximum?: number
}

export function WidgetConfigPanel({
  widget,
  placed,
  availableOutputKeys,
  onChange,
  onClose,
}: WidgetConfigPanelProps) {
  const schema = widget?.configSchema ?? { properties: {}, type: "object" }
  const properties = useMemo(() => {
    const props = (schema.properties ?? {}) as Record<string, SchemaProp>
    return Object.entries(props).map(([key, prop]) => ({ key, prop }))
  }, [schema])

  if (!placed || !widget) return null

  const inputMap = (placed.config[DATA_INPUT_MAP_KEY] as Record<string, string> | undefined) ?? {}

  return (
    <aside className="flex w-80 shrink-0 flex-col self-stretch overflow-hidden rounded-lg border border-card-default-border bg-card-flat-bg shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-card-default-border px-4 py-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-primary-text">{widget.label}</div>
          <div className="text-xs uppercase tracking-wide text-muted-text">Widget settings</div>
        </div>
        <button
          className="text-muted-text transition-colors hover:text-primary-text"
          onClick={onClose}
          title="Close"
          type="button"
        >
          <X size={16} />
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {/* ── Section 1: Data inputs ───────────────────────────────── */}
        {widget.dataInputs.length > 0 && (
          <section className="space-y-2">
            <SectionTitle>Data inputs</SectionTitle>
            <p className="text-xs text-muted-text">
              Map each widget input to an output produced by your dataflow.
            </p>
            {widget.dataInputs.map((input) => (
              <div
                className="flex items-center gap-2"
                key={input}
              >
                <span className="w-1/3 shrink-0 truncate font-mono text-xs text-secondary-text">
                  {input}
                </span>
                <select
                  className={cn(
                    "flex-1 rounded-md border border-select-default-border bg-card-default-bg px-2 py-1.5 text-xs text-select-default-text",
                    "focus:border-select-default-focus-border focus:outline-none focus:ring-1 focus:ring-select-default-focus-ring"
                  )}
                  onChange={(e) =>
                    onChange({
                      [DATA_INPUT_MAP_KEY]: { ...inputMap, [input]: e.target.value },
                    })
                  }
                  value={inputMap[input] ?? ""}
                >
                  <option value="">— not connected —</option>
                  {availableOutputKeys.map((key) => (
                    <option
                      key={key}
                      value={key}
                    >
                      {key}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            {availableOutputKeys.length === 0 && (
              <p className="rounded-md border border-warning/30 bg-warning/10 px-2 py-1.5 text-xs text-warning">
                No outputs defined yet. Add <strong>Output</strong> nodes in the Dataflow editor.
              </p>
            )}
          </section>
        )}

        {/* ── Section 2: Display options ──────────────────────────── */}
        {properties.length > 0 && (
          <section className="space-y-3">
            <SectionTitle>Display</SectionTitle>
            {properties.map(({ key, prop }) => (
              <SchemaField
                config={placed.config}
                description={prop.description}
                format={prop.format}
                key={key}
                label={prop.title ?? key}
                onChange={(v) => onChange({ [key]: v })}
                options={prop.enum}
                type={prop.type}
                value={placed.config[key]}
              />
            ))}
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-card-default-border px-4 py-3">
        <Button
          fullWidth
          onClick={onClose}
          size="sm"
          variant="outline"
        >
          Done
        </Button>
      </div>
    </aside>
  )
}

// ── Section title ───────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-text">{children}</h3>
  )
}

// ── Schema-driven field renderer ────────────────────────────────────

interface SchemaFieldProps {
  label: string
  description?: string
  type: SchemaProp["type"]
  value: unknown
  onChange: (val: unknown) => void
  options?: unknown[]
  format?: string
  config: WidgetConfig
}

function SchemaField({
  label,
  description,
  type,
  value,
  onChange,
  options,
  format,
}: SchemaFieldProps) {
  // ── Color picker ────────────────────────────────────────────────
  if (format === "color") {
    return (
      <FieldShell
        description={description}
        label={label}
      >
        <div className="flex items-center gap-2">
          <input
            className="h-7 w-10 shrink-0 cursor-pointer rounded border border-card-default-border bg-transparent"
            onChange={(e) => onChange(e.target.value)}
            type="color"
            value={typeof value === "string" ? value : "#818cf8"}
          />
          <input
            className="flex-1 rounded-md border border-input-default-border bg-card-default-bg px-2 py-1 font-mono text-xs text-input-default-text focus:border-input-default-focus-border focus:outline-none"
            onChange={(e) => onChange(e.target.value)}
            value={typeof value === "string" ? value : ""}
          />
        </div>
      </FieldShell>
    )
  }

  // ── Boolean ─────────────────────────────────────────────────────
  if (type === "boolean") {
    return (
      <div className="flex items-center justify-between gap-2 py-1">
        <div className="min-w-0">
          <div className="text-xs font-medium text-secondary-text">{label}</div>
          {description && <p className="text-xs text-muted-text">{description}</p>}
        </div>
        <Toggle
          checked={Boolean(value)}
          onChange={(checked) => onChange(checked)}
          size="sm"
        />
      </div>
    )
  }

  // ── Number ──────────────────────────────────────────────────────
  if (type === "number") {
    return (
      <FieldShell
        description={description}
        label={label}
      >
        <Input
          onChange={(v) => onChange(Number(v))}
          size="sm"
          type="number"
          value={value === null || value === undefined ? "" : String(value)}
        />
      </FieldShell>
    )
  }

  // ── Enum (string with options) ──────────────────────────────────
  if (type === "string" && options && options.length > 0) {
    return (
      <FieldShell
        description={description}
        label={label}
      >
        <select
          className={cn(
            "w-full rounded-md border border-select-default-border bg-card-default-bg px-2 py-1.5 text-sm text-select-default-text",
            "focus:border-select-default-focus-border focus:outline-none focus:ring-1 focus:ring-select-default-focus-ring"
          )}
          onChange={(e) => onChange(e.target.value)}
          value={typeof value === "string" ? value : value === undefined ? "" : String(value)}
        >
          {options.map((opt) => (
            <option
              key={String(opt)}
              value={String(opt)}
            >
              {String(opt)}
            </option>
          ))}
        </select>
      </FieldShell>
    )
  }

  // ── Array of threshold objects → rich editor ───────────────────
  // Heuristic: arrays of objects with `value` + `color` keys → thresholds
  if (type === "array" && isThresholdArray(value)) {
    return (
      <ThresholdEditor
        description={description}
        label={label}
        onChange={onChange}
        value={value as Threshold[]}
      />
    )
  }

  // ── Generic array (free-form JSON) ──────────────────────────────
  if (type === "array") {
    return (
      <FieldShell
        description={description}
        label={label}
      >
        <textarea
          className={cn(
            "w-full rounded-md border border-input-default-border bg-card-default-bg px-2 py-1 font-mono text-xs text-input-default-text",
            "focus:border-input-default-focus-border focus:outline-none focus:ring-1 focus:ring-input-default-focus-ring"
          )}
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value))
            } catch {
              onChange(e.target.value)
            }
          }}
          rows={4}
          value={typeof value === "string" ? value : JSON.stringify(value ?? [], null, 2)}
        />
      </FieldShell>
    )
  }

  // ── Default: string ─────────────────────────────────────────────
  return (
    <FieldShell
      description={description}
      label={label}
    >
      <Input
        onChange={(v) => onChange(v)}
        size="sm"
        value={value === null || value === undefined ? "" : String(value)}
      />
    </FieldShell>
  )
}

function FieldShell({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <span className="block text-xs font-medium text-secondary-text">{label}</span>
      {children}
      {description && <p className="text-xs text-muted-text">{description}</p>}
    </div>
  )
}

// ── Threshold editor ────────────────────────────────────────────────

interface Threshold {
  value: number
  color: string
}

function isThresholdArray(value: unknown): boolean {
  if (!Array.isArray(value) || value.length === 0) return false
  return value.every(
    (item) =>
      item &&
      typeof item === "object" &&
      typeof (item as Record<string, unknown>).value === "number" &&
      typeof (item as Record<string, unknown>).color === "string"
  )
}

function ThresholdEditor({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description?: string
  value: Threshold[]
  onChange: (val: Threshold[]) => void
}) {
  const sorted = [...value].sort((a, b) => a.value - b.value)

  const update = (i: number, patch: Partial<Threshold>) => {
    const next = sorted.map((t, idx) => (idx === i ? { ...t, ...patch } : t))
    onChange(next)
  }
  const remove = (i: number) => onChange(sorted.filter((_, idx) => idx !== i))
  const add = () =>
    onChange([
      ...sorted,
      // Default: midway between last value and last value + 10
      { color: "#818cf8", value: sorted.length ? sorted[sorted.length - 1].value + 10 : 0 },
    ])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-secondary-text">{label}</span>
        <button
          className="flex items-center gap-1 rounded text-xs text-accent transition-colors hover:text-primary-text"
          onClick={add}
          type="button"
        >
          <Plus size={12} />
          Add
        </button>
      </div>

      <div className="space-y-1.5">
        {sorted.map((t, i) => (
          <div
            className="flex items-center gap-2"
            key={`thr-${i}`}
          >
            <input
              className="h-7 w-8 shrink-0 cursor-pointer rounded border border-card-default-border bg-transparent"
              onChange={(e) => update(i, { color: e.target.value })}
              type="color"
              value={t.color}
            />
            <Input
              onChange={(v) => update(i, { value: Number(v) })}
              size="sm"
              type="number"
              value={String(t.value)}
            />
            <button
              className="shrink-0 text-muted-text transition-colors hover:text-error"
              onClick={() => remove(i)}
              title="Remove threshold"
              type="button"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        {sorted.length === 0 && (
          <p className="rounded-md border border-dashed border-card-default-border px-2 py-1.5 text-center text-xs text-muted-text">
            No thresholds. Click “Add”.
          </p>
        )}
      </div>

      {/* Preview strip */}
      {sorted.length > 0 && (
        <div className="space-y-1">
          <div className="flex h-2 overflow-hidden rounded-full">
            {sorted.map((t, i) => {
              const next = sorted[i + 1]
              const width = next ? `${Math.max(0, next.value - t.value)}%` : "100%"
              return (
                <div
                  className="h-full"
                  key={`strip-${i}`}
                  style={{ backgroundColor: t.color, width }}
                  title={`≥ ${t.value}`}
                />
              )
            })}
          </div>
          <div className="flex justify-between text-[10px] text-muted-text">
            <span>{sorted[0].value}</span>
            <span>{sorted[sorted.length - 1].value}</span>
          </div>
        </div>
      )}

      {description && <p className="text-xs text-muted-text">{description}</p>}
    </div>
  )
}
