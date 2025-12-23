import { Html } from "@elysiajs/html"
import { Layout } from "../components/Layout"
import { PluginsTable } from "../components/PluginsTable"
import { PluginCard } from "../components/PluginCard"
import type { PluginVerificationView } from "../db/types"

const _ = Html

export interface PluginsViewProps {
  plugins: PluginVerificationView[]
  filter?: "all" | "verified" | "unverified" | "safe" | "unsafe"
  search?: string
  view?: "table" | "grid"
}

function FilterButton({
  label,
  value,
  currentFilter,
  count,
}: {
  label: string
  value: string
  currentFilter: string
  count?: number
}) {
  const isActive = currentFilter === value
  return (
    <button
      type="button"
      class={`btn ${isActive ? "btn-primary" : "btn-secondary"} text-sm`}
      hx-get={`/plugins?filter=${value}`}
      hx-target="#plugins-content"
      hx-swap="innerHTML"
      hx-push-url="true"
    >
      {label}
      {count !== undefined && (
        <span
          class={`ml-2 px-2 py-0.5 rounded-full text-xs ${isActive ? "bg-white/20" : "bg-gray-600"}`}
        >
          {count}
        </span>
      )}
    </button>
  )
}

export function PluginsView({
  plugins,
  filter = "all",
  search = "",
  view = "table",
}: PluginsViewProps) {
  const verifiedCount = plugins.filter((p) => p.verified).length
  const unverifiedCount = plugins.filter((p) => !p.verified).length
  const safeCount = plugins.filter((p) => p.security_status === "safe").length
  const unsafeCount = plugins.filter((p) => p.security_status === "unsafe").length

  return (
    <Layout title="Plugins" currentPath="/plugins">
      {/* Page Header */}
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">Plugins</h1>
        <p class="text-gray-400">Browse and manage all tracked plugins across repositories.</p>
      </div>

      {/* Filters and Search */}
      <div class="card mb-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search */}
          <div class="relative flex-1 max-w-md">
            <svg
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>SVG</title>
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search plugins..."
              class="input pl-10"
              value={search}
              hx-get="/plugins"
              hx-trigger="keyup changed delay:300ms"
              hx-target="#plugins-content"
              hx-swap="innerHTML"
              hx-include="[name='filter'], [name='view']"
              name="search"
            />
          </div>

          {/* Filter Buttons */}
          <div class="flex items-center gap-2 flex-wrap">
            <FilterButton label="All" value="all" currentFilter={filter} count={plugins.length} />
            <FilterButton
              label="Verified"
              value="verified"
              currentFilter={filter}
              count={verifiedCount}
            />
            <FilterButton
              label="Unverified"
              value="unverified"
              currentFilter={filter}
              count={unverifiedCount}
            />
            <FilterButton label="Safe" value="safe" currentFilter={filter} count={safeCount} />
            <FilterButton
              label="Unsafe"
              value="unsafe"
              currentFilter={filter}
              count={unsafeCount}
            />
          </div>

          {/* View Toggle */}
          <div class="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
            <button
              type="button"
              class={`p-2 rounded ${view === "table" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"}`}
              hx-get={`/plugins?filter=${filter}&view=table`}
              hx-target="#plugins-content"
              hx-swap="innerHTML"
              hx-push-url="true"
              title="Table View"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
                <title>SVG</title>
              </svg>
            </button>
            <button
              type="button"
              class={`p-2 rounded ${view === "grid" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"}`}
              hx-get={`/plugins?filter=${filter}&view=grid`}
              hx-target="#plugins-content"
              hx-swap="innerHTML"
              hx-push-url="true"
              title="Grid View"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
                <title>SVG</title>
              </svg>
            </button>
          </div>
        </div>

        <input type="hidden" name="filter" value={filter} />
        <input type="hidden" name="view" value={view} />
      </div>

      {/* Plugins Content */}
      <div id="plugins-content">
        <PluginsContent plugins={plugins} view={view} />
      </div>
    </Layout>
  )
}

export function PluginsContent({
  plugins,
  view = "table",
}: {
  plugins: PluginVerificationView[]
  view?: "table" | "grid"
}) {
  if (plugins.length === 0) {
    return (
      <div class="card text-center py-16">
        <svg
          class="w-20 h-20 mx-auto text-gray-500 mb-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <title>SVG</title>
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 class="text-xl font-semibold text-gray-300 mb-2">No plugins found</h3>
        <p class="text-gray-500 mb-6">
          Try adjusting your filters or add a new repository to track plugins.
        </p>
        <div class="flex items-center justify-center gap-4">
          <button
            type="button"
            class="btn btn-secondary"
            hx-get="/plugins?filter=all"
            hx-target="#plugins-content"
            hx-swap="innerHTML"
          >
            Clear Filters
          </button>
          <a href="/repositories/add" class="btn btn-primary">
            Add Repository
          </a>
        </div>
      </div>
    )
  }

  if (view === "grid") {
    return (
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plugins.map((plugin) => (
          <PluginCard plugin={plugin} showActions={true} />
        ))}
      </div>
    )
  }

  return <PluginsTable plugins={plugins} showActions={true} />
}

