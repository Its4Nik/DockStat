"use client"

import { Button, Card } from "@dockstat/ui"
import { motion } from "framer-motion"
import { type ReactNode, useState } from "react"
import { toast as sonnerToast } from "sonner"

export function toast(toast: Omit<ToastProps, "id">) {
  return sonnerToast.custom((id) => (
    <Toast
      id={id}
      title={toast.title}
      description={toast.description}
      button={toast.button}
      variant={toast.variant}
    />
  ))
}

interface ToastProps {
  id: string | number
  title: string | ReactNode
  description: string | ReactNode
  variant?: "error" | "success"
  button?: {
    label: string
    onClick: () => void
  }
}

function Toast(props: ToastProps) {
  const { title, description, button, id, variant } = props
  const [isHovered, setIsHovered] = useState(false)

  const cardVariant = variant === "error" ? "error" : variant === "success" ? "success" : "outlined"

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative"
      style={{ zIndex: isHovered ? 50 : 1 }}
    >
      <Card variant={cardVariant} size="sm">
        <div className="flex items-start gap-4">
          <motion.div
            className="min-w-0 flex-1"
            initial={false}
            animate={{
              maxHeight: isHovered ? 1000 : 60,
            }}
            transition={{
              duration: 0.4,
              ease: [0.4, 0, 0.2, 1],
            }}
            style={{ overflow: "hidden" }}
          >
            <p
              className="text-sm font-semibold leading-5 text-primary-text"
              title={typeof title === "string" ? title : undefined}
            >
              {title}
            </p>

            <p
              className="mt-1 text-sm leading-5 text-muted-text"
              title={typeof description === "string" ? description : undefined}
            >
              {description}
            </p>
          </motion.div>

          <div className="my-auto shrink-0">
            <Button
              variant={cardVariant === "error" ? "danger" : "outline"}
              className="rounded-md px-3 py-1.5 text-sm font-semibold leading-5 shadow-sm transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
              onClick={() => {
                button?.onClick()
                sonnerToast.dismiss(id)
              }}
            >
              {button?.label || "Dismiss"}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
