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

---

## Component token reference


### Card

Source: `src/components/Card.tsx`

| Token name | Type | Allowed formats | Default | Purpose |
| --- | ---: | --- | --- | --- |
| `--components-card-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls background. |
| `--components-card-content-font-color` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls text color for content. |
| `--components-card-content-font-size` | size       | `px`, `rem`, `em`, `%`, `vh`, `vw` | `1rem` | Controls content font size. |
| `--components-card-footer-padding` | size       | `px`, `rem`, `em`, `%`, `vh`, `vw` | `1rem` | Controls footer inner padding. |
| `--components-card-header-padding` | size       | `px`, `rem`, `em`, `%`, `vh`, `vw` | `1rem` | Controls header inner padding. |
| `--components-card-padding` | size       | `px`, `rem`, `em`, `%`, `vh`, `vw` | `1rem` | Controls inner padding. |
| `--components-card-radius` | radius     | `px`, `rem`, `%` | `0.5rem` | Controls border radius. |
| `--components-card-shadow` | shadow     | full `box-shadow` string | `0 1px 2px rgba(0,0,0,0.06)` | Controls box shadow. |

**Exports / props**


```ts
// exports / props for Card
interface CardProps {
  Card?: any;
  CardContent?: any;
  CardFooter?: any;
  CardHeader?: any;
}
```

**Example (Tailwind + React)**

```tsx

import Card from "@dockstat/ui";


<Card style={{

  // example: override using CSS variables
  // e.g. background: var(--components-card-bg)

}}>
  {/* children */}
</Card>

```


### Button

Source: `src/components/Button.tsx`

| Token name | Type | Allowed formats | Default | Purpose |
| --- | ---: | --- | --- | --- |
| `--components-button-font-size` | size       | `px`, `rem`, `em`, `%`, `vh`, `vw` | `1rem` | Controls button font size. |
| `--components-button-padding-x` | size       | `px`, `rem`, `em`, `%`, `vh`, `vw` | `1rem` | Controls button horizontal inner padding. |
| `--components-button-padding-y` | size       | `px`, `rem`, `em`, `%`, `vh`, `vw` | `1rem` | Controls button vertical inner padding. |
| `--components-button-primary-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls button primary background. |
| `--components-button-primary-color` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls button primary color. |
| `--components-button-primary-hover-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls button primary hover background. |
| `--components-button-radius` | radius     | `px`, `rem`, `%` | `0.5rem` | Controls button border radius. |
| `--components-button-secondary-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls button secondary background. |
| `--components-button-secondary-color` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls button secondary color. |
| `--components-button-secondary-hover-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls button secondary hover background. |

**Exports / props**


```ts
// exports / props for Button
interface ButtonProps {
  Button?: any;
}
```

**Example (Tailwind + React)**

```tsx

import Button from "@dockstat/ui";


<Button style={{

  // example: override using CSS variables
  // e.g. background: var(--components-button-font-size)

}}>
  {/* children */}
</Button>

```


### Dropdown

Source: `src/components/Dropdown.tsx`

| Token name | Type | Allowed formats | Default | Purpose |
| --- | ---: | --- | --- | --- |
| `--components-dropdown-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls dropdown background. |
| `--components-dropdown-item-hover-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls dropdown item hover background. |
| `--components-dropdown-item-hover-color` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls dropdown item hover color. |
| `--components-dropdown-radius` | radius     | `px`, `rem`, `%` | `0.5rem` | Controls dropdown border radius. |
| `--components-dropdown-shadow` | shadow     | full `box-shadow` string | `0 1px 2px rgba(0,0,0,0.06)` | Controls dropdown box shadow. |

**Exports / props**


```ts
// exports / props for Dropdown
interface DropdownProps {
  Dropdown?: any;
  DropdownItem?: any;
  children?: React.ReactNode;
  trigger?: any;
}
```

**Example (Tailwind + React)**

```tsx

