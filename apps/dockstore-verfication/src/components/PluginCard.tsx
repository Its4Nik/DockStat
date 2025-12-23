import type { PluginVerificationView } from "../db/types"
import { Html } from "@elysiajs/html"
import { shortHash } from "../services/hash"

const _ = Html

export interface PluginCardProps {
  plugin: PluginVerificationView
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

export function PluginCard({ plugin, showActions = true }: PluginCardProps) {
  const hashDisplay = shortHash(plugin.version_hash)

  return (
    <div class="card hover:border-blue-500/50 transition-all duration-200">
      {/* Header */}
      <div class="flex items-start justify-between mb-4">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <h3 class="text-lg font-semibold text-white">{plugin.plugin_name}</h3>
            <span class="text-sm text-gray-400">v{plugin.version}</span>
          </div>
          <p class="text-sm text-gray-400 line-clamp-2">{plugin.description}</p>
        </div>
        <div class="flex flex-col items-end gap-2">
          {getVerificationBadge(plugin.verified)}
          {getSecurityBadge(plugin.security_status)}
        </div>
      </div>

      {/* Meta Info */}
      <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span class="text-gray-500">Author:</span>
          <span class="ml-2 text-gray-300">{plugin.author_name}</span>
          {plugin.author_website && (
            <a
              href={plugin.author_website}
              target="_blank"
              class="ml-1 text-blue-400 hover:text-blue-300"
            >
              ↗
            </a>
          )}
        </div>
        <div>
          <span class="text-gray-500">License:</span>
          <span class="ml-2 text-gray-300">{plugin.license}</span>
        </div>
        <div>
          <span class="text-gray-500">Repository:</span>
          <span class="ml-2">{getRepoTypeBadge(plugin.repo_type)}</span>
        </div>
        <div>
          <span class="text-gray-500">Hash:</span>
          <code class="ml-2 text-xs bg-gray-800 px-2 py-0.5 rounded font-mono text-green-400">
            {hashDisplay}
          </code>
        </div>
      </div>

      {/* Tags */}
      {plugin.tags && plugin.tags.length > 0 && (
        <div class="flex flex-wrap gap-2 mb-4">
          {plugin.tags.map((tag) => (
            <span class="text-xs px-2 py-1 bg-gray-700 rounded-full text-gray-300">{tag}</span>
          ))}
        </div>
      )}

      {/* Verification Info */}
      {plugin.verified && plugin.verified_by && (
        <div class="bg-green-900/20 border border-green-700/30 rounded-lg p-3 mb-4">
          <div class="flex items-center gap-2 text-sm">
            <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
              <title>SVG</title>
            </svg>
            <span class="text-green-400">Verified by {plugin.verified_by}</span>
            {plugin.verified_at && (
              <span class="text-green-400/60 text-xs">
                on {new Date(plugin.verified_at * 1000).toLocaleDateString()}
              </span>
            )}
          </div>
          {plugin.notes && <p class="text-sm text-green-400/80 mt-2">{plugin.notes}</p>}
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div class="flex items-center gap-2 pt-4 border-t border-gray-700">
          {!plugin.verified && (
            <button
              type="button"
              class="btn btn-primary text-sm"
              hx-post={`/api/plugins/${plugin.plugin_id}/versions/${plugin.version}/verify`}
              hx-target="closest .card"
              hx-swap="outerHTML"
            >
              <svg
                class="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-label="Verify"
              >
                <title>SVG</title>
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Verify
            </button>
          )}
          <a href={`/plugins/${plugin.plugin_id}`} class="btn btn-secondary text-sm">
            <svg
              class="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-label="View details"
            >
              <title>SVG</title>

              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            Details
          </a>
          <a
            href={plugin.repository_url}
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-secondary text-sm"
          >
            <svg
              class="w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-label="View source"
            >
              <title>SVG</title>

              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Source
          </a>
        </div>
      )}
    </div>
  )
}

export function PluginCardSkeleton() {
  return (
    <div class="card animate-pulse">
      <div class="flex items-start justify-between mb-4">
        <div class="flex-1">
          <div class="h-6 bg-gray-700 rounded w-1/3 mb-2" />
          <div class="h-4 bg-gray-700 rounded w-2/3" />
        </div>
        <div class="flex flex-col items-end gap-2">
          <div class="h-6 bg-gray-700 rounded w-20" />
          <div class="h-6 bg-gray-700 rounded w-16" />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div class="h-4 bg-gray-700 rounded" />
        <div class="h-4 bg-gray-700 rounded" />
        <div class="h-4 bg-gray-700 rounded" />
        <div class="h-4 bg-gray-700 rounded" />
      </div>
      <div class="flex gap-2 pt-4 border-t border-gray-700">
        <div class="h-9 bg-gray-700 rounded w-24" />
        <div class="h-9 bg-gray-700 rounded w-24" />
      </div>
    </div>
  )
}
