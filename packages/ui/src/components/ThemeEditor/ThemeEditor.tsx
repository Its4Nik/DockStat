import { SimpleColorPicker } from "./ColorPicker"

export function ThemeEditor({
  currentTheme,
  onColorChange,
  allColors,
}: {
  currentTheme: string
  onColorChange: (color: string, colorName: string) => void
  allColors: { color: string; colorName: string; displayName?: string }[]
}) {
  const getColorName = (colorName: string) => {
    return colorName.replaceAll("--color-", "").replaceAll("-", " ")
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-3 py-2 border-b border-accent shrink-0">
        <h1 className="text-sm font-semibold tracking-wide">{currentTheme}</h1>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-accent">
          {allColors.map((c) => {
            const label = c.displayName ?? c.colorName

            return (
              <div
                key={c.colorName}
                className="
                  flex items-center gap-4
                  px-3 py-2
                  hover:bg-main-bg/80
                  transition-colors
                "
              >
                {/* LEFT: readable info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-primary-text capitalize">
                    {getColorName(label)}
                  </div>

                  <div className="text-xs text-muted-text font-mono truncate">{c.colorName}</div>

                  <div className="text-[11px] text-zinc-500 font-mono">{c.color}</div>
                </div>

                {/* RIGHT: control */}
                <div className="shrink-0">
                  <SimpleColorPicker
                    showName={false}
                    color={c.color}
                    colorName={c.colorName}
                    displayName={c.displayName}
                    updateThemeColor={onColorChange}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