import Dropdown from "@dockstat/ui";


<Dropdown style={{

  // example: override using CSS variables
  // e.g. background: var(--components-dropdown-bg)

}}>
  {/* children */}
</Dropdown>

```


### Input

Source: `src/components/Input.tsx`

| Token name | Type | Allowed formats | Default | Purpose |
| --- | ---: | --- | --- | --- |
| `--components-input-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls input background. |
| `--components-input-border` | border-size | `px`, `rem` | `1px` | Controls input border width. |
| `--components-input-color` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls input color. |
| `--components-input-focus-ring` | ring       | `box-shadow` or `outline` style (e.g. `0 0 0 3px rgba(...)`) | `0 0 0 3px rgba(59,130,246,0.3)` | Controls input focus ring (outline). |
| `--components-input-font-size` | size       | `px`, `rem`, `em`, `%`, `vh`, `vw` | `1rem` | Controls input font size. |
| `--components-input-padding-x` | size       | `px`, `rem`, `em`, `%`, `vh`, `vw` | `1rem` | Controls input horizontal inner padding. |
| `--components-input-padding-y` | size       | `px`, `rem`, `em`, `%`, `vh`, `vw` | `1rem` | Controls input vertical inner padding. |
| `--components-input-radius` | radius     | `px`, `rem`, `%` | `0.5rem` | Controls input border radius. |

**Exports / props**


```ts
// exports / props for Input
interface InputProps {
  Input?: any;
}
```

**Example (Tailwind + React)**

```tsx

import Input from "@dockstat/ui";


<Input style={{

  // example: override using CSS variables
  // e.g. background: var(--components-input-bg)

}}>
  {/* children */}
</Input>

```


### Textarea

Source: `src/components/Textarea.tsx`

| Token name | Type | Allowed formats | Default | Purpose |
| --- | ---: | --- | --- | --- |
| `--components-textarea-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls textarea background. |
| `--components-textarea-border` | border-size | `px`, `rem` | `1px` | Controls textarea border width. |
| `--components-textarea-color` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls textarea color. |
| `--components-textarea-focus-ring` | ring       | `box-shadow` or `outline` style (e.g. `0 0 0 3px rgba(...)`) | `0 0 0 3px rgba(59,130,246,0.3)` | Controls textarea focus ring (outline). |
| `--components-textarea-font-size` | size       | `px`, `rem`, `em`, `%`, `vh`, `vw` | `1rem` | Controls textarea font size. |
| `--components-textarea-padding-x` | size       | `px`, `rem`, `em`, `%`, `vh`, `vw` | `1rem` | Controls textarea horizontal inner padding. |
| `--components-textarea-padding-y` | size       | `px`, `rem`, `em`, `%`, `vh`, `vw` | `1rem` | Controls textarea vertical inner padding. |
| `--components-textarea-radius` | radius     | `px`, `rem`, `%` | `0.5rem` | Controls textarea border radius. |

**Exports / props**


```ts
// exports / props for Textarea
interface TextareaProps {
  Textarea?: any;
}
```

**Example (Tailwind + React)**

```tsx

import Textarea from "@dockstat/ui";


<Textarea style={{

  // example: override using CSS variables
  // e.g. background: var(--components-textarea-bg)

}}>
  {/* children */}
</Textarea>

