/**
 * Widget Config Modal
 *
 * Modal for configuring a widget's settings, data source, and data parsing.
 */

import { Button, Input, Modal, Select, Toggle } from "@dockstat/ui"
import { useEffect, useState } from "react"
import { useDashboard } from "../context"
import { WidgetRegistry } from "../lib/widget-registry"
import type {
  DataParserConfig,
  DataSourceConfig,
  WidgetConfigField,
  WidgetInstance,
} from "../types"

type TabId = "config" | "datasource" | "parsing"

interface WidgetConfigModalProps {
  widget: WidgetInstance
  open: boolean
  onClose: () => void
}

/**
 * Renders a single config field based on its type
 */
function ConfigField({
  field,
  value,
  onChange,
}: {
  field: WidgetConfigField
  value: unknown
  onChange: (val: unknown) => void
}) {
  const strVal = value !== undefined && value !== null ? String(value) : ""

  switch (field.type) {
    case "boolean":
      return (
        <div className="flex items-center justify-between py-1">
          <label className="text-sm text-primary-text">{field.label}</label>
          <Toggle checked={Boolean(value)} onChange={(checked) => onChange(checked)} />
        </div>
      )

    case "select": {
      const options = (field.options ?? []).map((opt) => ({
        value: String(opt.value),
        label: opt.label,
      }))
      return (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-text">{field.label}</label>
          <Select
            options={options}
            value={strVal}
            onChange={(v) => onChange(v)}
            size="sm"
          />
        </div>
      )
    }

    case "number":
      return (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-text">{field.label}</label>
          <Input
            type="number"
            value={strVal}
            onChange={(v) => onChange(v === "" ? undefined : Number(v))}
            size="sm"
          />
        </div>
      )

    case "color":
      return (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-text">{field.label}</label>
          <Input
            type="color"
            value={strVal}
            onChange={(v) => onChange(v)}
            size="sm"
          />
        </div>
      )

    case "json":
      return (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-text">{field.label}</label>
          <textarea
            className="w-full px-3 py-2 text-sm rounded-md border border-input-default-border bg-transparent text-primary-text focus:outline-none focus:ring-1 focus:ring-input-default-focus-ring font-mono resize-y min-h-[80px]"
            value={typeof value === "string" ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                onChange(JSON.parse(e.target.value))
              } catch {
                onChange(e.target.value)
              }
            }}
          />
        </div>
      )

    default:
      return (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-text">{field.label}</label>
          <Input
            type="text"
            value={strVal}
            onChange={(v) => onChange(v)}
            size="sm"
          />
        </div>
      )
  }
}

/**
 * Data Source Configuration Form
 */
