/**
 * Built-in Widgets
 *
 * Re-exports all built-in widget definitions.
 */

export { statsWidget } from "./StatsWidget"
export { lineChartWidget } from "./LineChartWidget"
export { gaugeWidget } from "./GaugeWidget"
export { tableWidget } from "./TableWidget"
export { textWidget } from "./TextWidget"
export { alertWidget } from "./AlertWidget"

import { statsWidget } from "./StatsWidget"
import { lineChartWidget } from "./LineChartWidget"
import { gaugeWidget } from "./GaugeWidget"
import { tableWidget } from "./TableWidget"
import { textWidget } from "./TextWidget"
import { alertWidget } from "./AlertWidget"
import type { WidgetDefinition } from "../types"

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

