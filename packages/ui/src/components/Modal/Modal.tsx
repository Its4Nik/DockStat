import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Button } from "../Button/Button"
import { Card, CardBody, CardFooter, CardHeader } from "../Card/Card"

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full"

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  footer?: string | React.ReactNode
  children?: React.ReactNode
  bodyClasses?: string
  size?: ModalSize
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
  if (!open) return null

  return createPortal(
    <button
      type="button"
      className="fixed inset-0 z-50 flex items-center justify-center bg-modal-bg/50"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => e.stopPropagation()}
        className={`${sizeClasses[size]} w-full px-4`}
        // optional: tabIndex to allow focus on the dialog container
        tabIndex={-1}
      >
        <Card className="shadow-lg" onClick={(e) => e.stopPropagation()}>
          {title && <CardHeader>{title}</CardHeader>}

          <CardBody>{children}</CardBody>

          <CardFooter className="flex justify-between items-center">
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
      </button>
    </button>,
    elRef.current
  )
}