```


### Badge

Source: `src/components/Badge.tsx`

| Token name | Type | Allowed formats | Default | Purpose |
| --- | ---: | --- | --- | --- |
| `--components-badge-default-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls badge default background. |
| `--components-badge-default-color` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls badge default color. |
| `--components-badge-error-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls badge error background. |
| `--components-badge-error-color` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls badge error color. |
| `--components-badge-font-size` | size       | `px`, `rem`, `em`, `%`, `vh`, `vw` | `1rem` | Controls badge font size. |
| `--components-badge-padding-x` | size       | `px`, `rem`, `em`, `%`, `vh`, `vw` | `1rem` | Controls badge horizontal inner padding. |
| `--components-badge-padding-y` | size       | `px`, `rem`, `em`, `%`, `vh`, `vw` | `1rem` | Controls badge vertical inner padding. |
| `--components-badge-radius` | radius     | `px`, `rem`, `%` | `0.5rem` | Controls badge border radius. |
| `--components-badge-success-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls badge success background. |
| `--components-badge-success-color` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls badge success color. |
| `--components-badge-warning-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls badge warning background. |
| `--components-badge-warning-color` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls badge warning color. |

**Exports / props**


```ts
// exports / props for Badge
interface BadgeProps {
  Badge?: any;
}
```

**Example (Tailwind + React)**

```tsx

import Badge from "@dockstat/ui";


<Badge style={{

  // example: override using CSS variables
  // e.g. background: var(--components-badge-default-bg)

}}>
  {/* children */}
</Badge>

```


### Progress

Source: `src/components/Progress.tsx`

| Token name | Type | Allowed formats | Default | Purpose |
| --- | ---: | --- | --- | --- |
| `--components-progress-bar-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls progress bar background. |
| `--components-progress-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls progress background. |
| `--components-progress-radius` | radius     | `px`, `rem`, `%` | `0.5rem` | Controls progress border radius. |

**Exports / props**


```ts
// exports / props for Progress
interface ProgressProps {
  Progress?: any;
}
```

**Example (Tailwind + React)**

```tsx

import Progress from "@dockstat/ui";


<Progress style={{

  // example: override using CSS variables
  // e.g. background: var(--components-progress-bar-bg)

}}>
  {/* children */}
</Progress>

```


### Table

Source: `src/components/Table.tsx`

| Token name | Type | Allowed formats | Default | Purpose |
| --- | ---: | --- | --- | --- |
| `--components-table-body-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls table body background. |
| `--components-table-cell-font-size` | size       | `px`, `rem`, `em`, `%`, `vh`, `vw` | `1rem` | Controls table cell font size. |
| `--components-table-cell-padding-x` | size       | `px`, `rem`, `em`, `%`, `vh`, `vw` | `1rem` | Controls table cell horizontal inner padding. |
| `--components-table-cell-padding-y` | size       | `px`, `rem`, `em`, `%`, `vh`, `vw` | `1rem` | Controls table cell vertical inner padding. |
| `--components-table-divider` | token      | string (see usage) |  | Controls table divider. |
| `--components-table-header-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls table header background. |
| `--components-table-radius` | radius     | `px`, `rem`, `%` | `0.5rem` | Controls table border radius. |

**Exports / props**


```ts
// exports / props for Table
interface TableProps {
  Table?: any;
  TableBody?: any;
  TableCell?: any;
  TableHead?: any;
  TableRow?: any;
}
```

**Example (Tailwind + React)**

```tsx

import Table from "@dockstat/ui";


<Table style={{

  // example: override using CSS variables
  // e.g. background: var(--components-table-body-bg)

}}>
  {/* children */}
</Table>

```


### Modal

Source: `src/components/Dialog.tsx`

| Token name | Type | Allowed formats | Default | Purpose |
| --- | ---: | --- | --- | --- |
| `--components-dialog-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls background. |
| `--components-dialog-overlay-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls overlay background. |
| `--components-dialog-padding` | size       | `px`, `rem`, `em`, `%`, `vh`, `vw` | `1rem` | Controls inner padding. |
| `--components-dialog-radius` | radius     | `px`, `rem`, `%` | `0.5rem` | Controls border radius. |
| `--components-dialog-shadow` | shadow     | full `box-shadow` string | `0 1px 2px rgba(0,0,0,0.06)` | Controls box shadow. |

**Exports / props**


```ts
// exports / props for Modal
interface ModalProps {
  Modal?: any;
  children?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
}
```

**Example (Tailwind + React)**

```tsx

