import { logger } from "./logger";

/**
 * Finds and returns the first object in an array where the specified key matches the given value.
 *
 * @template T - The type of the objects in the array.
 * @param {T[]} array - The array of objects to search through.
 * @param {keyof T} key - The key of the object to match against.
 * @param {T[keyof T]} value - The value to match the key against.
 * @returns {T | undefined} The first matching object, or undefined if no match is found.
 */
export function findObjectByKey<T>(
	array: T[],
	key: keyof T,
	value: T[keyof T],
): T | undefined {
	logger.debug(
		`Searching for key: ${String(key)} with value: ${String(value)}`,
	);
	const data = array.find((item) => item[key] === value);
	return data;
}
