import type { LogEntry } from "@dockstat/logger"
import type { UpdateResult } from "@dockstat/sqlite-wrapper"
import { formatDate } from "@dockstat/utils"
import { SiGithub, SiNpm } from "@icons-pack/react-simple-icons"
import type { UseMutateAsyncFunction } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import { BookMarkedIcon, Paintbrush, Palette, Terminal, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Badge } from "../Badge/Badge"
import { Button } from "../Button/Button"
import { Card } from "../Card/Card"
import { Divider } from "../Divider/Divider"
import { LinkWithIcon } from "../Link/Link"
import { Modal } from "../Modal/Modal"
import { backdropVariants, slideInVariants } from "../Navbar/animations"
import { SidebarPaths } from "../Navbar/consts"
import DockStatLogo from "../Navbar/DockStat2-06.png"
import { usePinnedPaths } from "../Navbar/usePinnedPaths"
import { Table } from "../Table/Table"
import { ThemeBrowser, type ThemeBrowserItem } from "../ThemeBrowser/ThemeBrowser"
import { SidebarAnimatedItem, SidebarAnimatedNav } from "./SidebarAnimatedNav"
import { SidebarItem } from "./SidebarItem"

type PinLinkMutation = UseMutateAsyncFunction<
  UpdateResult & {
    message: string
  },
  Error,
  {
    path: string
    slug: string
  },
  unknown
>

type PathItem = {
  slug: string
  path: string
  isPinned?: boolean
  children?: PathItem[]
}

export type ThemeProps = {
  isOpen: boolean
  themes: ThemeBrowserItem[]
  currentThemeId: number | null
  currentThemeName: string
  onSelectTheme: (theme: ThemeBrowserItem) => void | Promise<void>
  toastSuccess: (themeName: string) => void
  onOpen: () => void
  currentThemeColors: { color: string; colorName: string }[]
  onColorChange: (color: string, colorName: string) => void
}

export type SidebarProps = {
  isOpen: boolean
  onClose: () => void
  isBusy: boolean
  logEntries: LogEntry[]
  mutationFn: { pin: PinLinkMutation; unpin: PinLinkMutation; isBusy: boolean }
  pins: { path: string; slug: string }[]
  pluginLinks: { pluginName: string; paths: { fullPath: string; metaTitle: string }[] }[]
  deleteTheme: (themeId: number) => Promise<void>
  themeProps?: ThemeProps
}

