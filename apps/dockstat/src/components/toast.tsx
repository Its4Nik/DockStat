"use client"

import { Button, Card } from "@dockstat/ui"
import { motion } from "framer-motion"
import { X } from "lucide-react"
import { type ReactNode, useState } from "react"
import { toast as sonnerToast } from "sonner"

export interface ToastProps {
  id: string | number
  title: string | ReactNode
  description: string | ReactNode
  variant?: "error" | "success"
  button?: {
    label: string
    onClick: () => void
  }
}

export function Toast(props: ToastProps) {
  const { title, description, button, id, variant } = props
  const [isHovered, setIsHovered] = useState(false)

  const cardVariant = variant === "error" ? "error" : variant === "success" ? "success" : "outlined"

  return (
    <motion.div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ zIndex: isHovered ? 50 : 1 }}
    >
      <Card
        size="sm"
        variant={cardVariant}
      >
        <div className="flex items-start gap-4">
          <motion.div
            animate={{
              maxHeight: isHovered ? 1000 : 60,
            }}
            className="min-w-0 flex-1"
            initial={false}
            style={{ overflow: "hidden" }}
            transition={{
              duration: 0.4,
              ease: [0.4, 0, 0.2, 1],
            }}
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
              noFocusRing
              onClick={() => {
                button?.onClick()
                sonnerToast.dismiss(id)
              }}
              size="xs"
              variant={cardVariant === "error" ? "danger" : "secondary"}
            >
              {button?.label || <X size={10} />}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
