import { existsSync } from "node:fs"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { Command } from "@commander-js/extra-typings"
import type { ComposeSpecification } from "@dockstat/typings/"
import { extractErrorMessage } from "@dockstat/utils"
import { Glob, YAML } from "bun"
import type {
  StackBuildResult,
  StackDownloadOptions,
  StackMetaType,
  StackValidationResult,
} from "../types"
import { log, printSummary } from "../utils/logger"
import { loadRepo, saveRepo } from "../utils/repo"

/**
 * Parse a docker-compose file and extract stack metadata
 */
async function parseStackFile(
  filePath: string,
  stacksDir: string
): Promise<{ meta: StackMetaType; compose: ComposeSpecification } | null> {
  try {
    const content = await Bun.file(filePath).text()
    const compose = YAML.parse(content) as ComposeSpecification

    // Extract relative path
    const relativePath = path.relative(stacksDir, filePath)
    const stackDir = path.dirname(relativePath)
    const stackName =
      path.basename(stackDir) ||
      path.basename(filePath, ".yaml").replace("docker-compose", "").replace("-", "") ||
      "unknown"

    // Extract services
    const services = Object.entries(compose.services || {}).map(([name, service]) => ({
      name,
      image: typeof service.image === "string" ? service.image : "",
      ports: service.ports
        ?.filter((p) => typeof p === "number" || (typeof p === "object" && p.target))
        .map((p) => (typeof p === "number" ? p : (p as { target: number }).target)),
      envVars: service.environment
        ? Array.isArray(service.environment)
          ? service.environment.map((e) => e.split("=")[0])
          : Object.keys(service.environment)
        : undefined,
      volumes: service.volumes
        ?.map((v) => (typeof v === "string" ? v : v.source ? `${v.source}:${v.target}` : v.target))
        .filter((v): v is string => v !== undefined),
      dependsOn: service.depends_on
        ? Array.isArray(service.depends_on)
          ? service.depends_on
          : Object.keys(service.depends_on)
        : undefined,
    }))

    // Extract environment variables from services
    const envSchema = extractEnvSchema(compose)

    // Check for swarm support (deploy configuration)
    const swarmSupport = Object.values(compose.services || {}).some(
      (service) => service.deploy !== undefined
    )

    // Extract metadata from labels if present
    const firstService = Object.values(compose.services || {})[0]
    const labels = firstService?.labels
    const labelMap = Array.isArray(labels)
      ? Object.fromEntries(labels.map((l) => l.split("=") as [string, string]))
      : (labels as Record<string, string> | undefined)

    const meta: StackMetaType = {
      id:
        labelMap?.["com.dockstat.stack.id"] || stackName.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      name: labelMap?.["com.dockstat.stack.name"] || stackName,
      description: labelMap?.["com.dockstat.stack.description"],
      version: labelMap?.["com.dockstat.stack.version"] || "1.0.0",
      author: labelMap?.["com.dockstat.stack.author"],
      repository: labelMap?.["com.dockstat.stack.repository"],
      tags: labelMap?.["com.dockstat.stack.tags"]?.split(","),
      path: relativePath,
      minDockerVersion: labelMap?.["com.dockstat.stack.minDockerVersion"],
      swarmSupport,
      envSchema,
      services,
      screenshots: labelMap?.["com.dockstat.stack.screenshots"]?.split(","),
      homepage: labelMap?.["com.dockstat.stack.homepage"],
      license: labelMap?.["com.dockstat.stack.license"],
      updatedAt: new Date().toISOString(),
    }

    return { meta, compose }
  } catch (error) {
    log("❌", `Failed to parse stack file: ${filePath}`, extractErrorMessage(error))
    return null
  }
}

/**
 * Extract environment variable schema from compose file
 */
function extractEnvSchema(compose: ComposeSpecification): StackMetaType["envSchema"] {
  const envVars: StackMetaType["envSchema"] = []
  const seenVars = new Set<string>()

  for (const [serviceName, service] of Object.entries(compose.services || {})) {
    if (!service.environment) continue

    const envMap = Array.isArray(service.environment)
      ? Object.fromEntries(service.environment.map((e) => e.split("=") as [string, string]))
      : service.environment

    for (const [name, value] of Object.entries(envMap)) {
      if (seenVars.has(name)) continue
      seenVars.add(name)

      // Check if value uses variable substitution
      const isVariable = typeof value === "string" && value.includes("${")
      const hasDefault = typeof value === "string" && value.includes(":-")

      envVars.push({
        name,
        description: `Environment variable for ${serviceName}`,
        required: isVariable && !hasDefault,
        default: hasDefault ? value.match(/:-([^}]*)/)?.[1] : undefined,
        secret:
          name.toLowerCase().includes("password") ||
          name.toLowerCase().includes("secret") ||
          name.toLowerCase().includes("key"),
        group: serviceName,
      })
    }
  }

  return envVars
}