import Modal from "@dockstat/ui";


<Modal style={{

  // example: override using CSS variables
  // e.g. background: var(--components-dialog-bg)

}}>
  {/* children */}
</Modal>

```


### ToggleSwitch

Source: `src/components/Switch.tsx`

| Token name | Type | Allowed formats | Default | Purpose |
| --- | ---: | --- | --- | --- |
| `--components-switch-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls switch background. |
| `--components-switch-enabled-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls switch enabled background. |
| `--components-switch-focus-ring` | ring       | `box-shadow` or `outline` style (e.g. `0 0 0 3px rgba(...)`) | `0 0 0 3px rgba(59,130,246,0.3)` | Controls switch focus ring (outline). |
| `--components-switch-height` | size       | `px`, `rem`, `em`, `%`, `vh`, `vw` | `1rem` | Controls switch height. |
| `--components-switch-radius` | radius     | `px`, `rem`, `%` | `0.5rem` | Controls switch border radius. |
| `--components-switch-thumb-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls switch thumb (knob) background. |
| `--components-switch-thumb-enabled-transform` | size       | `px`, `rem`, `em`, `%`, `vh`, `vw` | `1rem` | Controls switch thumb (knob) enabled transform. |
| `--components-switch-thumb-radius` | radius     | `px`, `rem`, `%` | `0.5rem` | Controls switch thumb (knob) border radius. |
| `--components-switch-thumb-size` | size       | `px`, `rem`, `em`, `%`, `vh`, `vw` | `1rem` | Controls switch thumb (knob) size. |
| `--components-switch-width` | size       | `px`, `rem`, `em`, `%`, `vh`, `vw` | `1rem` | Controls switch width. |

**Exports / props**


```ts
// exports / props for ToggleSwitch
interface ToggleSwitchProps {
  ToggleSwitch?: any;
}
```

**Example (Tailwind + React)**

```tsx

import ToggleSwitch from "@dockstat/ui";


<ToggleSwitch style={{

  // example: override using CSS variables
  // e.g. background: var(--components-switch-bg)

}}>
  {/* children */}
</ToggleSwitch>

```


### HoverCard

Source: `src/components/HoverCard.tsx`

| Token name | Type | Allowed formats | Default | Purpose |
| --- | ---: | --- | --- | --- |
| `--components-hovercard-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls background. |
| `--components-hovercard-padding` | size       | `px`, `rem`, `em`, `%`, `vh`, `vw` | `1rem` | Controls inner padding. |
| `--components-hovercard-radius` | radius     | `px`, `rem`, `%` | `0.5rem` | Controls border radius. |
| `--components-hovercard-shadow` | shadow     | full `box-shadow` string | `0 1px 2px rgba(0,0,0,0.06)` | Controls box shadow. |

**Exports / props**


```ts
// exports / props for HoverCard
interface HoverCardProps {
  HoverCard?: any;
}
```

**Example (Tailwind + React)**

```tsx

import HoverCard from "@dockstat/ui";


<HoverCard style={{

  // example: override using CSS variables
  // e.g. background: var(--components-hovercard-bg)

}}>
  {/* children */}
</HoverCard>

```


### Chart

Source: `src/components/Chart.tsx`

| Token name | Type | Allowed formats | Default | Purpose |
| --- | ---: | --- | --- | --- |
| `--components-chart-axis-color` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls chart axis color. |
| `--components-chart-bar-color` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls chart bar color. |
| `--components-chart-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls chart background. |
| `--components-chart-grid-color` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls chart grid color. |
| `--components-chart-label-color` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls chart label color. |
| `--components-chart-padding` | size       | `px`, `rem`, `em`, `%`, `vh`, `vw` | `1rem` | Controls chart inner padding. |
| `--components-chart-radius` | radius     | `px`, `rem`, `%` | `0.5rem` | Controls chart border radius. |
| `--components-chart-title-color` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls chart title color. |
| `--components-chart-title-font-size` | size       | `px`, `rem`, `em`, `%`, `vh`, `vw` | `1rem` | Controls chart title font size. |
| `--components-chart-tooltip-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls chart tooltip background. |
| `--components-chart-tooltip-border` | border-size | `px`, `rem` | `1px` | Controls chart tooltip border width. |
| `--components-chart-tooltip-color` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls chart tooltip color. |
| `--components-chart-tooltip-radius` | radius     | `px`, `rem`, `%` | `0.5rem` | Controls chart tooltip border radius. |

**Exports / props**


```ts
// exports / props for Chart
interface ChartProps {
  Chart?: any;
}
```

**Example (Tailwind + React)**

```tsx

