---
name: dockstat-ui
description: Use when building UI with @dockstat/ui components - the DockStat component library. Includes cards, buttons, badges, tables, forms, modals, sidebars, navigation, slides, theme browser/editor, and specialized graph nodes.
license: MIT
---

# DockStat UI (@dockstat/ui)

The DockStat UI package provides a cohesive set of React components for building DockStat applications. All components use Tailwind CSS v4 with CSS variables for theming and framer-motion for animations.

## Installation & Imports

```bash
# Package is @dockstat/ui, typically used as workspace:* in monorepos
```

```tsx
// Import components from the central index
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Badge,
  Table,
  Input,
  Toggle,
  Modal,
  Slider,
  LinkWithIcon,
  Navbar,
  Sidebar,
  Slides,
  Divider,
  Checkbox,
  CheckboxGroup,
  ThemeBrowser,
  ThemeEditor,
  ThemeSidebar,
  PluginsPage,
  HoverBubble,
} from "@dockstat/ui"

// Graph node components
import { ContainerNode, HostNode, DockNode, ClientNode, nodeTypes } from "@dockstat/ui"

// Onboarding
import { Onboarding } from "@dockstat/ui/welcome"

// CSS variables (Tailwind v4 custom properties)
import "@dockstat/ui/css"
```

## Design System

### Color Tokens (CSS Variables)

All components reference CSS variables for theming. The following patterns are used:

| Token Pattern | Usage |
|--------------|-------|
| `--color-primary-*` | Primary action colors |
| `--color-secondary-*` | Secondary/muted elements |
| `--color-accent` | Accent/highlight colors |
| `--color-error-*` | Error states |
| `--color-success-*` | Success states |
| `--color-warning-*` | Warning states |
| `--color-main-bg` | Main background |
| `--color-card-*` | Card backgrounds and borders |
| `--color-text-*` | Text colors (primary, secondary, muted) |
| `--color-border-*` | Border colors |
| `--color-toggle-*` | Toggle switch colors |
| `--color-slider-*` | Slider track and thumb |
| `--color-badge-*` | Badge variants |
| `--color-button-*` | Button variants |
| `--color-input-*` | Input field colors |
| `--color-table-*` | Table styling |
| `--color-hover-bubble-*` | Tooltip/HoverBubble colors |
| `--color-modal-*` | Modal backdrop |

### Typography Scale

| Size | Class | Use Case |
|------|-------|----------|
| xs | `text-xs` | Labels, badges, captions |
| sm | `text-sm` | Secondary text, table cells |
| md (default) | `text-base` | Body text |
| lg | `text-lg` | Subheadings |
| xl+ | `text-2xl` | Page headings (Navbar heading) |

### Spacing Convention

Use Tailwind's spacing scale. Components internally use:
- `p-1` to `p-8` for card padding (by size)
- `gap-1` to `gap-6` for flex gaps
- `mb-4`, `mt-4` for section spacing
- `px-3 py-2` for default input padding

### Motion & Animation

Components use framer-motion with these patterns:

1. **Button press feedback**: `whileTap={{ scale: 0.96 }}`
2. **Card hover**: `hover:shadow-lg` with `transition-all duration-200`
3. **Modal transitions**: Backdrop fade + content scale/opacity
4. **Sidebar**: Slide-in from left with backdrop blur
5. **Navbar badges**: Float animation with `floatVariants`
6. **Loading states**: Spinner animations in buttons

## Component Reference

### Card

Container component with multiple variants.

```tsx
import { Card, CardBody, CardHeader, CardFooter } from "@dockstat/ui"

<Card
  variant="default"        // "default" | "outlined" | "elevated" | "flat" | "dark" | "error" | "success" | "custom"
  size="md"               // "xs" | "sm" | "md" | "lg"
  hoverable={false}       // Enable hover shadow effect
  glass={false}           // Glassmorphism effect with backdrop blur
  onClick={undefined}     // Makes card clickable
  className="custom-class"
>
  <CardHeader>Title</CardHeader>
  <CardBody>Content here</CardBody>
  <CardFooter>Footer actions</CardFooter>
</Card>
```