/**
 * Validate a stack compose file
 */
async function validateStack(filePath: string): Promise<StackValidationResult> {
  const result: StackValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    services: [],
    envVars: [],
  }

  try {
    const content = await Bun.file(filePath).text()
    const compose = YAML.parse(content) as ComposeSpecification

    // Check for services
    if (!compose.services || Object.keys(compose.services).length === 0) {
      result.errors.push("No services defined in the compose file")
      result.valid = false
    }

    // Extract services
    result.services = Object.keys(compose.services || {})

    // Check each service
    for (const [name, service] of Object.entries(compose.services || {})) {
      if (!service.image && !service.build) {
        result.warnings.push(`Service "${name}" has no image or build configuration`)
      }

      // Extract environment variables
      if (service.environment) {
        const envKeys = Array.isArray(service.environment)
          ? service.environment.map((e) => e.split("=")[0])
          : Object.keys(service.environment)
        result.envVars.push(...envKeys)
      }
    }

    // Remove duplicates from envVars
    result.envVars = [...new Set(result.envVars)]

    // Check for network definitions
    if (compose.networks && Object.keys(compose.networks).length > 0) {
      result.warnings.push(`${Object.keys(compose.networks).length} network(s) defined`)
    }

    // Check for volume definitions
    if (compose.volumes && Object.keys(compose.volumes).length > 0) {
      result.warnings.push(`${Object.keys(compose.volumes).length} volume(s) defined`)
    }
  } catch (error) {
    result.errors.push(`Failed to parse YAML: ${extractErrorMessage(error)}`)
    result.valid = false
  }

  return result
}

/**
 * Download/bundle a stack to a target directory
 */
async function downloadStack(
  options: StackDownloadOptions
): Promise<{ success: boolean; message: string }> {
  try {
    const repoData = await loadRepo("repo.json")
    if (!repoData) {
      return { success: false, message: "Repository file not found" }
    }

    const stack = repoData.content.stacks.find(
      (s) => s.id === options.stack || s.name.toLowerCase() === options.stack.toLowerCase()
    )

    if (!stack) {
      return { success: false, message: `Stack "${options.stack}" not found in repository` }
    }

    const stacksDir = repoData.config.stacks.dir
    const sourcePath = path.join(stacksDir, stack.path)

    // Check if source exists
    if (!existsSync(sourcePath)) {
      return { success: false, message: `Stack file not found: ${sourcePath}` }
    }

    // Create output directory if needed
    const outputDir = options.output
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true })
    }

    // Read and process compose file
    const content = await Bun.file(sourcePath).text()
    const compose = YAML.parse(content) as ComposeSpecification

    // Apply environment values if provided
    if (options.envValues) {
      for (const [_serviceName, service] of Object.entries(compose.services || {})) {
        if (service.environment) {
          const envMap = Array.isArray(service.environment)
            ? Object.fromEntries(service.environment.map((e) => e.split("=") as [string, string]))
            : { ...(service.environment as Record<string, string>) }

          for (const [key, value] of Object.entries(options.envValues)) {
            if (key in envMap) {
              envMap[key] = String(value)
            }
          }

          service.environment = envMap
        }
      }
    }

    // Write compose file
    const targetComposePath = path.join(outputDir, "docker-compose.yaml")
    if (existsSync(targetComposePath) && !options.overwrite) {
      return {
        success: false,
        message: "docker-compose.yaml already exists. Use --overwrite to replace.",
      }
    }

    await writeFile(targetComposePath, YAML.stringify(compose, null, 2), "utf-8")

    // Create .env file with defaults
    const envPath = path.join(outputDir, ".env")
    const envContent = (stack.envSchema || [])
      .map((env) => {
        const value = options.envValues?.[env.name] ?? env.default ?? ""
        return `${env.name}=${value}`
      })
      .join("\n")

    await writeFile(envPath, envContent, "utf-8")

    // Create .env.example if requested
    if (options.includeEnvExample) {
      const envExamplePath = path.join(outputDir, ".env.example")
      const envExampleContent = (stack.envSchema || [])
        .map((env) => `${env.name}=${env.default ?? ""}`)
        .join("\n")

      await writeFile(envExamplePath, envExampleContent, "utf-8")
    }

    return {
      success: true,
      message: `Stack "${stack.name}" downloaded to ${outputDir}`,
    }
  } catch (error) {
    return { success: false, message: extractErrorMessage(error) }
  }
}

// ============================================
// Commands
// ============================================

