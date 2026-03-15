/**
 * Built-in Widgets
 *
 * Re-exports all built-in widget definitions.
 */

export { alertWidget } from "./AlertWidget"
export { gaugeWidget } from "./GaugeWidget"
export { lineChartWidget } from "./LineChartWidget"
export { statsWidget } from "./StatsWidget"
export { tableWidget } from "./TableWidget"
export { textWidget } from "./TextWidget"

import type { WidgetDefinition } from "../types"
import { alertWidget } from "./AlertWidget"
import { gaugeWidget } from "./GaugeWidget"
import { lineChartWidget } from "./LineChartWidget"
import { statsWidget } from "./StatsWidget"
import { tableWidget } from "./TableWidget"
import { textWidget } from "./TextWidget"

/**
 * All built-in widget definitions
 */
export const builtinWidgets: WidgetDefinition[] = [
  statsWidget as unknown as WidgetDefinition,
  lineChartWidget as unknown as WidgetDefinition,
  gaugeWidget as unknown as WidgetDefinition,
  tableWidget as unknown as WidgetDefinition,
  textWidget as unknown as WidgetDefinition,
  alertWidget as unknown as WidgetDefinition,
]
