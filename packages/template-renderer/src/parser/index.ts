/**
 * Template Parser
 *
 * Parses JSON and YAML template files into validated PageTemplate objects.
 * Provides safe parsing with comprehensive error handling.
 */

import type { PageTemplate, TemplateFragment, TemplateValidationResult } from "../types"
import { validateFragment, validateTemplate } from "../validation"

/**
 * Supported template formats
 */
export type TemplateFormat = "json" | "yaml"

/**
 * Parse result containing the parsed template and validation result
 */
export interface ParseResult<T> {
  /** Whether parsing was successful */
  success: boolean
  /** The parsed data (only present if successful) */
  data?: T
  /** Validation result with any errors/warnings */
  validation: TemplateValidationResult
  /** Parse error if the input was not valid JSON/YAML */
  parseError?: string
}

/**
 * Detect the format of a template string
 */
export function detectFormat(content: string): TemplateFormat {
  const trimmed = content.trim()

  // If it starts with { or [, it's likely JSON
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return "json"
  }

  // Otherwise assume YAML
  return "yaml"
}

/**
 * Parse a JSON string
 */
function parseJSON(content: string): { data?: unknown; error?: string } {
  try {
    const data = JSON.parse(content)
    return { data }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to parse JSON" }
  }
}

/**
 * Parse a YAML string using Bun's built-in YAML parser
 */
function parseYAML(content: string): { data?: unknown; error?: string } {
  try {
    // Use Bun's native YAML parser
    const data = Bun.YAML.parse(content)
    return { data }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to parse YAML" }
  }
}

/**
 * Parse raw content (auto-detecting format)
 */
function parseRaw(content: string, format?: TemplateFormat): { data?: unknown; error?: string } {
  const detectedFormat = format ?? detectFormat(content)

  if (detectedFormat === "json") {
    return parseJSON(content)
  }

  return parseYAML(content)
}

/**
 * Parse a template string into a PageTemplate
 *
 * @param content - The template content (JSON or YAML string)
 * @param format - Optional format hint (auto-detected if not provided)
 * @returns ParseResult with the template or errors
 */
export function parseTemplate(content: string, format?: TemplateFormat): ParseResult<PageTemplate> {
  // Parse the raw content
  const { data, error: parseError } = parseRaw(content, format)

  if (parseError || data === undefined) {
    return {
      success: false,
      parseError: parseError ?? "Failed to parse content",
      validation: { valid: false, errors: [] },
    }
  }

  // Validate the parsed data
  const validation = validateTemplate(data)

  if (!validation.valid) {
    return {
      success: false,
      validation,
    }
  }

  return {
    success: true,
    data: data as PageTemplate,
    validation,
  }
}

/**
 * Parse a template fragment string
 *
 * @param content - The fragment content (JSON or YAML string)
 * @param format - Optional format hint (auto-detected if not provided)
 * @returns ParseResult with the fragment or errors
 */
export function parseFragment(
  content: string,
  format?: TemplateFormat
): ParseResult<TemplateFragment> {
  // Parse the raw content
  const { data, error: parseError } = parseRaw(content, format)

  if (parseError || data === undefined) {
    return {
      success: false,
      parseError: parseError ?? "Failed to parse content",
      validation: { valid: false, errors: [] },
    }
  }

  // Validate the parsed data
  const validation = validateFragment(data)

  if (!validation.valid) {
    return {
      success: false,
      validation,
    }
  }

  return {
    success: true,
    data: data as TemplateFragment,
    validation,
  }
}

/**
 * Parse a template from a file path
 *
 * @param path - Path to the template file
 * @returns Promise<ParseResult> with the template or errors
 */
