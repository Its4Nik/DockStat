#!/usr/bin/env bun
// scripts/parse-tailwind.ts
// TypeScript (no anys). Scans ./src/components and writes ./manifest.json
// Normalizes class tokens to the "components-..." part and converts var(--components-...) to "components-...".

import fs from 'node:fs'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createLogger } from '@dockstat/logger'

const logger = createLogger('buildManifest')

type FilePath = string

interface ManifestEntry {
  componentName: string
  path: string // relative path from project root
  classes: string[] // unique, normalized, sorted
  variables: string[] // unique, sorted
}

const ROOT_DIR = path.resolve(process.cwd(), './src/components')
const OUT_FILE = path.resolve(process.cwd(), './manifest.json')
const FILE_EXTENSIONS: Set<string> = new Set([
  '.js',
  '.ts',
  '.jsx',
  '.tsx',
  '.html',
  '.mdx',
  '.vue',
  '.svelte',
])

async function collectFiles(dir: FilePath): Promise<FilePath[]> {
  logger.debug(`Collecting files from directory: ${dir}`)
  const entries = await readdir(dir, { withFileTypes: true })
  const results: FilePath[] = []
  for (const ent of entries) {
    const full = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      const nested = await collectFiles(full)
      results.push(...nested)
    } else if (ent.isFile()) {
      if (FILE_EXTENSIONS.has(path.extname(ent.name))) results.push(full)
    }
  }
  return results
}

