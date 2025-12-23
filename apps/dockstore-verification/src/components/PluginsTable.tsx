import { Html } from "@elysiajs/html"
import type { PluginVerificationView } from "../db/types"
import { shortHash } from "../services/hash"
import { getViewableRepositoryUrl } from "../services/url"

const _ = Html

export interface PluginsTableProps {
  plugins: PluginVerificationView[]
  showActions?: boolean
}

function getSecurityBadge(status: "safe" | "unsafe" | "unknown") {
  switch (status) {
    case "safe":
      return <span class="badge badge-success">✓ Safe</span>
    case "unsafe":
      return <span class="badge badge-error">✗ Unsafe</span>
    default:
      return <span class="badge badge-warning">? Unknown</span>
  }
}

function getVerificationBadge(verified: boolean) {
  if (verified) {
    return <span class="badge badge-success">Verified</span>
  }
  return <span class="badge badge-neutral">Unverified</span>
}

function getRepoTypeBadge(repoType: "github" | "gitlab" | "http") {
  const colors: Record<string, string> = {
    github: "bg-gray-700 text-white",
    gitlab: "bg-orange-600 text-white",
    http: "bg-blue-600 text-white",
  }
  return (
    <span class={`badge ${colors[repoType] || "badge-neutral"}`}>
      {repoType.charAt(0).toUpperCase() + repoType.slice(1)}
    </span>
  )
}

export function PluginsTable({ plugins, showActions = true }: PluginsTableProps) {
  if (plugins.length === 0) {
    return (
      <div class="card text-center py-12">
        <svg
          class="w-16 h-16 mx-auto text-gray-500 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <title>SVG</title>
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <h3 class="text-lg font-semibold text-gray-300 mb-2">No plugins found</h3>
        <p class="text-gray-500">Add a repository to start tracking plugins.</p>
      </div>
    )
  }

  return (
    <div class="table-container card p-0 overflow-hidden">
      <table>
        <thead>
          <tr>
            <th>Plugin</th>
            <th>Version</th>
            <th>Author</th>
            <th>Source</th>
            <th>Hash</th>
            <th>Status</th>
            <th>Security</th>
            {showActions && <th class="text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {plugins.map((plugin) => (
            <tr>
              <td>
                <div class="flex flex-col">
                  <a
                    href={`/plugins/${plugin.plugin_id}`}
                    class="font-medium text-white hover:text-blue-400 transition-colors"
                  >
                    {plugin.plugin_name}
                  </a>
                  <span class="text-xs text-gray-500 truncate max-w-xs">{plugin.description}</span>
                </div>
              </td>
              <td>
                <code class="text-sm bg-gray-800 px-2 py-0.5 rounded">v{plugin.version}</code>
              </td>
              <td>
                <div class="flex flex-col">
                  <span class="text-gray-300">{plugin.author_name}</span>
                  {plugin.author_email && (
                    <span class="text-xs text-gray-500">{plugin.author_email}</span>
                  )}
                </div>
              </td>
              <td>{getRepoTypeBadge(plugin.repo_type)}</td>
              <td>
                <code class="text-xs bg-gray-800 px-2 py-0.5 rounded font-mono text-green-400">
                  {shortHash(plugin.version_hash)}
                </code>
              </td>
              <td>{getVerificationBadge(plugin.verified)}</td>
              <td>{getSecurityBadge(plugin.security_status)}</td>
              {showActions && (
                <td class="text-right">
                  <div class="flex items-center justify-end gap-2">
                    {!plugin.verified && (
                      <a
                        href={`/verify?plugin=${plugin.plugin_id}&version=${encodeURIComponent(plugin.version)}`}
                        class="btn btn-primary text-xs py-1 px-2"
                      >
                        Verify
                      </a>
                    )}
                    <a
                      href={`/plugins/${plugin.plugin_id}`}
                      class="btn btn-secondary text-xs py-1 px-2"
                    >
                      View
                    </a>
                    <a
                      href={getViewableRepositoryUrl(plugin.repository_url, plugin.repo_type)}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="btn btn-secondary text-xs py-1 px-2"
                      title="View Source"
                    >
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />

                        <title>SVG</title>
                      </svg>
                    </a>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function PluginTableRow({
  plugin,
  showActions = true,
}: {
  plugin: PluginVerificationView
  showActions?: boolean
}) {
  return (
    <tr>
      <td>
        <div class="flex flex-col">
          <a
            href={`/plugins/${plugin.plugin_id}`}
            class="font-medium text-white hover:text-blue-400 transition-colors"
          >
            {plugin.plugin_name}
          </a>
          <span class="text-xs text-gray-500 truncate max-w-xs">{plugin.description}</span>
        </div>
      </td>
      <td>
        <code class="text-sm bg-gray-800 px-2 py-0.5 rounded">v{plugin.version}</code>
      </td>
      <td>
        <div class="flex flex-col">
          <span class="text-gray-300">{plugin.author_name}</span>
          {plugin.author_email && <span class="text-xs text-gray-500">{plugin.author_email}</span>}
        </div>
      </td>
      <td>{getRepoTypeBadge(plugin.repo_type)}</td>
      <td>
        <code class="text-xs bg-gray-800 px-2 py-0.5 rounded font-mono text-green-400">
          {shortHash(plugin.version_hash)}
        </code>
      </td>
      <td>{getVerificationBadge(plugin.verified)}</td>
      <td>{getSecurityBadge(plugin.security_status)}</td>
      {showActions && (
        <td class="text-right">
          <div class="flex items-center justify-end gap-2">
            {!plugin.verified && (
              <a
                href={`/verify?plugin=${plugin.plugin_id}&version=${encodeURIComponent(plugin.version)}`}
                class="btn btn-primary text-xs py-1 px-2"
              >
                Verify
              </a>
            )}
            <a href={`/plugins/${plugin.plugin_id}`} class="btn btn-secondary text-xs py-1 px-2">
              View
            </a>
          </div>
        </td>
      )}
    </tr>
  )
}

export function PluginsTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div class="table-container card p-0 overflow-hidden animate-pulse">
      <table>
        <thead>
          <tr>
            <th>Plugin</th>
            <th>Version</th>
            <th>Author</th>
            <th>Source</th>
            <th>Hash</th>
            <th>Status</th>
            <th>Security</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_) => (
            <tr>
              <td>
                <div class="h-4 bg-gray-700 rounded w-32 mb-1" />
                <div class="h-3 bg-gray-700 rounded w-48" />
              </td>
              <td>
                <div class="h-5 bg-gray-700 rounded w-16" />
              </td>
              <td>
                <div class="h-4 bg-gray-700 rounded w-24 mb-1" />
                <div class="h-3 bg-gray-700 rounded w-32" />
              </td>
              <td>
                <div class="h-5 bg-gray-700 rounded w-16" />
              </td>
              <td>
                <div class="h-5 bg-gray-700 rounded w-20" />
              </td>
              <td>
                <div class="h-5 bg-gray-700 rounded w-20" />
              </td>
              <td>
                <div class="h-5 bg-gray-700 rounded w-16" />
              </td>
              <td class="text-right">
                <div class="h-7 bg-gray-700 rounded w-20 ml-auto" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
