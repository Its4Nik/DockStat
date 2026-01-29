type LabelValue = string | number | boolean | null

type DockerLabels =
  | Record<string, LabelValue>
  | string[]
  | undefined

export function hasLabel(
  labels: DockerLabels,
  key: string
): boolean {
  if (!labels) return false

  if (!Array.isArray(labels)) {
    return Object.prototype.hasOwnProperty.call(labels, key)
  }

  return labels.some(label => {
    if (label === key) return true
    return label.startsWith(`${key}=`)
  })
}

export function getLabelValue(
  labels: DockerLabels,
  key: string
): string | number | boolean | null | undefined {
  if (!labels) return undefined

  if (!Array.isArray(labels)) {
    return labels[key]
  }

  const entry = labels.find(
    label => label === key || label.startsWith(`${key}=`)
  )

  if (!entry || !entry.includes('=')) return null

  return entry.split('=').slice(1).join('=')
}

export function addLabel(
  labels: DockerLabels,
  key: string,
  value: LabelValue = null
): DockerLabels {
  if (!labels) {
    return value === null ? [key] : [`${key}=${value}`]
  }

  if (Array.isArray(labels)) {
    const filtered = labels.filter(
      l => l !== key && !l.startsWith(`${key}=`)
    )

    return value === null
      ? [...filtered, key]
      : [...filtered, `${key}=${value}`]
  }

  return {
    ...labels,
    [key]: value,
  }
}

export function normalizeEnv(
  env?: string[] | Record<string, string | number | boolean | null>
) {
  if (!Array.isArray(env)) return env;

  return env.map(entry => {
    const [key] = entry.split("=", 1);
    return `${key}=\${${key}}`;
  });
}
