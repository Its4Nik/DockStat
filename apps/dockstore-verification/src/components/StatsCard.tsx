import { Html } from "@elysiajs/html"

const _ = Html

export interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: JSX.Element | JSX.Element[] | string
  trend?: {
    value: number
    label: string
    positive?: boolean
  }
  variant?: "default" | "success" | "warning" | "error" | "info"
}

function getVariantStyles(variant: StatsCardProps["variant"] = "default") {
  switch (variant) {
    case "success":
      return {
        iconBg: "bg-green-500/20",
        iconColor: "text-green-400",
        valueColor: "text-green-400",
      }
    case "warning":
      return {
        iconBg: "bg-yellow-500/20",
        iconColor: "text-yellow-400",
        valueColor: "text-yellow-400",
      }
    case "error":
      return {
        iconBg: "bg-red-500/20",
        iconColor: "text-red-400",
        valueColor: "text-red-400",
      }
    case "info":
      return {
        iconBg: "bg-blue-500/20",
        iconColor: "text-blue-400",
        valueColor: "text-blue-400",
      }
    default:
      return {
        iconBg: "bg-gray-500/20",
        iconColor: "text-gray-400",
        valueColor: "text-white",
      }
  }
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = "default",
}: StatsCardProps) {
  const styles = getVariantStyles(variant)

  return (
    <div class="card">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-400 uppercase tracking-wide">{title}</p>
          <p class={`text-3xl font-bold mt-2 ${styles.valueColor}`}>{value}</p>
          {subtitle && <p class="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <div class="flex items-center mt-2">
              <span
                class={`text-sm font-medium ${trend.positive ? "text-green-400" : "text-red-400"}`}
              >
                {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
              <span class="text-sm text-gray-500 ml-2">{trend.label}</span>
            </div>
          )}
        </div>
        {icon && (
          <div class={`p-3 rounded-lg ${styles.iconBg}`}>
            <div class={`w-6 h-6 ${styles.iconColor}`}>{icon}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export interface StatsGridProps {
  children: JSX.Element | JSX.Element[] | string
  columns?: 2 | 3 | 4
}

export function StatsGrid({ children, columns = 4 }: StatsGridProps) {
  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  }

  return <div class={`grid gap-6 ${gridCols[columns]}`}>{children}</div>
}

// Preset icons for common stats
export const StatsIcons = {
  plugins: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Plugins icon">
      <title>SVG</title>
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
      />
    </svg>
  ),
  verified: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Verified icon">
      <title>SVG</title>

      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  ),
  repositories: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Repositories icon">
      <title>SVG</title>
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
      />
    </svg>
  ),
  versions: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Versions icon">
      <title>SVG</title>
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
      />
    </svg>
  ),
  safe: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Safe icon">
      <title>SVG</title>
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  unsafe: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Unsafe icon">
      <title>SVG</title>
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  pending: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Pending icon">
      <title>SVG</title>
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
}