function DataSourceForm({
  dataSource,
  onChange,
}: {
  dataSource: DataSourceConfig | undefined
  onChange: (ds: DataSourceConfig) => void
}) {
  const currentType = dataSource?.type ?? "mock"

  const typeOptions = [
    { value: "rest", label: "REST API" },
    { value: "mock", label: "Mock / Generated" },
    { value: "static", label: "Static Data" },
    { value: "websocket", label: "WebSocket" },
    { value: "graphql", label: "GraphQL" },
  ]

  const handleTypeChange = (newType: string) => {
    switch (newType) {
      case "rest":
        onChange({ type: "rest", url: "", method: "GET", refreshInterval: 30000 })
        break
      case "mock":
        onChange({ type: "mock", generator: "random", interval: 5000 })
        break
      case "static":
        onChange({ type: "static", data: null })
        break
      case "websocket":
        onChange({ type: "websocket", url: "", reconnect: true })
        break
      case "graphql":
        onChange({ type: "graphql", url: "", query: "" })
        break
      default:
        onChange({ type: "mock", generator: "random", interval: 5000 })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-text">Source Type</label>
        <Select
          options={typeOptions}
          value={currentType}
          onChange={handleTypeChange}
          size="sm"
        />
      </div>

      {currentType === "rest" && dataSource?.type === "rest" && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-text">URL</label>
            <Input
              type="text"
              placeholder="https://api.example.com/data"
              value={dataSource.url}
              onChange={(v) => onChange({ ...dataSource, url: v })}
              size="sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-text">HTTP Method</label>
            <Select
              options={[
                { value: "GET", label: "GET" },
                { value: "POST", label: "POST" },
              ]}
              value={dataSource.method ?? "GET"}
              onChange={(v) =>
                onChange({ ...dataSource, method: v as "GET" | "POST" })
              }
              size="sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-text">Refresh Interval (ms)</label>
            <Input
              type="number"
              value={String(dataSource.refreshInterval ?? 30000)}
              onChange={(v) =>
                onChange({ ...dataSource, refreshInterval: Number(v) })
              }
              size="sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-text">
              Headers (JSON object, e.g. {`{"Authorization":"Bearer token"}`})
            </label>
            <textarea
              className="w-full px-3 py-2 text-sm rounded-md border border-input-default-border bg-transparent text-primary-text focus:outline-none focus:ring-1 focus:ring-input-default-focus-ring font-mono resize-y min-h-[60px]"
              placeholder='{"Content-Type": "application/json"}'
              value={
                dataSource.headers ? JSON.stringify(dataSource.headers, null, 2) : ""
              }
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value) as Record<string, string>
                  onChange({ ...dataSource, headers: parsed })
                } catch {
                  // keep invalid input as-is; don't update until valid
                }
              }}
            />
          </div>
        </>
      )}

      {currentType === "mock" && dataSource?.type === "mock" && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-text">Generator</label>
            <Select
              options={[
                { value: "random", label: "Random" },
                { value: "sin", label: "Sine Wave" },
                { value: "sawtooth", label: "Sawtooth" },
                { value: "square", label: "Square Wave" },
                { value: "increment", label: "Increment" },
              ]}
              value={dataSource.generator}
              onChange={(v) => onChange({ ...dataSource, generator: v })}
              size="sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-text">Interval (ms)</label>
            <Input
              type="number"
              value={String(dataSource.interval ?? 5000)}
              onChange={(v) => onChange({ ...dataSource, interval: Number(v) })}
              size="sm"
            />
          </div>
        </>
      )}

      {currentType === "static" && dataSource?.type === "static" && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-text">Static Data (JSON)</label>
          <textarea
            className="w-full px-3 py-2 text-sm rounded-md border border-input-default-border bg-transparent text-primary-text focus:outline-none focus:ring-1 focus:ring-input-default-focus-ring font-mono resize-y min-h-[100px]"
            value={JSON.stringify(dataSource.data, null, 2)}
            onChange={(e) => {
              try {
                const parsed: unknown = JSON.parse(e.target.value)
                onChange({ ...dataSource, data: parsed })
              } catch {
                // keep invalid JSON input as-is
              }
            }}
          />
        </div>
      )}

      {currentType === "websocket" && dataSource?.type === "websocket" && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-text">WebSocket URL</label>
            <Input
              type="text"
              placeholder="wss://api.example.com/ws"
              value={dataSource.url}
              onChange={(v) => onChange({ ...dataSource, url: v })}
              size="sm"
            />
          </div>
          <div className="flex items-center justify-between py-1">
            <label className="text-sm text-primary-text">Auto Reconnect</label>
            <Toggle
              checked={dataSource.reconnect ?? true}
              onChange={(checked) => onChange({ ...dataSource, reconnect: checked })}
            />
          </div>
        </>
      )}

      {currentType === "graphql" && dataSource?.type === "graphql" && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-text">GraphQL Endpoint URL</label>
            <Input
              type="text"
              placeholder="https://api.example.com/graphql"
              value={dataSource.url}
              onChange={(v) => onChange({ ...dataSource, url: v })}
              size="sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-text">Query</label>
            <textarea
              className="w-full px-3 py-2 text-sm rounded-md border border-input-default-border bg-transparent text-primary-text focus:outline-none focus:ring-1 focus:ring-input-default-focus-ring font-mono resize-y min-h-[100px]"
              placeholder="{ myQuery { field1 field2 } }"
              value={dataSource.query}
              onChange={(e) => onChange({ ...dataSource, query: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-text">Refresh Interval (ms)</label>
            <Input
              type="number"
              value={String(dataSource.refreshInterval ?? 30000)}
              onChange={(v) =>
                onChange({ ...dataSource, refreshInterval: Number(v) })
              }
              size="sm"
            />
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Data Parsing Configuration Form
 */
function DataParsingForm({
  parser,
  onChange,
}: {
  parser: DataParserConfig | undefined
  onChange: (p: DataParserConfig | undefined) => void
}) {
  const isEnabled = parser !== undefined

  const handleToggle = (enabled: boolean) => {
    if (!enabled) {
      onChange(undefined)
    } else {
      onChange({ type: "json", extractPath: undefined })
    }
  }

  const parserTypeOptions = [
    { value: "json", label: "JSON" },
    { value: "csv", label: "CSV" },
    { value: "xml", label: "XML" },
    { value: "yaml", label: "YAML" },
    { value: "regex", label: "Regex" },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between py-1">
        <div>
          <p className="text-sm text-primary-text">Enable Data Parsing</p>
          <p className="text-xs text-muted-text">
            Transform raw data before it reaches the widget
          </p>
        </div>
        <Toggle checked={isEnabled} onChange={handleToggle} />
      </div>

      {isEnabled && parser && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-text">Parser Type</label>
            <Select
              options={parserTypeOptions}
              value={parser.type}
              onChange={(v) =>
                onChange({ ...parser, type: v as DataParserConfig["type"] })
              }
              size="sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-text">Extract Path</label>
            <Input
              type="text"
              placeholder="e.g. data.items or response.result"
              value={parser.extractPath ?? ""}
              onChange={(v) => onChange({ ...parser, extractPath: v || undefined })}
              size="sm"
            />
            <p className="text-xs text-muted-text">
              Dot-notation path to extract nested data (leave empty to use root)
            </p>
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Widget Config Modal Component
 */
export function WidgetConfigModal({ widget, open, onClose }: WidgetConfigModalProps) {
  const { updateWidget } = useDashboard()
  const definition = WidgetRegistry.get(widget.type)

  const [activeTab, setActiveTab] = useState<TabId>("config")
  const [localConfig, setLocalConfig] = useState<Record<string, unknown>>(
    widget.config as Record<string, unknown>
  )
  const [localDataSource, setLocalDataSource] = useState<DataSourceConfig | undefined>(
    widget.dataSource ?? definition?.defaultDataSource
  )
  const [localDataParser, setLocalDataParser] = useState<DataParserConfig | undefined>(
    widget.dataParser
  )
  const [localTitle, setLocalTitle] = useState<string>(widget.title ?? "")

  // Re-sync local state whenever the widget identity changes (e.g. a different widget
  // is configured while the modal is kept in the React tree)
  useEffect(() => {
    setLocalConfig(widget.config as Record<string, unknown>)
    setLocalDataSource(widget.dataSource ?? definition?.defaultDataSource)
    setLocalDataParser(widget.dataParser)
    setLocalTitle(widget.title ?? "")
  }, [widget.id, widget.config, widget.dataSource, widget.dataParser, widget.title, definition?.defaultDataSource])

  const resetLocalState = () => {
    setLocalConfig(widget.config as Record<string, unknown>)
    setLocalDataSource(widget.dataSource ?? definition?.defaultDataSource)
    setLocalDataParser(widget.dataParser)
    setLocalTitle(widget.title ?? "")
  }

  const handleSave = () => {
    updateWidget(widget.id, {
      config: localConfig,
      dataSource: localDataSource,
      dataParser: localDataParser,
      title: localTitle || undefined,
    })
    onClose()
  }

  const handleClose = () => {
    resetLocalState()
    onClose()
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "config", label: "Widget Config" },
    { id: "datasource", label: "Data Source" },
    { id: "parsing", label: "Data Parsing" },
  ]

  const fields = definition?.configSchema?.fields ?? []

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Configure: ${definition?.name ?? widget.type}`}
      size="lg"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Apply
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Tab Bar */}
        <div className="flex items-center gap-1 border-b border-border-color pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-button-primary-text"
                  : "text-muted-text hover:text-primary-text hover:bg-hover-bg"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "config" && (
          <div className="flex flex-col gap-4">
            {/* Title Override */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-text">Widget Title Override</label>
              <Input
                type="text"
                placeholder={definition?.name ?? "Widget title"}
                value={localTitle}
                onChange={(v) => setLocalTitle(v)}
                size="sm"
              />
            </div>

            {fields.length > 0 ? (
              <div className="flex flex-col gap-3">
                {fields.map((field) => (
                  <ConfigField
                    key={field.name}
                    field={field}
                    value={localConfig[field.name]}
                    onChange={(val) =>
                      setLocalConfig((prev) => ({ ...prev, [field.name]: val }))
                    }
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-text">
                This widget has no configurable fields.
              </p>
            )}
          </div>
        )}

        {activeTab === "datasource" && (
          <DataSourceForm
            dataSource={localDataSource}
            onChange={setLocalDataSource}
          />
        )}

        {activeTab === "parsing" && (
          <DataParsingForm
            parser={localDataParser}
            onChange={setLocalDataParser}
          />
        )}
      </div>
    </Modal>
  )
}
