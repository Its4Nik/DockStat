import type { LogEntry } from "@dockstat/logger"
import type { UpdateResult } from "@dockstat/sqlite-wrapper"
import { formatDate } from "@dockstat/utils"
import { SiGithub, SiNpm } from "@icons-pack/react-simple-icons"
import type { UseMutationResult } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import { BookMarkedIcon, LoaderPinwheel, Pin, X } from "lucide-react"
import { useMemo, useState } from "react"
import { NavLink } from "react-router"
import { Button } from "../Button/Button"
import { Card } from "../Card/Card"
import { Divider } from "../Divider/Divider"
import { LinkWithIcon } from "../Link/Link"
import { Modal } from "../Modal/Modal"
import { Table } from "../Table/Table"
import { backdropVariants, busyVariants, slideInVariants } from "./animations"
import DockStatLogo from "./DockStat2-06.png"

type pinLinkMutation = UseMutationResult<
  UpdateResult,
  Error,
  {
    slug: string
    path: string
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
  mutationFn: { pin: pinLinkMutation; unpin: pinLinkMutation }
  pins: { path: string; slug: string }[]
}

type SidebarItemProps = {
  item: PathItem
  depth?: number
  mutationFn: { pin: pinLinkMutation; unpin: pinLinkMutation }
}

const SidebarItem = ({ item, depth = 0, mutationFn }: SidebarItemProps) => {
  const handleTogglePin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const payload = {
      slug: String(form.get("slug")),
      path: String(form.get("path")),
    }

    if (item.isPinned) {
      console.log("Unpinning item:", { pinned: item.isPinned, payload })
      mutationFn.unpin.mutate(payload)
    } else {
      console.log("Pinning item:", { pinned: item.isPinned, payload })
      mutationFn.pin.mutate(payload)
    }
  }

  const isLoading = mutationFn.pin.isPending || mutationFn.unpin.isPending

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between group pr-2">
        <NavLink
          to={item.path}
          className={({ isActive }) =>
            `flex-1 rounded-md py-1.5 text-sm font-medium transition-colors duration-200
            ${isActive ? "bg-main-bg text-foreground" : "text-muted-foreground hover:bg-main-bg/20"}`
          }
          style={{ paddingLeft: `${depth + 0.75}rem` }}
        >
          {item.slug}
        </NavLink>

        <form onSubmit={handleTogglePin} className="flex items-center">
          <input type="hidden" name="slug" value={item.slug} />
          <input type="hidden" name="path" value={item.path} />
          <button
            type="submit"
            disabled={isLoading}
            className="p-1.5 rounded-md text-muted-foreground hover:text-accent hover:bg-main-bg/20 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
            title={item.isPinned ? "Unpin" : "Pin"}
          >
            <Pin
              size={14}
              className={`transition-all ${item.isPinned ? "fill-accent text-accent" : ""}`}
            />
          </button>
        </form>
      </div>

      {item.children?.map((child) => (
        <SidebarItem key={child.slug} item={child} depth={depth + 1} mutationFn={mutationFn} />
      ))}
    </div>
  )
}

export function Sidebar({ isOpen, onClose, isBusy, logEntries, pins, mutationFn }: SidebarProps) {
  const [logModalOpen, setLogModalOpen] = useState<boolean>(false)

  const paths: PathItem[] = [
    { path: "/", slug: "Home", children: [{ path: "/settings", slug: "Settings" }] },
  ]

  // Memoize the pin checking logic to avoid creating new objects on every render
  const pathsWithPinStatus = useMemo(() => {
    const checkIsPinned = (path: string, slug: string): boolean => {
      return pins.some((pin) => pin.path === path && pin.slug === slug)
    }

    const addPinStatus = (item: PathItem): PathItem => ({
      ...item,
      isPinned: checkIsPinned(item.path, item.slug),
      children: item.children?.map(addPinStatus),
    })

    return paths.map(addPinStatus)
  }, [pins])

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

              <div className="py-4">
                <Divider />
              </div>

              <nav className="flex flex-1 flex-col gap-1">
                {pathsWithPinStatus?.map((p) => (
                  <SidebarItem key={p.slug} item={p} mutationFn={mutationFn} />
                ))}
              </nav>

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

                <AnimatePresence initial={false}>
                  {isBusy && (
                    <motion.div
                      variants={busyVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="overflow-hidden"
                    >
                      <Divider variant="dashed" />
                      <span className="mt-4 flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                        <LoaderPinwheel className="animate-spin text-accent" size={18} />
                        <p className="text-muted-text">API Request running...</p>
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
                <Divider variant="dashed" />
                <Button onClick={() => setLogModalOpen(!logModalOpen)}>View Backend Logs</Button>
                <Modal
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
                      { key: "name", title: "Logger Name" },
                      { key: "level", title: "Level" },
                      { key: "message", title: "Log Message" },
                      { key: "requestId", title: "RequestID" },
                      { key: "caller", title: "Caller" },
                      { key: "parents", title: "Parents" },
                      {
                        key: "timestamp",
                        title: "Timestamp",
                        render: (date) => <span>{formatDate(date as Date, "datetime")}</span>,
                      },
                    ]}
                    data={logEntries}
                  />
                </Modal>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
