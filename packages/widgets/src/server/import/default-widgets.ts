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
  manifestVersion: "1.0.0",
  author: {
    name: "DockStat",
    url: "https://github.com/dockstat",
  },
  widgets: [
    // ── Gauge ──────────────────────────────────────────────────────
    {
      id: "builtin.gauge",
      name: "gauge",
      label: "Gauge",
      description:
        "A radial gauge that displays a single numeric value between a configurable min and max, with color-coded threshold zones.",
      category: "visualization",
      version: "1.0.0",
      kind: "gauge",
      defaultConfig: {
        min: 0,
        max: 100,
        unit: "%",
        thresholds: [
          { value: 0, color: "#22c55e" },
          { value: 60, color: "#eab308" },
          { value: 80, color: "#ef4444" },
        ],
        label: "",
        decimals: 0,
      },
      configSchema: {
        type: "object",
        properties: {
          min: { type: "number", title: "Minimum", default: 0 },
          max: { type: "number", title: "Maximum", default: 100 },
          unit: { type: "string", title: "Unit suffix", default: "%" },
          decimals: { type: "number", title: "Decimal places", default: 0 },
          label: { type: "string", title: "Label", default: "" },
          thresholds: {
            type: "array",
            title: "Threshold zones",
            items: {
              type: "object",
              properties: {
                value: { type: "number", title: "Threshold value" },
                color: { type: "string", title: "Color", format: "color" },
              },
            },
          },
        },
      },
      dataInputs: ["value"],
      dataOutputs: [],
      icon: "gauge",
      createdAt: now,
      updatedAt: now,
    },

    // ── Bar Chart ──────────────────────────────────────────────────
    {
      id: "builtin.bar-chart",
      name: "bar-chart",
      label: "Bar Chart",
      description:
        "A bar chart that renders categorical data as vertical or horizontal bars. Accepts an array of { label, value } objects.",
      category: "chart",
      version: "1.0.0",
      kind: "bar-chart",
      defaultConfig: {
        orientation: "vertical",
        color: "#3b82f6",
        barWidth: 0.8,
        showLabels: true,
        showGrid: true,
        yAxisLabel: "",
        xAxisLabel: "",
      },
      configSchema: {
        type: "object",
        properties: {
          orientation: {
            type: "string",
            title: "Orientation",
            enum: ["vertical", "horizontal"],
            default: "vertical",
          },
          color: { type: "string", title: "Bar color", format: "color", default: "#3b82f6" },
          barWidth: {
            type: "number",
            title: "Bar width (0–1)",
            minimum: 0,
            maximum: 1,
            default: 0.8,
          },
          showLabels: { type: "boolean", title: "Show value labels", default: true },
          showGrid: { type: "boolean", title: "Show grid lines", default: true },
          yAxisLabel: { type: "string", title: "Y-Axis label", default: "" },
          xAxisLabel: { type: "string", title: "X-Axis label", default: "" },
        },
      },
      dataInputs: ["data"],
      dataOutputs: [],
      icon: "bar-chart",
      createdAt: now,
      updatedAt: now,
    },

    // ── Heatmap ────────────────────────────────────────────────────
    {
      id: "builtin.heatmap",
      name: "heatmap",
      label: "Heatmap",
      description:
        "A grid heatmap that visualizes a 2D matrix of values using a color gradient. Ideal for density data, correlation matrices, or time-of-day patterns.",
      category: "visualization",
      version: "1.0.0",
      kind: "heatmap",
      defaultConfig: {
        colorScale: "interpolateInferno",
        minValue: 0,
        maxValue: 100,
        showValues: false,
        cellRadius: 4,
        xLabel: "",
        yLabel: "",
      },
      configSchema: {
        type: "object",
        properties: {
          colorScale: {
            type: "string",
            title: "Color scale",
            enum: [
              "interpolateInferno",
              "interpolateBlues",
              "interpolateGreens",
              "interpolateRdYlGn",
              "interpolateViridis",
            ],
            default: "interpolateInferno",
          },
          minValue: { type: "number", title: "Min value (for color mapping)", default: 0 },
          maxValue: { type: "number", title: "Max value (for color mapping)", default: 100 },
          showValues: { type: "boolean", title: "Show cell values", default: false },
          cellRadius: { type: "number", title: "Cell corner radius", default: 4 },
          xLabel: { type: "string", title: "X-Axis label", default: "" },
          yLabel: { type: "string", title: "Y-Axis label", default: "" },
        },
      },
      dataInputs: ["data"],
      dataOutputs: [],
      icon: "grid",
      createdAt: now,
      updatedAt: now,
    },

    // ── Honeycomb ──────────────────────────────────────────────────
    {
      id: "builtin.honeycomb",
      name: "honeycomb",
      label: "Honeycomb Chart",
      description:
        "A hexagonal honeycomb chart where each hexagon represents a metric or entity. Cell size and color are driven by the data value — perfect for at-a-glance status overviews of many items.",
      category: "visualization",
      version: "1.0.0",
      kind: "honeycomb",
      defaultConfig: {
        colorScale: "interpolateRdYlGn",
        minValue: 0,
        maxValue: 100,
        hexSize: 32,
        showLabels: true,
        showValues: true,
        thresholds: [
          { value: 0, color: "#ef4444" },
          { value: 50, color: "#eab308" },
          { value: 80, color: "#22c55e" },
        ],
        layout: "flat-top",
      },
      configSchema: {
        type: "object",
        properties: {
          colorScale: {
            type: "string",
            title: "Color scale",
            enum: [
              "interpolateRdYlGn",
              "interpolateInferno",
              "interpolateBlues",
              "interpolateViridis",
            ],
            default: "interpolateRdYlGn",
          },
          minValue: { type: "number", title: "Min value", default: 0 },
          maxValue: { type: "number", title: "Max value", default: 100 },
          hexSize: { type: "number", title: "Hexagon radius (px)", default: 32 },
          showLabels: { type: "boolean", title: "Show cell labels", default: true },
          showValues: { type: "boolean", title: "Show cell values", default: true },
          layout: {
            type: "string",
            title: "Hex orientation",
            enum: ["flat-top", "pointy-top"],
            default: "flat-top",
          },
          thresholds: {
            type: "array",
            title: "Color thresholds",
            items: {
              type: "object",
              properties: {
                value: { type: "number", title: "Threshold value" },
                color: { type: "string", title: "Color", format: "color" },
              },
            },
          },
        },
      },
      dataInputs: ["data"],
      dataOutputs: [],
      icon: "hexagon",
      createdAt: now,
      updatedAt: now,
    },
  ],
}
