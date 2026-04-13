import { Slides, ThemeEditor } from "@dockstat/ui"
import { useState } from "react"
import { GeneralSettingsSlide } from "@/components/settings/general/index"
import { HotkeysSlide } from "@/components/settings/hotkeys"
import { usePageHeading } from "@/hooks/useHeading"
import { useTheme } from "@/hooks/useTheme"
import { toast } from "@/lib/toast"

export default function SettingsPage() {
  usePageHeading("Settings")

  const currentThemeContext = useTheme()

  const allColors = currentThemeContext.theme?.vars || {}
  const themeName = currentThemeContext.theme?.name || "Undefined"

  const adjustCurrentTheme = (adjustedColors: Record<string, string>) => {
    currentThemeContext.adjustCurrentTheme({ ...allColors, ...adjustedColors })
  }
  const parsedColors = Object.entries(allColors).map((c) => {
    return {
      color: c[1],
      colorName: c[0],
    }
  })

  const [selectedSlide, setSelectedSlide] = useState("General")

  const slideDescription: Record<string, string> = {
    Accounts: "Manage DockStat Accounts and permissions",
    Certificates: "Manage Certificates used for authentication via SSH",
    Colors: "Customize the appearance of DockStat",
    "Database Management": "Database Management, cleanup and maintain tables",
    General: "General Settings",
    Hotkeys: "Configure your way of navigating DockStat",
    "SSL Credentials": "SSL Credentials, manage certificates used for SSL",
  }

  return (
    <div>
      <Slides
        buttonPosition="right"
        connected
        description={slideDescription[selectedSlide]}
        header="DockStat Settings"
        onSlideChange={(key) => setSelectedSlide(String(key))}
      >
        {{
          Accounts: <div>Accounts Settings</div>,
          Certificates: <div>Certificates Settings</div>,
          Colors: (
            <ThemeEditor
              allColors={parsedColors}
              currentTheme={themeName}
              multiColumn
              onColorChange={(colorValue, colorName) => {
                adjustCurrentTheme({ [colorName]: colorValue })
                toast({
                  description: `Changed: ${colorName} to ${colorValue}`,
                  title: "Updated color",
                })
              }}
            />
          ),
          General: <GeneralSettingsSlide />,
          Hotkeys: <HotkeysSlide />,
        }}
      </Slides>
    </div>
  )
}
