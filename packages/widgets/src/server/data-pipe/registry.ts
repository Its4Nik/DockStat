/**
 * Registry of available data-pipe node types with their configuration schemas.
 *
 * This is the single source of truth for what nodes can be placed on the
 * React Flow canvas.  Both the backend (engine registration) and the
 * frontend (palette + property editors) import from here.
 *
 * Each definition carries a TypeBox-compatible JSON Schema so the frontend
 * can render appropriate form controls without duplicating metadata.
 */

// ── Node kind categories ────────────────────────────────────────────

export type DataPipeNodeKind = "provider" | "transform" | "connector" | "output"

export interface NodeKindMeta {
  kind: DataPipeNodeKind
  label: string
  description: string
  icon: string
  color: string
}

export const NODE_KIND_META: Record<DataPipeNodeKind, NodeKindMeta> = {
  connector: {
    color: "#eab308",
    description: "Routes data between nodes without modification",
    icon: "link",
    kind: "connector",
    label: "Connector",
  },
  output: {
    color: "#a855f7",
    description: "Terminal node — delivers data to a widget input",
    icon: "flag",
    kind: "output",
    label: "Output",
  },
  provider: {
    color: "#3b82f6",
    description: "External data source that produces values",
    icon: "plug",
    kind: "provider",
    label: "Provider",
  },
  transform: {
    color: "#22c55e",
    description: "Transforms, filters, or maps incoming data",
    icon: "shuffle",
    kind: "transform",
    label: "Transform",
  },
}

// ── Property field definitions (drives the frontend form) ──────────

export type FieldType =
  | "string"
  | "number"
  | "boolean"
  | "select"
  | "textarea"
  | "object"
  | "array"
  | (() => unknown)

export interface PropertyField {
  /** Key in `node.data` */
  key: string
  /** Display label */
  label: string
  type: FieldType
  description?: string
  /** Options for select fields */
  options?: Array<{ label: string; value: string | number }>
  /** Default value used when the node is created */
  default?: unknown
  /** Whether this field is required */
  required?: boolean
}

// ── Node template definition ───────────────────────────────────────

export interface NodeTemplateDef {
  /** Unique identifier for this template (e.g. "static", "time", "jsonPath") */
  id: string
  /** Display label */
  label: string
  /** Short description */
  description: string
  /** Node kind */
  kind: DataPipeNodeKind
  /** For providers: the providerType. For transformers: the transformType */
  typeKey: string
  /** Property fields shown in the editor */
  properties: PropertyField[]
  /** Whether this node has source handles (outputs) */
  hasSource: boolean
  /** Whether this node has target handles (inputs) */
  hasTarget: boolean
}

// ── The master catalog ─────────────────────────────────────────────

