import { AnimatePresence, motion, type Variants } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Button } from "../Button/Button"
import { Card, CardBody, CardFooter, CardHeader } from "../Card/Card"
import { backdropVariants, glassModalVariants, modalVariants } from "./variants"

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full"

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  footer?: string | React.ReactNode
  children?: React.ReactNode
  bodyClasses?: string
  size?: ModalSize
  transparent?: boolean
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
  full: "max-w-[90vw]",
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  footer,
  bodyClasses,
  transparent = false,
  size = "md",
}) => {
  // client-only portal container
  const elRef = useRef<HTMLDivElement | null>(null)
  const [mounted, setMounted] = useState(false)

  // create element (but only when document is available)
  if (typeof document !== "undefined" && !elRef.current) {
    elRef.current = document.createElement("div")
  }

  // append to body on mount and remove on unmount
  useEffect(() => {
    if (!elRef.current) return
    const el = elRef.current
    document.body.appendChild(el)
    setMounted(true)
    return () => {
      if (el.parentNode) el.parentNode.removeChild(el)
    }
  }, [])

  // prevent background scroll when modal open (client-only)
  useEffect(() => {
    if (!mounted) return
    const prev = document.body.style.overflow
    document.body.style.overflow = open ? "hidden" : prev
    return () => {
      document.body.style.overflow = prev
    }
  }, [open, mounted])

  // close on Escape
  useEffect(() => {
    if (!mounted || !open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, mounted, onClose])

  // don't render anything server-side or before portal is mounted
  if (!mounted || !elRef.current) return null

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleBackdropKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === "Escape") {
      onClose()
    }
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
          className="fixed inset-0 z-50 flex items-center justify-center bg-modal-bg/50 cursor-default"
          onClick={handleBackdropClick}
          onKeyDown={handleBackdropKeyDown}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          // transition={{ duration: 0.2 }}
        >
          <motion.div
            key="modal-content"
            className={`${sizeClasses[size]} w-full max-h-[90vh] mx-4 rounded-lg`}
            variants={transparent ? glassModalVariants : modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            style={{ willChange: "opacity, transform" }}
            //transition={{ duration: 0.2 }}
          >
            <Card
              glass={transparent || false}
              className={`w-full shadow-lg cursor-default flex flex-col max-h-[90vh] overflow-hidden`}
            >
              {title && <CardHeader className="shrink-0">{title}</CardHeader>}

              {/* Make the body scrollable and flexible. Consumers can pass extra body classes via `bodyClasses`. */}
              <CardBody className={`flex-1 overflow-y-auto min-h-0 ${bodyClasses ?? ""}`}>
                {children}
              </CardBody>

              <CardFooter className="flex justify-between items-center shrink-0">
                {typeof footer === "string" ? (
                  <>
                    <div>{footer}</div>
                    <Button onClick={onClose}>Close</Button>
                  </>
                ) : footer ? (
                  <>
                    {footer}
                    <Button onClick={onClose}>Close</Button>
                  </>
                ) : (
                  <div className="flex justify-end w-full">
                    <Button onClick={onClose}>Close</Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    elRef.current
  )
}
