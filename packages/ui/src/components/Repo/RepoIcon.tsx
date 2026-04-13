import type { RepoType } from "@dockstat/typings/types"
import { SiGitea, SiGithub, SiGitlab } from "@icons-pack/react-simple-icons"
import { Folder, Globe } from "lucide-react"

export function RepoIcons({ type, size = 20 }: { type: RepoType["type"]; size: number }) {
  switch (type) {
    case "default": {
      return null
    }
    case "gitea": {
      return <SiGitea size={size} />
    }
    case "github": {
      return <SiGithub size={size} />
    }
    case "gitlab": {
      return <SiGitlab size={size} />
    }
    case "http": {
      return <Globe size={size} />
    }
    case "local": {
      return <Folder size={size} />
    }
  }
}