**Sizes:**
- `xs`: `p-1`
- `sm`: `p-3`
- `md` (default): `p-6`
- `lg`: `p-8`

**Variants:**
- `default`: Standard card with border
- `outlined`: Border-only, transparent background
- `elevated`: Enhanced shadow, no border
- `flat`: No border/shadow, muted text
- `dark`: Dark themed with subtle border
- `error`: Red border for error states
- `success`: Green border for success states
- `custom`: No default styling (add your own)

**Glass mode**: Adds `backdrop-blur-lg` and 20% background opacity to any variant.

---

### Button

Primary interactive element with loading state support.

```tsx
import { Button } from "@dockstat/ui"

<Button
  variant="primary"        // "primary" | "secondary" | "outline" | "ghost" | "danger"
  size="md"              // "xs" | "sm" | "md" | "lg"
  disabled={false}
  loading={false}        // Shows spinner, disables button
  fullWidth={false}      // w-full
  type="button"         // "button" | "submit" | "reset"
  noFocusRing={false}   // Remove focus ring (for custom focus handling)
  onClick={() => {}}
>
  Click me
</Button>
```

**Sizes:**
- `xs`: `px-1 py-0.5 text-xs`
- `sm`: `px-3 py-1.5 text-sm`
- `md` (default): `px-4 py-2 text-base`
- `lg`: `px-6 py-3 text-lg`

**Best practices:**
- Use `loading` for async operations (shows spinner, prevents clicks)
- Use `noFocusRing` when the surrounding UI provides its own focus handling
- Danger variant for destructive actions

---

### Badge

Small label/tag for status, counts, or categorization.

```tsx
import { Badge } from "@dockstat/ui"

<Badge
  variant="primary"      // "primary" | "secondary" | "success" | "warning" | "error"
  size="md"            // "xs" | "sm" | "md" | "lg"
  rounded={false}      // rounded-full vs rounded-md
  outlined={false}     // Bordered outline style vs filled
  unique={false}       // Deterministic color from content (ignores variant)
  className="font-mono"
>
  Label
</Badge>
```

**Sizes:**
- `xs`: `px-1 py-0.5 text-xs`
- `sm`: `px-2 py-0.5 text-xs`
- `md` (default): `px-2.5 py-0.5 text-sm`
- `lg`: `px-3 py-1 text-base`

**Use cases:**
- `unique`: Generate consistent color per item (e.g., request IDs)
- `outlined`: Subtle style for active nav items
- `rounded`: Pill shape for tags

---

### Table

Data table with sorting, filtering, search, and virtualization.

```tsx
import { Table, type Column } from "@dockstat/ui"

<Table
  data={items}            // Array of objects
  columns={columns}       // Column definitions
  size="md"             // "sm" | "md" | "lg" - affects row height
  striped={false}        // Alternating row colors
  bordered={false}       // Show borders
  hoverable={false}      // Highlight row on hover
  searchable={false}     // Show search/filter toolbar
  searchPlaceholder="Search..."
  rowKey="id"           // Key field for rows
  virtualizeThreshold={100}  // Rows before virtualization kicks in
  maxHeight={600}        // Max height for scrollable table
  className="custom-class"
/>
```

**Column definition:**

```tsx
type Column<T> = {
  key: keyof T | string
  title: string
  align?: "left" | "center" | "right"
  render?: (value: T[keyof T], row: T) => React.ReactNode
}
```

**Row heights:**
- `sm`: Compact rows
- `md` (default): Standard rows  
- `lg`: Comfortable rows

**Features:**
- Automatic virtualization for large datasets (100+ rows)
- Sortable columns via click on header
- Search across all fields when `searchable`
- Filter by column when `searchable`

---

### Input

Form input field with multiple variants.

