import { useEffect } from "react"

type UseHotkeyOptions = {
  open?: () => void
  close?: () => void
  toggle?: () => void
  openKey?: string
  closeKey?: string
  toggleKey?: string
  isOpen?: boolean
  requireModifier?: boolean
}

// Helper to check if the event matches the config string (e.g. "shift+k")
const matchesKey = (event: KeyboardEvent, configKey?: string) => {
  if (!configKey) return false

  // 1. Check for Shift requirement
  const requiresShift = configKey.includes("shift+")
  if (requiresShift && !event.shiftKey) return false
  if (!requiresShift && event.shiftKey) return false // Optional: Enforce NO shift if not specified

  // 2. Clean the config key to get the raw character (e.g. "shift+k" -> "k")
  const rawTargetKey = configKey.replace("shift+", "").toLowerCase()

  // 3. Compare safely (lowercase both to avoid "K" vs "k" issues)
  return event.key.toLowerCase() === rawTargetKey
}

export const useHotkey = ({
  open,
  close,
  toggle, // Added this if you want a generic toggle function
  openKey,
  closeKey,
  toggleKey,
  isOpen,
  requireModifier = true,
}: UseHotkeyOptions) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Check Global Modifier (Ctrl/Cmd)
      const hasModifier = e.ctrlKey || e.metaKey
      if (requireModifier && !hasModifier) return

      // 2. Check Actions
      if (closeKey && matchesKey(e, closeKey)) {
        e.preventDefault()
        close?.()
        return
      }

      if (openKey && matchesKey(e, openKey)) {
        e.preventDefault()
        open?.()
        return
      }

      if (toggleKey && matchesKey(e, toggleKey)) {
        e.preventDefault()
        if (toggle) {
          toggle()
        } else {
          // Fallback to isOpen logic if specific toggle fn not provided
          isOpen ? close?.() : open?.()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, close, toggle, openKey, closeKey, toggleKey, isOpen, requireModifier])
}
