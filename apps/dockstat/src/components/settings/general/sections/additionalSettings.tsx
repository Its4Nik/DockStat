import type { DockStatConfigTableType } from "@dockstat/typings/types"
import { Badge, Card, Divider, Toggle } from "@dockstat/ui"
import { Settings, ToggleLeft, ToggleRight } from "lucide-react"

export function AdditionalSettingsSection({
  additionalSettings,
  setShowRamUsageInNavbar,
}: {
  additionalSettings: DockStatConfigTableType["additionalSettings"]
  setShowRamUsageInNavbar: (boolean: boolean) => void
}) {
  return (
    <>
      <Divider variant="dotted" />
      <div>
        <Card size="sm" variant="outlined" className="flex gap-2 mb-4">
          <div className="mx-auto gap-2">
            <div className="flex items-center gap-2">
              <Settings size={24} className="text-accent" />
              <h2 className="text-2xl font-semibold text-muted-text">Additional Settings</h2>
            </div>
          </div>
        </Card>

        <Card variant="dark" className="p-4 space-y-4">
          {/* Backend RAM Usage Setting */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                {additionalSettings.showBackendRamUsageInNavbar ? (
                  <ToggleRight size={18} className="text-accent" />
                ) : (
                  <ToggleLeft size={18} className="text-muted-text" />
                )}
              </div>
              <div>
                <div className="font-semibold text-white">Show RAM Usage in Navbar</div>
                <div className="text-sm text-muted-text">
                  Display backend memory usage in the navigation bar
                </div>
              </div>
            </div>
            <div className="flex justify-between w-full">
              <Badge
                variant={additionalSettings.showBackendRamUsageInNavbar ? "success" : "secondary"}
                size="sm"
              >
                {additionalSettings.showBackendRamUsageInNavbar ? "Enabled" : "Disabled"}
              </Badge>
              <Toggle
                size="md"
                checked={additionalSettings.showBackendRamUsageInNavbar}
                onChange={() =>
                  setShowRamUsageInNavbar(!additionalSettings.showBackendRamUsageInNavbar)
                }
              />
            </div>
          </div>

          {/* Debug Info - Only in development */}
          {process.env.NODE_ENV !== "production" && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-muted-text hover:text-white transition-colors">
                Debug: Raw Config Data
              </summary>
              <pre className="mt-2 text-xs text-muted-text overflow-auto max-h-44 p-3 bg-muted/5 rounded-lg">
                {JSON.stringify(additionalSettings, null, 2)}
              </pre>
            </details>
          )}
        </Card>
      </div>
    </>
  )
}
