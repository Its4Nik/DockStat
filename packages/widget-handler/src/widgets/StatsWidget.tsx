/**
 * Stats Widget
 *
 * Displays a key metric with optional trend indicator.
 */

import { Card, CardBody } from "@dockstat/ui"
import { Minus, TrendingDown, TrendingUp } from "lucide-react"
import type { WidgetComponentProps, WidgetDefinition } from "../types"

/**
 * Stats widget configuration
 */
export interface StatsWidgetConfig {
  /** Label for the stat */
  label: string
  /** Unit suffix */
  unit?: string
  /** Number of decimal places */
  decimals?: number
  /** Show trend indicator */
  showTrend?: boolean
  /** Trend comparison value */
  trendValue?: number
  /** Prefix for the value */
  prefix?: string
  /** Thresholds for color changes */
  thresholds?: {
    warning: number
    critical: number
  }
}

/**
 * Stats widget data
 */
export interface StatsWidgetData {
  value: number
  previousValue?: number
}

/**
 * Stats Widget Component
 */
function StatsWidget({
  config,
  data,
  isLoading,
}: WidgetComponentProps<StatsWidgetConfig, StatsWidgetData>) {
  const value = data?.value ?? 0
  const previousValue = data?.previousValue
  const formattedValue =
    config.decimals !== undefined ? value.toFixed(config.decimals) : value.toLocaleString()

  // Calculate trend
  const trend = (() => {
    if (!config.showTrend || previousValue === undefined) return null
    if (value > previousValue) return "up"
    if (value < previousValue) return "down"
    return "neutral"
  })()

  // Calculate trend percentage
  const trendPercent = (() => {
    if (!previousValue || previousValue === 0) return 0
    return Math.abs(((value - previousValue) / previousValue) * 100).toFixed(1)
  })()

  // Determine color based on thresholds
  const valueColor = (() => {
    if (!config.thresholds) return "text-primary-text"
    if (value >= config.thresholds.critical) return "text-error"
    if (value >= config.thresholds.warning) return "text-warning"
    return "text-success"
  })()

  return (
    <Card className="h-full" hoverable>
      <CardBody className="flex flex-col justify-between h-full">
        <div className="text-sm text-muted-text">{config.label}</div>
        <div className="flex items-baseline gap-2">
          {config.prefix && <span className="text-lg text-muted-text">{config.prefix}</span>}
          <span className={`text-3xl font-bold ${valueColor}`}>
            {isLoading ? "..." : formattedValue}
          </span>
          {config.unit && <span className="text-sm text-muted-text">{config.unit}</span>}
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-sm">
            {trend === "up" && <TrendingUp className="w-4 h-4 text-success" />}
            {trend === "down" && <TrendingDown className="w-4 h-4 text-error" />}
            {trend === "neutral" && <Minus className="w-4 h-4 text-muted-text" />}
            <span
              className={
                trend === "up"
                  ? "text-success"
                  : trend === "down"
                    ? "text-error"
                    : "text-muted-text"
              }
            >
              {trendPercent}%
            </span>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

/**
 * Stats Widget Definition
 */
export const statsWidget: WidgetDefinition<StatsWidgetConfig, StatsWidgetData> = {
  type: "stats",
  name: "Stats",
  description: "Display a key metric with optional trend indicator",
  icon: "📊",
  category: "Display",
  tags: ["metric", "value", "kpi"],
  defaultConfig: {
    label: "Metric",
    decimals: 0,
    showTrend: false,
  },
  defaultLayout: {
    x: 0,
    y: 0,
    w: 3,
    h: 2,
    minW: 2,
    minH: 2,
  },
  defaultDataSource: {
    type: "mock",
    generator: "random",
    interval: 5000,
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
        name: "unit",
        type: "text",
        label: "Unit",
      },
      {
        name: "prefix",
        type: "text",
        label: "Prefix",
      },
      {
        name: "decimals",
        type: "number",
        label: "Decimal Places",
        min: 0,
        max: 10,
      },
      {
        name: "showTrend",
        type: "boolean",
        label: "Show Trend",
      },
    ],
  },
  component: StatsWidget,
}
