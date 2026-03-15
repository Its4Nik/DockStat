/**
 * Table Widget
 *
 * Displays data in a tabular format.
 */

import { Card, CardBody, CardHeader } from "@dockstat/ui"
import type { WidgetComponentProps, WidgetDefinition } from "../types"

/**
 * Table column configuration
 */
export interface TableColumn {
  key: string
  title: string
  width?: string | number
  align?: "left" | "center" | "right"
  format?: string
}

/**
 * Table widget configuration
 */
export interface TableWidgetConfig {
  /** Table title */
  title?: string
  /** Column definitions */
  columns: TableColumn[]
  /** Rows per page */
  pageSize?: number
  /** Show row numbers */
  showRowNumbers?: boolean
  /** Enable sorting */
  sortable?: boolean
  /** Sticky header */
  stickyHeader?: boolean
}

/**
 * Table widget data
 */
export interface TableWidgetData {
  rows: Record<string, unknown>[]
  totalRows?: number
}

/**
 * Table Widget Component
 */
function TableWidget({
  config,
  data,
  isLoading,
}: WidgetComponentProps<TableWidgetConfig, TableWidgetData>) {
  const rows: Record<string, unknown>[] = data?.rows ?? []
  const cols: TableColumn[] = config.columns || []

  // Format cell value
  const formatValue = (value: unknown, column: TableColumn): string => {
    if (value === null || value === undefined) return "-"

    if (column.format === "number" && typeof value === "number") {
      return value.toLocaleString()
    }
    if (column.format === "percent" && typeof value === "number") {
      return `${value.toFixed(1)}%`
    }
    if (column.format === "date" && typeof value === "string") {
      return new Date(value).toLocaleDateString()
    }

    return String(value)
  }

  return (
    <Card className="h-full flex flex-col">
      {config.title && <CardHeader>{config.title}</CardHeader>}
      <CardBody className="flex-1 overflow-auto p-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-text">Loading...</div>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-text">No data available</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead
                className={config.stickyHeader !== false ? "sticky top-0 bg-card-default-bg" : ""}
              >
                <tr className="border-b border-border-color">
                  {config.showRowNumbers && (
                    <th className="px-3 py-2 text-left text-muted-text font-medium w-10">#</th>
                  )}
                  {cols.map((column) => (
                    <th
                      key={column.key}
                      className="px-3 py-2 text-left text-muted-text font-medium"
                      style={{
                        width: column.width,
                        textAlign: column.align ?? "left",
                      }}
                    >
                      {column.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, config.pageSize ?? 10).map((row, index) => (
                  <tr
                    key={index}
                    className="border-b border-border-color hover:bg-hover-bg transition-colors"
                  >
                    {config.showRowNumbers && (
                      <td className="px-3 py-2 text-muted-text">{index + 1}</td>
                    )}
                    {cols.map((column) => (
                      <td
                        key={column.key}
                        className="px-3 py-2"
                        style={{ textAlign: column.align ?? "left" }}
                      >
                        {formatValue(row[column.key], column)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

/**
 * Table Widget Definition
 */
export const tableWidget: WidgetDefinition<TableWidgetConfig, TableWidgetData> = {
  type: "table",
  name: "Table",
  description: "Display data in a tabular format",
  icon: "📋",
  category: "Data",
  tags: ["table", "grid", "data", "list"],
  defaultConfig: {
    title: "",
    columns: [
      { key: "name", title: "Name" },
      { key: "value", title: "Value", align: "right" },
      { key: "status", title: "Status" },
    ],
    pageSize: 10,
    showRowNumbers: false,
    sortable: true,
    stickyHeader: true,
  },
  defaultLayout: {
    x: 0,
    y: 0,
    w: 6,
    h: 4,
    minW: 4,
    minH: 3,
  },
  defaultDataSource: {
    type: "static",
    data: {
      rows: [
        { name: "Item 1", value: 100, status: "Active" },
        { name: "Item 2", value: 200, status: "Inactive" },
        { name: "Item 3", value: 150, status: "Active" },
      ],
    },
  },
  configSchema: {
    fields: [
      {
        name: "title",
        type: "text",
        label: "Title",
      },
      {
        name: "pageSize",
        type: "number",
        label: "Rows per Page",
        min: 1,
        max: 100,
      },
      {
        name: "showRowNumbers",
        type: "boolean",
        label: "Show Row Numbers",
      },
      {
        name: "stickyHeader",
        type: "boolean",
        label: "Sticky Header",
      },
    ],
  },
  component: TableWidget,
}