```tsx
import { Input } from "@dockstat/ui"

<Input
  type="text"           // "text" | "email" | "password" | "number" | "tel" | "url" | "color" | "operation"
  size="md"           // "sm" | "md" | "lg"
  variant="default"  // "default" | "filled" | "underline"
  disabled={false}
  placeholder="Enter value..."
  error={false}       // Red border + error ring
  success={false}     // Green border + success ring
  required={false}
  autoFocus={false}
  className="custom-class"
  onChange={(value) => {}}
/>
```

**Variants:**
- `default`: Standard bordered input
- `filled`: Background fill with focus ring
- `underline`: Bottom border only

**Special types:**
- `color`: Native color picker
- `operation`: Hidden input for form operations (sets `name="__operation__"`)

---

### Toggle

Binary switch control.

```tsx
import { Toggle } from "@dockstat/ui"

<Toggle
  checked={false}
  onChange={(checked) => {}}
  disabled={false}
  size="md"        // "sm" | "md" | "lg"
  label="Toggle label"
  className="custom-class"
/>
```

**Sizes:**
- `sm`: 32x16px track, 12x12px dot
- `md` (default): 48x24px track, 20x20px dot
- `lg`: 64x32px track, 28x28px dot

**Use with label** for accessibility. Label appears to the right of the toggle.

---

### Modal

Dialog overlay with backdrop, animation, and scroll lock.

```tsx
import { Modal } from "@dockstat/ui"

<Modal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"           // string or ReactNode
  footer="Footer text"          // string, ReactNode, or undefined
  size="md"                   // "sm" | "md" | "lg" | "xl" | "full"
  transparent={false}         // Glass/backdrop effect
  bodyClasses="extra-body-classes"
>
  Modal content here
</Modal>
```

**Sizes:**
- `sm`: `max-w-sm`
- `md` (default): `max-w-lg`
- `lg`: `max-w-3xl`
- `xl`: `max-w-5xl`
- `full`: `max-w-[90vw]`

**Features:**
- Escape key closes modal
- Click outside closes modal
- Body scroll locked when open
- Portal rendered to document.body
- Accessible: `role="dialog"`, `aria-modal`, `aria-labelledby`

**Footer patterns:**
- String: Shows text + Close button
- ReactNode: Custom footer + Close button
- Undefined: Close button only, right-aligned

---

### Slider

Range input with styled track and value display.

```tsx
import { Slider } from "@dockstat/ui"

<Slider
  min={0}
  max={100}
  step={1}
  value={50}              // Controlled value (omit for uncontrolled)
  onChange={(value) => {}}
  label="Volume"
  showValue={true}       // Show current value pill
  disabled={false}
  variant="solid"       // "solid" | "gradient"
  size="md"            // "sm" | "md" | "lg"
  className="custom-class"
/>
```

**Sizes (track height):**
- `sm`: 4px track
- `md` (default): 12px track
- `lg`: 20px track

**Features:**
- Controlled or uncontrolled mode
- Shows min/max labels below slider
- Value pill displays current value above

---

### Divider

Visual separator with optional label.

```tsx
import { Divider } from "@dockstat/ui"

<Divider
  variant="solid"        // "solid" | "dashed" | "dotted"
  orientation="horizontal"  // "horizontal" | "vertical"
  shadow={true}         // Drop shadow effect
  label="Section name"  // Text or ReactNode
  className="custom-class"
/>
```

**Label pattern**: Creates a centered label with lines on both sides.
```
─────────── Label ───────────
```

---

### LinkWithIcon

Styled link with optional icon, works with react-router NavLink.

```tsx
import { LinkWithIcon } from "@dockstat/ui"

// Plain link
<LinkWithIcon
  href="/path"
  icon={<Icon />}
  iconPosition="left"   // "left" | "right"
  external={false}      // Opens in new tab with rel="noopener noreferrer"
  className="custom-class"
>
  Link text
</LinkWithIcon>

// React Router NavLink with active state styling
<LinkWithIcon
  href="/path"
  navLinkActive={(props) => props.isActive ? "text-accent" : undefined}
>
  Active-aware link
</LinkWithIcon>
```

---

### HoverBubble

Tooltip that appears on hover.

