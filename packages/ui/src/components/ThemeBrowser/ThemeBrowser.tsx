import { Check } from "lucide-react"
import { Badge } from "../Badge/Badge"
import { Card } from "../Card/Card"

export type ThemeBrowserItem = {
  id: number
  name: string
  variables: Record<string, string>
}

export type ThemeBrowserProps = {
  themes: ThemeBrowserItem[]
  currentThemeId?: number | null
  onSelectTheme: (theme: ThemeBrowserItem) => void
}

/**
 * Key color variables to show in the preview.
 * These represent the most visually distinctive theme colors.
 */
const PREVIEW_COLORS = [
  { key: "--color-main-bg", label: "Background" },
  { key: "--color-primary-text", label: "Primary Text" },
  { key: "--color-accent", label: "Accent" },
  { key: "--color-card-default-bg", label: "Card" },
  { key: "--color-badge-primary-bg", label: "Primary" },
  { key: "--color-error", label: "Error" },
  { key: "--color-success", label: "Success" },
] as const

function ThemePreviewCard({
  theme,
  isSelected,
  onSelect,
}: {
  theme: ThemeBrowserItem
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <Card
      variant={isSelected ? "outlined" : "default"}
      size="sm"
      hoverable
      onClick={onSelect}
      className={`relative cursor-pointer transition-all ${isSelected ? "ring-2 ring-accent" : ""}`}
    >
      {isSelected && (
        <div className="absolute top-2 right-2">
          <Badge variant="success" size="sm">
            <Check size={12} className="mr-1" />
            Active
          </Badge>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <p className="font-semibold text-primary-text">{theme.name}</p>

        {/* Color preview grid */}
        <div className="grid grid-cols-7 gap-1">
          {PREVIEW_COLORS.map(({ key, label }) => {
            const color = theme.variables[key] || "#808080"
            return (
              <div key={key} className="flex flex-col items-center gap-1">
                <div
                  className="w-6 h-6 rounded-md border border-divider-color shadow-sm"
                  style={{ backgroundColor: color }}
                  title={`${label}: ${color}`}
                />
              </div>
            )
          })}
        </div>

        {/* Color labels */}
        <div className="grid grid-cols-7 gap-1">
          {PREVIEW_COLORS.map(({ key, label }) => (
            <span key={key} className="text-[10px] text-muted-text text-center truncate">
              {label}
            </span>
          ))}
        </div>
      </div>
    </Card>
  )
}

export function ThemeBrowser({ themes, currentThemeId, onSelectTheme }: ThemeBrowserProps) {
  if (themes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-4">
        <p className="text-muted-text">No themes available</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-text">
        Select a theme to apply. The preview shows the main colors used in each theme.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {themes.map((theme) => (
          <ThemePreviewCard
            key={theme.id}
            theme={theme}
            isSelected={currentThemeId === theme.id}
            onSelect={() => onSelectTheme(theme)}
          />
        ))}
      </div>
    </div>
  )
}
