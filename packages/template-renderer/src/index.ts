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

// Builder
export {
  actions,
  FragmentBuilder,
  fragment,
  layouts,
  loaders,
  TemplateBuilder,
  template,
  WidgetBuilder,
  widget,
  widgets,
} from "./builder"
// Hooks
export {
  type ApiActionExecutor,
  type ApiActionResult,
  type ExecuteApiActionOptions,
  type LoaderExecutor,
  type UseTemplateActionsResult,
  type UseTemplateLoadersResult,
  type UseTemplateResult,
  type UseTemplateStateResult,
  useTemplate,
  useTemplateActions,
  useTemplateLoaders,
  useTemplateState,
} from "./hooks/useTemplate"
// Parser
export {
  detectFormat,
  mergeFragmentsIntoTemplate,
  type ParseResult,
  parseFragment,
  parseFragmentFile,
  parseTemplate,
  parseTemplateFile,
  parseTemplates,
  serializeFragmentToJSON,
  serializeFragmentToYAML,
  serializeTemplateToJSON,
  serializeTemplateToYAML,
  type TemplateFormat,
  tryParseFragment,
  tryParseTemplate,
} from "./parser"
// Widget Registry
export {
  getRegisteredWidgetTypes,
  getWidgetComponent,
  getWidgetEntry,
  hasWidget,
  type PropsTransformContext,
  type RegistryEntry,
  WIDGET_REGISTRY,
  type WidgetComponent,
  widgetHasChildren,
} from "./registry"

// Renderer
export {
  TemplateRenderer,
  type TemplateRendererProps,
  useTemplateContext,
} from "./renderer"
// Types
export * from "./types"
// Validation
export {
  assertValidFragment,
  assertValidTemplate,
  isValidFragment,
  isValidTemplate,
  validateFragment,
  validateTemplate,
} from "./validation"