```tsx
import { HoverBubble } from "@dockstat/ui"

<HoverBubble
  label="Tooltip text (supports multiple lines)"
  position="top"     // "top" | "bottom" | "left" | "right"
  className="custom-class"
>
  <button>Hover me</button>
</HoverBubble>
```

**Features:**
- Appears on group hover
- Arrow indicator pointing to element
- Max width: min(16rem, calc(100vw - 18rem))
- Smooth opacity + scale transition
- GPU accelerated transform

---

### Navbar

Top navigation bar with sidebar toggle, nav links, and branding.

```tsx
import { Navbar, SidebarPaths } from "@dockstat/ui"

<Navbar
  isBusy={false}                    // Shows animated gradient background
  heading=""                        // Centered page title
  navLinks={[
    { slug: "home", path: "/" },
    { slug: "settings", path: "/settings" },
  ]}
  pluginLinks={[]}                  // Plugin route groupings
  themes={themes}
  currentThemeId={null}
  onSelectTheme={(theme) => {}}
  deleteTheme={(id) => Promise.resolve()}
  logEntries={[]}
  mutationFn={{ pin: ..., unpin: ..., isBusy: false }}
  auth={{ user: "username", logout: () => {} }}
  ramUsage="512MB"                 // Displayed RAM badge
  ramRefreshKey={0}                // Key to force refresh animation
  mutationFn                            // Sidebar mutation function
  onColorChange={(color, name) => {}}
  setIsThemeSidebarOpen={(open) => {}}
  toastSuccess={(name) => {}}
  sidebarHotkeys={{
    toggle: "Cmd+K",
    open: "Cmd+B",
    close: "Escape",
  }}
  openQuickLinksModalHotkey="Cmd+P"
/>
```

**Features:**
- Animated gradient when `isBusy`
- Nav link badges with active state outline
- RAM usage with pulse animation on change
- Sidebar slide-in panel
- Logo and branding

---

### Sidebar

Slide-in navigation panel (typically used with Navbar).

```tsx
import { Sidebar } from "@dockstat/ui"

<Sidebar
  isOpen={true}
  onClose={() => setIsOpen(false)}
  isBusy={false}
  pins={[{ path: "/", slug: "Home" }]}
  pluginLinks={[]}
  themes={themes}
  currentThemeId={null}
  onSelectTheme={(theme) => {}}
  setIsThemeSidebarOpen={(open) => {}}
  deleteTheme={(id) => Promise.resolve()}
  logEntries={[]}
  mutationFn={{ pin: ..., unpin: ..., isBusy: false }}
  toastSuccess={(name) => {}}
  auth={{ user: "username", logout: () => {} }}
  onColorChange={(color, name) => {}}
/>
```

**Features:**
- Pin/unpin navigation items
- Toggle between main routes and plugin routes
- Theme browser integration
- Log viewer modal with Table
- Theme editor modal
- User auth section with logout
- External links section (GitHub, docs, npm)

---

### Slides

Multi-step wizard/presentation component.

```tsx
import { Slides } from "@dockstat/ui"

<Slides
  header="Setup Wizard"
  description="Configure your environment"
  children={/* step content */}
  buttonPosition="left"     // "left" | "right"
  variant="default"        // "default" | "minimal"
  cardVariant="flat"       // Card variant when not minimal
  glass={false}
  connected={false}        // Shows connection indicator
  defaultSlide={0}
  selectedSlide={controlledIndex}
  onSlideChange={(index) => {}}
  hideable={false}         // Show/hide toggle
  className="custom-class"
/>
```

**Minimal variant**: No card wrapper, just header + content with bottom navigation.

**Default variant**: Card wrapper with header and footer button row.

---

### Checkbox & CheckboxGroup

Form checkboxes.

```tsx
import { Checkbox, CheckboxGroup } from "@dockstat/ui"

<Checkbox
  checked={false}
  onChange={(checked) => {}}
  disabled={false}
  size="md"           // "sm" | "md" | "lg"
  label="Option label"
  className="custom-class"
/>

<CheckboxGroup
  options={[
    { value: "a", label: "Option A" },
    { value: "b", label: "Option B" },
  ]}
  value={["a"]}
  onChange={(values) => {}}
  disabled={false}
  className="custom-class"
/>
```

