// DockNodeCard.tsx
import { Badge, Button, Card, CardBody, CardFooter, LinkWithIcon } from "@dockstat/ui"
import {
  Activity,
  Clock,
  ExternalLink,
  Globe,
  Server,
  Shield,
  ShieldCheck,
  Trash2,
} from "lucide-react"
import { useState } from "react"

type Target = {
  id?: number
  host: string
  name: string
  timeout: number
  useSSL: boolean
  port: number
  isReachable: string
}

export function DockNodeCard({
  dn,
  deleteNode,
  isDisabled,
}: {
  dn: Target
  isDisabled: boolean
  deleteNode: (id: number) => Promise<void>
}) {
  const [isDeleting, setIsDeleting] = useState(false)

  const isOnline = dn.isReachable === "OK"

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsDeleting(true)
    try {
      await deleteNode(Number(dn.id))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card
      variant="elevated"
      className="group overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
    >
      <CardBody className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`rounded-lg p-2 ${isOnline ? "bg-success/15" : "bg-error/20"}`}>
              <Server className={`h-6 w-6 ${isOnline ? "text-success" : "text-error"}`} />
            </div>

            <div>
              <h3 className="text-lg font-semibold leading-tight">{dn.name}</h3>

              <div className="mt-1 flex items-center gap-2">
                <Badge size="sm" variant={isOnline ? "success" : "error"} className="gap-1">
                  <Activity className="h-3 w-3" />
                  {isOnline ? "Online" : "Offline"}
                </Badge>

                {dn.id && <span className="font-mono text-xs text-muted-text">#{dn.id}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <Globe className="h-4 w-4 text-muted-text" />
            <span className="text-secondary-text">Host</span>
            <span className="rounded bg-accent/10 px-2 py-0.5 font-mono text-accent">
              {dn.host}:{dn.port}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-text" />
            <span className="text-secondary-text">Timeout</span>
            <span className="font-medium">{dn.timeout / 1000}s</span>
          </div>

          <div className="flex items-center gap-3">
            {dn.useSSL ? (
              <>
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  SSL Enabled
                </span>
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 text-muted-text" />
                <span className="text-muted-text">No SSL</span>
              </>
            )}
          </div>
        </div>
      </CardBody>

      {/* Footer */}
      <CardFooter className="flex items-center justify-between border-t bg-muted/30">
        <LinkWithIcon
          href={`http${dn.useSSL ? "s" : ""}://${dn.host}:${dn.port}`}
          icon={<ExternalLink className="h-4 w-4" />}
          iconPosition="left"
          external
          className="text-sm"
        >
          Open
        </LinkWithIcon>

        <Button
          size="sm"
          variant="danger"
          disabled={isDisabled || isDeleting}
          onClick={handleDelete}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          {isDeleting ? "Deleting…" : "Delete"}
        </Button>
      </CardFooter>
    </Card>
  )
}
