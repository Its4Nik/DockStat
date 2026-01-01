export function pushWithLimit<T>(arr: T[], item: T, max = 50) {
  if (arr.length >= max) {
    arr.shift()
  }
  arr.push(item)
  return arr
}
