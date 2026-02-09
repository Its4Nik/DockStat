import { Slides } from "@dockstat/ui"
import { useState } from "react"
import { HotkeysSlide } from "@/components/settings/hotkeys"
import { usePageHeading } from "@/hooks/useHeading"
import { GeneralSettingsSlide } from "@/components/settings/general/index"

export default function SettingsPage() {
  usePageHeading("Settings")

  const [selectedSlide, setSelectedSlide] = useState("General")

  const slideDescription: Record<string, string> = {
    General: "General Settings",
    Hotkeys: "Configure your way of navigating DockStat",
    "Database Management": "Database Management, cleanup and maintain tables",
    Certificates: "Manage Certificates used for authentication via SSH",
    "SSL Credentials": "SSL Credentials, manage certificates used for SSL",
    Accounts: "Manage DockStat Accounts and permissions",
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
        }}
      </Slides>
    </div>
  )
}
