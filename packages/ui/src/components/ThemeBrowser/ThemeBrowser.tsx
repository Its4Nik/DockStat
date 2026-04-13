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
      className={`relative flex-1 cursor-pointer transition-all m-1 ${isSelected ? "ring-2 ring-accent" : ""}`}
      hoverable
      onClick={onSelect}
      size="sm"
      variant={isSelected ? "outlined" : "default"}
    >
      <div className="absolute top-2 right-2">
        {isSelected && (
          <Badge
            size="sm"
            variant="success"
          >
            <Check
              className="mr-1"
              size={12}
            />
            Active
          </Badge>
        )}
        {!(theme.id < 0) ? (
          <Button
            className="mt-1"
            onClick={async (e) => {
              e.stopPropagation()
              await deleteTheme(theme.id)
            }}
            size="xs"
            variant="danger"
          >
            <Trash size={12} />
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <p className="font-semibold text-primary-text">{theme.name}</p>

        <div className="mx-4 flex h-10 gap-1 overflow-visible">
          {colorEntries.map(([name, color]) => (
            <div
              className="flex-1 relative group overflow-visible"
              key={name}
            >
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
            <div
              className="flex-1 text-center"
              key={name}
            >
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
            isSelected={currentThemeId === theme.id}
            key={theme.id}
            onSelect={async () => {
              await onSelectTheme(theme)
              toastSuccess(theme.name)
            }}
            theme={theme}
          />
        ))}
      </div>
    </div>
  )
}
