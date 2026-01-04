import type { LogEntry } from "@dockstat/logger"
import type { UpdateResult } from "@dockstat/sqlite-wrapper"
import { formatDate } from "@dockstat/utils"
import { SiGithub, SiNpm } from "@icons-pack/react-simple-icons"
import type { UseMutationResult } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import { BookMarkedIcon, LoaderPinwheel, X } from "lucide-react"
import { useState } from "react"

import { Button } from "../Button/Button"
import { Card } from "../Card/Card"
import { Divider } from "../Divider/Divider"
import { LinkWithIcon } from "../Link/Link"
import { Modal } from "../Modal/Modal"
import { Table } from "../Table/Table"
import { backdropVariants, busyVariants, slideInVariants } from "./animations"
import DockStatLogo from "./DockStat2-06.png"
import { SidebarItem } from "./SidebarItem"
import { usePinnedPaths } from "./usePinnedPaths"
import { Badge } from "../Badge/Badge"

type PinLinkMutation = UseMutationResult<
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
  mutationFn: { pin: PinLinkMutation; unpin: PinLinkMutation }
  pins: { path: string; slug: string }[]
}

export function Sidebar({ isOpen, onClose, isBusy, logEntries, pins, mutationFn }: SidebarProps) {
  const [logModalOpen, setLogModalOpen] = useState<boolean>(false)

  const handleTogglePin = (item: PathItem) => {
    const payload = { slug: item.slug, path: item.path }
    if (item.isPinned) {
      mutationFn.unpin.mutate(payload)
    } else {
      mutationFn.pin.mutate(payload)
    }
  }

  const paths: PathItem[] = [
    {
      path: "/",
      slug: "Home",
      children: [{ path: "/settings", slug: "Settings" }],
    },
    {
      path: "/clients",
      slug: "Clients",
    },
  ]

  const pathsWithPinStatus = usePinnedPaths(paths, pins)

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
                  <SidebarItem
                    key={p.slug}
                    item={p}
                    handleTogglePin={handleTogglePin}
                    isLoading={mutationFn.pin.isPending || mutationFn.unpin.isPending}
                  />
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
                      {
                        key: "requestId",
                        title: "RequestID",
                        render: (reqId) => reqId && <Badge unique>{String(reqId)}</Badge>,
                      },
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
