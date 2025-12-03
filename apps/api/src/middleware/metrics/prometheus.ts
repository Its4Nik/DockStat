export type MetricType = "counter" | "gauge" | "summary"

export interface MetricSample {
	labels?: Record<string, string>
	value: number | string
	timestamp?: number
}

export interface MetricFamily {
	name: string
	help: string
	type: MetricType
	samples: MetricSample[]
}

function formatLabels(labels?: Record<string, string>): string {
	if (!labels || Object.keys(labels).length === 0) return ""
	const parts = Object.entries(labels).map(
		([key, value]) => `${key}="${String(value)}"`
	)
	return `{${parts.join(",")}}`
}

export function renderPrometheusMetrics(
	families: MetricFamily[],
	defaultTimestamp = Date.now()
): string {
	const lines: string[] = []

	families.forEach((family, index) => {
		if (index > 0) lines.push("") // blank line between metric families

		lines.push(`# HELP ${family.name} ${family.help}`)
		lines.push(`# TYPE ${family.name} ${family.type}`)

		for (const sample of family.samples) {
			const labels = formatLabels(sample.labels)
			const ts = sample.timestamp ?? defaultTimestamp
			lines.push(`${family.name}${labels} ${sample.value} ${ts}`)
		}
	})

	return lines.join("\n")
}
