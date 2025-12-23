/**
 * @dockstat/template-renderer
 *
 * A library for defining frontend pages using JSON/YAML templates
 * composed of widgets from @dockstat/ui.
 *
 * Features:
 * - Full type safety for template definitions
 * - JSON/YAML template parsing and validation
 * - React component rendering from templates
 * - Data binding and state management
 * - Action handling for user interactions
 * - Reusable template fragments
 * - Type-safe template builder API
 */

// Types
export * from "./types"

// Widget Registry
export {
  getWidgetEntry,
  getWidgetComponent,
  hasWidget,
  getRegisteredWidgetTypes,
  widgetHasChildren,
  WIDGET_REGISTRY,
  type WidgetComponent,
  type RegistryEntry,
  type PropsTransformContext,
} from "./registry"

// Validation
export {
  validateTemplate,
  validateFragment,
  isValidTemplate,
  isValidFragment,
  assertValidTemplate,
  assertValidFragment,
} from "./validation"

// Parser
export {
  parseTemplate,
  parseFragment,
  parseTemplateFile,
  parseFragmentFile,
  serializeTemplateToJSON,
  serializeTemplateToYAML,
  serializeFragmentToJSON,
  serializeFragmentToYAML,
  tryParseTemplate,
  tryParseFragment,
  parseTemplates,
  mergeFragmentsIntoTemplate,
  detectFormat,
  type TemplateFormat,
  type ParseResult,
} from "./parser"

// Renderer
export {
  TemplateRenderer,
  useTemplateContext,
  type TemplateRendererProps,
} from "./renderer"

// Hooks
export {
  useTemplateState,
  useTemplateActions,
  useTemplateLoaders,
  useTemplate,
  type UseTemplateStateResult,
  type UseTemplateActionsResult,
  type UseTemplateLoadersResult,
  type UseTemplateResult,
  type ExecuteApiActionOptions,
  type ApiActionResult,
  type ApiActionExecutor,
  type LoaderExecutor,
} from "./hooks/useTemplate"

// Builder
export {
  WidgetBuilder,
  TemplateBuilder,
  FragmentBuilder,
  widget,
  widgets,
  template,
  fragment,
  actions,
  loaders,
  layouts,
} from "./builder"
