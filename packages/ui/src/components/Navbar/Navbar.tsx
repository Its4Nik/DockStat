import type { LogEntry } from "@dockstat/logger"
import { useHotkey } from "@dockstat/utils/react"
import { AnimatePresence, motion } from "framer-motion"
import { Menu } from "lucide-react"
import { useState } from "react"
import { NavLink } from "react-router"
import { Badge } from "../Badge/Badge"
import { Card } from "../Card/Card"
import { Divider } from "../Divider/Divider"
import { LinkLookup } from "../HotkeyMenus/LinkLookup"
import { LinkWithIcon } from "../Link/Link"
import { Sidebar, type SidebarProps } from "../Sidebar/Sidebar"
import type { ThemeBrowserItem } from "../ThemeBrowser/ThemeBrowser"
import { floatVariants } from "./consts"
import DockStatLogo from "./DockStat2-06.png"

export type { PinLinkMutation, SidebarProps } from "../Sidebar/Sidebar"
export { type PathItem, SidebarPaths } from "./consts"

type NavbarProps = {
  deleteTheme: (themeId: number) => Promise<void>
  isBusy: boolean
  logEntries: LogEntry[]
  navLinks?: { slug: string; path: string }[]
  pluginLinks: Array<{
    pluginName: string
    paths: Array<{ fullPath: string; metaTitle: string }>
  }>
  ramUsage?: string
  heading?: string
  mutationFn: SidebarProps["mutationFn"]
  themes: ThemeBrowserItem[]
  currentThemeId: number | null
  onSelectTheme: (theme: ThemeBrowserItem) => void | Promise<void>
  toastSuccess: (themeName: string) => void
  onColorChange: (color: string, colorName: string) => void
  setIsThemeSidebarOpen: (bool: boolean) => void
  openQuickLinksModalHotkey?: string
  sidebarHotkeys: {
    toggle?: string
    open?: string
    close?: string
  }
}

export function Navbar({
  isBusy,
  navLinks,
  ramUsage,
  logEntries,
  heading,
  mutationFn,
  pluginLinks,
  themes,
  currentThemeId,
  onSelectTheme,
  toastSuccess,
  onColorChange,
  openQuickLinksModalHotkey,
  sidebarHotkeys,
  setIsThemeSidebarOpen,
  deleteTheme,
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useHotkey({
    close: () => setIsMenuOpen(false),
    closeKey: sidebarHotkeys.close,
    isOpen: isMenuOpen,
    open: () => setIsMenuOpen(true),
    openKey: sidebarHotkeys.open,
    toggleKey: sidebarHotkeys.toggle,
  })

  return (
    <>
      <LinkLookup
        hotkey={openQuickLinksModalHotkey}
        pins={navLinks || []}
        pluginLinks={pluginLinks}
      />

      <Card
        className="max-w-screen p-0.5 mb-4 relative overflow-visible"
        size="sm"
      >
        <div
          className={`absolute inset-0 bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 bg-size-[200%_200%] transition-opacity duration-500 ${
            isBusy ? "opacity-20 animate-[gradient_1s_ease_infinite]" : "opacity-0"
          }`}
          style={{
            animation: isBusy ? "gradient 3s ease infinite" : "none",
          }}
        />

        <nav className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <motion.button
              aria-label="Toggle menu"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Badge
                className="p-2!"
                variant="secondary"
              >
                <Menu size={20} />
              </Badge>
            </motion.button>

            <LinkWithIcon href="/">
              <img
                alt="DockStat Logo"
                className="w-8 shrink-0"
                src={DockStatLogo}
              />
            </LinkWithIcon>
          </div>

          {(heading || "").length > 0 && (
            <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl font-bold">{heading}</h1>
          )}

          <div className="flex items-center gap-2">
            <AnimatePresence initial={false}>
              {navLinks?.map((nl) => (
                <motion.div
                  animate="animate"
                  exit="exit"
                  initial="initial"
                  key={nl.slug}
                  layout
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  variants={floatVariants}
                >
                  <NavLink
                    end
                    to={nl.path}
                  >
                    {({ isActive }) => <Badge outlined={isActive}>{nl.slug}</Badge>}
                  </NavLink>
                </motion.div>
              ))}

              {ramUsage && (
                <motion.div
                  animate="animate"
                  exit="exit"
                  initial="initial"
                  key="ram-usage"
                  layout
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  variants={floatVariants}
                >
                  <Badge
                    className="font-mono"
                    variant="secondary"
                  >
                    {ramUsage}
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        <Sidebar
          currentThemeId={currentThemeId}
          deleteTheme={deleteTheme}
          isBusy={isBusy}
          isOpen={isMenuOpen}
          logEntries={logEntries}
          mutationFn={mutationFn}
          onClose={() => setIsMenuOpen(false)}
          onColorChange={onColorChange}
          onSelectTheme={onSelectTheme}
          pins={navLinks || []}
          pluginLinks={pluginLinks || []}
          setIsThemeSidebarOpen={setIsThemeSidebarOpen}
          themes={themes}
          toastSuccess={toastSuccess}
        />

        <style>{`
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
      </Card>
      <Divider
        className="my-4"
        variant="dashed"
      />
    </>
  )
}
