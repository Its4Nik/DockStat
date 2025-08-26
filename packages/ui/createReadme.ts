#!/usr/bin/env bun
/**
 * generate-readme.ts
 *
 * Usage:
 *   chmod +x ./generate-readme.ts
 *   ./generate-readme.ts            # reads ./manifest.json and writes ./README.md
 *   ./generate-readme.ts manifest.json OUT_README.md
 *
 * Notes:
 * - Designed to run with bun (bun vX+). It's plain TypeScript and uses Bun/Node fs API.
 * - Heuristics are used to infer token types and example defaults. Tweak inferType() or
 *   defaults map if you want different behavior.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

type ManifestItem = {
  componentName: string
  path: string
  classes: string[]
  variables: string[]
}

const args = process.argv.slice(2)
const manifestPath = args[0] ?? './manifest.json'
const outPath = args[1] ?? './README.md'

/* ---------- Utilities / heuristics ---------- */

function safeReadJSON(filePath: string) {
  const raw = readFileSync(filePath, { encoding: 'utf-8' })
  return JSON.parse(raw)
}

function kebabToSentence(k: string) {
  // quick conversion of kebab-case -> readable sentence fragment
  return k
    .replace(/-/g, ' ')
    .replace(/\b(bg)\b/g, 'background')
    .replace(/\b(px|rem|em|%|vh|vw)\b/g, (m) => m)
    .replace(/\b(btn|btns)\b/g, '')
    .replace(/\b(card|components|component|dialog|sonner|hovercard)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function humanPurpose(tokenKebab: string) {
  // tokenKebab is like "card-padding" or "card-content-font-color" (we expect leading component removed)
  // produce a short purpose sentence.
  const s = tokenKebab
    .replace(/^-/g, '')
    .replace(/(^|\s)(bg)\b/g, '$1background')
    .replace(/\bpadding-x\b/g, 'horizontal padding')
    .replace(/\bpadding-y\b/g, 'vertical padding')
    .replace(/\bpadding\b/g, 'inner padding')
    .replace(/\bfont-size\b/g, 'font size')
    .replace(/\bcontent-font-color\b/g, 'text color for content')
    .replace(/\bcolor\b/g, 'color')
    .replace(/\bborder\b/g, 'border width')
    .replace(/\bradius\b/g, 'border radius')
    .replace(/\bshadow\b/g, 'box shadow')
    .replace(/\bfocus-ring\b/g, 'focus ring (outline)')
    .replace(/\bthumb\b/g, 'thumb (knob)')
    .replace(/\bwidth\b/g, 'width')
    .replace(/\bheight\b/g, 'height')

  const phrase = kebabToSentence(s)
  return `Controls ${phrase}.`
}

function inferTypeFromClass(cls: string): string {
  // remove leading components-...-<rest> => inspect rest
  const parts = cls.split('-')
  // last words can indicate type
  const tail = parts.slice(2).join('-') // remove "components-<component>-..."
  const word = tail.toLowerCase()

  if (
    /\b(color|bg|fill|title-color|label-color|description-color|info-color|success-color|error-color|warning-color)\b/.test(
      word
    )
  )
    return 'color'
  if (/\b(bg|background)\b/.test(word)) return 'color'
  if (
    /\b(font-size|text-size|title-font-size|description-font-size|cell-font-size)\b/.test(
      word
    )
  )
    return 'size'
  if (
    /\b(padding|padding-x|padding-y|pad|padding-left|padding-right)\b/.test(
      word
    )
  )
    return 'size'
  if (/\b(radius|rounding|border-radius)\b/.test(word)) return 'radius'
  if (/\b(shadow)\b/.test(word)) return 'shadow'
  if (/\b(duration|time|transition)\b/.test(word)) return 'duration'
  if (/\b(border-size|border-width|border)\b/.test(word)) return 'border-size'
  if (/\b(overlay|backdrop)\b/.test(word)) return 'color'
  if (/\b(height|width|size|thumb-size|thumb)\b/.test(word)) return 'size'
  if (/\b(transform|translate|enabled-transform)\b/.test(word))
    return 'transform'
  if (/\b(opacity|alpha|transparent)\b/.test(word)) return 'number'
  if (/\b(ring|focus-ring)\b/.test(word)) return 'ring'
  // default fallback
  return 'token'
}

function allowedFormatsForType(t: string) {
  switch (t) {
    case 'color':
      return '`hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors'
    case 'size':
      return '`px`, `rem`, `em`, `%`, `vh`, `vw`'
    case 'radius':
      return '`px`, `rem`, `%`'
    case 'duration':
      return '`ms`, `s`'
    case 'border-size':
      return '`px`, `rem`'
    case 'shadow':
      return 'full `box-shadow` string'
    case 'transform':
      return 'CSS transform (e.g. `translateX(0.5rem)`)'
    case 'ring':
      return '`box-shadow` or `outline` style (e.g. `0 0 0 3px rgba(...)`)'
    case 'number':
      return 'numeric value (unitless) or `%`'
    default:
      return 'string (see usage)'
  }
}

function exampleDefaultForType(t: string) {
  switch (t) {
    case 'color':
      return '#111827'
    case 'size':
      return '1rem'
    case 'radius':
      return '0.5rem'
    case 'duration':
      return '200ms'
    case 'border-size':
      return '1px'
    case 'shadow':
      return '0 1px 2px rgba(0,0,0,0.06)'
    case 'transform':
      return 'translateX(0)'
    case 'ring':
      return '0 0 0 3px rgba(59,130,246,0.3)'
    case 'number':
      return '1'
    default:
      return ''
  }
}

function tokenNameFromClass(cls: string) {
  // class is like components-card-padding -> convert to --components-card-padding
  return `--${cls}`
}

function mkTableRow(
  token: string,
  type: string,
  allowed: string,
  def: string,
  purpose: string
) {
  // escape backticks if present
  const defCell = def ? `\`${def}\`` : ''
  return `| \`${token}\` | ${type.padEnd(10)} | ${allowed} | ${defCell} | ${purpose} |`
}

/* ---------- README template header (keeps your original style) ---------- */

const README_HEADER = `# @dockstat/ui — Design tokens & component variables

A small, maintainable reference for the Tailwind-compatible design tokens (CSS variables) used by the internal \`@dockstat/ui\` component library.

This README documents the naming convention, allowed value formats, recommended defaults, and concrete usage examples (Tailwind + React). It’s written to be easy to maintain — treat the tokens here as the single source of truth and generate the CSS variables from a simple JSON/YAML file if the token list grows.

---

## Quick conventions (how to name things)

* Token namespace: \`--components-<component>-<property>\`
  Example: \`--components-card-padding\`
* Property types: \`size\`, \`color\`, \`duration\`, \`shadow\`, \`border-size\`, \`radius\` etc.
* Keep names kebab-case (lowercase + \`-\`).
* Values must include units where applicable (see types below).
* Use semantic tokens where possible (e.g. \`components-card-padding-md\`) only if you need multiple size variants. Otherwise prefer single token per property.

---

## Allowed formats & rules

### Sizes (for spacing / radius / shadow extents)

Allowed values: follow Tailwind-like sizing or CSS size units.

* Allowed named tokens (for guidance): \`none\`, \`2xs\`, \`xs\`, \`sm\`, \`md\`, \`lg\`, \`xl\`, \`2xl\`
  (These are *semantic* names — map them to concrete CSS values in the tokens file.)
* Concrete CSS units supported: \`px\`, \`rem\`, \`em\`, \`%\`, \`vh\`, \`vw\`.
  **Examples:** \`8px\`, \`0.5rem\`, \`1rem\`, \`50%\`.

### Colors

Supported formats: \`hsl()\`, \`hsla()\`, \`rgb()\`, \`rgba()\`, \`#hex\` (3/6/8), named CSS colors.
Prefer HSL or hex for theming. When storing alpha separately, use \`rgba\` or \`hsla\`.

### Duration (transitions)

Units: \`ms\` (milliseconds) or \`s\` (seconds).
Examples: \`200ms\`, \`0.2s\`. Prefer \`ms\` for precise consistency.

### Border sizes

Units: \`px\` or \`rem\`. Example: \`1px\`, \`0.125rem\`.

### Shadow

Use full \`box-shadow\` strings as variable values — this gives full control:
Example: \`0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06)\`.

---

## Component token reference
`

/* ---------- Main generation ---------- */

function generateForManifest(manifest: ManifestItem[]) {
  const parts: string[] = []
  parts.push(README_HEADER)

  for (const comp of manifest) {
    parts.push(`\n### ${comp.componentName}\n`)
    parts.push(`Source: \`${comp.path}\`\n`)
    // Table header
    parts.push(
      '| Token name | Type | Allowed formats | Default | Purpose |\n' +
        '| --- | ---: | --- | --- | --- |'
    )

    for (const cls of comp.classes) {
      const token = tokenNameFromClass(cls)
      const type = inferTypeFromClass(cls)
      const allowed = allowedFormatsForType(type)
      const def = exampleDefaultForType(type)
      const purpose = humanPurpose(comp.componentName)
      parts.push(mkTableRow(token, type, allowed, def, purpose))
    }

    // Variables / props section
    if (comp.variables.length) {
      parts.push('\n**Exports / props**\n\n')
      parts.push(
        `\`\`\`ts\n// exports / props for ${comp.componentName}\ninterface ${comp.componentName}Props {`
      )
      for (const v of comp.variables) {
        // simple typing heuristics
        const name = v
        const t =
          name === 'children'
            ? 'React.ReactNode'
            : name === 'isOpen' || name === 'open'
              ? 'boolean'
              : name === 'onClose' || name.startsWith('on')
                ? '() => void'
                : name === 'position'
                  ? `"top" | "bottom" | "left" | "right"`
                  : 'any'
        parts.push(`  ${name}?: ${t};`)
      }
      parts.push('}\n```\n')
    }

    // Usage example (Tailwind + React)
    parts.push('**Example (Tailwind + React)**\n')
    parts.push('```tsx\n')
    parts.push(`import ${comp.componentName} from "@dockstat/ui";\n\n`)
    // Build a tiny inline style example using first 2 tokens (if present)
    const sampleTokens = comp.classes.slice(0, 2).map((c) => `var(--${c})`)
    parts.push(`<${comp.componentName} style={{\n`)
    if (sampleTokens[0])
      parts.push(
        `  // example: override using CSS variables\n  // e.g. background: ${sampleTokens[0]}\n`
      )
    parts.push(`}}>\n  {/* children */}\n</${comp.componentName}>\n`)
    parts.push('```\n')
  }

  // Append a short footer with how to regenerate
  parts.push(
    '\n---\n\n*This README was generated from `manifest.json` by `generate-readme.ts`.*\n'
  )
  parts.push(
    'To regenerate: `bun ./createReadme.ts [manifest.json] [OUT_README.md]` (defaults: ./manifest.json -> ./README.md)\n'
  )

  return parts.join('\n')
}

/* ---------- Run ---------- */

try {
  const absManifest = path.resolve(manifestPath)
  const manifest = safeReadJSON(absManifest) as ManifestItem[]
  const md = generateForManifest(manifest)
  writeFileSync(outPath, md, { encoding: 'utf-8' })
  console.log(`✔ README generated to ${outPath} (from ${manifestPath})`)
} catch (err: unknown) {
  console.error(
    '✖ Failed to generate README:',
    (err as Error)?.message ?? String(err)
  )
  process.exit(1)
}