export const NODE_TEMPLATES = ({
  getWsTopics,
}: {
  getWsTopics: () => string[]
}): NodeTemplateDef[] => {
  return [
    // ── Providers ──────────────────────────────────────────────────
    {
      description: "Produces a fixed value. Great for testing or constants.",
      hasSource: true,
      hasTarget: false,
      id: "static-provider",
      kind: "provider",
      label: "Static Data",
      properties: [
        {
          default: null,
          description: "Any JSON value this node will emit",
          key: "value",
          label: "Value",
          type: "object",
        },
      ],
      typeKey: "static",
    },
    {
      description: "Emits the current server timestamp on each evaluation.",
      hasSource: true,
      hasTarget: false,
      id: "time-provider",
      kind: "provider",
      label: "Time",
      properties: [],
      typeKey: "time",
    },
    {
      description: "Subscribes to a WebSocket pub/sub topic and forwards the latest value.",
      hasSource: true,
      hasTarget: false,
      id: "websocket-provider",
      kind: "provider",
      label: "WebSocket Source",
      properties: [
        {
          description: "The pub/sub topic to subscribe to (e.g. 'logs', 'metrics/containers')",
          key: "topic",
          label: "Topic",
          required: true,
          type: getWsTopics,
        },
        {
          default: null,
          description: "Value used before the first message arrives",
          key: "fallback",
          label: "Fallback",
          type: "object",
        },
      ],
      typeKey: "websocket-source",
    },

    // ── Transforms ─────────────────────────────────────────────────
    {
      description: "Passes data through unchanged. Useful as a junction.",
      hasSource: true,
      hasTarget: true,
      id: "passthrough-transform",
      kind: "transform",
      label: "Passthrough",
      properties: [],
      typeKey: "passthrough",
    },
    {
      description: "Extracts a nested value using a dot-separated path (e.g. data.containers).",
      hasSource: true,
      hasTarget: true,
      id: "jsonpath-transform",
      kind: "transform",
      label: "JSON Path",
      properties: [
        {
          default: "",
          description: 'Dot-separated path, e.g. "data.value"',
          key: "path",
          label: "Path",
          type: "string",
        },
      ],
      typeKey: "jsonPath",
    },
    {
      description: "Filters an array of objects by a field comparison.",
      hasSource: true,
      hasTarget: true,
      id: "arrayfilter-transform",
      kind: "transform",
      label: "Array Filter",
      properties: [
        {
          default: "status",
          key: "field",
          label: "Field",
          type: "string",
        },
        {
          default: "eq",
          key: "operator",
          label: "Operator",
          options: [
            { label: "=", value: "eq" },
            { label: "\u2260", value: "neq" },
            { label: ">", value: "gt" },
            { label: "<", value: "lt" },
          ],
          type: "select",
        },
        {
          key: "filterValue",
          label: "Value",
          type: "object",
        },
      ],
      typeKey: "arrayFilter",
    },
    {
      description: "Evaluate a JavaScript expression. `$` refers to the input value.",
      hasSource: true,
      hasTarget: true,
      id: "expression-transform",
      kind: "transform",
      label: "Expression",
      properties: [
        {
          default: "$",
          description: 'Expression evaluated with `$` = input. e.g. "$.count * 2"',
          key: "expression",
          label: "Expression",
          type: "textarea",
        },
      ],
      typeKey: "expression",
    },
    {
      description: "Aggregates an array of objects (sum, avg, min, max, count).",
      hasSource: true,
      hasTarget: true,
      id: "aggregate-transform",
      kind: "transform",
      label: "Aggregate",
      properties: [
        {
          default: "sum",
          key: "operation",
          label: "Operation",
          options: [
            { label: "Sum", value: "sum" },
            { label: "Average", value: "avg" },
            { label: "Minimum", value: "min" },
            { label: "Maximum", value: "max" },
            { label: "Count", value: "count" },
          ],
          type: "select",
        },
        {
          default: "value",
          description: "Which numeric field to aggregate",
          key: "field",
          label: "Field",
          type: "string",
        },
      ],
      typeKey: "aggregate",
    },
    {
      description: "Sorts an array of objects by a field.",
      hasSource: true,
      hasTarget: true,
      id: "sort-transform",
      kind: "transform",
      label: "Sort",
      properties: [
        {
          default: "name",
          key: "field",
          label: "Field",
          type: "string",
        },
        {
          default: "asc",
          key: "direction",
          label: "Direction",
          options: [
            { label: "Ascending", value: "asc" },
            { label: "Descending", value: "desc" },
          ],
          type: "select",
        },
      ],
      typeKey: "sort",
    },
    {
      description: "Picks specific fields from an object, dropping the rest.",
      hasSource: true,
      hasTarget: true,
      id: "pick-transform",
      kind: "transform",
      label: "Pick Fields",
      properties: [
        {
          default: [],
          description: "Comma-separated field names to keep",
          key: "fields",
          label: "Fields",
          type: "string",
        },
      ],
      typeKey: "pick",
    },
    {
      description: "Formats a value: round numbers, format dates, etc.",
      hasSource: true,
      hasTarget: true,
      id: "format-transform",
      kind: "transform",
      label: "Format",
      properties: [
        {
          default: "number",
          key: "format",
          label: "Format Type",
          options: [
            { label: "Number (fixed decimals)", value: "number" },
            { label: "Percentage", value: "percentage" },
            { label: "Date (locale)", value: "date" },
            { label: "Bytes", value: "bytes" },
          ],
          type: "select",
        },
        {
          default: 2,
          key: "decimals",
          label: "Decimals",
          type: "number",
        },
      ],
      typeKey: "format",
    },
    {
      description: "Groups array records by a field and aggregates each group.",
      hasSource: true,
      hasTarget: true,
      id: "groupby-transform",
      kind: "transform",
      label: "Group By",
      properties: [
        {
          default: "category",
          description: "Field to group by",
          key: "field",
          label: "Group Field",
          type: "string",
        },
        {
          default: { value: "sum" },
          description:
            "JSON object mapping field to operation (sum, avg, min, max, count, first, last)",
          key: "aggregations",
          label: "Aggregations",
          type: "object",
        },
      ],
      typeKey: "groupBy",
    },
    {
      description:
        "Flattens nested arrays. Optionally plucks a nested array field from each record.",
      hasSource: true,
      hasTarget: true,
      id: "flatten-transform",
      kind: "transform",
      label: "Flatten",
      properties: [
        {
          default: "",
          description: "Optional dot-path of a nested array field to flatten (e.g. items)",
          key: "path",
          label: "Path",
          type: "string",
        },
        {
          default: 1,
          description: "Max depth to flatten (0 = no limit)",
          key: "depth",
          label: "Depth",
          type: "number",
        },
      ],
      typeKey: "flatten",
    },
    {
      description: "Pivots long-format data into wide format (rows to columns).",
      hasSource: true,
      hasTarget: true,
      id: "pivot-transform",
      kind: "transform",
      label: "Pivot",
      properties: [
        {
          default: "row",
          key: "rowField",
          label: "Row Field",
          type: "string",
        },
        {
          default: "col",
          key: "colField",
          label: "Column Field",
          type: "string",
        },
        {
          default: "value",
          key: "valueField",
          label: "Value Field",
          type: "string",
        },
        {
          default: "sum",
          key: "operation",
          label: "Aggregation",
          options: [
            { label: "Sum", value: "sum" },
            { label: "Average", value: "avg" },
            { label: "Minimum", value: "min" },
            { label: "Maximum", value: "max" },
          ],
          type: "select",
        },
      ],
      typeKey: "pivot",
    },
    {
      description: "Keeps only the top-N (or bottom-N) records sorted by a field.",
      hasSource: true,
      hasTarget: true,
      id: "topn-transform",
      kind: "transform",
      label: "Top N",
      properties: [
        {
          default: "value",
          key: "field",
          label: "Field",
          type: "string",
        },
        {
          default: 10,
          key: "count",
          label: "N",
          type: "number",
        },
        {
          default: "desc",
          key: "direction",
          label: "Direction",
          options: [
            { label: "Top N (descending)", value: "desc" },
            { label: "Bottom N (ascending)", value: "asc" },
          ],
          type: "select",
        },
      ],
      typeKey: "topN",
    },
    {
      description: "Applies a sliding-window aggregation over an ordered array.",
      hasSource: true,
      hasTarget: true,
      id: "window-transform",
      kind: "transform",
      label: "Window",
      properties: [
        {
          default: "value",
          key: "field",
          label: "Field",
          type: "string",
        },
        {
          default: 3,
          key: "size",
          label: "Window Size",
          type: "number",
        },
        {
          default: "avg",
          key: "operation",
          label: "Operation",
          options: [
            { label: "Sum", value: "sum" },
            { label: "Average", value: "avg" },
            { label: "Minimum", value: "min" },
            { label: "Maximum", value: "max" },
          ],
          type: "select",
        },
      ],
      typeKey: "window",
    },
    {
      description:
        "Renames or restructures fields on each record. Supports dot-notation for nesting.",
      hasSource: true,
      hasTarget: true,
      id: "mapfields-transform",
      kind: "transform",
      label: "Map Fields",
      properties: [
        {
          default: { oldName: "newName" },
          description:
            "JSON object mapping old field name to new field name (e.g. { meta.title: title })",
          key: "mapping",
          label: "Field Mapping",
          type: "object",
        },
      ],
      typeKey: "mapFields",
    },

    // ── Connectors ─────────────────────────────────────────────────
    {
      description: "Routes data between nodes without any modification.",
      hasSource: true,
      hasTarget: true,
      id: "connector-node",
      kind: "connector",
      label: "Connector",
      properties: [],
      typeKey: "connector",
    },

    // ── Outputs ────────────────────────────────────────────────────
    {
      description: "Terminal node — delivers data to a widget input.",
      hasSource: false,
      hasTarget: true,
      id: "output-node",
      kind: "output",
      label: "Output",
      properties: [
        {
          default: "result",
          description: "The data-output key that widgets consume",
          key: "key",
          label: "Key",
          required: true,
          type: "string",
        },
      ],
      typeKey: "output",
    },
  ]
}

// ── Helpers ────────────────────────────────────────────────────────

const buildTemplates = (getWsTopics: () => string[] = () => []) =>
  NODE_TEMPLATES({ getWsTopics })

/** Look up a template by its id. */
export function getNodeTemplate(id: string): NodeTemplateDef | undefined {
  return buildTemplates().find((t) => t.id === id)
}

/** All templates of a given kind. */
export function templatesByKind(kind: DataPipeNodeKind): NodeTemplateDef[] {
  return buildTemplates().filter((t) => t.kind === kind)
}

/**
 * Build default node data from a template's property definitions.
 * Returns a DataPipeNodeData-compatible record.
 */
export function defaultDataFor(template: NodeTemplateDef): Record<string, unknown> {
  const data: Record<string, unknown> = { label: template.label }
  for (const prop of template.properties) {
    if (prop.default !== undefined) {
      data[prop.key] = prop.default
    }
  }
  // Embed the type key so the engine knows which provider/transformer to invoke
  if (template.kind === "provider") {
    data.providerType = template.typeKey
  } else if (template.kind === "transform") {
    data.transformType = template.typeKey
  }
  return data
}
