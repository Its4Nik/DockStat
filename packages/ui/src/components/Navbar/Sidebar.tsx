import { SiGithub, SiNpm } from "@icons-pack/react-simple-icons"
import { AnimatePresence, motion } from "framer-motion"
import { BookMarkedIcon, LoaderPinwheel, X } from "lucide-react"
import { NavLink } from "react-router"

import { Button } from "../Button/Button"
import { Card } from "../Card/Card"
import { Divider } from "../Divider/Divider"
import { LinkWithIcon } from "../Link/Link"

import { backdropVariants, busyVariants, slideInVariants } from "./animations"
import DockStatLogo from "./DockStat2-06.png"
import type { LogEntry } from "@dockstat/logger"
import { Modal } from "../Modal/Modal"
import { useState } from "react"
import { Table } from "../Table/Table"
import { formatDate } from "@dockstat/utils"

type PathItem = {
  slug: string
  path: string
  children?: PathItem[]
}

type SidebarProps = {
  isOpen: boolean
  onClose: () => void
  isBusy: boolean
  logEntries: LogEntry[]
  paths?: PathItem[]
}

const SidebarItem = ({ item, depth = 0 }: { item: PathItem; depth?: number }) => (
  <div className="flex flex-col gap-1">
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex w-full items-center rounded-md py-1 pr-3 text-sm font-medium transition-colors duration-200
        ${isActive ? "bg-main-bg" : "hover:bg-main-bg/20"}`
      }
      style={{ paddingLeft: `${depth + 0.75}rem` }}
    >
      {item.slug}
    </NavLink>
    {item.children?.map((child) => (
      <SidebarItem key={child.slug} item={child} depth={depth + 1} />
    ))}
  </div>
)

export function Sidebar({
  isOpen,
  onClose,
  isBusy,
  logEntries,
  paths = [{ path: "/", slug: "Home", children: [{ path: "/settings", slug: "Settings" }] }],
}: SidebarProps) {
  const [logModalOpen, setLogModalOpen] = useState<boolean>(false)

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
                {paths?.map((p) => (
                  <SidebarItem key={p.slug} item={p} />
                ))}
              </nav>

              <div className="mt-auto flex flex-col gap-4 pt-4">
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
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
