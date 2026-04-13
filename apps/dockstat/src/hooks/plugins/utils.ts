export function getValueByPath(obj: Record<string, unknown> | undefined, path: string): unknown {
  if (!obj) return undefined
  const parts = path.split(".")
  let current: unknown = obj

  for (const part of parts) {
    if (current === null || current === undefined) return undefined
    if (typeof current !== "object") return undefined
    current = (current as Record<string, unknown>)[part]
  }

  return current
}
