import type { LogEntry } from "@dockstat/logger"
import { motion } from "framer-motion"
import { Menu } from "lucide-react"
import { useState } from "react"
import { NavLink } from "react-router"

import { Badge } from "../Badge/Badge"
import { Card } from "../Card/Card"
import { Divider } from "../Divider/Divider"
import { LinkLookup } from "../HotkeyMenus/LinkLookup"
import { LinkWithIcon } from "../Link/Link"
import { Sidebar, type SidebarProps } from "../Sidebar/Sidebar"
import DockStatLogo from "./DockStat2-06.png"

type NavbarProps = {
  isBusy: boolean
  logEntries: LogEntry[]
  navLinks?: { slug: string; path: string }[]
  pluginLinks: Array<{ pluginName: string; paths: Array<{ fullPath: string; metaTitle: string }> }>
  ramUsage?: string
  heading?: string
  mutationFn: SidebarProps["mutationFn"]
}

export function Navbar({
  isBusy,
  navLinks,
  ramUsage,
  logEntries,
  heading,
  mutationFn,
  pluginLinks,
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      <LinkLookup pins={navLinks || []} pluginLinks={pluginLinks} />

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
            {navLinks?.map((nl) => (
              <NavLink to={nl.path} key={nl.slug}>
                {({ isActive }) => <Badge outlined={isActive}>{nl.slug}</Badge>}
              </NavLink>
            ))}
            {ramUsage ? (
              <Badge variant="secondary" className="font-mono">
                {ramUsage}
              </Badge>
            ) : null}
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
