import { Card } from "@dockstat/ui"
import { expandVariants, itemVariants } from "./consts"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown } from "lucide-react"

interface SectionProps {
  icon: React.ReactNode
  title: string
  description?: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
  badge?: React.ReactNode
}

export function Section({
  icon,
  title,
  description,
  isOpen,
  onToggle,
  children,
  badge,
}: SectionProps) {
  return (
    <motion.div variants={itemVariants}>
      <button type="button" onClick={onToggle} className="w-full group">
        <Card variant="outlined" hoverable size="sm" className="w-full transition-all duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted-text/20 text-accent transition-colors group-hover:bg-accent/25">
              {icon}
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-primary-text">{title}</span>
                {badge}
              </div>
              {description && (
                <p className="text-xs text-muted-text mt-0.5 truncate">{description}</p>
              )}
            </div>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="text-muted-text group-hover:text-secondary-text transition-colors"
            >
              <ChevronDown size={18} />
            </motion.div>
          </div>
        </Card>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            variants={expandVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="overflow-hidden"
          >
            <div className="pl-4 border-l-2 border-badge-primary-bg/30 ml-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
