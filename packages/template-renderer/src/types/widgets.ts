/**
 * Widget Registry Types
 *
 * Maps widget type names to their corresponding props from @dockstat/ui
 * This provides full type safety for template definitions.
 */

import type {
  BadgeSize,
  BadgeVariant,
  ButtonSize,
  ButtonVariant,
  CardSize,
  CardVariant,
  CheckboxSize,
  CheckboxGroupOption,
  DividerVariant,
  InputSize,
  InputVariant,
  ModalSize,
  ButtonRowPosition,
  ToggleSize,
} from "@dockstat/ui"

// Re-export UI types for convenience
export type {
  BadgeSize,
  BadgeVariant,
  ButtonSize,
  ButtonVariant,
  CardSize,
  CardVariant,
  CheckboxSize,
  CheckboxGroupOption,
  DividerVariant,
  InputSize,
  InputVariant,
  ModalSize,
  ButtonRowPosition,
  ToggleSize,
}

/**
 * Serializable versions of component props
 * These exclude function props and ReactNode children for JSON/YAML compatibility
 */

export interface SerializableBadgeProps {
  text: string
  variant?: BadgeVariant
  size?: BadgeSize
  className?: string
  rounded?: boolean
  unique?: boolean
  outlined?: boolean
}

export interface SerializableButtonProps {
  text: string
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  /** Action identifier to trigger when clicked */
  action?: string
  type?: "button" | "submit" | "reset"
  className?: string
  fullWidth?: boolean
  noFocusRing?: boolean
}

export interface SerializableCardProps {
  variant?: CardVariant
  size?: CardSize
  className?: string
  /** Action identifier to trigger when clicked */
  action?: string
  hoverable?: boolean
}

export interface SerializableCardHeaderProps {
  text?: string
  className?: string
  id?: string
}

export interface SerializableCardBodyProps {
  className?: string
}

export interface SerializableCardFooterProps {
  className?: string
  align?: "left" | "right" | "center"
}

export interface SerializableDividerProps {
  variant?: DividerVariant
  orientation?: "horizontal" | "vertical"
  className?: string
  shadow?: boolean
  label?: string
}

export interface SerializableInputProps {
  type?: "text" | "email" | "password" | "number" | "tel" | "url"
  size?: InputSize
  variant?: InputVariant
  disabled?: boolean
  placeholder?: string
  /** Binding key for the input value */
  binding?: string
  className?: string
  error?: boolean
  success?: boolean
}

export interface SerializableCheckboxProps {
  checked?: boolean
  disabled?: boolean
  size?: CheckboxSize
  label?: string
  className?: string
  indeterminate?: boolean
  id?: string
  name?: string
  value?: string
  /** Binding key for the checkbox state */
  binding?: string
}

export interface SerializableCheckboxGroupProps {
  options: CheckboxGroupOption[]
  /** Binding key for the selected values */
  binding?: string
  direction?: "horizontal" | "vertical"
  className?: string
}

export interface SerializableToggleProps {
  checked?: boolean
  disabled?: boolean
  size?: ToggleSize
  label?: string
  className?: string
  /** Binding key for the toggle state */
  binding?: string
}

export interface SerializableHoverBubbleProps {
  label: string
  position?: "top" | "bottom" | "left" | "right"
  className?: string
}

export interface SerializableLinkProps {
  href: string
  text: string
  iconPosition?: "left" | "right"
  className?: string
  external?: boolean
  /** Icon name from lucide-react */
  icon?: string
}

export interface SerializableModalProps {
  /** Binding key for open state */
  openBinding?: string
  title?: string
  footer?: string
  bodyClasses?: string
  size?: ModalSize
}

export interface SerializableSliderProps {
  min?: number
  max?: number
  step?: number
  /** Binding key for the slider value */
  binding?: string
  className?: string
  label?: string
  showValue?: boolean
  disabled?: boolean
  variant?: "gradient" | "solid"
  marks?: Array<{ value: number; label?: string }>
}

export interface SerializableSlidesProps {
  /** Map of slide key to slide content (defined as children widgets) */
  slides: Record<string, never> // Content defined via children
  header?: string
  description?: string
  buttonPosition?: ButtonRowPosition
  connected?: boolean
  defaultSlide?: string
  /** Binding key for selected slide */
  selectedSlideBinding?: string
  hideable?: boolean
  className?: string
}

export interface SerializableTableColumn {
  key: string
  title: string
  width?: string | number
  align?: "left" | "center" | "right"
  sortable?: boolean
  filterable?: boolean
  /** Custom render template for cell content */
  renderTemplate?: string
}

export interface SerializableTableProps {
  /** Binding key for table data */
  dataBinding?: string
  columns: SerializableTableColumn[]
  className?: string
  striped?: boolean
  bordered?: boolean
  hoverable?: boolean
  size?: "sm" | "md" | "lg"
  searchable?: boolean
  searchPlaceholder?: string
}

export interface SerializableTextProps {
  text: string
  className?: string
  as?: "p" | "span" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div"
}

export interface SerializableContainerProps {
  className?: string
  /** Layout type */
  layout?: "flex" | "grid" | "block"
  /** Flex direction when layout is flex */
  direction?: "row" | "column" | "row-reverse" | "column-reverse"
  /** Gap between children */
  gap?: string | number
  /** Align items */
  align?: "start" | "center" | "end" | "stretch" | "baseline"
  /** Justify content */
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly"
  /** Grid columns when layout is grid */
  columns?: number | string
}

/**
 * Widget Registry
 * Maps widget type names to their serializable props types
 */
export interface WidgetRegistry {
  badge: SerializableBadgeProps
  button: SerializableButtonProps
  card: SerializableCardProps
  cardHeader: SerializableCardHeaderProps
  cardBody: SerializableCardBodyProps
  cardFooter: SerializableCardFooterProps
  divider: SerializableDividerProps
  input: SerializableInputProps
  checkbox: SerializableCheckboxProps
  checkboxGroup: SerializableCheckboxGroupProps
  toggle: SerializableToggleProps
  hoverBubble: SerializableHoverBubbleProps
  link: SerializableLinkProps
  modal: SerializableModalProps
  slider: SerializableSliderProps
  slides: SerializableSlidesProps
  table: SerializableTableProps
  text: SerializableTextProps
  container: SerializableContainerProps
}

/**
 * Widget type literal union
 */
export type WidgetType = keyof WidgetRegistry

/**
 * Get props type for a specific widget type
 */
export type WidgetPropsFor<T extends WidgetType> = WidgetRegistry[T]

/**
 * List of widget types that can have children
 */
export const CONTAINER_WIDGETS: WidgetType[] = [
  "card",
  "cardHeader",
  "cardBody",
  "cardFooter",
  "hoverBubble",
  "modal",
  "container",
] as const

/**
 * Check if a widget type supports children
 */
export function isContainerWidget(type: WidgetType): boolean {
  return CONTAINER_WIDGETS.includes(type)
}

/**
 * Props that represent event handlers/actions
 */
export interface WidgetActions {
  onClick?: string
  onChange?: string
  onSubmit?: string
  onClose?: string
  onSlideChange?: string
}

/**
 * Props that represent data bindings
 */
export interface WidgetBindings {
  /** Bind a prop value to a data path */
  [propName: string]: string
}
