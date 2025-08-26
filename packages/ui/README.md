# @dockstat/ui — Design tokens & component variables

A small, maintainable reference for the Tailwind-compatible design tokens (CSS variables) used by the internal `@dockstat/ui` component library.

This README documents the naming convention, allowed value formats, recommended defaults, and concrete usage examples (Tailwind + React). It’s written to be easy to maintain — treat the tokens here as the single source of truth and generate the CSS variables from a simple JSON/YAML file if the token list grows.

---

## Quick conventions (how to name things)

* Token namespace: `--components-<component>-<property>`
  Example: `--components-card-padding`
* Property types: `size`, `color`, `duration`, `shadow`, `border-size`, `radius` etc.
* Keep names kebab-case (lowercase + `-`).
* Values must include units where applicable (see types below).
* Use semantic tokens where possible (e.g. `components-card-padding-md`) only if you need multiple size variants. Otherwise prefer single token per property.

---

## Allowed formats & rules

### Sizes (for spacing / radius / shadow extents)

Allowed values: follow Tailwind-like sizing or CSS size units.

* Allowed named tokens (for guidance): `none`, `2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`
  (These are *semantic* names — map them to concrete CSS values in the tokens file.)
* Concrete CSS units supported: `px`, `rem`, `em`, `%`, `vh`, `vw`.
  **Examples:** `8px`, `0.5rem`, `1rem`, `50%`.

### Colors

Supported formats: `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex` (3/6/8), named CSS colors.
Prefer HSL or hex for theming. When storing alpha separately, use `rgba` or `hsla`.

### Duration (transitions)

Units: `ms` (milliseconds) or `s` (seconds).
Examples: `200ms`, `0.2s`. Prefer `ms` for precise consistency.

### Border sizes

Units: `px` or `rem`. Example: `1px`, `0.125rem`.

### Shadow

Use full `box-shadow` strings as variable values — this gives full control:
Example: `0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06)`.


## Component token reference

### Card

| Token name                             |        Type | Allowed formats          |                         Default | Purpose                    |
| -------------------------------------- | ----------: | ------------------------ | ------------------------------: | -------------------------- |
| `--components-card-rounding`           |      radius | `px`, `rem`, `%`         |                        `0.5rem` | border-radius              |
| `--components-card-padding`            |        size | `px`, `rem`              |                          `1rem` | inner padding              |
| `--components-card-animation-duration` |    duration | `ms`, `s`                |                         `200ms` | transition duration        |
| `--components-card-border-size`        | border-size | `px`, `rem`              |                           `1px` | border width               |
| `--components-card-border-color`       |       color | `hex`, `rgb`, `hsl`      |                       `#e5e7eb` | border color               |
| `--components-card-shadow`             |      shadow | full `box-shadow` string |    `0 1px 2px rgba(0,0,0,0.06)` | default box-shadow         |
| `--components-card-text-color`         |       color | `hex`, `rgb`, `hsl`      |                       `#111827` | text color inside card     |
| `--components-card-bg-color`           |       color | `hex`, `rgb`, `hsl`      |          `linear-gradient(...)` | background gradient / fill |
| `--components-card-bg-glass-color`     |       color | `hex`, `rgb`, `hsl`, `/` |         `rgba(255,255,255,0.2)` | glass variant background   |
| `--components-card-backdrop-blur`      |        size | `px`, `rem`              |                          `20px` | glass blur strength        |
| `--components-card-hover-border-color` |       color | `hex`, `rgb`, `hsl`      |                       `#3b82f6` | border color on hover      |
| `--components-card-hover-shadow`       |      shadow | full `box-shadow` string | `0 0 12px rgba(59,130,246,0.6)` | shadow on hover            |
| `--components-card-shadow-3d`          |      shadow | full `box-shadow` string |   `0 8px 20px rgba(0,0,0,0.15)` | elevated / 3D shadow       |
| `--components-card-badge-rounding`     |      radius | `px`, `rem`, `%`         |                        `9999px` | full rounding for badge    |
| `--components-card-badge-shadow`       |      shadow | full `box-shadow` string |     `0 2px 4px rgba(0,0,0,0.1)` | inner badge shadow         |