export function PluginDetail({ plugin }: { plugin: PluginVerificationView }) {
  return (
    <Layout title={plugin.plugin_name} currentPath="/plugins">
      {/* Breadcrumb */}
      <nav class="mb-6">
        <ol class="flex items-center gap-2 text-sm">
          <li>
            <a href="/plugins" class="text-gray-400 hover:text-white">
              Plugins
            </a>
          </li>
          <li class="text-gray-600">/</li>
          <li class="text-white">{plugin.plugin_name}</li>
        </ol>
      </nav>

      {/* Plugin Header */}
      <div class="card mb-8">
        <div class="flex items-start justify-between mb-6">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-3xl font-bold text-white">{plugin.plugin_name}</h1>
              <span class="text-lg text-gray-400">v{plugin.version}</span>
            </div>
            <p class="text-gray-400 max-w-2xl">{plugin.description}</p>
          </div>
          <div class="flex flex-col items-end gap-2">
            <span class={`badge ${plugin.verified ? "badge-success" : "badge-neutral"}`}>
              {plugin.verified ? "Verified" : "Unverified"}
            </span>
            <span
              class={`badge ${
                plugin.security_status === "safe"
                  ? "badge-success"
                  : plugin.security_status === "unsafe"
                    ? "badge-error"
                    : "badge-warning"
              }`}
            >
              {plugin.security_status === "safe"
                ? "✓ Safe"
                : plugin.security_status === "unsafe"
                  ? "✗ Unsafe"
                  : "? Unknown"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div class="flex items-center gap-3">
          {!plugin.verified && (
            <button
              type="button"
              class="btn btn-primary"
              hx-post={`/api/plugins/${plugin.plugin_id}/versions/${plugin.version}/verify`}
              hx-target="body"
              hx-swap="outerHTML"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
                <title>SVG</title>
              </svg>
              Verify This Version
            </button>
          )}
          <a href={plugin.repository_url} target="_blank" class="btn btn-secondary">
            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              <title>SVG</title>
            </svg>
            View Source
          </a>
          {plugin.author_website && (
            <a href={plugin.author_website} target="_blank" class="btn btn-secondary">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
                <title>SVG</title>
              </svg>
              Author Website
            </a>
          )}
        </div>
      </div>

      {/* Plugin Details Grid */}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Meta Information */}
        <div class="card">
          <h2 class="text-lg font-semibold text-white mb-4">Information</h2>
          <dl class="space-y-4">
            <div class="flex justify-between">
              <dt class="text-gray-400">Author</dt>
              <dd class="text-white">{plugin.author_name}</dd>
            </div>
            {plugin.author_email && (
              <div class="flex justify-between">
                <dt class="text-gray-400">Email</dt>
                <dd class="text-white">{plugin.author_email}</dd>
              </div>
            )}
            <div class="flex justify-between">
              <dt class="text-gray-400">License</dt>
              <dd class="text-white">{plugin.license}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-400">Repository Type</dt>
              <dd>
                <span class="badge badge-neutral">
                  {plugin.repo_type.charAt(0).toUpperCase() + plugin.repo_type.slice(1)}
                </span>
              </dd>
            </div>
            <div class="flex justify-between items-start">
              <dt class="text-gray-400">Tags</dt>
              <dd class="flex flex-wrap justify-end gap-1">
                {plugin.tags && plugin.tags.length > 0 ? (
                  plugin.tags.map((tag) => (
                    <span class="text-xs px-2 py-1 bg-gray-700 rounded-full text-gray-300">
                      {tag}
                    </span>
                  ))
                ) : (
                  <span class="text-gray-500">No tags</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {/* Verification Details */}
        <div class="card">
          <h2 class="text-lg font-semibold text-white mb-4">Verification</h2>
          <dl class="space-y-4">
            <div class="flex justify-between">
              <dt class="text-gray-400">Source Hash</dt>
              <dd>
                <code class="text-xs bg-gray-800 px-2 py-1 rounded font-mono text-green-400">
                  {plugin.version_hash}
                </code>
              </dd>
            </div>
            {plugin.bundle_hash && (
              <div class="flex justify-between">
                <dt class="text-gray-400">Bundle Hash</dt>
                <dd>
                  <code class="text-xs bg-gray-800 px-2 py-1 rounded font-mono text-blue-400">
                    {plugin.bundle_hash}
                  </code>
                </dd>
              </div>
            )}
            <div class="flex justify-between">
              <dt class="text-gray-400">Verification Status</dt>
              <dd>
                <span class={`badge ${plugin.verified ? "badge-success" : "badge-neutral"}`}>
                  {plugin.verified ? "Verified" : "Unverified"}
                </span>
              </dd>
            </div>
            {plugin.verified && plugin.verified_by && (
              <>
                <div class="flex justify-between">
                  <dt class="text-gray-400">Verified By</dt>
                  <dd class="text-white">{plugin.verified_by}</dd>
                </div>
                {plugin.verified_at && (
                  <div class="flex justify-between">
                    <dt class="text-gray-400">Verified At</dt>
                    <dd class="text-white">
                      {new Date(plugin.verified_at * 1000).toLocaleString()}
                    </dd>
                  </div>
                )}
              </>
            )}
            <div class="flex justify-between">
              <dt class="text-gray-400">Security Status</dt>
              <dd>
                <span
                  class={`badge ${
                    plugin.security_status === "safe"
                      ? "badge-success"
                      : plugin.security_status === "unsafe"
                        ? "badge-error"
                        : "badge-warning"
                  }`}
                >
                  {plugin.security_status.charAt(0).toUpperCase() + plugin.security_status.slice(1)}
                </span>
              </dd>
            </div>
          </dl>

          {plugin.notes && (
            <div class="mt-6 pt-4 border-t border-gray-700">
              <h3 class="text-sm font-medium text-gray-400 mb-2">Verification Notes</h3>
              <p class="text-gray-300">{plugin.notes}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
