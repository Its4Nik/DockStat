import { Badge } from "@dockstat/ui"

export function ConfigValue({
  label,
  value,
}: {
  label: string
  value: string | number | React.ReactNode | boolean | undefined | null
}) {
  if (value === undefined || value === null) {
    return (
      <div className="flex justify-between py-1.5 border-b border-divider-color last:border-b-0">
        <span className="text-muted-text">{label}</span>
        <span className="text-secondary-text italic">Not set</span>
      </div>
    )
  }

  if (typeof value === "boolean") {
    return (
      <div className="flex justify-between py-1.5 border-b border-divider-color last:border-b-0">
        <span className="text-muted-text">{label}</span>
        <Badge variant={value ? "success" : "secondary"} size="sm">
          {value ? "Yes" : "No"}
        </Badge>
      </div>
    )
  }

  return (
    <div className="flex justify-between py-1.5 border-b border-divider-color last:border-b-0">
      <span className="text-muted-text">{label}</span>
      <span className="text-primary-text font-medium">{value}</span>
    </div>
  )
}
