import { Badge, Modal } from "@dockstat/ui"
import {
  Activity,
  AlertTriangle,
  Code,
  ExternalLink,
  Globe,
  HelpCircle,
  Layers,
  Play,
  Route,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Tag,
  User,
  Zap,
} from "lucide-react"
import { useEffect, useState } from "react"
import { ClientAPI } from "~/api"
import { ConfigValue } from "./misc/ConfigValue"
import { OptionsSection } from "./misc/OptionsSection"
import type {
  FrontendAction,
  FrontendLoader,
  InstalledPlugin,
  LocalVerificationStatus,
  PluginApiRoute,
  PluginDetailModalProps,
  PluginFrontendRoute,
  SecurityStatus,
} from "./types"

const securityIcons: Record<SecurityStatus, React.ReactNode> = {
  safe: <ShieldCheck size={16} className="text-green-500" />,
  unsafe: <ShieldAlert size={16} className="text-red-500" />,
  unknown: <HelpCircle size={16} className="text-yellow-500" />,
  unverified: <ShieldOff size={16} className="text-muted-text" />,
}

const securityColors: Record<SecurityStatus, string> = {
  safe: "text-green-500",
  unsafe: "text-red-500",
  unknown: "text-yellow-500",
  unverified: "text-muted-text",
}

interface PluginExtendedDetails {
  apiRoutes: PluginApiRoute[]
  frontendRoutes: PluginFrontendRoute[]
  frontendActions: FrontendAction[]
  frontendLoaders: FrontendLoader[]
  hooks: Array<{ event: string; pluginName: string }>
}

function formatTimestamp(timestamp?: number): string {
  if (!timestamp) return "N/A"
  return new Date(timestamp * 1000).toLocaleString()
}

