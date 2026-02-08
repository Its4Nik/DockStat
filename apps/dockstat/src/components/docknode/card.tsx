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

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsDeleting(true)
    try {
      await deleteNode(Number(dn.id))
    } finally {
      setIsDeleting(false)
    }
  }

  const isOnline = dn.isReachable === "OK"

  return (
    <Card className="overflow-hidden transition-all duration-300" variant="elevated">
      <CardBody>
        {/* Header */}
        <div>
          <div className="flex items-start justify-between mb-4 mt-0">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isOnline ? "bg-success/20" : "bg-error/30"}`}>
                <Server className={`w-6 h-6 ${isOnline ? "text-success" : "text-error"}`} />
              </div>
              <div>
                <h3 className="font-bold  text-lg leading-tight">{dn.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge size="sm" variant={isOnline ? "success" : "error"} className="font-medium">
                    <span className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {isOnline ? "Online" : "Offline"}
                    </span>
                  </Badge>
                  <span className="text-xs text-muted-text  ont-mono">ID: {dn.id}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Connection Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Globe className="w-4 h-4 text-slate-400" />
              <span className="text-secondary-text">Host:</span>
              <span className="text-accent bg-accent/10 p-1 rounded-md font-mono">
                {dn.host}:{dn.port}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-secondary-text">Timeout:</span>
              <span className="text-accent">{dn.timeout / 1000}s</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              {dn.useSSL ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    SSL Enabled
                  </span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 text-secondary-text" />
                  <span className="text-muted-text">No SSL</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <CardFooter className="mt-4 flex items-center justify-between">
          <LinkWithIcon
            href={`http${dn.useSSL ? "s" : ""}://${dn.host}:${dn.port}`}
            icon={<ExternalLink className="w-4 h-4" />}
            iconPosition="left"
            external
          >
            Visit
          </LinkWithIcon>

          <Button
            variant="danger"
            size="sm"
            disabled={isDisabled || isDeleting}
            onClick={handleDelete}
            className={`flex items-center gap-2 transition-all duration-300 ${
              isDeleting ? "opacity-50 cursor-wait" : "hover:bg-rose-600 hover:text-white"
            }`}
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </CardFooter>
      </CardBody>
    </Card>
  )
}
