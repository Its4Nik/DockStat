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
import { Sidebar, type SidebarProps, type ThemeProps } from "../Sidebar/Sidebar"
import { floatVariants } from "./consts"
import DockStatLogo from "./DockStat2-06.png"

export { type PathItem, SidebarPaths } from "./consts"

type NavbarProps = {
  isBusy: boolean
  logEntries: LogEntry[]
  navLinks?: { slug: string; path: string }[]
  pluginLinks: Array<{ pluginName: string; paths: Array<{ fullPath: string; metaTitle: string }> }>
  ramUsage?: string
  heading?: string
  mutationFn: SidebarProps["mutationFn"]
  themeProps?: ThemeProps
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
  themeProps,
  openQuickLinksModalHotkey,
  sidebarHotkeys,
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useHotkey({
    close: () => setIsMenuOpen(false),
    open: () => setIsMenuOpen(true),
    isOpen: isMenuOpen,
    closeKey: sidebarHotkeys.close,
    openKey: sidebarHotkeys.open,
    toggleKey: sidebarHotkeys.toggle,
  })

  return (
    <>
      <LinkLookup
        pins={navLinks || []}
        pluginLinks={pluginLinks}
        hotkey={openQuickLinksModalHotkey}
      />

      <Card size="sm" className="w-full p-0.5 mb-4 relative overflow-visible">
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
            <motion.button onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
              <Badge className="p-2!" variant="secondary">
                <Menu size={20} />
              </Badge>
            </motion.button>

            <LinkWithIcon href="/">
              <img src={DockStatLogo} alt="DockStat Logo" className="w-8 shrink-0" />
            </LinkWithIcon>
          </div>

          {(heading || "").length > 0 && (
            <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl font-bold">{heading}</h1>
          )}

          <div className="flex items-center gap-2">
            <AnimatePresence initial={false}>
              {navLinks?.map((nl) => (
                <motion.div
                  key={nl.slug}
                  layout
                  variants={floatVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <NavLink to={nl.path}>
                    {({ isActive }) => <Badge outlined={isActive}>{nl.slug}</Badge>}
                  </NavLink>
                </motion.div>
              ))}

              {ramUsage && (
                <motion.div
                  key="ram-usage"
                  layout
                  variants={floatVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <Badge variant="secondary" className="font-mono">
                    {ramUsage}
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        <Sidebar
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          isBusy={isBusy}
          logEntries={logEntries}
          mutationFn={mutationFn}
          pins={navLinks || []}
          pluginLinks={pluginLinks || []}
          themeProps={themeProps}
        />

        <style>{`
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
      </Card>
      <Divider variant="dashed" className="my-4" />
    </>
  )
}
