import type { DOCKER } from "@dockstat/typings"
import { Badge } from "@dockstat/ui"
import { formatDuration } from "@dockstat/utils"

export function ClientOptions({ options }: { options: DOCKER.DockerAdapterOptions }) {
  return (
    <div>
      {options.defaultTimeout && (
        <Badge variant="secondary">Default timeout: {formatDuration(options.defaultTimeout)}</Badge>
      )}
    </div>
  )
}
