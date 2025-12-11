import type { RepoType } from "@dockstat/typings/types"
import { Coffee, Folder, Github, Gitlab, Link } from "lucide-react"

export function getRepoIcon(repoType: RepoType["type"]) {
  switch (repoType) {
    case "github":
      return <Github />
    case "gitlab":
      return <Gitlab />
    case "gitea":
      return <Coffee />
    case "http":
      return <Link />
    case "local":
      return <Folder />
  }
}
