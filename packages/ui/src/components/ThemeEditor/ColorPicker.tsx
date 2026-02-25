import { useState } from "react"
import { Input } from "../Forms/Input"

export function SimpleColorPicker({
  color,
  colorName,
  displayName,
  updateThemeColor,
}: {
  color: string
  colorName: string
  displayName?: string
  updateThemeColor: (color: string, colorName: string) => void
}) {
  const [currentColor, setCurrentColor] = useState(color)

  const name = displayName || colorName.replace("--color-", "").replaceAll("-", " ")

  const onChange = (e: string) => {
    setCurrentColor(e)
    updateThemeColor(e, colorName)
  }

  return (
    <div className="flex flex-col items-center space-y-1">
      <div
        title={name}
        className="text-xs font-medium text-center mb-1 truncate w-full capitalize text-primary-text"
      >
        {name}
      </div>
      <div className="relative">
        <div
          className="w-10 h-10 rounded border border-border"
          style={{ backgroundColor: currentColor }}
        />
        <Input
          type="color"
          value={currentColor}
          onChange={onChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  )
}
