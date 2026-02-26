import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "../Button/Button"
import { Card } from "../Card/Card"
import { Input } from "../Forms/Input"
import { backdropVariants, reverseSlideInVariants } from "../Navbar/animations"
import { ThemeEditor } from "../ThemeEditor/ThemeEditor"
import { getAllComponents, getComponentColors } from "./data/componentColors"

export type ThemeSidebarProps = {
  isOpen: boolean
  onClose: () => void
  onColorChange: (color: string, colorName: string) => void
  allColors: { color: string; colorName: string }[]
  currentTheme: string
}

export function ThemeSidebar({
  isOpen,
  onClose,
  onColorChange,
  allColors,
  currentTheme,
}: ThemeSidebarProps) {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, onClose])

  const components = getAllComponents()
  const filteredComponents = components.filter((component) =>
    component.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getColorsForSelectedComponent = () => {
    if (!selectedComponent) return allColors

    const componentColors = getComponentColors(selectedComponent)
    return componentColors.map((cc) => {
      const colorObj = allColors.find((c) => c.colorName === cc.colorName)
      return (
        colorObj || {
          color: "#000000",
          colorName: cc.colorName,
          displayName: cc.displayName,
        }
      )
    })
  }

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
            className="fixed right-0 top-0 z-50 h-full w-80 overflow-y-auto p-4"
            variants={reverseSlideInVariants}
            initial="closed"
            animate="open"
            exit="closed"
          >
            <Card className="flex h-full flex-col shadow-xl">
              <div className="flex items-center justify-between p-1">
                <p className="text-lg font-bold tracking-tight">Theme Editor</p>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
                  <X size={16} />
                </Button>
              </div>

              <div className="mt-2">
                <Input
                  placeholder="Search components..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e)}
                  className="w-full"
                />
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  size="xs"
                  variant={!selectedComponent ? "primary" : "outline"}
                  onClick={() => setSelectedComponent(null)}
                  noFocusRing
                >
                  All Colors
                </Button>
                {filteredComponents.map((component) => (
                  <Button
                    key={component}
                    noFocusRing
                    size="xs"
                    variant={selectedComponent === component ? "primary" : "outline"}
                    onClick={() => setSelectedComponent(component)}
                  >
                    {component}
                  </Button>
                ))}
              </div>

              <div className="mt-4 flex-1 overflow-y-auto">
                <ThemeEditor
                  currentTheme={currentTheme}
                  onColorChange={onColorChange}
                  allColors={getColorsForSelectedComponent()}
                />
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
