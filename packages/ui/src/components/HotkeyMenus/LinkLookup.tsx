import { useHotkey } from "@dockstat/utils/react"
import { AnimatePresence, motion } from "framer-motion"
import { Link, Pin, Puzzle } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { Badge } from "../Badge/Badge"
import { Card } from "../Card/Card"
import { Divider } from "../Divider/Divider"
import { Input } from "../Forms/Input"
import { HoverBubble } from "../HoverBubble/HoverBubble"
import { Modal } from "../Modal/Modal"
import { type PathItem, SidebarPaths } from "../Navbar/consts"
import { containerVariants, itemVariants } from "./animations"

export function LinkLookup({
  pins,
  pluginLinks,
  sidebarLinks = SidebarPaths,
  hotkey,
}: {
  pins: { path: string; slug: string }[]
  pluginLinks: {
    pluginName: string
    paths: { fullPath: string; metaTitle: string }[]
  }[]
  sidebarLinks?: typeof SidebarPaths
  hotkey?: string
}) {
  const navigate = useNavigate()

  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>("")

  interface SearchResult {
    id: string
    type: "pin" | "plugin" | "sidebar"
    path: string
    title: string
    pluginName?: string
    metaTitle?: string
  }

  const RESULT_PRIORITY: Record<SearchResult["type"], number> = {
    pin: 3,
    plugin: 2,
    sidebar: 1,
  }

  // Process all data into searchable results
  const allResults = useMemo<SearchResult[]>(() => {
    const map = new Map<string, SearchResult>()
    let index = 0

    const upsert = (result: SearchResult) => {
      const existing = map.get(result.path)

      if (!existing || RESULT_PRIORITY[result.type] > RESULT_PRIORITY[existing.type]) {
        map.set(result.path, result)
      }
    }

    // Pins
    pins.forEach((pin, pinIndex) => {
      upsert({
        id: `pin-${pinIndex}`,
        path: pin.path,
        title: pin.slug,
        type: "pin",
      })
    })

    // Plugins
    pluginLinks.forEach((plugin, pluginIndex) => {
      plugin.paths.forEach((pathItem, pathIndex) => {
        upsert({
          id: `plugin-${pluginIndex}-${pathIndex}`,
          metaTitle: pathItem.metaTitle,
          path: pathItem.fullPath,
          pluginName: plugin.pluginName,
          title: pathItem.metaTitle,
          type: "plugin",
        })
      })
    })

    // Sidebar (recursive)
    const processSidebarItem = (item: PathItem) => {
      upsert({
        id: `sidebar-${index++}`,
        path: item.path,
        title: item.slug,
        type: "sidebar",
      })

      item.children?.forEach(processSidebarItem)
    }

    sidebarLinks.forEach(processSidebarItem)

    return Array.from(map.values())
  }, [pins, pluginLinks, sidebarLinks])

  const filteredResults = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return allResults

    return allResults.filter(
      (result) =>
        result.title.toLowerCase().includes(query) ||
        result.path.toLowerCase().includes(query) ||
        (result.pluginName ?? "").toLowerCase().includes(query)
    )
  }, [searchQuery, allResults])

  useHotkey({
    close: () => setModalOpen(false),
    closeKey: "Escape",
    isOpen: modalOpen,
    open: () => {
      setModalOpen(true)

      setTimeout(() => {
        document.querySelector<HTMLInputElement>("#search-input")?.focus()
      }, 100)
    },
    openKey: hotkey,
    requireModifier: true,
  })

  const handleResultClick = useCallback(
    (result: SearchResult) => {
      navigate(result.path)
      setModalOpen(false)
      setSearchQuery("")
    },
    [navigate]
  )

  return (
    <Modal
      onClose={() => {
        setModalOpen(false)
        setSearchQuery("")
      }}
      open={modalOpen}
      size="full"
      title="Search Links"
    >
      <div>
        <Input
          autoFocus
          className="text-lg"
          onChange={setSearchQuery}
          placeholder="Search for any Page"
          value={searchQuery}
          variant="underline"
        />
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-secondary-text"
          initial={{ opacity: 0, y: -5 }}
          key={filteredResults.length}
          transition={{ duration: 0.2 }}
        >
          {filteredResults.length} {filteredResults.length === 1 ? "result" : "results"} found
        </motion.div>
      </div>

      <div className="max-h-96 overflow-y-auto p-2">
        <AnimatePresence mode="popLayout">
          {filteredResults.length > 0 ? (
            <motion.div
              animate="visible"
              className="flex flex-wrap gap-2"
              initial="hidden"
              variants={containerVariants}
            >
              {filteredResults.map((result, index) => (
                <motion.div
                  animate="visible"
                  className="flex-1"
                  exit="exit"
                  initial="hidden"
                  key={result.id}
                  layout
                  layoutId={result.id}
                  tabIndex={-1}
                  variants={itemVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Card
                    className="cursor-pointer w-full transition-colors min-w-40"
                    onClick={() => handleResultClick(result)}
                    size="sm"
                    tabIndex={0}
                    variant="outlined"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-2">
                        <div className="flex justify-between gap-2 mb-1">
                          <Badge
                            outlined={result.type === "sidebar"}
                            rounded
                            variant={
                              result.type === "pin"
                                ? "primary"
                                : result.type === "plugin"
                                  ? "secondary"
                                  : "primary"
                            }
                          >
                            {result.type === "pin" ? (
                              <HoverBubble
                                className="w-40"
                                label="A pinned link"
                                position="bottom"
                              >
                                <Pin size={15} />
                              </HoverBubble>
                            ) : result.type === "plugin" ? (
                              <HoverBubble
                                className="w-40"
                                label="A link extracted out of a plugin bundle"
                                position="bottom"
                              >
                                <Puzzle size={15} />
                              </HoverBubble>
                            ) : (
                              <HoverBubble
                                className="w-40"
                                label="A default page of DockStat"
                                position="bottom"
                              >
                                <Link size={15} />
                              </HoverBubble>
                            )}
                          </Badge>
                          {result.pluginName && (
                            <Badge
                              size="sm"
                              variant="secondary"
                            >
                              {result.pluginName}
                            </Badge>
                          )}
                          <Badge
                            size="sm"
                            variant="secondary"
                          >
                            {index + 1}
                          </Badge>
                        </div>
                        <Divider />
                        <h3 className="font-medium text-primary-text">{result.title}</h3>
                        <p className="text-sm text-muted-text">{result.path}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : searchQuery ? (
            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="text-center py-12"
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ damping: 25, stiffness: 300, type: "spring" }}
            >
              <div className="text-primary-text mb-2">No results found</div>
              <p className="text-sm text-muted-text">Try searching with different keywords</p>
            </motion.div>
          ) : (
            <motion.div
              animate={{ opacity: 1 }}
              className="text-center py-8 text-primary-text"
              initial={{ opacity: 0 }}
            >
              Start typing to search...
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  )
}
