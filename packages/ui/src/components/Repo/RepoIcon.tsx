import type { RepoType } from "@dockstat/typings/types"
import { SiGitea, SiGithub, SiGitlab } from "@icons-pack/react-simple-icons"
import { Folder, Globe } from "lucide-react"

export function RepoIcons({ type }: { type: RepoType["type"] }) {
  switch (type) {
    case "default": {
      return
    }
    case "gitea": {
      return <SiGitea />
    }
    case "github": {
      return <SiGithub />
    }
    case "gitlab": {
      return <SiGitlab />
    }
    case "http": {
      return <Globe />
    }
    case "local": {
      return <Folder />
    }
  }
}
