import type { RepoType } from "@dockstat/typings/types"
import { Badge, Button, Card, CardHeader, Divider, LinkWithIcon, RepoIcons } from "@dockstat/ui"
import { repo } from "@dockstat/utils"
import { ExternalLink, ShieldAlert, ShieldCheck, ShieldX, Trash2 } from "lucide-react"
import { useEdenMutation } from "@/hooks/useEdenMutation"
import { api } from "@/lib/api"

export function RepoCard({ id, name, policy, source, type, verification_api }: RepoType) {
  const deleteRepoMutation = useEdenMutation({
    route: api.db.repositories({ id: id }).delete,
    mutationKey: ["deleteRepo"],
    invalidateQueries: [["fetchAllRepositories"]],
    toast: {
      errorTitle: "Could not delete repository",
      successTitle: `Deleted ${name}`,
    },
  })

  const handleDelete = () => deleteRepoMutation.mutateAsync()

  const getSecurityBadge = () => {
    if (!verification_api) {
      return {
        icon: <ShieldX size={16} />,
        label: "No Verification",
        variant: "primary" as const,
      }
    }
    if (policy === "strict") {
      return {
        icon: <ShieldCheck size={16} />,
        label: "Strict",
        variant: "success" as const,
      }
    }
    return {
      icon: <ShieldAlert size={16} />,
      label: "Relaxed",
      variant: "warning" as const,
    }
  }

  const securityBadge = getSecurityBadge()

  return (
    <Card variant="flat" className="h-full flex flex-col">
      <CardHeader size="sm" className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-primary-text truncate mb-2">{name}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={securityBadge.variant} className="flex items-center gap-1">
                {securityBadge.icon}
                <span className="text-xs">{securityBadge.label}</span>
              </Badge>
              <Badge variant="primary" className="flex items-center gap-1">
                <RepoIcons type={type} size={16} />
                <span className="text-xs capitalize">{type}</span>
              </Badge>
            </div>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={deleteRepoMutation.isPending}
            className="shrink-0"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </CardHeader>

      <div className="px-4 pb-4 flex-1 flex flex-col mt-2 gap-3 text-sm">
        <div className="flex flex-col gap-1">
          <span className="text-muted-text text-xs font-medium">Source</span>
          <code className="text-xs bg-main-bg/40 px-2 py-1 rounded break-all">{source}</code>
        </div>

        {verification_api && (
          <div className="flex flex-col gap-1">
            <span className="text-muted-text text-xs font-medium">Verification API</span>
            <code className="text-xs bg-main-bg/40 px-2 py-1 rounded break-all">
              {verification_api}
            </code>
          </div>
        )}

        <div className="mt-auto pt-3">
          <Divider className="my-4" />

          <LinkWithIcon
            icon={<ExternalLink size={14} />}
            href={repo.parseFromDBToRepoLink(type, source, "README.md", false)}
          >
            View Repository
          </LinkWithIcon>
        </div>
      </div>
    </Card>
  )
}