---

### ThemeBrowser

Theme selection interface with previews.

```tsx
import { ThemeBrowser, type ThemeBrowserItem } from "@dockstat/ui"

<ThemeBrowser
  themes={themes}              // ThemeBrowserItem[]
  currentThemeId={currentId}
  onSelectTheme={async (theme) => {}}
  deleteTheme={(id) => Promise.resolve()}
  toastSuccess={(name) => {}}
/>
```

**ThemeBrowserItem:**
```tsx
type ThemeBrowserItem = {
  id: number
  name: string
  variables: Record<string, string>
}
```

**Features:**
- Visual color preview with skewed color swatches
- Active indicator badge
- Delete button for custom themes
- Selection ring highlight

---

### ThemeEditor & ThemeSidebar

Theme customization components. Import and use as needed for theme editing flows.

---

### PluginsPage

Plugins management page component.

```tsx
import { PluginsPage } from "@dockstat/ui"

<PluginsPage
  installedPlugins={plugins}
  status={{
    installed_plugins: { count: 5, data: plugins },
    repos: ["repo1", "repo2"],
    loaded_plugins: [/* ...]},
  }}
/>
```

---

### Graph Nodes

Specialized nodes for dockstat graph visualization (reactflow/xyflow).

```tsx
import { ContainerNode, HostNode, DockNode, ClientNode, nodeTypes } from "@dockstat/ui"

// nodeTypes is a map for reactflow nodeTypes prop
// Individual nodes can be used directly in custom node defs
```

---

### Onboarding

Multi-step onboarding wizard for new users.

```tsx
import { Onboarding, WelcomeToDockStat } from "@dockstat/ui/welcome"

<Onboarding
  setOnBoardingComplete={(complete) => {
    if (complete) {
      // Save to storage/backend
    }
  }}
/>

// Convenience wrapper
<WelcomeToDockStat
  setOnBoardingComplete={(complete) => {}}
/>
```

**Features:**
- Keyboard navigation (ArrowLeft/ArrowRight)
- Skip and Finish buttons
- Progress dots
- Animated slide transitions
- Dialog-based modal presentation

---

## Design Guidelines

### Layout Patterns

1. **Page structure**: Navbar at top, content below with optional sidebar
2. **Card grouping**: Use Card with CardHeader/CardBody for grouped content
3. **Spacing**: `gap-4` between major sections, `gap-2` for related items
4. **Max widths**: Use `max-w-screen` or container constraints as needed

### Visual Hierarchy

1. **Headings**: `text-2xl font-bold` for page titles, `text-lg font-semibold` for sections
2. **Cards**: Group related content; use `hoverable` for selectable cards
3. **Badges**: Use for status, counts, and categorization—never for primary actions
4. **Buttons**: One primary action per section; use outline/ghost for secondary

### State Communication

1. **Loading**: Use Button `loading` prop, show skeleton/spinner in cards
2. **Empty states**: Use table's built-in "No data available" or custom centered message
3. **Errors**: Use `error` variant on inputs, `error` variant on cards/badges
4. **Success**: Use `success` variant on cards/badges for confirmations

### Accessibility

1. **Focus management**: Modals trap focus implicitly via Escape + backdrop click
2. **Keyboard nav**: Sidebar closes on Escape, onboarding supports arrow keys
3. **Labels**: Toggles should include labels; use aria-labels for icon-only buttons
4. **Color contrast**: Rely on CSS variables which are designed for contrast

### Theming

1. All colors come from CSS variables—define them at `:root` or theme scope
2. Glass mode uses `backdrop-blur-lg` and 20% opacity, works on any background
3. Dark mode: Use `variant="dark"` on cards, CSS variables handle the rest
4. Custom themes: Store theme variables in `ThemeBrowserItem.variables`

### Motion Philosophy

