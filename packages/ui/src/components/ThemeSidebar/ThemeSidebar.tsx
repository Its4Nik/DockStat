import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "../Button/Button"
import { Card } from "../Card/Card"
import { Input } from "../Forms/Input"
import { Modal } from "../Modal/Modal"
import { backdropVariants, reverseSlideInVariants } from "../Navbar/animations"
import { ThemeEditor } from "../ThemeEditor/ThemeEditor"
import { getAllComponents, getComponentColors } from "./data/componentColors"

export type ThemeSidebarProps = {
  isOpen: boolean
  onClose: () => void
  onColorChange: (color: string, colorName: string) => void
  allColors: { color: string; colorName: string }[]
  currentTheme: string
  currentThemeValues: { vars: Record<string, string>; animations: Record<string, string> }
  saveNewTheme: (
    name: string,
    animations: Record<string, unknown>,
    variables: Record<string, string>
  ) => Promise<void>
}

export function ThemeSidebar({
  isOpen,
  onClose,
  onColorChange,
  allColors,
  currentTheme,
  saveNewTheme,
  currentThemeValues,
}: ThemeSidebarProps) {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [isModified, setIsModified] = useState<boolean>(false)
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false)
  const [newThemeName, setNewThemeName] = useState<string>("")

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

  const getColorsForComponent = getColorsForSelectedComponent()

  return (
    <>
      <Modal onClose={() => setShowSaveModal(false)} open={showSaveModal} transparent>
        <div className="flex flex-col items-center justify-center space-y-4 p-4">
          <Input
            type="text"
            placeholder="Theme Name"
            className="w-full"
            onChange={(value) => setNewThemeName(value)}
          />
          <Button
            onClick={async () => {
              await saveNewTheme(
                newThemeName,
                currentThemeValues.animations,
                currentThemeValues.vars
              )
              setShowSaveModal(false)
            }}
          >
            Save
          </Button>
        </div>
      </Modal>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              variants={backdropVariants}
              initial="closed"
              animate="open"
              exit="closed"
              transition={{ duration: 0.2 }}
              onClick={onClose}
            />
            <motion.div
              className="fixed right-0 top-0 z-50 h-full w-90 overflow-y-auto p-4"
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

                {isModified === true ? (
                  <div className="mt-2">
                    <Button
                      variant="primary"
                      fullWidth
                      size="sm"
                      onClick={() => {
                        setShowSaveModal(true)
                      }}
                    >
                      Save new theme
                    </Button>
                  </div>
                ) : null}

                <div className="mt-4 flex-1 overflow-y-auto">
                  <ThemeEditor
                    currentTheme={currentTheme}
                    onColorChange={(color, colorName) => {
                      setIsModified(true)
                      onColorChange(color, colorName)
                    }}
                    allColors={getColorsForComponent}
                  />
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
