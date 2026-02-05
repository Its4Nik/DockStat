export function truncate(str: string, maxLength: number, suffix = "..."): string {
  if (str.length <= maxLength) {
    return str
  }
  return str.slice(0, maxLength) + suffix
}
