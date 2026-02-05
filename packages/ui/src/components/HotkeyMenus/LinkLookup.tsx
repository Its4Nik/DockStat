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
  hotkey = "k",
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
        type: "pin",
        path: pin.path,
        title: pin.slug,
      })
    })

    // Plugins
    pluginLinks.forEach((plugin, pluginIndex) => {
      plugin.paths.forEach((pathItem, pathIndex) => {
        upsert({
          id: `plugin-${pluginIndex}-${pathIndex}`,
          type: "plugin",
          path: pathItem.fullPath,
          title: pathItem.metaTitle,
          pluginName: plugin.pluginName,
          metaTitle: pathItem.metaTitle,
        })
      })
    })

    // Sidebar (recursive)
    const processSidebarItem = (item: PathItem) => {
      upsert({
        id: `sidebar-${index++}`,
        type: "sidebar",
        path: item.path,
        title: item.slug,
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
    open: () => {
      setModalOpen(true)

      setTimeout(() => {
        document.querySelector<HTMLInputElement>("#search-input")?.focus()
      }, 100)
    },
    close: () => setModalOpen(false),
    openKey: hotkey,
    closeKey: "Escape",
    isOpen: modalOpen,
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
      open={modalOpen}
      title="Search Links"
      size="full"
      onClose={() => {
        setModalOpen(false)
        setSearchQuery("")
      }}
    >
      <div>
        <Input
          variant="underline"
          placeholder="Search for any Page"
          value={searchQuery}
          onChange={setSearchQuery}
          className="text-lg"
          autoFocus
        />
        <motion.div
          className="mt-2 text-sm text-gray-400"
          key={filteredResults.length}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {filteredResults.length} {filteredResults.length === 1 ? "result" : "results"} found
        </motion.div>
      </div>

      <div className="max-h-96 overflow-y-auto p-2">
        <AnimatePresence mode="popLayout">
          {filteredResults.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-wrap gap-2"
            >
              {filteredResults.map((result, index) => (
                <motion.div
                  key={result.id}
                  layout
                  layoutId={result.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  whileHover="hover"
                  whileTap="tap"
                  className="flex-1"
                  tabIndex={-1}
                >
                  <Card
                    tabIndex={0}
                    variant="outlined"
                    className="cursor-pointer w-full transition-colors min-w-40"
                    size="sm"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-2">
                        <div className="flex justify-between gap-2 mb-1">
                          <Badge
                            rounded
                            outlined={result.type === "sidebar"}
                            variant={
                              result.type === "pin"
                                ? "primary"
                                : result.type === "plugin"
                                  ? "secondary"
                                  : "primary"
                            }
                          >
                            {result.type === "pin" ? (
                              <HoverBubble label="A pinned link" position="bottom" className="w-40">
                                <Pin size={15} />
                              </HoverBubble>
                            ) : result.type === "plugin" ? (
                              <HoverBubble
                                label="A link extracted out of a plugin bundle"
                                position="bottom"
                                className="w-40"
                              >
                                <Puzzle size={15} />
                              </HoverBubble>
                            ) : (
                              <HoverBubble
                                label="A default page of DockStat"
                                position="bottom"
                                className="w-40"
                              >
                                <Link size={15} />
                              </HoverBubble>
                            )}
                          </Badge>
                          {result.pluginName && (
                            <Badge size="sm" variant="secondary">
                              {result.pluginName}
                            </Badge>
                          )}
                          <Badge size="sm" variant="secondary">
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
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="text-center py-12"
            >
              <div className="text-gray-400 mb-2">No results found</div>
              <p className="text-sm text-gray-500">Try searching with different keywords</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-gray-500"
            >
              Start typing to search...
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  )
}
