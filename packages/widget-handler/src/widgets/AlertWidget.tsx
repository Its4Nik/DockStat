/**
 * Alert Widget
 *
 * Displays an alert/notification message with severity levels.
 */

import { Badge, Card, CardBody } from "@dockstat/ui"
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react"
import type { WidgetComponentProps, WidgetDefinition } from "../types"

/**
 * Alert severity levels
 */
export type AlertSeverity = "info" | "warning" | "error" | "success"

/**
 * Alert widget configuration
 */
export interface AlertWidgetConfig {
  /** Alert title */
  title: string
  /** Alert message */
  message: string
  /** Severity level */
  severity: AlertSeverity
  /** Show dismiss button */
  dismissible?: boolean
  /** Show icon */
  showIcon?: boolean
}

/**
 * Alert widget data (for dynamic alerts)
 */
export interface AlertWidgetData {
  /** Dynamic message */
  message?: string
  /** Dynamic severity */
  severity?: AlertSeverity
  /** Active state */
  active?: boolean
}

/**
 * Alert Widget Component
 */
function AlertWidget({
  config,
  data,
  onConfigChange,
}: WidgetComponentProps<AlertWidgetConfig, AlertWidgetData>) {
  const message: string = data?.message ?? config.message
  const severity: AlertSeverity = data?.severity ?? config.severity
  const isActive: boolean = data?.active !== false

  // Get icon component
  const IconComponent = (() => {
    switch (severity) {
      case "error":
        return AlertCircle
      case "warning":
        return AlertTriangle
      case "success":
        return CheckCircle
      default:
        return Info
    }
  })()

  // Get styles based on severity
  const severityStyles = {
    info: {
      bg: "bg-info/10",
      border: "border-info",
      text: "text-info",
      badgeVariant: "primary" as const,
    },
    warning: {
      bg: "bg-warning/10",
      border: "border-warning",
      text: "text-warning",
      badgeVariant: "warning" as const,
    },
    error: {
      bg: "bg-error/10",
      border: "border-error",
      text: "text-error",
      badgeVariant: "error" as const,
    },
    success: {
      bg: "bg-success/10",
      border: "border-success",
      text: "text-success",
      badgeVariant: "success" as const,
    },
  }

  const styles = severityStyles[severity]

  if (!isActive) return null

  return (
    <Card className={`h-full ${styles.bg} border-l-4 ${styles.border}`} variant="outlined">
      <CardBody className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {config.showIcon !== false && (
              <IconComponent className={`w-5 h-5 ${styles.text} shrink-0`} />
            )}
            <span className="font-semibold text-primary-text">{config.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={styles.badgeVariant} size="xs">
              {severity.toUpperCase()}
            </Badge>
            {config.dismissible && (
              <button
                type="button"
                onClick={() => onConfigChange({ dismissible: false } as Partial<AlertWidgetConfig>)}
                className="p-1 rounded hover:bg-hover-bg transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4 text-muted-text" />
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-secondary-text pl-7">{message}</p>
      </CardBody>
    </Card>
  )
}

/**
 * Alert Widget Definition
 */
export const alertWidget: WidgetDefinition<AlertWidgetConfig, AlertWidgetData> = {
  type: "alert",
  name: "Alert",
  description: "Display an alert/notification message",
  icon: "⚠️",
  category: "Feedback",
  tags: ["alert", "notification", "warning", "error", "message"],
  defaultConfig: {
    title: "Alert",
    message: "This is an alert message.",
    severity: "info",
    showIcon: true,
    dismissible: false,
  },
  defaultLayout: {
    x: 0,
    y: 0,
    w: 6,
    h: 2,
    minW: 3,
    minH: 1,
  },
  defaultDataSource: {
    type: "static",
    data: {
      active: true,
    },
  },
  configSchema: {
    fields: [
      {
        name: "title",
        type: "text",
        label: "Title",
        required: true,
      },
      {
        name: "message",
        type: "text",
        label: "Message",
        required: true,
      },
      {
        name: "severity",
        type: "select",
        label: "Severity",
        options: [
          { label: "Info", value: "info" },
          { label: "Warning", value: "warning" },
          { label: "Error", value: "error" },
          { label: "Success", value: "success" },
        ],
      },
      {
        name: "showIcon",
        type: "boolean",
        label: "Show Icon",
      },
      {
        name: "dismissible",
        type: "boolean",
        label: "Dismissible",
      },
    ],
  },
  component: AlertWidget,
}
