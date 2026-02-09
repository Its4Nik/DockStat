import { Button, Card } from "@dockstat/ui"
import { Save } from "lucide-react"
import { useContext, useEffect, useState } from "react"
import { ConfigProviderContext } from "@/contexts/config"
import { useEdenMutation } from "@/hooks/eden/useEdenMutation"
import { api } from "@/lib/api"

// Helper to determine if shift is active based on string value (e.g. "shift+s")
const hasShift = (val: string) => val.toLowerCase().includes("shift+")
const stripShift = (val: string) => val.replace(/shift\+/i, "")

export function HotkeysSlide() {
  const { hotkeys } = useContext(ConfigProviderContext)
  const [localHotkeys, setLocalHotkeys] = useState<Record<string, string>>(hotkeys ?? {})

  // Sync state when context changes
  useEffect(() => {
    setLocalHotkeys(hotkeys ?? {})
  }, [hotkeys])

  const editHotkeyMutation = useEdenMutation({
    mutationKey: ["editHotkey"],
    route: api.db.config.hotkey.post,
    invalidateQueries: [["fetchAdditionalSettings"]],
    toast: {
      errorTitle: "Failed to update hotkey",
      successTitle: "Hotkey updated successfully",
    },
  })

  const handleSave = async () => {
    await editHotkeyMutation.mutateAsync({ hotkeys: localHotkeys })
  }

  const entries = Object.entries(localHotkeys)

  if (entries.length === 0) return null

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {entries.map(([actionName, value]) => {
        // Compare current local state with original context to check "dirty" state
        const originalValue = (hotkeys as Record<string, string>)?.[actionName] ?? ""
        const isDirty = originalValue !== value
        const isShiftActive = hasShift(value)
        const charCode = stripShift(value)

        return (
          <Card
            key={actionName}
            variant="outlined"
            className="group relative flex flex-col justify-between gap-3 overflow-hidden bg-card p-4 transition-all"
          >
            {/* Header: Action Name */}
            <div className="flex items-center justify-between">
              <kbd className="font-light bg-accent/20 text-sm px-2 py-0.5 rounded-md text-foreground capitalize">
                {actionName.replace(/[:_]/g, " ")}
              </kbd>

              {/* Save Button: Only shows when changed */}
              <div
                className={`transition-all duration-300 ${isDirty ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 pointer-events-none"}`}
              >
                <Button
                  noFocusRing
                  size="xs"
                  variant="primary"
                  onClick={() => handleSave()}
                  className="h-7 px-2"
                >
                  <Save size={14} className="mr-1" />
                  Save all
                </Button>
              </div>
            </div>

            {/* Visual Keycap Area */}
            <div className="flex items-center gap-2 rounded-lg bg-muted/30 p-1">
              {/* 1. Static CTRL Key */}
              <div className="flex py-2 bg-accent/20 min-w-12 select-none items-center justify-center rounded border-b-2 border-border bg-muted px-2 font-mono text-xs font-bold text-muted-foreground">
                CTRL
              </div>

              <span className="text-muted-foreground/40">+</span>

              {/* 2. Interactive SHIFT Toggle */}
              <button
                type="button"
                onClick={() => {
                  const newVal = isShiftActive ? charCode : `shift+${charCode}`
                  setLocalHotkeys((prev) => ({ ...prev, [actionName]: newVal }))
                }}
                className={`
                  flex py-2 min-w-12 cursor-pointer items-center justify-center rounded border-b-2 px-2 transition-all active:mt-0.5 active:border-b-0
                  ${
                    isShiftActive
                      ? "border-primary/50 bg-accent/20 bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-accent/10 text-muted-foreground"
                  }
                `}
              >
                <span className="mr-1 font-mono text-xs font-bold">SHIFT</span>
                <div
                  className={`h-1.5 w-1.5 rounded-full ${isShiftActive ? "bg-accent" : "bg-transparent border border-muted-text"}`}
                />
              </button>

              <span className="text-muted-foreground/40">+</span>

              {/* 3. The Input Keycap */}
              <div className="bg-accent/20 py-0.5 relative flex w-12 items-center justify-center rounded border-b-2 border-border bg-background shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-accent/60">
                <input
                  type="text"
                  maxLength={1}
                  className="h-full w-full bg-transparent text-center font-mono text-lg font-bold uppercase text-foreground placeholder:text-muted-foreground/20 focus:outline-none"
                  value={charCode}
                  placeholder="?"
                  onChange={(e) => {
                    const char = e.target.value.toLowerCase()
                    const newVal = isShiftActive ? `shift+${char}` : char
                    setLocalHotkeys((prev) => ({ ...prev, [actionName]: newVal }))
                  }}
                />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
