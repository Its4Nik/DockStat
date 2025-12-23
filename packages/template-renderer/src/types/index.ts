/**
 * Template Renderer Types
 *
 * Central export point for all type definitions used in the template rendering system.
 */

// Template types
export {
  type ActionConfig,
  type ActionErrorHandler,
  type ActionResult,
  // Action types
  type ActionSuccessHandler,
  type FragmentReference,
  isFragmentReference,
  // Layout and configuration
  type LayoutConfig,
  // Loader types
  type LoaderConfig,
  type LoaderResult,
  // Page template
  type PageTemplate,
  type PluginFrontendConfig,
  // Plugin integration
  type PluginFrontendRoute,
  type StateConfig,
  // Fragments
  type TemplateFragment,
  type TemplateNode,
  // Rendering context
  type TemplateRenderContext,
  type TemplateValidationError,
  // Validation
  type TemplateValidationResult,
  type TemplateValidationWarning,
  type TypedWidgetNode,
  type WidgetNode,
  // Widget node types
  type WidgetNodeBase,
} from "./template"
// Widget types and registry
export {
  // Re-exported UI types
  type BadgeSize,
  type BadgeVariant,
  type ButtonRowPosition,
  type ButtonSize,
  type ButtonVariant,
  type CardSize,
  type CardVariant,
  type CheckboxGroupOption,
  type CheckboxSize,
  // Constants and utilities
  CONTAINER_WIDGETS,
  type DividerVariant,
  type InputSize,
  type InputVariant,
  isContainerWidget,
  type ModalSize,
  // Serializable props types
  type SerializableBadgeProps,
  type SerializableButtonProps,
  type SerializableCardBodyProps,
  type SerializableCardFooterProps,
  type SerializableCardHeaderProps,
  type SerializableCardProps,
  type SerializableCheckboxGroupProps,
  type SerializableCheckboxProps,
  type SerializableContainerProps,
  type SerializableDividerProps,
  type SerializableHoverBubbleProps,
  type SerializableInputProps,
  type SerializableLinkProps,
  type SerializableModalProps,
  type SerializableSliderProps,
  type SerializableSlidesProps,
  type SerializableTableColumn,
  type SerializableTableProps,
  type SerializableTextProps,
  type SerializableToggleProps,
  type ToggleSize,
  type WidgetActions,
  type WidgetBindings,
  type WidgetPropsFor,
  // Registry and utility types
  type WidgetRegistry,
  type WidgetType,
} from "./widgets"
