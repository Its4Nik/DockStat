/**
 * Default widget definitions that ship with the widgets package.
 *
 * These are seeded into the database on first boot via
 * `WidgetImporter.importManifest(DEFAULT_WIDGET_MANIFEST)`.
 *
 * Each definition describes a visualization that the frontend renders
 * based on the `kind` field.  The `configSchema` is a JSON Schema that
 * the frontend uses to auto-generate settings panels.
 */

import type { WidgetManifest } from "../types"

const now = new Date().toISOString()

export const DEFAULT_WIDGET_MANIFEST: WidgetManifest = {
  author: {
    name: "DockStat",
    url: "https://github.com/dockstat",
  },
  manifestVersion: "1.0.0",
  widgets: [
    // ── Gauge ──────────────────────────────────────────────────────
    {
      category: "visualization",
      configSchema: {
        properties: {
          decimals: { default: 0, title: "Decimal places", type: "number" },
          label: { default: "", title: "Label", type: "string" },
          max: { default: 100, title: "Maximum", type: "number" },
          min: { default: 0, title: "Minimum", type: "number" },
          thresholds: {
            items: {
              properties: {
                color: { format: "color", title: "Color", type: "string" },
                value: { title: "Threshold value", type: "number" },
              },
              type: "object",
            },
            title: "Threshold zones",
            type: "array",
          },
          unit: { default: "%", title: "Unit suffix", type: "string" },
        },
        type: "object",
      },
      createdAt: now,
      dataInputs: ["value"],
      dataOutputs: [],
      defaultConfig: {
        decimals: 0,
        label: "",
        max: 100,
        min: 0,
        thresholds: [
          { color: "#22c55e", value: 0 },
          { color: "#eab308", value: 60 },
          { color: "#ef4444", value: 80 },
        ],
        unit: "%",
      },
      description:
        "A radial gauge that displays a single numeric value between a configurable min and max, with color-coded threshold zones.",
      icon: "gauge",
      id: "builtin.gauge",
      kind: "gauge",
      label: "Gauge",
      name: "gauge",
      updatedAt: now,
      version: "1.0.0",
    },

    // ── Bar Chart ──────────────────────────────────────────────────
    {
      category: "chart",
      configSchema: {
        properties: {
          barWidth: {
            default: 0.8,
            maximum: 1,
            minimum: 0,
            title: "Bar width (0–1)",
            type: "number",
          },
          color: { default: "#3b82f6", format: "color", title: "Bar color", type: "string" },
          orientation: {
            default: "vertical",
            enum: ["vertical", "horizontal"],
            title: "Orientation",
            type: "string",
          },
          showGrid: { default: true, title: "Show grid lines", type: "boolean" },
          showLabels: { default: true, title: "Show value labels", type: "boolean" },
          xAxisLabel: { default: "", title: "X-Axis label", type: "string" },
          yAxisLabel: { default: "", title: "Y-Axis label", type: "string" },
        },
        type: "object",
      },
      createdAt: now,
      dataInputs: ["data"],
      dataOutputs: [],
      defaultConfig: {
        barWidth: 0.8,
        color: "#3b82f6",
        orientation: "vertical",
        showGrid: true,
        showLabels: true,
        xAxisLabel: "",
        yAxisLabel: "",
      },
      description:
        "A bar chart that renders categorical data as vertical or horizontal bars. Accepts an array of { label, value } objects.",
      icon: "bar-chart",
      id: "builtin.bar-chart",
      kind: "bar-chart",
      label: "Bar Chart",
      name: "bar-chart",
      updatedAt: now,
      version: "1.0.0",
    },

    // ── Heatmap ────────────────────────────────────────────────────
    {
      category: "visualization",
      configSchema: {
        properties: {
          cellRadius: { default: 4, title: "Cell corner radius", type: "number" },
          colorScale: {
            default: "interpolateInferno",
            enum: [
              "interpolateInferno",
              "interpolateBlues",
              "interpolateGreens",
              "interpolateRdYlGn",
              "interpolateViridis",
            ],
            title: "Color scale",
            type: "string",
          },
          maxValue: { default: 100, title: "Max value (for color mapping)", type: "number" },
          minValue: { default: 0, title: "Min value (for color mapping)", type: "number" },
          showValues: { default: false, title: "Show cell values", type: "boolean" },
          xLabel: { default: "", title: "X-Axis label", type: "string" },
          yLabel: { default: "", title: "Y-Axis label", type: "string" },
        },
        type: "object",
      },
      createdAt: now,
      dataInputs: ["data"],
      dataOutputs: [],
      defaultConfig: {
        cellRadius: 4,
        colorScale: "interpolateInferno",
        maxValue: 100,
        minValue: 0,
        showValues: false,
        xLabel: "",
        yLabel: "",
      },
      description:
        "A grid heatmap that visualizes a 2D matrix of values using a color gradient. Ideal for density data, correlation matrices, or time-of-day patterns.",
      icon: "grid",
      id: "builtin.heatmap",
      kind: "heatmap",
      label: "Heatmap",
      name: "heatmap",
      updatedAt: now,
      version: "1.0.0",
    },

    // ── Stat (big number tile) ────────────────────────────────────
    {
      category: "visualization",
      configSchema: {
        properties: {
          decimals: { default: 0, title: "Decimal places", type: "number" },
          format: {
            default: "number",
            enum: ["number", "percentage", "bytes", "date"],
            title: "Number format",
            type: "string",
          },
          label: { default: "", title: "Optional label", type: "string" },
          prefix: { default: "", title: "Prefix", type: "string" },
          showTrend: { default: false, title: "Show trend (delta vs previous)", type: "boolean" },
          suffix: { default: "", title: "Suffix", type: "string" },
          thresholds: {
            items: {
              properties: {
                color: { format: "color", title: "Color", type: "string" },
                value: { title: "Threshold value", type: "number" },
              },
              type: "object",
            },
            title: "Color thresholds (value → color)",
            type: "array",
          },
          unit: { default: "", title: "Unit suffix", type: "string" },
        },
        type: "object",
      },
      createdAt: now,
      dataInputs: ["value"],
      dataOutputs: [],
      defaultConfig: {
        decimals: 0,
        format: "number",
        label: "",
        prefix: "",
        showTrend: false,
        suffix: "",
        thresholds: [{ color: "#818cf8", value: -Infinity }],
        unit: "",
      },
      description:
        "A single big-number metric tile with optional unit, trend indicator, and color-coded threshold states. Ideal for KPIs like CPU, memory, container count.",
      icon: "activity",
      id: "builtin.stat",
      kind: "stat",
      label: "Stat",
      name: "stat",
      updatedAt: now,
      version: "1.0.0",
    },

    // ── Sparkline (mini line chart) ───────────────────────────────
    {
      category: "chart",
      configSchema: {
        properties: {
          fill: { default: "#818cf81a", format: "color", title: "Fill color", type: "string" },
          label: { default: "", title: "Label", type: "string" },
          max: { default: null, title: "Y-axis max (blank = auto)", type: "number" },
          min: { default: null, title: "Y-axis min (blank = auto)", type: "number" },
          showArea: { default: true, title: "Fill area under line", type: "boolean" },
          showDots: { default: false, title: "Show data points", type: "boolean" },
          stroke: { default: "#818cf8", format: "color", title: "Line color", type: "string" },
          strokeWidth: { default: 2, title: "Line width", type: "number" },
          unit: { default: "", title: "Unit suffix", type: "string" },
        },
        type: "object",
      },
      createdAt: now,
      dataInputs: ["series"],
      dataOutputs: [],
      defaultConfig: {
        fill: "#818cf81a",
        label: "",
        max: null,
        min: null,
        showArea: true,
        showDots: false,
        stroke: "#818cf8",
        strokeWidth: 2,
        unit: "",
      },
      description:
        "A compact line chart showing a series of numeric values over time. Renders a smooth area-filled sparkline ideal for embedding in tiles or beside stats.",
      icon: "trending-up",
      id: "builtin.sparkline",
      kind: "sparkline",
      label: "Sparkline",
      name: "sparkline",
      updatedAt: now,
      version: "1.0.0",
    },

    // ── Progress (horizontal bar) ────────────────────────────────
    {
      category: "visualization",
      configSchema: {
        properties: {
          decimals: { default: 0, title: "Decimal places", type: "number" },
          label: { default: "", title: "Label", type: "string" },
          max: { default: 100, title: "Maximum", type: "number" },
          min: { default: 0, title: "Minimum", type: "number" },
          showValue: { default: true, title: "Show numeric value", type: "boolean" },
          thresholds: {
            items: {
              properties: {
                color: { format: "color", title: "Color", type: "string" },
                value: { title: "Threshold value", type: "number" },
              },
              type: "object",
            },
            title: "Threshold zones",
            type: "array",
          },
          unit: { default: "%", title: "Unit suffix", type: "string" },
        },
        type: "object",
      },
      createdAt: now,
      dataInputs: ["value"],
      dataOutputs: [],
      defaultConfig: {
        decimals: 0,
        label: "",
        max: 100,
        min: 0,
        showValue: true,
        thresholds: [
          { color: "#22c55e", value: 0 },
          { color: "#eab308", value: 60 },
          { color: "#ef4444", value: 80 },
        ],
        unit: "%",
      },
      description:
        "A horizontal progress bar showing a value between min and max, with optional threshold coloring and an inline label.",
      icon: "bar-chart-horizontal",
      id: "builtin.progress",
      kind: "progress",
      label: "Progress Bar",
      name: "progress",
      updatedAt: now,
      version: "1.0.0",
    },

    // ── JSON Tree (raw data viewer) ─────────────────────────────
    {
      category: "utility",
      configSchema: {
        properties: {
          expanded: { default: false, title: "Start expanded", type: "boolean" },
          label: { default: "", title: "Optional label", type: "string" },
          maxStringLength: { default: 200, title: "Max string length shown", type: "number" },
        },
        type: "object",
      },
      createdAt: now,
      dataInputs: ["data"],
      dataOutputs: [],
      defaultConfig: {
        expanded: false,
        label: "",
        maxStringLength: 200,
      },
      description:
        "A collapsible JSON tree viewer for inspecting the raw payload of any data-pipe output. Useful for debugging or for objects too complex to chart.",
      icon: "braces",
      id: "builtin.json-tree",
      kind: "json-tree",
      label: "JSON / Raw Data",
      name: "json-tree",
      updatedAt: now,
      version: "1.0.0",
    },

    // ── Honeycomb ───────────────────────────────────────────────
    {
      category: "visualization",
      configSchema: {
        properties: {
          colorScale: {
            default: "interpolateRdYlGn",
            enum: [
              "interpolateRdYlGn",
              "interpolateInferno",
              "interpolateBlues",
              "interpolateViridis",
            ],
            title: "Color scale",
            type: "string",
          },
          hexSize: { default: 32, title: "Hexagon radius (px)", type: "number" },
          layout: {
            default: "flat-top",
            enum: ["flat-top", "pointy-top"],
            title: "Hex orientation",
            type: "string",
          },
          maxValue: { default: 100, title: "Max value", type: "number" },
          minValue: { default: 0, title: "Min value", type: "number" },
          showLabels: { default: true, title: "Show cell labels", type: "boolean" },
          showValues: { default: true, title: "Show cell values", type: "boolean" },
          thresholds: {
            items: {
              properties: {
                color: { format: "color", title: "Color", type: "string" },
                value: { title: "Threshold value", type: "number" },
              },
              type: "object",
            },
            title: "Color thresholds",
            type: "array",
          },
        },
        type: "object",
      },
      createdAt: now,
      dataInputs: ["data"],
      dataOutputs: [],
      defaultConfig: {
        colorScale: "interpolateRdYlGn",
        hexSize: 32,
        layout: "flat-top",
        maxValue: 100,
        minValue: 0,
        showLabels: true,
        showValues: true,
        thresholds: [
          { color: "#ef4444", value: 0 },
          { color: "#eab308", value: 50 },
          { color: "#22c55e", value: 80 },
        ],
      },
      description:
        "A hexagonal honeycomb chart where each hexagon represents a metric or entity. Cell size and color are driven by the data value — perfect for at-a-glance status overviews of many items.",
      icon: "hexagon",
      id: "builtin.honeycomb",
      kind: "honeycomb",
      label: "Honeycomb Chart",
      name: "honeycomb",
      updatedAt: now,
      version: "1.0.0",
    },
  ],
}
