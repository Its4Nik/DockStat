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
  return (
    <div>
      <h1>{currentTheme}</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 p-2">
        {allColors.map((c) => {
          return (
            <SimpleColorPicker
              key={c.colorName}
              color={c.color}
              colorName={c.colorName}
              displayName={c.displayName}
              updateThemeColor={onColorChange}
            />
          )
        })}
      </div>
    </div>
  )
}
