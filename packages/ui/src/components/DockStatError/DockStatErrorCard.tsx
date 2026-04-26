import { cn } from "@sglara/cn"
import { motion } from "framer-motion"
import { AlertTriangle, ArrowLeft, FileX, SearchX } from "lucide-react"
import type { ReactNode } from "react"
import { useNavigate } from "react-router"
import { Button, type ButtonProps } from "../Button/Button"
import { Card } from "../Card/Card"

/**
 * Structured detail for a single error field.
 * Mirrors DockStatErrorDetail from @dockstat/utils without importing it directly.
 */
export interface DockStatErrorDetail {
  field?: string
  message: string
  value?: unknown
  expected?: string
}

export interface DockStatErrorCardProps {
  /** Machine-readable error code (e.g. "NOT_FOUND", "VALIDATION") */
  code?: string
  /** Human-readable error description */
  description: string
  /** Structured field-level error details */
  details?: DockStatErrorDetail[]
  /** Icon variant or custom ReactNode */
  icon?: "alert" | "search" | "file" | ReactNode
  /** Whether to show the "Go Home" button */
  showHomeButton?: boolean
  /** The request ID for tracking */
  reqId?: string
  /** HTTP status code */
  status?: number
  /** Custom subtitle rendered below the title */
  subtitle?: string
  /** Custom title override (defaults to "Error {status}" or "Something went wrong") */
  title?: string
  /** Additional className on the outer wrapper */
  className?: string
  /** Optional action button */
  action?: {
    label: string
    onClick: () => void
    variant?: ButtonProps["variant"]
  }
}

const cardVariants = {
  animate: { opacity: 1, transition: { duration: 0.3 }, y: 0 },
  initial: { opacity: 0, y: 10 },
}

const iconMap: Record<string, ReactNode> = {
  alert: <AlertTriangle className="h-8 w-8 text-error" />,
  file: <FileX className="h-8 w-8 text-error" />,
  search: <SearchX className="h-8 w-8 text-error" />,
}

export function DockStatErrorCard({
  code,
  description,
  details,
  icon = "alert",
  showHomeButton = false,
  reqId,
  status,
  subtitle,
  title,
  className,
  action,
}: DockStatErrorCardProps) {
  const navigate = useNavigate()

  const displayTitle = title ?? (status ? `Error ${status}` : "Something went wrong")
  const displaySubtitle = subtitle ?? (code ? code.replace(/_/g, " ").toLowerCase() : undefined)
  const iconNode = typeof icon === "string" ? (iconMap[icon] ?? iconMap.alert) : icon

  return (
    <motion.div
      animate="animate"
      className={cn("w-full max-w-md mx-auto mt-12", className)}
      initial="initial"
      variants={cardVariants}
    >
      <Card
        size="md"
        variant="elevated"
      >
        <div className="flex flex-col items-center gap-6 p-8">
          {/* Icon */}
          <div className="p-4 rounded-full bg-error/10">{iconNode}</div>

          {/* Title, subtitle & description */}
          <div className="text-center space-y-2">
            <h1 className="text-xl font-bold text-primary-text">{displayTitle}</h1>
            {displaySubtitle && (
              <p className="text-xs font-mono uppercase tracking-wider text-muted-text">
                {displaySubtitle}
              </p>
            )}
            <p className="text-secondary-text">{description}</p>
          </div>

          {/* Structured field-level details */}
          {details && details.length > 0 && (
            <div className="w-full bg-muted/50 rounded-lg p-4 space-y-1">
              {details.map((d, i) => (
                <div
                  className="flex justify-between text-xs font-mono text-secondary-text/70 py-1 border-b border-border/50 last:border-0"
                  key={d.field ?? i}
                >
                  <span className="text-secondary-text">
                    {d.field ? `${d.field}: ` : ""}
                    {d.message}
                  </span>
                  {d.expected && (
                    <span className="text-muted-text ml-2 shrink-0">expected: {d.expected}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Meta info (reqId, status) */}
          {(reqId || status) && !details?.length && (
            <div className="w-full bg-muted/50 rounded-lg p-3 space-y-1">
              {status && (
                <div className="flex justify-between text-xs font-mono text-secondary-text/70 py-0.5">
                  <span>Status:</span>
                  <span className="text-secondary-text">{status}</span>
                </div>
              )}
              {reqId && (
                <div className="flex justify-between text-xs font-mono text-secondary-text/70 py-0.5">
                  <span>Request ID:</span>
                  <span className="text-secondary-text font-semibold">{reqId}</span>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          {(showHomeButton || action) && (
            <div className="flex gap-3">
              {showHomeButton && (
                <button
                  className="flex items-center gap-2 px-4 py-2.5 bg-accent-primary text-white text-sm font-medium rounded-lg hover:bg-accent-primary/90 transition-all active:scale-95"
                  onClick={() => navigate("/")}
                  type="button"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Go Home
                </button>
              )}
              {action && (
                <Button
                  onClick={action.onClick}
                  variant={action.variant ?? "secondary"}
                >
                  {action.label}
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
