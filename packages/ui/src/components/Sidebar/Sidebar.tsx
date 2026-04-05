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

export type PinLinkMutation = UseMutateAsyncFunction<
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

export type SidebarProps = {
  isOpen: boolean
  onClose: () => void
  isBusy: boolean
  logEntries: LogEntry[]
  mutationFn: { pin: PinLinkMutation; unpin: PinLinkMutation; isBusy: boolean }
  pins: { path: string; slug: string }[]
  pluginLinks: {
    pluginName: string
    paths: { fullPath: string; metaTitle: string }[]
  }[]
  deleteTheme: (themeId: number) => Promise<void>
  themes: ThemeBrowserItem[]
  currentThemeId: number | null
  setIsThemeSidebarOpen: (bool: boolean) => void
  onSelectTheme: (theme: ThemeBrowserItem) => void | Promise<void>
  toastSuccess: (themeName: string) => void
  onColorChange: (color: string, colorName: string) => void
}

export function Sidebar({
  isOpen,
  onSelectTheme,
  setIsThemeSidebarOpen,
  onClose,
  logEntries,
  pins,
  pluginLinks,
  mutationFn,
  themes,
  currentThemeId,
  toastSuccess,
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
    const payload = { path: item.path, slug: item.slug }
    if (item.isPinned) {
      mutationFn.unpin(payload)
    } else {
      mutationFn.pin(payload)
    }
  }

  const pathsWithPinStatus = usePinnedPaths([...SidebarPaths], pins)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            animate="open"
            className="fixed inset-0 z-40 bg-main-bg/50 backdrop-blur-xs"
            exit="closed"
            initial="closed"
            onClick={onClose}
            transition={{ duration: 0.2 }}
            variants={backdropVariants}
          />
          <motion.div
            animate="open"
            className="fixed left-0 top-0 z-50 h-full w-80 overflow-y-auto p-4"
            exit="closed"
            initial="closed"
            variants={slideInVariants}
          >
            <Card className="flex h-full flex-col shadow-xl overflow-y-scroll">
              <div className="flex items-center justify-between p-1">
                <div className="flex items-center gap-3">
                  <img
                    alt="DockStat Logo"
                    className="w-8"
                    src={DockStatLogo}
                  />
                  <p className="text-lg font-bold tracking-tight">DockStat</p>
                </div>
                <Button
                  className="h-8 w-8 p-0"
                  onClick={onClose}
                  size="sm"
                  variant="outline"
                >
                  <X size={16} />
                </Button>
              </div>

              <div className="mt-2">
                <div className="flex transition-all duration-300 space-x-2">
                  <Button
                    className="flex-1 relative"
                    disabled={!showPluginRoutes}
                    noFocusRing
                    onClick={() => setShowPluginRoutes(false)}
                    size="xs"
                    variant={!showPluginRoutes ? "outline" : "primary"}
                  >
                    Main routes
                  </Button>
                  {pluginLinks.length >= 1 ? (
                    <Button
                      className="flex-1 relative"
                      disabled={showPluginRoutes}
                      noFocusRing
                      onClick={() => setShowPluginRoutes(true)}
                      size="xs"
                      variant={showPluginRoutes ? "outline" : "primary"}
                    >
                      Plugin routes
                    </Button>
                  ) : null}
                </div>

                <AnimatePresence
                  initial={false}
                  mode="wait"
                >
                  {showPluginRoutes ? (
                    <SidebarAnimatedNav key="plugins">
                      {pluginLinks.map((plugin) => (
                        <div key={plugin.pluginName}>
                          <Divider
                            className="mb-2"
                            label={plugin.pluginName}
                          />
                          <div className="flex flex-1 flex-col gap-1">
                            {plugin.paths.map((path) => (
                              <SidebarAnimatedItem key={path.fullPath}>
                                <SidebarItem
                                  handleTogglePin={() =>
                                    handleTogglePin({
                                      isPinned: isPinned(path.fullPath),
                                      path: path.fullPath,
                                      slug: path.metaTitle,
                                    })
                                  }
                                  isLoading={mutationFn.isBusy}
                                  item={{
                                    isPinned: isPinned(path.fullPath),
                                    path: path.fullPath,
                                    slug: path.metaTitle,
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
                            handleTogglePin={handleTogglePin}
                            isLoading={mutationFn.isBusy}
                            item={p}
                          />
                        </SidebarAnimatedItem>
                      ))}
                    </SidebarAnimatedNav>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-auto flex flex-col gap-4 pt-4">
                <Divider
                  label="More of DockStat"
                  variant="dashed"
                />

                <div className="flex flex-col gap-3">
                  <LinkWithIcon
                    external
                    href="https://github.com/its4nik/dockstat"
                    icon={<SiGithub size={18} />}
                    iconPosition="left"
                  >
                    Visit Github
                  </LinkWithIcon>

                  <LinkWithIcon
                    external
                    href="https://dockstat.itsnik.de"
                    icon={<BookMarkedIcon size={18} />}
                    iconPosition="left"
                  >
                    Technical Documentation
                  </LinkWithIcon>

                  <LinkWithIcon
                    external
                    href="https://www.npmjs.com/search?q=%40dockstat"
                    icon={<SiNpm size={18} />}
                    iconPosition="left"
                  >
                    @dockstat packages
                  </LinkWithIcon>
                </div>

                <Divider variant="dashed" />

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => setLogModalOpen(!logModalOpen)}
                    variant="outline"
                  >
                    <Terminal size={18} />
                  </Button>

                  <Button
                    className="flex-1"
                    onClick={() => {
                      setThemeModalOpen(true)
                    }}
                    variant="outline"
                  >
                    <Palette size={18} />
                  </Button>

                  <Button
                    className="flex-1"
                    onClick={() => setIsThemeSidebarOpen(true)}
                    variant="outline"
                  >
                    <Paintbrush size={18} />
                  </Button>
                </div>
              </div>
              <Modal
                onClose={() => setLogModalOpen(false)}
                open={logModalOpen}
                size="full"
                title={`${logEntries.length} Logs available`}
                transparent
              >
                <Table
                  columns={[
                    {
                      align: "center",
                      key: "name",
                      render: (loggerName) =>
                        loggerName && <Badge rounded>{String(loggerName)}</Badge>,
                      title: "Logger Name",
                    },
                    {
                      align: "center",
                      key: "level",
                      render: (level) =>
                        level && (
                          <span
                            className={`${level === "info" ? "text-accent" : level === "debug" ? "text-muted-text" : level === "error" ? "text-error" : "text-orange-400"}`}
                          >
                            {String(level)}
                          </span>
                        ),
                      title: "Level",
                    },
                    { key: "message", title: "Log Message" },
                    {
                      align: "center",
                      key: "requestId",
                      render: (reqId) => reqId && <Badge unique>{String(reqId)}</Badge>,
                      title: "RequestID",
                    },
                    { align: "center", key: "caller", title: "Caller" },
                    { key: "parents", title: "Parents" },
                    {
                      key: "timestamp",
                      render: (date) => <span>{formatDate(date as Date, "log")}</span>,
                      title: "Timestamp",
                    },
                  ]}
                  data={logEntries}
                  hoverable
                  searchable
                  striped
                />
              </Modal>

              <Modal
                onClose={() => setThemeModalOpen(false)}
                open={themeModalOpen}
                size="xl"
                title="Theme Browser"
                transparent
              >
                <ThemeBrowser
                  currentThemeId={currentThemeId}
                  deleteTheme={deleteTheme}
                  onSelectTheme={async (theme) => await onSelectTheme(theme)}
                  themes={themes}
                  toastSuccess={toastSuccess}
                />
              </Modal>

              {/* ThemeSidebar is now rendered globally in layout.tsx */}
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
