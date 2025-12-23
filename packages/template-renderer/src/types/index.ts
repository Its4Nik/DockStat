/**
 * Template Renderer Types
 *
 * Central export point for all type definitions used in the template rendering system.
 */

// Widget types and registry
export {
  // Serializable props types
  type SerializableBadgeProps,
  type SerializableButtonProps,
  type SerializableCardProps,
  type SerializableCardHeaderProps,
  type SerializableCardBodyProps,
  type SerializableCardFooterProps,
  type SerializableDividerProps,
  type SerializableInputProps,
  type SerializableCheckboxProps,
  type SerializableCheckboxGroupProps,
  type SerializableToggleProps,
  type SerializableHoverBubbleProps,
  type SerializableLinkProps,
  type SerializableModalProps,
  type SerializableSliderProps,
  type SerializableSlidesProps,
  type SerializableTableColumn,
  type SerializableTableProps,
  type SerializableTextProps,
  type SerializableContainerProps,
  // Registry and utility types
  type WidgetRegistry,
  type WidgetType,
  type WidgetPropsFor,
  type WidgetActions,
  type WidgetBindings,
  // Re-exported UI types
  type BadgeSize,
  type BadgeVariant,
  type ButtonSize,
  type ButtonVariant,
  type CardSize,
  type CardVariant,
  type CheckboxSize,
  type CheckboxGroupOption,
  type DividerVariant,
  type InputSize,
  type InputVariant,
  type ModalSize,
  type ButtonRowPosition,
  type ToggleSize,
  // Constants and utilities
  CONTAINER_WIDGETS,
  isContainerWidget,
} from "./widgets"

// Template types
export {
  // Widget node types
  type WidgetNodeBase,
  type WidgetNode,
  type TypedWidgetNode,
  // Layout and configuration
  type LayoutConfig,
  type StateConfig,
  type ActionConfig,
  // Page template
  type PageTemplate,
  // Fragments
  type TemplateFragment,
  type FragmentReference,
  type TemplateNode,
  isFragmentReference,
  // Plugin integration
  type PluginFrontendRoute,
  type PluginFrontendConfig,
  // Rendering context
  type TemplateRenderContext,
  // Validation
  type TemplateValidationResult,
  type TemplateValidationError,
  type TemplateValidationWarning,
} from "./template"
