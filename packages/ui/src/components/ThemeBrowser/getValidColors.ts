import { PREVIEW_COLORS } from "./consts"

const PREVIEW_COLOR_KEYS = new Set(PREVIEW_COLORS.map((c) => c.key))

const GRADIENT_OR_EFFECT_RE = /(linear-gradient|radial-gradient|drop-shadow|box-shadow)/i

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const RGB_RE = /^rgba?\(/i
const HSL_RE = /^hsla?\(/i
const NAMED_COLOR_RE = /^[a-z]+$/i

export const getValidColors = (vars: Record<string, string>): Record<string, string> => {
  const validColors: Record<string, string> = {}

  for (const [key, rawValue] of Object.entries(vars)) {
    if (
      !PREVIEW_COLOR_KEYS.has(
        key as
          | "--color-main-bg"
          | "--color-primary-text"
          | "--color-accent"
          | "--color-card-default-bg"
          | "--color-badge-primary-bg"
          | "--color-error"
          | "--color-success"
      )
    )
      continue

    const value = rawValue.trim()

    if (!value || GRADIENT_OR_EFFECT_RE.test(value) || value.startsWith("0 0")) {
      continue
    }

    if (
      HEX_RE.test(value) ||
      RGB_RE.test(value) ||
      HSL_RE.test(value) ||
      NAMED_COLOR_RE.test(value)
    ) {
      validColors[key] = value
    }
  }

  return validColors
}