function ApiRoutesDisplay({ routes }: { routes: PluginApiRoute[] }) {
  if (routes.length === 0) {
    return <span className="text-muted-text text-sm italic">No API routes defined</span>
  }

  return (
    <div className="space-y-2">
      {routes.map((route, index) => (
        <div
          key={`${route.path}-${index}`}
          className="flex items-center justify-between py-2 px-3 bg-main-bg rounded-md"
        >
          <div className="flex items-center gap-2">
            <Badge
              variant={route.method === "GET" ? "primary" : "warning"}
              size="sm"
              className="font-mono"
            >
              {route.method}
            </Badge>
            <code className="text-sm text-primary-text">{route.path}</code>
          </div>
          {route.actions.length > 0 && (
            <div className="flex items-center gap-1">
              <Zap size={12} className="text-muted-text" />
              <span className="text-xs text-muted-text">{route.actions.length} action(s)</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function FrontendRoutesDisplay({ routes }: { routes: PluginFrontendRoute[] }) {
  if (routes.length === 0) {
    return <span className="text-muted-text text-sm italic">No frontend routes defined</span>
  }

  return (
    <div className="space-y-2">
      {routes.map((route, index) => (
        <div
          key={`${route.path}-${index}`}
          className="flex items-center justify-between py-2 px-3 bg-main-bg rounded-md"
        >
          <div className="flex items-center gap-2">
            <Route size={14} className="text-accent" />
            <code className="text-sm text-primary-text">{route.path}</code>
            {route.meta?.showInNav && (
              <Badge variant="secondary" size="sm">
                Nav
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-text">
            {route.meta?.title && <span>{route.meta.title}</span>}
            {route.loaders && route.loaders.length > 0 && (
              <Badge variant="secondary" size="sm" outlined>
                {route.loaders.length} loader(s)
              </Badge>
            )}
            {route.actions && route.actions.length > 0 && (
              <Badge variant="secondary" size="sm" outlined>
                {route.actions.length} action(s)
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function LoadersDisplay({ loaders }: { loaders: FrontendLoader[] }) {
  if (loaders.length === 0) {
    return <span className="text-muted-text text-sm italic">No loaders defined</span>
  }

  return (
    <div className="space-y-2">
      {loaders.map((loader, index) => (
        <div
          key={`${loader.id}-${index}`}
          className="flex items-center justify-between py-2 px-3 bg-main-bg rounded-md"
        >
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-blue-500" />
            <span className="text-sm font-medium text-primary-text">{loader.id}</span>
            <Badge variant={loader.method === "POST" ? "warning" : "primary"} size="sm">
              {loader.method || "GET"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <code className="text-xs text-muted-text">{loader.apiRoute}</code>
            {loader.polling && (
              <Badge variant="secondary" size="sm" outlined>
                Polling: {loader.polling.interval}ms
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function ActionsDisplay({ actions }: { actions: FrontendAction[] }) {
  if (actions.length === 0) {
    return <span className="text-muted-text text-sm italic">No actions defined</span>
  }

  const actionTypeColors: Record<string, string> = {
    setState: "bg-purple-500",
    navigate: "bg-blue-500",
    api: "bg-green-500",
    reload: "bg-orange-500",
    custom: "bg-gray-500",
  }

  return (
    <div className="space-y-2">
      {actions.map((action, index) => (
        <div
          key={`${action.id}-${index}`}
          className="flex items-center justify-between py-2 px-3 bg-main-bg rounded-md"
        >
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-yellow-500" />
            <span className="text-sm font-medium text-primary-text">{action.id}</span>
            <Badge
              variant="secondary"
              size="sm"
              className={`${actionTypeColors[action.type] || "bg-gray-500"} text-white`}
            >
              {action.type}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-text">
            {action.apiRoute && <code>{action.apiRoute}</code>}
            {action.confirm && (
              <Badge variant="warning" size="sm" outlined>
                Confirm
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function HooksDisplay({ hooks }: { hooks: Array<{ event: string; pluginName: string }> }) {
  if (hooks.length === 0) {
    return <span className="text-muted-text text-sm italic">No hooks registered</span>
  }

  return (
    <div className="space-y-2">
      {hooks.map((hook, index) => (
        <div
          key={`${hook.event}-${index}`}
          className="flex items-center justify-between py-2 px-3 bg-main-bg rounded-md"
        >
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-purple-500" />
            <span className="text-sm font-medium text-primary-text">{hook.event}</span>
          </div>
          <Badge variant="secondary" size="sm" outlined>
            {hook.pluginName}
          </Badge>
        </div>
      ))}
    </div>
  )
}

function VerificationDisplay({ verification }: { verification: LocalVerificationStatus | null }) {
  if (!verification) {
    return <span className="text-muted-text text-sm italic">Verification not available</span>
  }

  const securityStatus = verification.securityStatus

  return (
    <div className="text-sm">
      <div className="flex items-center gap-2 mb-3">
        {securityIcons[securityStatus]}
        <span className={`font-medium ${securityColors[securityStatus]}`}>
          {securityStatus === "safe"
            ? "Verified Safe"
            : securityStatus === "unsafe"
              ? "Unsafe - Do Not Use"
              : securityStatus === "unverified"
                ? "Not Verified"
                : "Unknown Status"}
        </span>
      </div>

      <ConfigValue label="Is Verified" value={verification.isVerified} />
      <ConfigValue label="Security Status" value={verification.securityStatus} />
      <ConfigValue label="Repository" value={verification.repository} />
      <ConfigValue label="Policy" value={verification.policy} />
      <ConfigValue label="Hash Matches" value={verification.matchesCache} />

      {verification.hash && (
        <div className="py-1.5 border-b border-divider-color last:border-b-0">
          <span className="text-muted-text block mb-1">Plugin Hash</span>
          <code className="text-xs text-secondary-text break-all">{verification.hash}</code>
        </div>
      )}

      {verification.cachedHash && (
        <div className="py-1.5 border-b border-divider-color last:border-b-0">
          <span className="text-muted-text block mb-1">Expected Hash</span>
          <code className="text-xs text-secondary-text break-all">{verification.cachedHash}</code>
        </div>
      )}

      {verification.verifiedBy && (
        <ConfigValue label="Verified By" value={verification.verifiedBy} />
      )}

      {verification.verifiedAt && (
        <ConfigValue label="Verified At" value={formatTimestamp(verification.verifiedAt)} />
      )}

      {verification.notes && (
        <div className="py-1.5 border-b border-divider-color last:border-b-0">
          <span className="text-muted-text block mb-1">Notes</span>
          <p className="text-xs text-secondary-text">{verification.notes}</p>
        </div>
      )}

      <div className="py-1.5">
        <span className="text-muted-text block mb-1">Message</span>
        <p
          className={`text-xs ${securityStatus === "unsafe" ? "text-red-500" : "text-secondary-text"}`}
        >
          {verification.message}
        </p>
      </div>

      {!verification.matchesCache && verification.cachedHash && (
        <div className="mt-3 p-2 rounded-md bg-red-500/10 border border-red-500/30">
          <div className="flex items-center gap-2 text-red-500">
            <AlertTriangle size={14} />
            <span className="text-sm font-medium">Hash Mismatch Warning</span>
          </div>
          <p className="text-xs text-red-400 mt-1">
            The plugin's hash does not match the expected verification hash. This could indicate the
            plugin has been modified or tampered with.
          </p>
        </div>
      )}
    </div>
  )
}

async function fetchPluginDetails(
  plugin: InstalledPlugin,
  isLoaded: boolean
): Promise<PluginExtendedDetails> {
  const details: PluginExtendedDetails = {
    apiRoutes: [],
    frontendRoutes: [],
    frontendActions: [],
    frontendLoaders: [],
    hooks: [],
  }

  if (!isLoaded) {
    return details
  }

  try {
    // Fetch all plugin routes
    const routesRes = await ClientAPI.plugins.routes.get()
    if (routesRes.status === 200 && routesRes.data) {
      const allRoutes = routesRes.data as Array<{ plugin: string; routes: string[] }>
      const pluginRoutes = allRoutes.find((r) => r.plugin === plugin.name)
      if (pluginRoutes) {
        details.apiRoutes = pluginRoutes.routes.map((path) => ({
          path,
          method: "GET" as const,
          actions: [],
        }))
      }
    }

    // Fetch frontend routes by plugin
    const frontendRes = await ClientAPI.plugins.frontend.routes["by-plugin"].get()
    if (frontendRes.status === 200 && frontendRes.data) {
      const byPlugin = frontendRes.data as Array<{
        pluginId: number
        pluginName: string
        routes: PluginFrontendRoute[]
      }>
      const pluginFrontend = byPlugin.find((p) => p.pluginId === plugin.id)
      if (pluginFrontend) {
        details.frontendRoutes = pluginFrontend.routes || []

        // Extract actions and loaders from routes
        for (const route of details.frontendRoutes) {
          if (route.actions) {
            details.frontendActions.push(...route.actions)
          }
          if (route.loaders) {
            details.frontendLoaders.push(...route.loaders)
          }
        }
      }
    }

    // Fetch hooks
    const hooksRes = await ClientAPI.plugins.hooks.get()
    if (hooksRes.status === 200 && hooksRes.data) {
      const hookEntries = hooksRes.data as Array<[number, Map<string, unknown>]>
      const pluginHooks = hookEntries.find(([id]) => id === plugin.id)
      if (pluginHooks?.[1]) {
        const hookMap = pluginHooks[1]
        if (hookMap instanceof Map) {
          for (const [event] of hookMap) {
            details.hooks.push({ event, pluginName: plugin.name })
          }
        } else if (typeof hookMap === "object") {
          for (const event of Object.keys(hookMap)) {
            details.hooks.push({ event, pluginName: plugin.name })
          }
        }
      }
    }
  } catch (error) {
    console.error("Failed to fetch plugin details:", error)
  }

  return details
}

export function PluginDetailModal({
  open,
  onClose,
  plugin,
  isLoaded,
  verification,
}: PluginDetailModalProps) {
  const [details, setDetails] = useState<PluginExtendedDetails | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && plugin) {
      setLoading(true)
      fetchPluginDetails(plugin, isLoaded)
        .then(setDetails)
        .finally(() => setLoading(false))
    } else {
      setDetails(null)
    }
  }, [open, plugin, isLoaded])

  if (!plugin) return null

  const securityStatus = verification?.securityStatus || "unknown"

  return (
    <Modal open={open} onClose={onClose} title={`Plugin: ${plugin.name}`} size="xl">
      <div className="space-y-4">
        {/* Top Row - Basic Info & Status */}
        <div className="flex flex-wrap gap-4">
          {/* Basic Info */}
          <div className="flex-1 min-w-64">
            <OptionsSection title="Basic Information">
              <div className="text-sm">
                <ConfigValue label="Plugin ID" value={plugin.id} />
                <ConfigValue label="Name" value={plugin.name} />
                <ConfigValue label="Version" value={plugin.version} />
                <div className="flex justify-between py-1.5 border-b border-divider-color">
                  <span className="text-muted-text">Status</span>
                  <Badge variant={isLoaded ? "success" : "secondary"} size="sm">
                    {isLoaded ? (
                      <>
                        <Play size={10} className="mr-1" />
                        Active
                      </>
                    ) : (
                      "Inactive"
                    )}
                  </Badge>
                </div>
              </div>
            </OptionsSection>
          </div>

          {/* Author Info */}
          <div className="flex-1 min-w-64">
            <OptionsSection title="Author">
              <div className="text-sm">
                <div className="flex items-center gap-2 py-1.5 border-b border-divider-color">
                  <User size={14} className="text-muted-text" />
                  <span className="text-primary-text">{plugin.author.name}</span>
                </div>
                {plugin.author.email && <ConfigValue label="Email" value={plugin.author.email} />}
                {plugin.author.website && (
                  <div className="flex justify-between py-1.5 border-b border-divider-color">
                    <span className="text-muted-text">Website</span>
                    <a
                      href={plugin.author.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-accent hover:underline"
                    >
                      <Globe size={12} />
                      <span className="text-sm">Visit</span>
                    </a>
                  </div>
                )}
                <ConfigValue label="License" value={plugin.author.license} />
              </div>
            </OptionsSection>
          </div>

          {/* Repository Info */}
          <div className="flex-1 min-w-64">
            <OptionsSection title="Repository">
              <div className="text-sm">
                <ConfigValue label="Type" value={plugin.repoType} />
                {plugin.repository && plugin.repository !== "Default" && (
                  <div className="flex justify-between py-1.5 border-b border-divider-color">
                    <span className="text-muted-text">Repository</span>
                    <a
                      href={plugin.repository}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-accent hover:underline"
                    >
                      <ExternalLink size={12} />
                      <span className="text-sm">View</span>
                    </a>
                  </div>
                )}
                <div className="py-1.5 border-b border-divider-color last:border-b-0">
                  <span className="text-muted-text block mb-1">Manifest</span>
                  <code className="text-xs text-secondary-text break-all">{plugin.manifest}</code>
                </div>
              </div>
            </OptionsSection>
          </div>
        </div>

        {/* Description & Tags */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <OptionsSection title="Description">
              <p className="text-sm text-secondary-text py-2">{plugin.description}</p>
            </OptionsSection>
          </div>

          {plugin.tags && plugin.tags.length > 0 && (
            <div className="flex-1 min-w-64">
              <OptionsSection title="Tags">
                <div className="flex flex-wrap gap-1.5 py-2">
                  {plugin.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" size="sm" outlined>
                      <Tag size={10} className="mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </OptionsSection>
            </div>
          )}
        </div>

        {/* Verification Section */}
        <OptionsSection title="Verification Status">
          <div className="py-2">
            <div className="flex items-center gap-2 mb-3">
              {securityIcons[securityStatus]}
              <span className={`font-medium ${securityColors[securityStatus]}`}>
                {securityStatus === "safe"
                  ? "Verified Safe"
                  : securityStatus === "unsafe"
                    ? "Unsafe"
                    : securityStatus === "unverified"
                      ? "Not Verified"
                      : "Unknown Status"}
              </span>
              {verification?.repository && (
                <Badge variant="secondary" size="sm" outlined>
                  from {verification.repository}
                </Badge>
              )}
              {verification?.policy && (
                <Badge
                  variant={verification.policy === "strict" ? "warning" : "secondary"}
                  size="sm"
                  outlined
                >
                  <Shield size={10} className="mr-1" />
                  {verification.policy}
                </Badge>
              )}
            </div>
            <VerificationDisplay verification={verification} />
          </div>
        </OptionsSection>

        {/* Routes & Actions Section - Only shown if plugin is loaded */}
        {loading ? (
          <div className="text-center py-8 text-muted-text">
            <div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full mx-auto mb-2" />
            <p>Loading plugin details...</p>
          </div>
        ) : isLoaded && details ? (
          <>
            {/* API Routes */}
            <OptionsSection title={`Backend API Routes (${details.apiRoutes.length})`}>
              <div className="py-2">
                <ApiRoutesDisplay routes={details.apiRoutes} />
              </div>
            </OptionsSection>

            {/* Frontend Routes */}
            <OptionsSection title={`Frontend Routes (${details.frontendRoutes.length})`}>
              <div className="py-2">
                <FrontendRoutesDisplay routes={details.frontendRoutes} />
              </div>
            </OptionsSection>

            {/* Frontend Loaders */}
            <OptionsSection title={`Frontend Loaders (${details.frontendLoaders.length})`}>
              <div className="py-2">
                <LoadersDisplay loaders={details.frontendLoaders} />
              </div>
            </OptionsSection>

            {/* Frontend Actions */}
            <OptionsSection title={`Frontend Actions (${details.frontendActions.length})`}>
              <div className="py-2">
                <ActionsDisplay actions={details.frontendActions} />
              </div>
            </OptionsSection>

            {/* Hooks */}
            <OptionsSection title={`Hooks (${details.hooks.length})`}>
              <div className="py-2">
                <HooksDisplay hooks={details.hooks} />
              </div>
            </OptionsSection>
          </>
        ) : !isLoaded ? (
          <div className="text-center py-8 text-muted-text">
            <Code size={32} className="mx-auto mb-2 opacity-50" />
            <p className="font-medium">Plugin Not Active</p>
            <p className="text-sm mt-1">
              Activate this plugin to view its routes, actions, loaders, and hooks.
            </p>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
