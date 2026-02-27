import { Check, Trash } from "lucide-react"
import { Badge } from "../Badge/Badge"
import { Button } from "../Button/Button"
import { Card } from "../Card/Card"
import { getValidColors } from "./getValidColors"

export type ThemeBrowserItem = {
  id: number
  name: string
  variables: Record<string, string>
}

export type ThemeBrowserProps = {
  themes: ThemeBrowserItem[]
  currentThemeId?: number | null
  onSelectTheme: (theme: ThemeBrowserItem) => Promise<void>
  deleteTheme: (themeId: number) => Promise<void>
  toastSuccess: (themeName: string) => void
}

function ThemePreviewCard({
  theme,
  isSelected,
  onSelect,
  deleteTheme,
}: {
  theme: ThemeBrowserItem
  deleteTheme: (themeId: number) => Promise<void>
  isSelected: boolean
  onSelect: () => void
}) {
  const validColors = getValidColors(theme.variables)
  const colorEntries = Object.entries(validColors)

  return (
    <Card
      variant={isSelected ? "outlined" : "default"}
      size="sm"
      hoverable
      onClick={onSelect}
      className={`relative flex-1 cursor-pointer transition-all m-1 ${isSelected ? "ring-2 ring-accent" : ""}`}
    >
      <div className="absolute top-2 right-2">
        {isSelected && (
          <Badge variant="success" size="sm">
            <Check size={12} className="mr-1" />
            Active
          </Badge>
        )}
        {!(theme.id < 0) ? (
          <Button
            className="mt-1"
            variant="danger"
            size="xs"
            onClick={async (e) => {
              e.stopPropagation()
              await deleteTheme(theme.id)
            }}
          >
            <Trash size={12} />
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <p className="font-semibold text-primary-text">{theme.name}</p>

        <div className="mx-4 flex h-10 gap-1 overflow-visible">
          {colorEntries.map(([name, color]) => (
            <div key={name} className="flex-1 relative group overflow-visible">
              <div
                className="w-full h-full transform -skew-x-12 transition-transform duration-300 ease-in-out group-hover:-translate-y-2 group-hover:scale-125 rounded-md"
                style={{ backgroundColor: color }}
              />
            </div>
          ))}
        </div>

        {/* Color Labels */}
        <div className="flex mt-3 mx-4">
          {colorEntries.map(([name]) => (
            <div key={name} className="flex-1 text-center">
              <div className="text-xs font-medium capitalize">
                {name.replaceAll("--color-", "")}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

export function ThemeBrowser({
  themes,
  currentThemeId,
  onSelectTheme,
  toastSuccess,
  deleteTheme,
}: ThemeBrowserProps) {
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

      <div className="flex flex-wrap gap-2 p-4">
        {themes.map((theme) => (
          <ThemePreviewCard
            deleteTheme={deleteTheme}
            key={theme.id}
            theme={theme}
            isSelected={currentThemeId === theme.id}
            onSelect={async () => {
              await onSelectTheme(theme)
              toastSuccess(theme.name)
            }}
          />
        ))}
      </div>
    </div>
  )
}