import Chart from "@dockstat/ui";


<Chart style={{

  // example: override using CSS variables
  // e.g. background: var(--components-chart-axis-color)

}}>
  {/* children */}
</Chart>

```


### Toaster

Source: `src/components/Sonner.tsx`

| Token name | Type | Allowed formats | Default | Purpose |
| --- | ---: | --- | --- | --- |
| `--components-sonner-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls background. |
| `--components-sonner-border` | border-size | `px`, `rem` | `1px` | Controls border width. |
| `--components-sonner-button-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls button background. |
| `--components-sonner-button-color` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls button color. |
| `--components-sonner-button-font-size` | size       | `px`, `rem`, `em`, `%`, `vh`, `vw` | `1rem` | Controls button font size. |
| `--components-sonner-cancel-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls cancel background. |
| `--components-sonner-cancel-color` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls cancel color. |
| `--components-sonner-close-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls close background. |
| `--components-sonner-close-color` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls close color. |
| `--components-sonner-color` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls color. |
| `--components-sonner-description-font-size` | size       | `px`, `rem`, `em`, `%`, `vh`, `vw` | `1rem` | Controls description font size. |
| `--components-sonner-error-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls error background. |
| `--components-sonner-error-border` | border-size | `px`, `rem` | `1px` | Controls error border width. |
| `--components-sonner-error-color` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls error color. |
| `--components-sonner-info-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls info background. |
| `--components-sonner-info-border` | border-size | `px`, `rem` | `1px` | Controls info border width. |
| `--components-sonner-info-color` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls info color. |
| `--components-sonner-loading-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls loading background. |
| `--components-sonner-loading-border` | border-size | `px`, `rem` | `1px` | Controls loading border width. |
| `--components-sonner-loading-color` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls loading color. |
| `--components-sonner-success-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls success background. |
| `--components-sonner-success-border` | border-size | `px`, `rem` | `1px` | Controls success border width. |
| `--components-sonner-success-color` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls success color. |
| `--components-sonner-title-font-size` | size       | `px`, `rem`, `em`, `%`, `vh`, `vw` | `1rem` | Controls title font size. |
| `--components-sonner-warning-bg` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls warning background. |
| `--components-sonner-warning-border` | border-size | `px`, `rem` | `1px` | Controls warning border width. |
| `--components-sonner-warning-color` | color      | `hsl()`, `hsla()`, `rgb()`, `rgba()`, `#hex`, named CSS colors | `#111827` | Controls warning color. |

**Exports / props**


```ts
// exports / props for Toaster
interface ToasterProps {
  Toaster?: any;
  position?: "top" | "bottom" | "left" | "right";
  toast?: any;
}
```

**Example (Tailwind + React)**

```tsx

import Toaster from "@dockstat/ui";


<Toaster style={{

  // example: override using CSS variables
  // e.g. background: var(--components-sonner-bg)

}}>
  {/* children */}
</Toaster>

```


---

*This README was generated from `manifest.json` by `createReadme.ts`.*

To regenerate: `bun ./createReadme.ts [manifest.json] [OUT_README.md]` (defaults: ./manifest.json -> ./README.md)