1. **Subtle by default**: Card hover is shadow-only, no transform
2. **Tactile feedback**: Buttons scale down on press (0.96)
3. **Entrance animations**: Modals fade+scale, sidebar slides in
4. **State changes**: RAM badge pulses, nav badges float gently
5. **Avoid**: Excessive motion that competes with content

---

## Sane Defaults

When uncertain, use these defaults:

| Component | Default Choice | Rationale |
|-----------|---------------|-----------|
| Card | `variant="default"` | Balanced appearance, works in most contexts |
| Card | `size="md"` | Standard padding for content |
| Card | `hoverable={false}` | Only enable for selectable cards |
| Button | `variant="primary"` | Primary actions |
| Button | `size="md"` | Readable text, comfortable click target |
| Button | `loading={false}` | Set true during async ops |
| Badge | `variant="primary"` | Neutral emphasis |
| Badge | `size="md"` | Legible at typical use sizes |
| Badge | `rounded={false}` | Square corners unless pill shape needed |
| Table | `size="md"` | Comfortable row height |
| Table | `searchable={true}` for data tables | Users expect search |
| Table | `hoverable={true}` for interactive tables | Row feedback |
| Table | `striped={false}` | Cleaner look; enable for dense data |
| Input | `variant="default"` | Most versatile |
| Input | `size="md"` | Standard touch target |
| Toggle | `size="md"` | Clear visible state |
| Toggle | Always include `label` | Accessibility |
| Modal | `size="md"` | Fits most content |
| Modal | `transparent={false}` | Solid card unless overlay needed |
| Modal | Always provide `onClose` | Required for UX |
| Slider | `variant="solid"` | Cleaner look |
| Slider | `showValue={true}` | Users want feedback |
| Divider | `variant="solid"` | Standard separator |
| Divider | Use `label` for section breaks | Visual context |
| LinkWithIcon | `iconPosition="left"` | Reading direction |
| LinkWithIcon | `external={true}` for external URLs | Security + UX |
| Navbar | Always provide `navLinks` | Core navigation |
| Navbar | `heading` for page context | Clear page identity |
| Sidebar | `isOpen` controlled by parent | Predictable state |
| Slides | `variant="default"` | Card container looks better |
| Slides | `buttonPosition="left"` | Forward = right is conventional |

---

## File Structure

```
packages/ui/
├── src/
│   ├── components/
│   │   ├── Badge/
│   │   ├── Button/
│   │   ├── Card/          (Card, CardBody, CardHeader, CardFooter)
│   │   ├── Checkbox/
│   │   ├── Divider/
│   │   ├── Forms/         (Input, Selection, Toggle, CheckboxGroup)
│   │   ├── Graph/         (nodes: client, container, docknode, host)
│   │   ├── HoverBubble/
│   │   ├── HotkeyMenus/
│   │   ├── Input/         (alias for Forms/Input)
│   │   ├── Link/
│   │   ├── Modal/
│   │   ├── Navbar/
│   │   ├── Plugins/
│   │   ├── Repo/
│   │   ├── Sidebar/
│   │   ├── Slider/
│   │   ├── Slides/
│   │   ├── Table/
│   │   ├── ThemeBrowser/
│   │   ├── ThemeEditor/
│   │   └── ThemeSidebar/
│   ├── welcome/           (Onboarding, Intro, slides)
│   ├── utils/
│   └── stories/          (Storybook stories for each component)
├── index.ts              (Re-exports from components/index.ts)
└── package.json
```

**Entry points:**
- `@dockstat/ui` → `src/components/index.ts` (all components)
- `@dockstat/ui/css` → `src/App.css` (CSS variables)
- `@dockstat/ui/welcome` → `src/welcome/Onboarding.tsx` (onboarding)

---

## Related Packages

- `@dockstat/typings` — Shared types (DBPluginShemaT, RepoType, PluginMetaType, etc.)
- `@dockstat/utils` — Utility functions and React hooks (useHotkey, sleep, formatDate)
- `@dockstat/logger` — Logging types (LogEntry)
- `@dockstat/sqlite-wrapper` — Database types (UpdateResult)
