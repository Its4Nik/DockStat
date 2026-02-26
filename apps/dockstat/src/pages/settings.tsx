import { Slides, ThemeEditor } from "@dockstat/ui"
import { useContext, useState } from "react"
import { GeneralSettingsSlide } from "@/components/settings/general/index"
import { HotkeysSlide } from "@/components/settings/hotkeys"
import { ThemeProviderContext } from "@/contexts/theme"
import { usePageHeading } from "@/hooks/useHeading"
import { toast } from "@/lib/toast"

export default function SettingsPage() {
  usePageHeading("Settings")

  const currentThemeContext = useContext(ThemeProviderContext)

  const allColors = currentThemeContext.theme?.vars || {}
  const themeName = currentThemeContext.theme?.name || "Undefined"

  const adjustCurrentTheme = (adjustedColors: Record<string, string>) => {
    currentThemeContext.adjustCurrentTheme({ ...allColors, ...adjustedColors })
  }
  const parsedColors = Object.entries(allColors).map((c) => {
    return {
      colorName: c[0],
      color: c[1],
    }
  })

  const [selectedSlide, setSelectedSlide] = useState("General")

  const slideDescription: Record<string, string> = {
    General: "General Settings",
    Hotkeys: "Configure your way of navigating DockStat",
    "Database Management": "Database Management, cleanup and maintain tables",
    Certificates: "Manage Certificates used for authentication via SSH",
    "SSL Credentials": "SSL Credentials, manage certificates used for SSL",
    Accounts: "Manage DockStat Accounts and permissions",
    Colors: "Customize the appearance of DockStat",
  }

  return (
    <div>
      <Slides
        connected
        header="DockStat Settings"
        buttonPosition="right"
        description={slideDescription[selectedSlide]}
        onSlideChange={(key) => setSelectedSlide(String(key))}
      >
        {{
          General: <GeneralSettingsSlide />,
          Hotkeys: <HotkeysSlide />,
          Certificates: <div>Certificates Settings</div>,
          Accounts: <div>Accounts Settings</div>,
          Colors: (
            <ThemeEditor
              currentTheme={themeName}
              allColors={parsedColors}
              onColorChange={(colorValue, colorName) => {
                adjustCurrentTheme({ [colorName]: colorValue })
                toast({
                  description: `Changed: ${colorName} to ${colorValue}`,
                  title: "Updated color",
                })
              }}
            />
          ),
        }}
      </Slides>
    </div>
  )
}
