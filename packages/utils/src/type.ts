/**
 * Type utility functions and type guards
 * @module type
 */

/**
 * Type guard that checks if a value is not null or undefined.
 * @param value - Value to check
 * @returns True if value is not null or undefined
 */
export function isNotNullish<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 * Type guard that checks if a function is a promise or not
 * @param value - The funtion to check
 * @returns True if value is not not
 */
export function isPromise<T>(value: T | Promise<T>): value is Promise<T> {
  return (
    value !== null && typeof value === "object" && typeof (value as Promise<T>).then === "function"
  )
}

/**
 * Type guard for strings.
 * @param value - Value to check
 * @returns True if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === "string"
}

/**
 * Type guard for numbers (excluding NaN).
 * @param value - Value to check
 * @returns True if value is a number and not NaN
 */
export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value)
}

/**
 * Type guard for plain objects.
 * @param value - Value to check
 * @returns True if value is a plain object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === "[object Object]"
  )
}

/**
 * Type guard for arrays.
 * @param value - Value to check
 * @returns True if value is an array
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

/**
 * Type guard for functions.
 * @param value - Value to check
 * @returns True if value is a function
 */ // biome-ignore lint/complexity/noBannedTypes: needed for the check
export function isFunction(value: unknown): value is Function {
  return typeof value === "function"
}

// Source - https://stackoverflow.com/a/78575949
// Posted by Pau Ibáñez, modified by community. See post 'Timeline' for change history
// Retrieved 2026-04-23, License - CC BY-SA 4.0
export type NestedOmit<Schema, Path extends string> = Path extends `${infer Head}.${infer Tail}`
  ? Head extends keyof Schema
    ? {
        [K in keyof Schema]: K extends Head ? NestedOmit<Schema[K], Tail> : Schema[K]
      }
    : Schema
  : Omit<Schema, Path>