export const stackBundleCommand = new Command("bundle")
  .description("Bundles all stacks and updates the repository manifest")
  .option("--validate", "Validate stack files during bundling", true)
  .action(async (options, cmd) => {
    const globalOptions = cmd.optsWithGlobals() as { root: string }

    const repoData = await loadRepo(globalOptions.root)
    if (!repoData) {
      console.error(`❌ Repository file not found: ${globalOptions.root}`)
      console.error("   Run 'init' first to create a repository.")
      process.exit(1)
    }

    const { dir: stacksDir } = repoData.config.stacks

    console.log("\n🚀 DockStat Stack Bundler\n")

    const glob = new Glob(`${stacksDir}/**/docker-compose.yaml`)
    const globAlt = new Glob(`${stacksDir}/**/docker-compose.yml`)
    const stackPaths = [...glob.scanSync(), ...globAlt.scanSync()]

    if (stackPaths.length === 0) {
      console.log("⚠️  No stacks found")
      return
    }

    log("🔍", `Found ${stackPaths.length} stack(s)`)
    console.log()

    const results: StackBuildResult[] = []

    for (const stackPath of stackPaths) {
      const name = stackPath
        .replace(/\/docker-compose\.(yaml|yml)$/, "")
        .replace(`${stacksDir}/`, "")

      log("📦", `Bundling ${name}...`)

      try {
        // Validate if requested
        if (options.validate) {
          const validation = await validateStack(stackPath)
          if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(", ")}`)
          }
          if (validation.warnings.length > 0) {
            for (const warning of validation.warnings) {
              console.log(`  ⚠️  ${warning}`)
            }
          }
        }

        const parsed = await parseStackFile(stackPath, stacksDir)
        if (!parsed) {
          throw new Error("Failed to parse stack file")
        }

        log("✅", name, stackPath)
        results.push({ name, success: true, meta: parsed.meta })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(`❌ ${name}: ${message.split("\n")[0]}`)
        results.push({ name, success: false, error: message })
      }
    }

    // Update repo file
    const successfulStacks = results
      .filter(
        (r): r is StackBuildResult & { meta: StackMetaType } => r.success && r.meta !== undefined
      )
      .map((r) => r.meta)
    repoData.content.stacks = successfulStacks
    await saveRepo(globalOptions.root, repoData)
    log("📋", `Updated ${globalOptions.root}`, `${successfulStacks.length} stack(s)`)

    const succeeded = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    printSummary(succeeded, failed)

    if (failed > 0) {
      console.log("\n❌ Failed stacks:")
      for (const r of results.filter((r) => !r.success)) {
        console.log(`  - ${r.name}: ${r.error?.split("\n")[0]}`)
      }
      process.exit(1)
    }

    console.log("\n✨ All stacks bundled successfully!\n")
  })

export const stackDownloadCommand = new Command("download")
  .description("Download a stack from the repository")
  .argument("<stack>", "Stack ID or name to download")
  .option("-o, --output <dir>", "Output directory", ".")
  .option("--overwrite", "Overwrite existing files", false)
  .option("--env-example", "Include .env.example file", true)
  .action(async (stackId, options, cmd) => {
    const globalOptions = cmd.optsWithGlobals() as { root: string }

    // Load repo
    const originalRoot = globalOptions.root
    const repoData = await loadRepo(originalRoot)
    if (!repoData) {
      console.error(`❌ Repository file not found: ${originalRoot}`)
      process.exit(1)
    }

    console.log("\n📥 Downloading stack...\n")

    const result = await downloadStack({
      stack: stackId,
      output: options.output,
      overwrite: options.overwrite,
      includeEnvExample: options.envExample,
    })

    if (result.success) {
      console.log(`✅ ${result.message}`)
    } else {
      console.error(`❌ ${result.message}`)
      process.exit(1)
    }
  })

export const stackValidateCommand = new Command("validate")
  .description("Validate a stack compose file")
  .argument("<file>", "Path to stack file")
  .action(async (filePath) => {
    console.log("\n🔍 Validating stack...\n")

    const result = await validateStack(filePath)

    if (result.valid) {
      console.log("✅ Stack is valid!")
    } else {
      console.log("❌ Stack validation failed!")
    }

    if (result.errors.length > 0) {
      console.log("\nErrors:")
      for (const error of result.errors) {
        console.log(`  ❌ ${error}`)
      }
    }

    if (result.warnings.length > 0) {
      console.log("\nWarnings:")
      for (const warning of result.warnings) {
        console.log(`  ⚠️  ${warning}`)
      }
    }

    console.log(`\nServices: ${result.services.join(", ") || "None"}`)
    console.log(`Environment Variables: ${result.envVars.length}`)

    if (!result.valid) {
      process.exit(1)
    }
  })

export const stacksCommand = new Command("stacks")
  .description("Manage stacks in the repository")
  .addCommand(stackBundleCommand)
  .addCommand(stackDownloadCommand)
  .addCommand(stackValidateCommand)
