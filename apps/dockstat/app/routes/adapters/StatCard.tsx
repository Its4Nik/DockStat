import { Card } from "@dockstat/ui"
import type { ReactNode } from "react"

interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  variant?: "default" | "success" | "warning" | "error"
}

const variantStyles = {
  default: "text-secondary-text",
  success: "text-green-500",
  warning: "text-yellow-500",
  error: "text-red-500",
}

export function StatCard({ label, value, icon, variant = "default" }: StatCardProps) {
  return (
    <Card variant="outlined" size="sm" className="min-w-[140px]">
      <div className="flex items-center gap-2">
        {icon && <span className={variantStyles[variant]}>{icon}</span>}
        <div>
          <p className="text-xs text-muted-text uppercase tracking-wide">{label}</p>
          <p className={`text-xl font-semibold ${variantStyles[variant]}`}>{value}</p>
        </div>
      </div>
    </Card>
  )
}
