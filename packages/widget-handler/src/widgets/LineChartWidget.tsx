/**
 * Line Chart Widget
 *
 * Displays time series data as a line chart.
 */

import type { WidgetDefinition, WidgetComponentProps } from "../types"
import { Card, CardBody, CardHeader } from "@dockstat/ui"

/**
 * Line chart widget configuration
 */
export interface LineChartWidgetConfig {
  /** Chart title */
  title?: string
  /** Line color */
  lineColor?: string
  /** Fill area under line */
  fillArea?: boolean
  /** Show grid lines */
  showGrid?: boolean
  /** Show data points */
  showPoints?: boolean
  /** Y-axis minimum */
  yMin?: number
  /** Y-axis maximum */
  yMax?: number
  /** Line smoothing */
  smooth?: boolean
}

/**
 * Line chart data point
 */
export interface LineChartDataPoint {
  timestamp: number
  value: number
}

/**
 * Line chart widget data
 */
export interface LineChartWidgetData {
  points: LineChartDataPoint[]
  min?: number
  max?: number
  avg?: number
}

/**
 * Line Chart Widget Component
 */
function LineChartWidget({
  config,
  data,
  isLoading,
}: WidgetComponentProps<LineChartWidgetConfig, LineChartWidgetData>) {
  const points: LineChartDataPoint[] = data?.points ?? []
  const min = data?.min
  const max = data?.max
  const avg = data?.avg

  // Calculate chart dimensions
  const chartWidth = 100
  const chartHeight = 60
  const padding = 5

  // Calculate scales
  const xScale = chartWidth / (points.length > 1 ? points.length - 1 : 1)
  const yMin = config.yMin ?? Math.min(...points.map((p) => p.value), 0)
  const yMax = config.yMax ?? Math.max(...points.map((p) => p.value), 100)
  const yRange = yMax - yMin || 1

  // Generate path
  const pathData = points
    .map((point, i) => {
      const x = padding + i * xScale
      const y =
        chartHeight - padding - ((point.value - yMin) / yRange) * (chartHeight - 2 * padding)
      return `${i === 0 ? "M" : "L"} ${x} ${y}`
    })
    .join(" ")

  // Generate area path
  const areaPath = pathData
    ? `${pathData} L ${padding + (points.length - 1) * xScale} ${chartHeight - padding} L ${padding} ${chartHeight - padding} Z`
    : ""

  return (
    <Card className="h-full">
      {config.title && <CardHeader>{config.title}</CardHeader>}
      <CardBody className="flex flex-col h-full">
        {/* Chart */}
        <div className="flex-1 relative min-h-[100px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-text">Loading...</div>
            </div>
          ) : points.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-text">No data</div>
            </div>
          ) : (
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              <title>Line Chart</title>
              {/* Grid */}
              {config.showGrid !== false && (
                <g className="stroke-border-color opacity-30">
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                    <line
                      key={ratio}
                      x1={padding}
                      x2={chartWidth - padding}
                      y1={padding + ratio * (chartHeight - 2 * padding)}
                      y2={padding + ratio * (chartHeight - 2 * padding)}
                      strokeWidth="0.5"
                    />
                  ))}
                </g>
              )}

              {/* Area fill */}
              {config.fillArea && areaPath && (
                <path
                  d={areaPath}
                  fill={config.lineColor ?? "var(--color-primary)"}
                  fillOpacity="0.2"
                />
              )}

              {/* Line */}
              {pathData && (
                <path
                  d={pathData}
                  fill="none"
                  stroke={config.lineColor ?? "var(--color-primary)"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Points */}
              {config.showPoints &&
                points.map((point, i) => {
                  const x = padding + i * xScale
                  const y =
                    chartHeight -
                    padding -
                    ((point.value - yMin) / yRange) * (chartHeight - 2 * padding)
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="2"
                      fill={config.lineColor ?? "var(--color-primary)"}
                    />
                  )
                })}
            </svg>
          )}
        </div>

        {/* Stats */}
        {(min !== undefined || max !== undefined || avg !== undefined) && (
          <div className="flex justify-between text-xs text-muted-text mt-2 pt-2 border-t border-border-color">
            {min !== undefined && <span>Min: {min.toFixed(1)}</span>}
            {avg !== undefined && <span>Avg: {avg.toFixed(1)}</span>}
            {max !== undefined && <span>Max: {max.toFixed(1)}</span>}
          </div>
        )}
      </CardBody>
    </Card>
  )
}

/**
 * Line Chart Widget Definition
 */
export const lineChartWidget: WidgetDefinition<LineChartWidgetConfig, LineChartWidgetData> = {
  type: "line-chart",
  name: "Line Chart",
  description: "Display time series data as a line chart",
  icon: "📈",
  category: "Charts",
  tags: ["chart", "time-series", "graph"],
  defaultConfig: {
    title: "",
    lineColor: "var(--color-primary)",
    fillArea: true,
    showGrid: true,
    showPoints: false,
    smooth: true,
  },
  defaultLayout: {
    x: 0,
    y: 0,
    w: 6,
    h: 3,
    minW: 4,
    minH: 2,
  },
  defaultDataSource: {
    type: "mock",
    generator: "sin",
    interval: 1000,
  },
  configSchema: {
    fields: [
      {
        name: "title",
        type: "text",
        label: "Title",
      },
      {
        name: "lineColor",
        type: "color",
        label: "Line Color",
      },
      {
        name: "fillArea",
        type: "boolean",
        label: "Fill Area",
      },
      {
        name: "showGrid",
        type: "boolean",
        label: "Show Grid",
      },
      {
        name: "showPoints",
        type: "boolean",
        label: "Show Points",
      },
    ],
  },
  component: LineChartWidget,
}