export function Sidebar({
  isOpen,
  onClose,
  logEntries,
  pins,
  pluginLinks,
  mutationFn,
  themeProps,
  deleteTheme,
}: SidebarProps) {
  const [logModalOpen, setLogModalOpen] = useState<boolean>(false)
  const [themeModalOpen, setThemeModalOpen] = useState<boolean>(false)
  const [showPluginRoutes, setShowPluginRoutes] = useState<boolean>(false)

  const pinnedPaths = useMemo(() => new Set(pins.map((p) => p.path)), [pins])

  const isPinned = (path: string) => pinnedPaths.has(path)

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, onClose])

  const handleTogglePin = (item: PathItem) => {
    const payload = { slug: item.slug, path: item.path }
    if (item.isPinned) {
      mutationFn.unpin(payload)
    } else {
      mutationFn.pin(payload)
    }
  }

  // Theme sidebar state is now managed globally in the context

  const pathsWithPinStatus = usePinnedPaths([...SidebarPaths], pins)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-main-bg/50 backdrop-blur-xs"
            variants={backdropVariants}
            initial="closed"
            animate="open"
            exit="closed"
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed left-0 top-0 z-50 h-full w-80 overflow-y-auto p-4"
            variants={slideInVariants}
            initial="closed"
            animate="open"
            exit="closed"
          >
            <Card className="flex h-full flex-col shadow-xl">
              <div className="flex items-center justify-between p-1">
                <div className="flex items-center gap-3">
                  <img src={DockStatLogo} alt="DockStat Logo" className="w-8" />
                  <p className="text-lg font-bold tracking-tight">DockStat</p>
                </div>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
                  <X size={16} />
                </Button>
              </div>

              <div className="mt-2">
                <div className="flex transition-all duration-300 space-x-2">
                  <Button
                    noFocusRing
                    className="flex-1 relative"
                    size="xs"
                    variant={!showPluginRoutes ? "outline" : "primary"}
                    disabled={!showPluginRoutes}
                    onClick={() => setShowPluginRoutes(false)}
                  >
                    Main routes
                  </Button>
                  {pluginLinks.length >= 1 ? (
                    <Button
                      noFocusRing
                      className="flex-1 relative"
                      size="xs"
                      variant={showPluginRoutes ? "outline" : "primary"}
                      onClick={() => setShowPluginRoutes(true)}
                      disabled={showPluginRoutes}
                    >
                      Plugin routes
                    </Button>
                  ) : null}
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  {showPluginRoutes ? (
                    <SidebarAnimatedNav key="plugins">
                      {pluginLinks.map((plugin) => (
                        <div key={plugin.pluginName}>
                          <Divider label={plugin.pluginName} className="mb-2" />
                          <div className="flex flex-1 flex-col gap-1">
                            {plugin.paths.map((path) => (
                              <SidebarAnimatedItem key={path.fullPath}>
                                <SidebarItem
                                  handleTogglePin={() =>
                                    handleTogglePin({
                                      path: path.fullPath,
                                      slug: path.metaTitle,
                                      isPinned: isPinned(path.fullPath),
                                    })
                                  }
                                  isLoading={mutationFn.isBusy}
                                  item={{
                                    path: path.fullPath,
                                    slug: path.metaTitle,
                                    isPinned: isPinned(path.fullPath),
                                  }}
                                />
                              </SidebarAnimatedItem>
                            ))}
                          </div>
                        </div>
                      ))}
                    </SidebarAnimatedNav>
                  ) : (
                    <SidebarAnimatedNav key="default">
                      {pathsWithPinStatus?.map((p) => (
                        <SidebarAnimatedItem key={p.slug}>
                          <SidebarItem
                            item={p}
                            handleTogglePin={handleTogglePin}
                            isLoading={mutationFn.isBusy}
                          />
                        </SidebarAnimatedItem>
                      ))}
                    </SidebarAnimatedNav>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-auto flex flex-col gap-4 pt-4">
                <Divider label="More of DockStat" variant="dashed" />

                <div className="flex flex-col gap-3">
                  <LinkWithIcon
                    href="https://github.com/its4nik/dockstat"
                    external
                    iconPosition="left"
                    icon={<SiGithub size={18} />}
                  >
                    Visit Github
                  </LinkWithIcon>

                  <LinkWithIcon
                    href="https://dockstat.itsnik.de"
                    external
                    iconPosition="left"
                    icon={<BookMarkedIcon size={18} />}
                  >
                    Technical Documentation
                  </LinkWithIcon>

                  <LinkWithIcon
                    href="https://www.npmjs.com/search?q=%40dockstat"
                    external
                    iconPosition="left"
                    icon={<SiNpm size={18} />}
                  >
                    @dockstat packages
                  </LinkWithIcon>
                </div>

                <Divider variant="dashed" />

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setLogModalOpen(!logModalOpen)}
                    className="flex-1"
                  >
                    <Terminal size={18} />
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setThemeModalOpen(true)
                    }}
                    className="flex-1"
                  >
                    <Palette size={18} />
                  </Button>

                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      themeProps?.onOpen()
                    }}
                  >
                    <Paintbrush size={18} />
                  </Button>
                </div>
              </div>
              <Modal
                transparent
                size="full"
                title={`${logEntries.length} Logs available`}
                open={logModalOpen}
                onClose={() => setLogModalOpen(false)}
              >
                <Table
                  striped
                  hoverable
                  searchable
                  columns={[
                    {
                      key: "name",
                      title: "Logger Name",
                      align: "center",
                      render: (loggerName) =>
                        loggerName && <Badge rounded>{String(loggerName)}</Badge>,
                    },
                    {
                      key: "level",
                      align: "center",
                      title: "Level",
                      render: (level) =>
                        level && (
                          <span
                            className={`${level === "info" ? "text-accent" : level === "debug" ? "text-muted-text" : level === "error" ? "text-error" : "text-orange-400"}`}
                          >
                            {String(level)}
                          </span>
                        ),
                    },
                    { key: "message", title: "Log Message" },
                    {
                      key: "requestId",
                      title: "RequestID",
                      align: "center",
                      render: (reqId) => reqId && <Badge unique>{String(reqId)}</Badge>,
                    },
                    { key: "caller", title: "Caller", align: "center" },
                    { key: "parents", title: "Parents" },
                    {
                      key: "timestamp",
                      title: "Timestamp",
                      render: (date) => <span>{formatDate(date as Date, "log")}</span>,
                    },
                  ]}
                  data={logEntries}
                />
              </Modal>

              <Modal
                size="xl"
                transparent
                title="Theme Browser"
                open={themeModalOpen}
                onClose={() => setThemeModalOpen(false)}
              >
                {themeProps ? (
                  <ThemeBrowser
                    deleteTheme={deleteTheme}
                    themes={themeProps.themes}
                    currentThemeId={themeProps.currentThemeId}
                    onSelectTheme={async (theme) => await themeProps.onSelectTheme(theme)}
                    toastSuccess={themeProps.toastSuccess}
                  />
                ) : (
                  <p className="text-muted-text">Theme functionality not available</p>
                )}
              </Modal>

              {/* ThemeSidebar is now rendered globally in layout.tsx */}
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