export async function parseTemplateFile(path: string): Promise<ParseResult<PageTemplate>> {
  try {
    const file = Bun.file(path)
    const content = await file.text()

    // Detect format from file extension
    let format: TemplateFormat | undefined
    if (path.endsWith(".json")) {
      format = "json"
    } else if (path.endsWith(".yaml") || path.endsWith(".yml")) {
      format = "yaml"
    }

    return parseTemplate(content, format)
  } catch (error) {
    return {
      success: false,
      parseError: error instanceof Error ? error.message : "Failed to read file",
      validation: { valid: false, errors: [] },
    }
  }
}

/**
 * Parse a template fragment from a file path
 *
 * @param path - Path to the fragment file
 * @returns Promise<ParseResult> with the fragment or errors
 */
export async function parseFragmentFile(path: string): Promise<ParseResult<TemplateFragment>> {
  try {
    const file = Bun.file(path)
    const content = await file.text()

    // Detect format from file extension
    let format: TemplateFormat | undefined
    if (path.endsWith(".json")) {
      format = "json"
    } else if (path.endsWith(".yaml") || path.endsWith(".yml")) {
      format = "yaml"
    }

    return parseFragment(content, format)
  } catch (error) {
    return {
      success: false,
      parseError: error instanceof Error ? error.message : "Failed to read file",
      validation: { valid: false, errors: [] },
    }
  }
}

/**
 * Serialize a PageTemplate to JSON
 *
 * @param template - The template to serialize
 * @param pretty - Whether to format with indentation (default: true)
 * @returns JSON string
 */
export function serializeTemplateToJSON(template: PageTemplate, pretty = true): string {
  return JSON.stringify(template, null, pretty ? 2 : undefined)
}

/**
 * Serialize a PageTemplate to YAML
 *
 * @param template - The template to serialize
 * @returns YAML string
 */
export function serializeTemplateToYAML(template: PageTemplate): string {
  return Bun.YAML.stringify(template)
}

/**
 * Serialize a TemplateFragment to JSON
 *
 * @param fragment - The fragment to serialize
 * @param pretty - Whether to format with indentation (default: true)
 * @returns JSON string
 */
export function serializeFragmentToJSON(fragment: TemplateFragment, pretty = true): string {
  return JSON.stringify(fragment, null, pretty ? 2 : undefined)
}

/**
 * Serialize a TemplateFragment to YAML
 *
 * @param fragment - The fragment to serialize
 * @returns YAML string
 */
export function serializeFragmentToYAML(fragment: TemplateFragment): string {
  return Bun.YAML.stringify(fragment)
}

/**
 * Try to parse content as a template, returning null on failure
 */
export function tryParseTemplate(content: string, format?: TemplateFormat): PageTemplate | null {
  const result = parseTemplate(content, format)
  return result.success ? result.data! : null
}

/**
 * Try to parse content as a fragment, returning null on failure
 */
export function tryParseFragment(
  content: string,
  format?: TemplateFormat
): TemplateFragment | null {
  const result = parseFragment(content, format)
  return result.success ? result.data! : null
}

/**
 * Parse multiple templates from an array of contents
 */
export function parseTemplates(
  contents: Array<{ content: string; format?: TemplateFormat; id?: string }>
): Map<string, ParseResult<PageTemplate>> {
  const results = new Map<string, ParseResult<PageTemplate>>()

  for (const { content, format, id } of contents) {
    const result = parseTemplate(content, format)
    const templateId = result.success ? result.data!.id : (id ?? `unknown-${results.size}`)
    results.set(templateId, result)
  }

  return results
}

/**
 * Merge multiple template fragments into a single template
 * This is useful for composing templates from reusable parts
 */
export function mergeFragmentsIntoTemplate(
  baseTemplate: Partial<PageTemplate> & { id: string; name: string },
  fragments: TemplateFragment[]
): PageTemplate {
  const mergedWidgets = [...(baseTemplate.widgets ?? [])]

  // Collect all fragment widgets
  for (const fragment of fragments) {
    mergedWidgets.push(...fragment.widgets)
  }

  return {
    ...baseTemplate,
    widgets: mergedWidgets,
  }
}