function extractClassStrings(src: string): string[] {
  const results: string[] = []

  // capture common patterns where classes are written literally
  const attrDouble = /\b(?:class|className)\s*=\s*"([^"]*)"/g
  const attrSingle = /\b(?:class|className)\s*=\s*'([^']*)'/g
  const braceDouble = /\b(?:class|className)\s*=\s*{\s*"([^"]*)"\s*}/g
  const braceSingle = /\b(?:class|className)\s*=\s*{\s*'([^']*)'\s*}/g
  const templateInBraces = /\b(?:class|className)\s*=\s*{\s*`([^`]*)`\s*}/g
  const templateDirect = /\b(?:class|className)\s*=\s*`([^`]*)`/g

  // generic string containing the word "components" (constants, CSS variables, etc.)
  const genericStrings = /(["'`])([^"'`]*components[^"'`]*)\1/gi

  for (const match of src.matchAll(attrDouble)) {
    results.push(match[1])
  }
  for (const match of src.matchAll(attrSingle)) {
    results.push(match[1])
  }
  for (const match of src.matchAll(braceDouble)) {
    results.push(match[1])
  }
  for (const match of src.matchAll(braceSingle)) {
    results.push(match[1])
  }
  for (const match of src.matchAll(templateInBraces)) {
    results.push(match[1])
  }
  for (const match of src.matchAll(templateDirect)) {
    results.push(match[1])
  }
  for (const match of src.matchAll(genericStrings)) {
    results.push(match[1])
  }

  return results
}

function normalizeToken(raw: string): string | null {
  // 1) try to match var(--components-foo) or var(--components-foo) missing closing paren
  const varFull = /var\(--([A-Za-z0-9-]+)\)/i
  const varNoClose = /var\(--([A-Za-z0-9-]+)\)?/i
  const varM = raw.match(varFull) ?? raw.match(varNoClose)
  if (varM) {
    if (varM[1]) {
      // return captured inner name, e.g. "components-chart-axis-color"
      return varM[1]
    }
  }

  // 2) otherwise find the substring that starts with "components" (case-insensitive)
  const lower = raw.toLowerCase()
  const idx = lower.indexOf('components')
  if (idx === -1) return null

  // take substring from the 'components' position to end
  let sub = raw.slice(idx)

  // strip surrounding punctuation that might remain (closing parens, quotes, semicolons, commas)
  sub = sub.replace(/^[^A-Za-z0-9]+/, '') // remove leading non-alnum
  sub = sub.replace(/[)"';,.\]]+$/g, '') // remove trailing punctuation

  // if it somehow begins with "--components..." (unlikely after starting at 'components'), normalize
  sub = sub.replace(/^--/, '')

  // final sanity check: should start with components
  if (!/^components/i.test(sub)) return null

  // return in original casing (or could be normalized to lowerCase if desired)
  return sub
}

function classTokensFromStrings(strings: string[]): string[] {
  const tokens = new Set<string>()
  for (const s of strings) {
    // remove ${...} template expressions to avoid garbage tokens
    const cleaned = s.replace(/\$\{[^}]*\}/g, ' ')
    // split by whitespace, commas
    const parts = cleaned
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter(Boolean)
    for (const p of parts) {
      const normalized = normalizeToken(p)
      if (normalized) tokens.add(normalized)
    }
  }
  return Array.from(tokens).sort()
}

function extractTopLevelVariables(src: string): string[] {
  const vars = new Set<string>()
  const varRegex =
    /^(?:export\s+)?(?:const|let|var)\s+([A-Za-z0-9_$\{\}\s,=:\[\]]+?)\s*=/gmu
  for (const m of src.matchAll(varRegex)) {
    const decl = m[1].trim()
    if (!decl) continue

    if (decl.startsWith('{')) {
      const inside = decl.slice(1, -1) // strip { }
      const parts = inside
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
      for (const p of parts) {
        const nameMatch = p.match(/^([A-Za-z0-9_$]+)/)
        if (nameMatch) vars.add(nameMatch[1])
      }
    } else if (decl.startsWith('[')) {
      const inside = decl.slice(1, -1) // strip [ ]
      const parts = inside
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
      for (const p of parts) {
        const nameMatch = p.match(/^([A-Za-z0-9_$]+)/)
        if (nameMatch) vars.add(nameMatch[1])
      }
    } else {
      const names = decl
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean)
      for (const n of names) {
        const nm = n.match(/^([A-Za-z0-9_$]+)/)
        if (nm) vars.add(nm[1])
      }
    }
  }

  return Array.from(vars).sort()
}

function detectComponentNameAndProps(
  src: string,
  filePath: string
): { componentName: string; propVariables: string[] } {
  const tryRegex = (r: RegExp): string | null => {
    const m = src.match(r)
    return m ? m[1] : null
  }

  let name = tryRegex(/export\s+default\s+function\s+([A-Za-z0-9_$]+)/)
  if (!name) name = tryRegex(/export\s+function\s+([A-Za-z0-9_$]+)/)
  if (!name)
    name = tryRegex(/export\s+(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=/)
  if (!name) {
    const ed = tryRegex(/export\s+default\s+([A-Za-z0-9_$]+)/)
    if (ed) name = ed
  }
  if (!name) {
    name = tryRegex(/^(?:const|function|class)\s+([A-Za-z0-9_$]+)\s*[=({]/m)
  }
  if (!name) {
    name = path.basename(filePath, path.extname(filePath))
  }

  const propVars = new Set<string>()

  const funcPattern = new RegExp(`function\\s+${name}\\s*\\(([^)]*)\\)`)
  const funcMatch = src.match(funcPattern)
  if (funcMatch && funcMatch[1] !== undefined) {
    const param = funcMatch[1].trim()
    if (param.startsWith('{')) {
      const inside = param.replace(/^\{/, '').replace(/\}$/, '')
      const parts = inside
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
      for (const p of parts) {
        const nameMatch = p.match(/^([A-Za-z0-9_$]+)/)
        if (nameMatch) propVars.add(nameMatch[1])
      }
    } else if (param) {
      const nm = param
        .split('=')[0]
        .trim()
        .split(/\s*,\s*/)[0]
      if (nm) propVars.add(nm)
    }
  } else {
    const arrowPattern = new RegExp(
      `(?:const|let|var)\\s+${name}\\s*=\\s*\\(?([^=)]*)\\)?\\s*=>`
    )
    const arrowMatch = src.match(arrowPattern)
    if (arrowMatch && arrowMatch[1] !== undefined) {
      const param = arrowMatch[1].trim()
      if (param.startsWith('{')) {
        const inside = param.replace(/^\{/, '').replace(/\}$/, '')
        const parts = inside
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean)
        for (const p of parts) {
          const nameMatch = p.match(/^([A-Za-z0-9_$]+)/)
          if (nameMatch) propVars.add(nameMatch[1])
        }
      } else if (param) {
        const nm = param
          .split('=')[0]
          .trim()
          .split(/\s*,\s*/)[0]
        if (nm) propVars.add(nm)
      }
    }
  }

  const exportDefaultInnerFunc = src.match(
    /export\s+default\s+[A-Za-z0-9_$]*\s*\(\s*function\s*\(?([^)]*)\)?\s*\)/
  )
  if (exportDefaultInnerFunc && exportDefaultInnerFunc[1] !== undefined) {
    const param = exportDefaultInnerFunc[1].trim()
    if (param.startsWith('{')) {
      const inside = param.replace(/^\{/, '').replace(/\}$/, '')
      const parts = inside
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
      for (const p of parts) {
        const nameMatch = p.match(/^([A-Za-z0-9_$]+)/)
        if (nameMatch) propVars.add(nameMatch[1])
      }
    } else if (param) {
      propVars.add(param.split('=')[0].trim())
    }
  }

  return { componentName: name, propVariables: Array.from(propVars).sort() }
}

async function run(): Promise<void> {
  try {
    logger.info('Starting manifest build')
    if (!fs.existsSync(ROOT_DIR)) {
      logger.error(`Directory not found: ${ROOT_DIR}`)
      process.exitCode = 1
      return
    }

    const files = await collectFiles(ROOT_DIR)
    logger.info(`Found ${files.length} files to process`)
    const manifest: ManifestEntry[] = []

    for (const filePath of files) {
      const relativePath = path.relative(process.cwd(), filePath)
      const src = await readFile(filePath, 'utf8')
      logger.debug(`Processing file: ${relativePath}`)

      const classStrings = extractClassStrings(src)
      const classes = classTokensFromStrings(classStrings)

      if (classes.length === 0) continue // only include files with "components" classes

      const topVars = extractTopLevelVariables(src)
      const { componentName, propVariables } = detectComponentNameAndProps(
        src,
        filePath
      )

      const variablesSet = new Set<string>([...topVars, ...propVariables])
      const variables = Array.from(variablesSet).sort()

      manifest.push({
        componentName,
        path: relativePath,
        classes,
        variables,
      })
    }

    await writeFile(OUT_FILE, JSON.stringify(manifest, null, 2), 'utf8')
    logger.info(`Successfully wrote ${manifest.length} entries to ${OUT_FILE}`)
  } catch (err) {
    logger.error(
      `Error while generating manifest: ${err instanceof Error ? err.message : String(err)}`
    )
    process.exitCode = 2
  }
}

run()
