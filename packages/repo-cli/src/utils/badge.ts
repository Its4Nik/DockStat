import type { BadgeOptions } from "../types"

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function measureText(text: string): number {
  const avgCharWidth = 6.8
  return Math.ceil(text.length * avgCharWidth) + 14
}

// 16x16 icon paths (from Lucide/Heroicons style)
export const ICONS = {
  plugin: `<path d="M12 2v4m0 12v4M2 12h4m12 0h4m-5.66-5.66l2.83-2.83m-11.31 0l2.83 2.83m5.65 5.66l2.83 2.83m-11.31 0l2.83-2.83" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  puzzle: `<path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0 1 12 2c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.878.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  palette: `<path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75c.969 0 1.781-.774 1.781-1.781 0-.466-.18-.903-.506-1.22a1.766 1.766 0 0 1-.507-1.219c0-.969.774-1.78 1.781-1.78h2.101c3.206 0 5.85-2.644 5.85-5.85 0-4.965-4.365-8.15-9.75-8.15Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7.5" cy="10.5" r="1" fill="currentColor"/><circle cx="10.5" cy="7.5" r="1" fill="currentColor"/><circle cx="13.5" cy="7.5" r="1" fill="currentColor"/><circle cx="16.5" cy="10.5" r="1" fill="currentColor"/>`,
  layers: `<path d="m12 2 9 4.5-9 4.5-9-4.5L12 2Zm0 0v4.5m9 4.5-9 4.5-9-4.5m18 5-9 4.5-9-4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  github: `<path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10Z" fill="currentColor"/>`,
  gitlab: `<path d="m22 13.29-3.5-10.74a.86.86 0 0 0-.81-.55.88.88 0 0 0-.84.61l-2.36 7.25H9.51L7.15 2.61a.88.88 0 0 0-.84-.61.86.86 0 0 0-.81.55L2 13.29a1.72 1.72 0 0 0 .61 1.92l9.06 6.59a.35.35 0 0 0 .66 0l9.06-6.59a1.72 1.72 0 0 0 .61-1.92Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  server: `<rect x="3" y="3" width="18" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="3" y="15" width="18" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="7" cy="6" r="1" fill="currentColor"/><circle cx="7" cy="18" r="1" fill="currentColor"/>`,
  folder: `<path d="M3 6.75A2.25 2.25 0 0 1 5.25 4.5h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12a1.5 1.5 0 0 0 1.06.44h6.379A2.25 2.25 0 0 1 21 8.75v9a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 17.75v-11Z" fill="none" stroke="currentColor" stroke-width="1.5"/>`,
  globe: `<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3 12h18M12 3a15.3 15.3 0 0 1 4 9 15.3 15.3 0 0 1-4 9 15.3 15.3 0 0 1-4-9 15.3 15.3 0 0 1 4-9Z" fill="none" stroke="currentColor" stroke-width="1.5"/>`,
  shield: `<path d="M12 3.5 3.5 7v4.5c0 5.25 3.625 10.125 8.5 11.5 4.875-1.375 8.5-6.25 8.5-11.5V7L12 3.5Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  shieldCheck: `<path d="M12 3.5 3.5 7v4.5c0 5.25 3.625 10.125 8.5 11.5 4.875-1.375 8.5-6.25 8.5-11.5V7L12 3.5Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="m9 12 2 2 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  check: `<path d="M4.5 12.75l6 6 9-13.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  tag: `<path d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="6" r="1" fill="currentColor"/>`,
} as const

export type IconName = keyof typeof ICONS

export interface BadgeOptionsWithIcon extends BadgeOptions {
  icon?: IconName
}

export function createBadge(options: BadgeOptionsWithIcon): string {
  const { label, message, color, labelColor = "#1e293b", style = "flat", icon } = options

  const iconSize = 14
  const iconPadding = icon ? iconSize + 6 : 0
  const labelWidth = measureText(label) + iconPadding
  const messageWidth = measureText(message)
  const totalWidth = labelWidth + messageWidth + 4
  const height = 26
  const radius = style === "flat-square" ? 4 : 13

  const uid = Math.random().toString(36).slice(2, 8)

  const iconSvg = icon
    ? `<g transform="translate(8, ${(height - iconSize) / 2})" color="#fff" opacity="0.9">
        <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none">
          ${ICONS[icon]}
        </svg>
      </g>`
    : ""

  const labelX = icon ? iconPadding + (labelWidth - iconPadding) / 2 : labelWidth / 2

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" role="img" aria-label="${escapeXml(label)}: ${escapeXml(message)}">
  <title>${escapeXml(label)}: ${escapeXml(message)}</title>
  <defs>
    <linearGradient id="grad-${uid}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.08"/>
    </linearGradient>
    <filter id="shadow-${uid}" x="-5%" y="-5%" width="110%" height="120%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.2"/>
    </filter>
  </defs>
  <g filter="url(#shadow-${uid})">
    <rect width="${totalWidth}" height="${height}" rx="${radius}" fill="${labelColor}"/>
    <rect x="${labelWidth}" width="${messageWidth + 4}" height="${height}" rx="${radius}" fill="${color}"/>
    <rect x="${labelWidth}" width="${Math.min(radius, messageWidth)}" height="${height}" fill="${color}"/>
    <rect width="${totalWidth}" height="${height}" rx="${radius}" fill="url(#grad-${uid})"/>
  </g>
  ${iconSvg}
  <g fill="#fff" text-anchor="middle" font-family="system-ui,-apple-system,BlinkMacSystemFont,sans-serif" font-weight="600" font-size="11">
    <text x="${labelX}" y="17" opacity="0.95">${escapeXml(label)}</text>
    <text x="${labelWidth + messageWidth / 2 + 2}" y="17">${escapeXml(message)}</text>
  </g>
</svg>`
}

export const COLORS = {
  green: "#10b981",
  brightgreen: "#22c55e",
  yellow: "#f59e0b",
  yellowgreen: "#84cc16",
  orange: "#f97316",
  red: "#ef4444",
  blue: "#3b82f6",
  lightgrey: "#64748b",
  grey: "#475569",
  purple: "#8b5cf6",
  pink: "#ec4899",
  cyan: "#06b6d4",
  indigo: "#6366f1",
  teal: "#14b8a6",
} as const
