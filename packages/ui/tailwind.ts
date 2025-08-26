#!/usr/bin/env bun
/**
 * generate-tailwind-config.ts
 * (same usage as before)
 */

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

type ComponentEntry = {
  componentName: string
  path: string
  classes: string[]
  variables?: string[] // optional
}

type Manifest = ComponentEntry[]

/** Make a safe kebab-case key from an arbitrary string */
function kebabSafeKey(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-') // non allowed -> hyphen
    .replace(/^-+|-+$/g, '') // trim leading/trailing hyphens
    .replace(/-+/g, '-') // collapse multiple hyphens
}

/** Parse CLI args: --manifest and --out */
function parseArgs(argv: string[]) {
  const args: Record<string, string | undefined> = {}
  for (const a of argv.slice(2)) {
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=')
      args[k] = v ?? ''
    }
  }
  return {
    manifestPath: (args.manifest && String(args.manifest)) || './manifest.json',
    outPath: (args.out && String(args.out)) || './tailwind.config.ts',
  }
}

/** Decide which tailwind theme bucket a class should go into */
function classifyClass(cls: string): string {
  const s = cls.toLowerCase()
  // Heuristics (unchanged)
  const colorHints = [
    'bg',
    'background',
    'color',
    'title',
    'label',
    'fill',
    'stroke',
    'primary',
    'secondary',
    'success',
    'error',
    'warning',
    'info',
    'accent',
    'close-color',
    'cancel-color',
  ]
  if (colorHints.some((h) => s.includes(h))) return 'colors'

  if (
    s.includes('font-size') ||
    s.includes('title-font-size') ||
    s.includes('description-font-size')
  )
    return 'fontSize'

  if (
    s.includes('padding') ||
    s.includes('margin') ||
    s.includes('gap') ||
    s.includes('padding-x') ||
    s.includes('padding-y') ||
    s.includes('padding-left') ||
    s.includes('padding-right') ||
    s.includes('padding-top') ||
    s.includes('padding-bottom')
  )
    return 'spacing'

  if (s.includes('radius') || s.includes('rounded')) return 'borderRadius'

  if (s.includes('shadow')) return 'boxShadow'

  if (s.includes('focus-ring') || s.includes('focus') || s.includes('ring'))
    return 'ringColor'

  if (s.includes('border') || s.includes('divider')) return 'borderColor'

  if (
    s.includes('width') ||
    s.includes('-width') ||
    s.endsWith('-w') ||
    s.includes('thumb-size') ||
    s.includes('size')
  )
    return 'width'

  if (s.includes('height') || s.includes('-height') || s.endsWith('-h'))
    return 'height'

  // fallback to colors
  return 'colors'
}

/** Make sure keys are unique within a bucket; if not append incremental suffix */
function uniqueKeyForBucket(bucket: Map<string, string>, baseKey: string) {
  let key = baseKey
  let i = 1
  while (bucket.has(key)) {
    key = `${baseKey}-${i}`
    i++
  }
  return key
}

/** Convert object map into JS literal string with single quotes */
function objectToJsLiteral(obj: Record<string, string>, indent = 8) {
  const pad = (n: number) => ' '.repeat(n)
  const entries = Object.entries(obj)
    .map(([k, v]) => `${pad(indent)}'${k}': '${v}'`)
    .join(',\n')
  return `{\n${entries}\n${pad(indent - 2)}}`
}

async function main() {
  const { manifestPath, outPath } = parseArgs(process.argv)

  const manifestFull = path.resolve(manifestPath)
  const outFull = path.resolve(outPath)

  const raw = await readFile(manifestFull, 'utf8')
  let manifest: Manifest
  try {
    manifest = JSON.parse(raw) as Manifest
  } catch (err) {
    console.error('Error parsing manifest.json:', err)
    process.exit(1)
    return
  }

  // Collect all classes
  const classes = new Set<string>()
  for (const comp of manifest) {
    if (Array.isArray(comp.classes)) {
      for (const c of comp.classes) classes.add(c)
    }
  }

  // Prepare buckets
  const buckets: Record<string, Map<string, string>> = {
    colors: new Map(),
    spacing: new Map(),
    fontSize: new Map(),
    borderRadius: new Map(),
    boxShadow: new Map(),
    ringColor: new Map(),
    borderColor: new Map(),
    width: new Map(),
    height: new Map(),
  }

  // Fill buckets
  for (const cls of Array.from(classes).sort()) {
    const bucketName = classifyClass(cls)
    const bucket = buckets[bucketName]

    // remove "components-" prefix if present for readability
    const withoutPrefix = cls.startsWith('components-')
      ? cls.replace(/^components-/, '')
      : cls

    // produce kebab-case key
    let candidateKey = kebabSafeKey(withoutPrefix)
    if (!candidateKey) candidateKey = kebabSafeKey(cls) || 'key'

    const unique = uniqueKeyForBucket(bucket, candidateKey)
    const cssVar = `var(--theme-${cls})` // maps to --theme-<class>

    bucket.set(unique, cssVar)
  }

  // Build JS output
  // Only include buckets that have entries
  const extendParts: string[] = []
  for (const [bucketName, map] of Object.entries(buckets)) {
    if (map.size === 0) continue
    const obj: Record<string, string> = {}
    for (const [k, v] of map.entries()) obj[k] = v
    extendParts.push(`    ${bucketName}: ${objectToJsLiteral(obj, 8)},`)
  }

  const extendBlock = extendParts.length
    ? `extend: {\n${extendParts.join('\n')}\n  }`
    : ''

  const fileContent = `import type { Config } from "tailwindcss";
export default {
  theme: {
    ${extendBlock}
  },
} satisfies Config;\n`

  await writeFile(outFull, fileContent, 'utf8')

  console.log(`✅ Generated Tailwind config at: ${outFull}`)
  console.log(` - source manifest: ${manifestFull}`)
  console.log(
    ` - included buckets: ${Object.entries(buckets)
      .filter(([_, m]) => m.size > 0)
      .map(([k, m]) => `${k}(${m.size})`)
      .join(', ')}`
  )
}

main().catch((e) => {
  console.error('Unexpected error:', e)
  process.exit(1)
})
