/**
 * Data Source Adapters
 *
 * Built-in adapters for different data source types.
 */

import type { DataSourceAdapter, MockGeneratorConfig, MockGeneratorFn } from "../../types"

/**
 * Mock data generators
 */
const mockGenerators: Record<string, MockGeneratorFn> = {
  random: (config: MockGeneratorConfig, _timestamp: number) => {
    const min = config.min ?? 0
    const max = config.max ?? 100
    return Math.random() * (max - min) + min
  },

  increment: (config: MockGeneratorConfig, timestamp: number) => {
    const min = config.min ?? 0
    const max = config.max ?? 100
    const step = config.step ?? 1
    const value = (timestamp / 1000) * step
    return min + (value % (max - min))
  },

  sin: (config: MockGeneratorConfig, timestamp: number) => {
    const min = config.min ?? 0
    const max = config.max ?? 100
    const period = config.period ?? 10000
    const amplitude = (max - min) / 2
    const offset = (max + min) / 2
    return offset + amplitude * Math.sin((timestamp / period) * Math.PI * 2)
  },

  sawtooth: (config: MockGeneratorConfig, timestamp: number) => {
    const min = config.min ?? 0
    const max = config.max ?? 100
    const period = config.period ?? 10000
    const value = (timestamp % period) / period
    return min + value * (max - min)
  },

  square: (config: MockGeneratorConfig, timestamp: number) => {
    const min = config.min ?? 0
    const max = config.max ?? 100
    const period = config.period ?? 10000
    const halfPeriod = period / 2
    return timestamp % period < halfPeriod ? max : min
  },
}

/**
 * Generate mock data
 */
function generateMockData(
  generatorName: string,
  config: MockGeneratorConfig,
  timestamp: number
): unknown {
  const generator = mockGenerators[generatorName] ?? mockGenerators.random
  return generator(config, timestamp)
}

/**
 * REST API Adapter
 */
export const restAdapter: DataSourceAdapter<{
  type: "rest"
  url: string
  method?: "GET" | "POST"
  headers?: Record<string, string>
  body?: unknown
}> = {
  type: "rest",

  async fetch(config, signal) {
    const startTime = performance.now()

    const response = await fetch(config.url, {
      method: config.method ?? "GET",
      headers: config.headers,
      body: config.method === "POST" ? JSON.stringify(config.body) : undefined,
      signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    const responseTime = performance.now() - startTime

    return {
      data,
      meta: {
        timestamp: new Date(),
        responseTime,
      },
    }
  },

  validateConfig(config): config is {
    type: "rest"
    url: string
    method?: "GET" | "POST"
    headers?: Record<string, string>
    body?: unknown
  } {
    return (
      typeof config === "object" &&
      config !== null &&
      (config as { type?: string }).type === "rest" &&
      typeof (config as { url?: string }).url === "string"
    )
  },

  getDefaultConfig() {
    return {
      type: "rest",
      url: "",
      method: "GET",
      headers: {},
    }
  },
}

/**
 * Static Data Adapter
 */
export const staticAdapter: DataSourceAdapter<{ type: "static"; data: unknown }> = {
  type: "static",

  async fetch(config) {
    return {
      data: config.data,
      meta: {
        timestamp: new Date(),
        responseTime: 0,
      },
    }
  },

  validateConfig(config): config is { type: "static"; data: unknown } {
    return (
      typeof config === "object" &&
      config !== null &&
      (config as { type?: string }).type === "static" &&
      "data" in config
    )
  },

  getDefaultConfig() {
    return {
      type: "static",
      data: null,
    }
  },
}

/**
 * Mock Data Adapter
 */
export const mockAdapter: DataSourceAdapter<{
  type: "mock"
  generator: string
  interval?: number
  config?: MockGeneratorConfig
}> = {
  type: "mock",

  async fetch(config) {
    const startTime = performance.now()
    const generatorConfig: MockGeneratorConfig = {
      type: config.generator as MockGeneratorConfig["type"],
      min: (config.config as MockGeneratorConfig | undefined)?.min,
      max: (config.config as MockGeneratorConfig | undefined)?.max,
      period: (config.config as MockGeneratorConfig | undefined)?.period,
    }

    const data = generateMockData(config.generator, generatorConfig, Date.now())
    const responseTime = performance.now() - startTime

    return {
      data,
      meta: {
        timestamp: new Date(),
        responseTime,
      },
    }
  },

  validateConfig(config): config is {
    type: "mock"
    generator: string
    interval?: number
    config?: MockGeneratorConfig
  } {
    return (
      typeof config === "object" &&
      config !== null &&
      (config as { type?: string }).type === "mock" &&
      typeof (config as { generator?: string }).generator === "string"
    )
  },

  getDefaultConfig() {
    return {
      type: "mock",
      generator: "random",
      interval: 5000,
    }
  },
}

/**
 * Get all built-in adapters
 */
export function getBuiltinAdapters(): DataSourceAdapter[] {
  return [restAdapter, staticAdapter, mockAdapter]
}

/**
 * Register custom mock generator
 */
export function registerMockGenerator(name: string, fn: MockGeneratorFn): void {
  mockGenerators[name] = fn
}
