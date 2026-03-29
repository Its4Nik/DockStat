/**
 * Parsing utilities for Docker Swarm operations
 */

import type { MountConfig, PortConfig, StackDeployOptions } from "../types"

/**
 * Parse environment file content into key-value pairs
 */
export function parseEnvContent(content: string): Record<string, string> {
  const env: Record<string, string> = {}
  const lines = content.split("\n")

  for (const line of lines) {
    const trimmed = line.trim()

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith("#")) {
      continue
    }

    // Find the first equals sign
    const equalsIndex = trimmed.indexOf("=")
    if (equalsIndex === -1) {
      continue
    }

    const key = trimmed.slice(0, equalsIndex).trim()
    let value = trimmed.slice(equalsIndex + 1).trim()

    // Remove quotes if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    env[key] = value
  }

  return env
}

/**
 * Convert environment record to docker-compose env format
 */
export function envRecordToArray(env: Record<string, string | number | boolean>): string[] {
  return Object.entries(env).map(([key, value]) => `${key}=${value}`)
}

/**
 * Convert environment array to record
 */
export function envArrayToRecord(env: string[]): Record<string, string> {
  const result: Record<string, string> = {}

  for (const item of env) {
    const equalsIndex = item.indexOf("=")
    if (equalsIndex === -1) {
      result[item] = ""
    } else {
      const key = item.slice(0, equalsIndex)
      const value = item.slice(equalsIndex + 1)
      result[key] = value
    }
  }

  return result
}

/**
 * Merge environment variables (later values override earlier)
 */
export function mergeEnv(
  ...envs: Array<Record<string, string> | undefined>
): Record<string, string> {
  const result: Record<string, string> = {}

  for (const env of envs) {
    if (env) {
      Object.assign(result, env)
    }
  }

  return result
}

/**
 * Parse port specification string
 * Supports formats: "80", "80:8080", "80:8080/tcp", "80-90:8080-8090"
 */
export function parsePortSpec(spec: string): PortConfig | null {
  // Protocol suffix
  let protocol: "tcp" | "udp" | "sctp" = "tcp"
  let specWithoutProtocol = spec

  if (spec.endsWith("/tcp")) {
    protocol = "tcp"
    specWithoutProtocol = spec.slice(0, -4)
  } else if (spec.endsWith("/udp")) {
    protocol = "udp"
    specWithoutProtocol = spec.slice(0, -4)
  } else if (spec.endsWith("/sctp")) {
    protocol = "sctp"
    specWithoutProtocol = spec.slice(0, -5)
  }

  // Port mapping
  const parts = specWithoutProtocol.split(":")
  if (parts.length === 1) {
    const port = parseInt(parts[0] ?? "", 10)
    if (Number.isNaN(port)) return null
    return { target: port, protocol }
  }

  if (parts.length === 2) {
    const published = parseInt(parts[0] ?? "", 10)
    const target = parseInt(parts[1] ?? "", 10)
    if (Number.isNaN(published) || Number.isNaN(target)) return null
    return { published, target, protocol }
  }

  // Host:Port:ContainerPort format
  if (parts.length === 3) {
    const published = parseInt(parts[1] ?? "", 10)
    const target = parseInt(parts[2] ?? "", 10)
    if (Number.isNaN(published) || Number.isNaN(target)) return null
    return { published, target, protocol }
  }

  return null
}

/**
 * Parse mount specification string
 * Supports formats: "source:target", "source:target:ro", "type:source:target"
 */
export function parseMountSpec(spec: string): MountConfig | null {
  const parts = spec.split(":")

  if (parts.length < 2) return null

  let type: MountConfig["type"] = "bind"
  let source = parts[0] ?? ""
  let target = parts[1] ?? ""
  let readOnly = false

  // Check for type prefix
  if (["bind", "volume", "tmpfs"].includes(parts[0] ?? "")) {
    type = parts[0] as MountConfig["type"]
    source = parts[1] ?? ""
    target = parts[2] ?? ""

    // Check for options
    if (parts.length > 3) {
      const options = parts.slice(3)
      readOnly = options.includes("ro")
    }
  } else {
    // Check for options in third part
    if (parts.length > 2) {
      const options = parts.slice(2)
      readOnly = options.includes("ro")
    }
  }

  if (!source || !target) return null

  return {
    type,
    source,
    target,
    readOnly,
  }
}

/**
 * Generate a stack name from compose file
 */
export function generateStackName(compose: string): string | null {
  // Try to extract project name from compose
  const lines = compose.split("\n")
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith("name:")) {
      return trimmed.slice(5).trim().replace(/["']/g, "")
    }
  }
  return null
}

/**
 * Extract service names from compose YAML
 */
export function extractServiceNames(compose: string): string[] {
  const services: string[] = []
  const lines = compose.split("\n")

  let inServices = false
  let indentLevel = 0

  for (const line of lines) {
    // Detect services section
    if (line.startsWith("services:")) {
      inServices = true
      indentLevel = line.search(/\S/) + 2
      continue
    }

    // Detect end of services section
    if (inServices) {
      const currentIndent = line.search(/\S/)
      if (currentIndent >= 0 && currentIndent < indentLevel && !line.trim().startsWith("#")) {
        break
      }

      // Extract service name
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("-")) {
        const colonIndex = trimmed.indexOf(":")
        if (colonIndex > 0) {
          const serviceName = trimmed.slice(0, colonIndex).trim()
          if (
            serviceName &&
            ![
              "image",
              "build",
              "ports",
              "volumes",
              "environment",
              "env_file",
              "networks",
              "depends_on",
              "labels",
              "command",
              "entrypoint",
              "restart",
              "deploy",
              "healthcheck",
            ].includes(serviceName)
          ) {
            services.push(serviceName)
          }
        }
      }
    }
  }

  return services
}

/**
 * Build environment content for stack deploy
 */
export function buildEnvContent(options: StackDeployOptions): string {
  const lines: string[] = []

  // Add env file content first
  if (options.envContent) {
    lines.push(options.envContent)
  }

  // Add individual env vars (these override envContent)
  if (options.env) {
    for (const [key, value] of Object.entries(options.env)) {
      lines.push(`${key}=${value}`)
    }
  }

  return lines.join("\n")
}

/**
 * Validate compose YAML structure
 */
export function validateComposeStructure(compose: string): {
  valid: boolean
  errors: string[]
  services: string[]
} {
  const errors: string[] = []
  const services = extractServiceNames(compose)

  // Basic validation
  if (!compose.includes("services:")) {
    errors.push("Missing 'services' section")
  }

  if (!compose.includes("version:") && !compose.includes("version:")) {
    // Version is optional in newer compose spec
  }

  // Check for valid YAML-like structure
  const lines = compose.split("\n")

  for (const line of lines) {
    if (line.trim() && !line.trim().startsWith("#")) {
      // Check for tabs (should be spaces)
      if (line.includes("\t")) {
        errors.push("Use spaces instead of tabs for indentation")
        break
      }
    }
  }

  return {
    valid: errors.length === 0 && services.length > 0,
    errors,
    services,
  }
}

/**
 * Extract stack name from deploy options or compose
 */
export function resolveStackName(options: StackDeployOptions): string {
  if (options.name) {
    return options.name
  }

  const generatedName = generateStackName(options.compose)
  if (generatedName) {
    return generatedName
  }

  throw new Error("Stack name is required and could not be extracted from compose file")
}
