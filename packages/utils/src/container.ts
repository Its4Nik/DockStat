/**
 * Container utility functions for Docker operations
 * @module container
 */

/**
 * Parses a Docker container name into its components.
 * @param name - Container name (with or without leading slash)
 * @returns Parsed container name components
 */
export function parseContainerName(name: string): {
  name: string
  prefix: string | null
} {
  // Remove leading slash if present
  const cleanName = name.startsWith("/") ? name.slice(1) : name

  // Check for compose-style naming (prefix_name_number)
  const parts = cleanName.split("_")

  if (parts.length >= 2) {
    // Check if last part is a number (typical for docker-compose)
    const lastPart = String(parts[parts.length - 1])
    if (/^\d+$/.test(lastPart)) {
      // This looks like a compose container: prefix_service_number
      const prefix = parts[0]
      const serviceName = parts.slice(1).join("_")
      return {
        name: serviceName,
        prefix: prefix || null,
      }
    }
  }

  // No compose-style prefix detected
  return {
    name: cleanName,
    prefix: null,
  }
}

/**
 * Parses a Docker image reference into its components.
 * @param image - Docker image reference
 * @returns Parsed image components
 */
export function parseImageName(image: string): {
  registry: string | null
  repository: string
  tag: string
} {
  let registry: string | null = null
  let repository: string
  let tag = "latest"

  // Split by tag separator first
  const [imageWithoutTag, imageTag] = image.split(":")
  if (imageTag && !imageTag.includes("/")) {
    tag = imageTag
  }

  const imagePath = String(imageTag?.includes("/") ? image : imageWithoutTag)

  // Check for registry (contains . or : or is localhost)
  const parts = imagePath.split("/")

  if (parts.length > 1) {
    const firstPart = String(parts[0])
    // If first part looks like a domain/host
    if (firstPart.includes(".") || firstPart.includes(":") || firstPart === "localhost") {
      registry = firstPart
      repository = parts.slice(1).join("/")
    } else {
      repository = imagePath
    }
  } else {
    repository = imagePath
  }

  return {
    registry,
    repository,
    tag,
  }
}

/**
 * Calculates CPU percentage from Docker stats.
 * @param previousCpuUsage - Previous CPU usage value
 * @param currentCpuUsage - Current CPU usage value
 * @param previousSystemCpu - Previous system CPU value
 * @param currentSystemCpu - Current system CPU value
 * @param numCpus - Number of CPUs
 * @returns CPU percentage
 */
export function calculateCpuPercent(
  previousCpuUsage: number,
  currentCpuUsage: number,
  previousSystemCpu: number,
  currentSystemCpu: number,
  numCpus: number
): number {
  const cpuDelta = currentCpuUsage - previousCpuUsage
  const systemDelta = currentSystemCpu - previousSystemCpu

  if (systemDelta <= 0 || cpuDelta <= 0) {
    return 0
  }

  const cpuPercent = (cpuDelta / systemDelta) * numCpus * 100

  return Math.max(0, Math.min(100 * numCpus, cpuPercent))
}

/**
 * Calculates memory percentage from Docker stats.
 * @param memoryUsage - Current memory usage in bytes
 * @param memoryLimit - Memory limit in bytes
 * @returns Memory percentage
 */
export function calculateMemoryPercent(memoryUsage: number, memoryLimit: number): number {
  if (memoryLimit <= 0) {
    return 0
  }

  const percent = (memoryUsage / memoryLimit) * 100

  return Math.max(0, Math.min(100, percent))
}
