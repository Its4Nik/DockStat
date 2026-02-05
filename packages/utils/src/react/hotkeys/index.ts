import { useEffect } from "react"

type UseHotkeyOptions = {
  open: () => void
  close: () => void
  openKey?: string
  closeKey?: string
  toggleKey?: string
  isOpen?: boolean
  requireModifier?: boolean
}

export const useHotkey = ({
  open,
  close,
  openKey,
  closeKey,
  toggleKey,
  isOpen,
  requireModifier = true,
}: UseHotkeyOptions) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const hasModifier = e.ctrlKey || e.metaKey

      if (requireModifier && !hasModifier) return

      if (closeKey && e.key === closeKey) {
        e.preventDefault()
        close()
        return
      }

      if (openKey && e.key === openKey) {
        e.preventDefault()
        open()
        return
      }

      if (toggleKey && e.key === toggleKey) {
        e.preventDefault()
        isOpen ? close() : open()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, close, openKey, closeKey, toggleKey, isOpen, requireModifier])
}
