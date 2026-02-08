import { usePageHeading } from "@/hooks/useHeading"
import { Slides } from "@dockstat/ui"
import { useState } from "react"
import { HotkeysSlide } from "@/components/settings/hotkeys"

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
          General: <div>General Settings</div>,
          Hotkeys: <HotkeysSlide />,
          "Database Management": <div>Database Management Settings</div>,
          Certificates: <div>Certificates Settings</div>,
          "SSL Credentials": <div>SSL Credentials Settings</div>,
          Accounts: <div>Accounts Settings</div>,
        }}
      </Slides>
    </div>
  )
}
