export function contentType(ext: string) {
  switch (ext) {
    case ".json":
      return "application/json"
    case ".yaml":
    case ".yml":
      return "application/yaml"
    case ".txt":
    case ".log":
    case ".md":
      return "text/plain"
    default:
      return "text/plain"
  }
}
