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
      <Modal
        onClose={() => setShowSaveModal(false)}
        open={showSaveModal}
        transparent
      >
        <div className="flex flex-col items-center justify-center space-y-4 p-4">
          <Input
            className="w-full"
            onChange={(value) => setNewThemeName(value)}
            placeholder="Theme Name"
            type="text"
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
              animate="open"
              className="fixed inset-0 z-40"
              exit="closed"
              initial="closed"
              onClick={onClose}
              transition={{ duration: 0.2 }}
              variants={backdropVariants}
            />
            <motion.div
              animate="open"
              className="fixed right-0 top-0 z-50 h-full w-90 overflow-y-auto p-4"
              exit="closed"
              initial="closed"
              variants={reverseSlideInVariants}
            >
              <Card className="flex h-full flex-col shadow-xl">
                <div className="flex items-center justify-between p-1">
                  <p className="text-lg font-bold tracking-tight">Theme Editor</p>
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
                  <Input
                    className="w-full"
                    onChange={(e) => setSearchTerm(e)}
                    placeholder="Search components..."
                    value={searchTerm}
                  />
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    noFocusRing
                    onClick={() => setSelectedComponent(null)}
                    size="xs"
                    variant={!selectedComponent ? "primary" : "outline"}
                  >
                    All Colors
                  </Button>
                  {filteredComponents.map((component) => (
                    <Button
                      key={component}
                      noFocusRing
                      onClick={() => setSelectedComponent(component)}
                      size="xs"
                      variant={selectedComponent === component ? "primary" : "outline"}
                    >
                      {component}
                    </Button>
                  ))}
                </div>

                {isModified === true ? (
                  <div className="mt-2">
                    <Button
                      fullWidth
                      onClick={() => {
                        setShowSaveModal(true)
                      }}
                      size="sm"
                      variant="primary"
                    >
                      Save new theme
                    </Button>
                  </div>
                ) : null}

                <div className="mt-4 flex-1 overflow-y-auto">
                  <ThemeEditor
                    allColors={getColorsForComponent}
                    currentTheme={currentTheme}
                    onColorChange={(color, colorName) => {
                      setIsModified(true)
                      onColorChange(color, colorName)
                    }}
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
