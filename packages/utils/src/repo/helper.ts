type ParsedRepo = {
  ownerRepo: string
  branch: string
  path: string
  domain?: string
}

function parseRepoParts(source: string): ParsedRepo {
  const [ownerRepo, branchAndPath] = source.split(":")

  if (!ownerRepo) {
    throw new Error(`No parsable Repo found in ${source}`)
  }

  const parts = branchAndPath?.split("/") || []
  const branch = parts[0] || "main"
  const path = parts.slice(1).join("/")

  return { ownerRepo, branch, path }
}

function splitDomain(source: string, fallback: string) {
  // format: domain/owner/repo:branch/path
  if (source.includes("/")) {
    const [domain, rest] = source.split("/", 2)
    if (rest?.includes(":")) {
      return { domain, source: rest }
    }
  }
  return { domain: fallback, source }
}

export { parseRepoParts, splitDomain }
