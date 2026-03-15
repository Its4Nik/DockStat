/**
 * Gauge Widget
 *
 * Displays a value as a gauge/arc meter.
 */

import { Card, CardBody } from "@dockstat/ui"
import type { WidgetComponentProps, WidgetDefinition } from "../types"

/**
 * Gauge widget configuration
 */
export interface GaugeWidgetConfig {
  /** Label for the gauge */
  label: string
  /** Minimum value */
  min: number
  /** Maximum value */
  max: number
  /** Unit suffix */
  unit?: string
  /** Threshold segments */
  thresholds?: {
    warning: number
    critical: number
  }
  /** Show percentage */
  showPercentage?: boolean
  /** Gauge width (stroke width) */
  strokeWidth?: number
}

/**
 * Gauge widget data
 */
export interface GaugeWidgetData {
  value: number
}

/**
 * Gauge Widget Component
 */
function GaugeWidget({
  config,
  data,
  isLoading,
}: WidgetComponentProps<GaugeWidgetConfig, GaugeWidgetData>) {
  const value = data?.value ?? 0
  const { min, max } = config
  const range = max - min || 1
  const percentage = Math.min(100, Math.max(0, ((value - min) / range) * 100))

  // Calculate arc
  const radius = 45
  const strokeWidth = config.strokeWidth ?? 8
  const circumference = 2 * Math.PI * radius
  const arcLength = circumference * 0.75 // 270 degree arc
  const offset = arcLength - (percentage / 100) * arcLength

  // Determine color based on thresholds
  const getColor = () => {
    if (!config.thresholds) return "var(--color-primary)"
    if (percentage >= config.thresholds.critical) return "var(--color-error)"
    if (percentage >= config.thresholds.warning) return "var(--color-warning)"
    return "var(--color-success)"
  }

  const gaugeColor = getColor()

  // Format display value
  const displayValue = config.showPercentage ? `${percentage.toFixed(0)}%` : value.toFixed(1)

  return (
    <Card className="h-full">
      <CardBody className="flex flex-col items-center justify-center h-full">
        <div className="text-sm text-muted-text mb-2">{config.label}</div>

        <div className="relative w-32 h-32">
          {isLoading ? (
            <div className="flex items-center justify-center w-full h-full">
              <div className="text-muted-text">...</div>
            </div>
          ) : (
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-[135deg]">
              <title>Background Arc</title>
              {/* Background arc */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="var(--color-border)"
                strokeWidth={strokeWidth}
                strokeDasharray={`${arcLength} ${circumference}`}
                strokeLinecap="round"
              />

              {/* Value arc */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={gaugeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={`${arcLength} ${circumference}`}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
          )}

          {/* Center value */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
            <span className="text-2xl font-bold text-primary-text">{displayValue}</span>
            {config.unit && <span className="text-xs text-muted-text">{config.unit}</span>}
          </div>
        </div>

        {/* Min/Max labels */}
        <div className="flex justify-between w-full mt-2 text-xs text-muted-text px-4">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </CardBody>
    </Card>
  )
}

/**
 * Gauge Widget Definition
 */
export const gaugeWidget: WidgetDefinition<GaugeWidgetConfig, GaugeWidgetData> = {
  type: "gauge",
  name: "Gauge",
  description: "Display a value as a gauge/arc meter",
  icon: "🎯",
  category: "Display",
  tags: ["meter", "gauge", "progress", "arc"],
  defaultConfig: {
    label: "Progress",
    min: 0,
    max: 100,
    unit: "%",
    showPercentage: true,
    strokeWidth: 8,
    thresholds: {
      warning: 70,
      critical: 90,
    },
  },
  defaultLayout: {
    x: 0,
    y: 0,
    w: 3,
    h: 3,
    minW: 2,
    minH: 2,
  },
  defaultDataSource: {
    type: "mock",
    generator: "random",
    interval: 3000,
  },
  configSchema: {
    fields: [
      {
        name: "label",
        type: "text",
        label: "Label",
        required: true,
      },
      {
        name: "min",
        type: "number",
        label: "Minimum",
        defaultValue: 0,
      },
      {
        name: "max",
        type: "number",
        label: "Maximum",
        defaultValue: 100,
      },
      {
        name: "unit",
        type: "text",
        label: "Unit",
      },
      {
        name: "showPercentage",
        type: "boolean",
        label: "Show as Percentage",
      },
    ],
  },
  component: GaugeWidget,
}
