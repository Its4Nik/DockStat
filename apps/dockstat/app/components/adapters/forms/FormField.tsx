import { motion } from "framer-motion"
import { HoverBubble } from "@dockstat/ui"
import { Info } from "lucide-react"
import { itemVariants } from "./consts"

interface FormFieldProps {
  label: string
  tooltip: string
  children: React.ReactNode
  htmlFor?: string
  required?: boolean
}

export function FormField({ label, tooltip, children, htmlFor, required }: FormFieldProps) {
  return (
    <motion.div variants={itemVariants} className="space-y-2">
      <div className="flex items-center gap-2">
        <label htmlFor={htmlFor} className="text-sm font-medium text-secondary-text">
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </label>
        <HoverBubble label={tooltip} position="right">
          <Info
            size={14}
            className="text-muted-text hover:text-secondary-text cursor-help transition-colors"
          />
        </HoverBubble>
      </div>
      {children}
    </motion.div>
  )
}
