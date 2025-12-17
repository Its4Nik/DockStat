/**
 * Data utility functions for object and array manipulation
 * @module data
 */

/**
 * Deep clones an object or array.
 * @param obj - Object to clone
 * @returns Deep cloned object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as T
  }

  if (obj instanceof Object) {
    const clonedObj = {} as T
    for (const key in obj) {
      // biome-ignore lint/suspicious/noPrototypeBuiltins: Needed
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }

  return obj
}

/**
 * Deep merges multiple objects.
 * @param objs - Objects to merge
 * @returns Merged object
 */
export function deepMerge<T extends Record<string, unknown>>(...objs: Partial<T>[]): T {
  const result = {} as T

  for (const obj of objs) {
    if (!obj) continue

    for (const key in obj) {
      // biome-ignore lint/suspicious/noPrototypeBuiltins: Needed
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key]

        if (
          value &&
          typeof value === "object" &&
          !Array.isArray(value) &&
          !(value instanceof Date)
        ) {
          result[key] = deepMerge(result[key] || {}, value) as T[Extract<keyof T, string>]
        } else {
          result[key] = value as T[Extract<keyof T, string>]
        }
      }
    }
  }

  return result
}

/**
 * Creates an object with only the specified keys.
 * @param obj - Source object
 * @param keys - Keys to pick
 * @returns New object with only specified keys
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>

  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key]
    }
  }

  return result
}

/**
 * Creates an object without the specified keys.
 * @param obj - Source object
 * @param keys - Keys to omit
 * @returns New object without specified keys
 */
export function omit<T extends Record<PropertyKey, unknown>, const K extends readonly (keyof T)[]>(
  obj: T,
  keys: K
): Omit<T, K[number]> {
  const result: Partial<T> = { ...obj }

  for (const key of keys) {
    delete result[key]
  }

  return result as Omit<T, K[number]>
}

/**
 * Groups array items by a key or function.
 * @param arr - Array to group
 * @param keyOrFn - Key name or grouping function
 * @returns Grouped object
 */
export function groupBy<T>(
  arr: T[],
  keyOrFn: keyof T | ((item: T) => string | number)
): Record<string, T[]> {
  const result: Record<string, T[]> = {}

  for (const item of arr) {
    const key = typeof keyOrFn === "function" ? String(keyOrFn(item)) : String(item[keyOrFn])

    if (!result[key]) {
      result[key] = []
    }

    result[key].push(item)
  }

  return result
}

/**
 * Returns unique items from an array based on a key.
 * @param arr - Array to filter
 * @param keyOrFn - Key name or comparison function
 * @returns Array with unique items
 */
export function uniqueBy<T>(arr: T[], keyOrFn: keyof T | ((item: T) => unknown)): T[] {
  const seen = new Set()
  const result: T[] = []

  for (const item of arr) {
    const key = typeof keyOrFn === "function" ? keyOrFn(item) : item[keyOrFn]

    if (!seen.has(key)) {
      seen.add(key)
      result.push(item)
    }
  }

  return result
}

/**
 * Sorts an array by a key or function.
 * @param arr - Array to sort
 * @param keyOrFn - Key name or sorting function
 * @param direction - Sort direction (default: "asc")
 * @returns Sorted array (new array)
 */
export function sortBy<T>(
  arr: T[],
  keyOrFn: keyof T | ((item: T) => unknown),
  direction: "asc" | "desc" = "asc"
): T[] {
  const copy = [...arr]

  copy.sort((a, b) => {
    const aVal = typeof keyOrFn === "function" ? (keyOrFn(a) as number) : (a[keyOrFn] as number)
    const bVal = typeof keyOrFn === "function" ? (keyOrFn(b) as number) : (b[keyOrFn] as number)

    if (aVal < bVal) {
      return direction === "asc" ? -1 : 1
    }
    if (aVal > bVal) {
      return direction === "asc" ? 1 : -1
    }
    return 0
  })

  return copy
}
