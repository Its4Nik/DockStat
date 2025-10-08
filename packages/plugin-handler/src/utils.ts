import type { PLUGIN } from "@dockstat/typings";
import { allowedFunctions } from "./consts";
import { createLogger } from "@dockstat/logger";

export const logger = createLogger("PluginHandler")

export function validatePlugin(pluginConfig: PLUGIN.PluginTable) {
  const errors: string[] = []
  const { meta, plugin } = pluginConfig

  logger.info(`Checking ${meta.name}`)
  {
    logger.debug(`Verifying ${meta.name}'s meta data`)
    const { license, name, repository, version, path } = meta
    if (!license) {
      errors.push("License is missing")
    }
    if (!name) {
      errors.push("Name is missing")
    }
    if (!repository) {
      errors.push("Repository is missing")
    }
    if (!path) {
      errors.push("No Path to Plugin provided")
    }
    if (!version) {
      errors.push("Version is missing")
    }
  }

  logger.debug(`Checking if ${meta.name} has at least one plugin definition`)
  const hasBackend = !!plugin.backendConfig
  const hasFrontend = !!plugin.component
  if (hasBackend && hasFrontend) {
    errors.push("No Plugin definition found")
  }

  if (errors.length >= 1) {
    throw new Error(JSON.stringify(errors))
  }

  return true
}

export function buildPluginLink(repo: string, path: string) {
  logger.debug(`Building plugin link: repo=${repo} - path=${path}`)
  let link = ""
  if (repo.endsWith("/")) {
    link = repo
  } else {
    link = `${repo}/`
  }

  if (path.startsWith('/')) {
    link += path.substring(1)
  } else if (path.startsWith("./")) {
    link += path.substring(2)
  } else {
    link += path
  }

  logger.debug(`Normalized link: ${link}`)
  return link
}
