import { Html } from "@elysiajs/html"
import type { PluginVerificationView } from "../db/types"

const _ = Html

export interface PublicDashboardStats {
  totalPlugins: number
  verifiedPlugins: number
  totalVersions: number
  verifiedVersions: number
  safePlugins: number
  unsafePlugins: number
}

export interface PublicDashboardProps {
  stats: PublicDashboardStats
  plugins: PluginVerificationView[]
}

/**
 * Public layout without navigation (for unauthenticated users)
 */
function PublicLayout({
  title,
  children,
}: {
  title: string
  children: JSX.Element | JSX.Element[] | string
}) {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title} - DockStore Plugin Status</title>
        <script src="https://unpkg.com/htmx.org@1.9.10" />
        <script src="https://cdn.tailwindcss.com" />
        <style>
          {`
            :root {
              --bg-primary: #0f172a;
              --bg-secondary: #1e293b;
              --bg-card: #334155;
              --text-primary: #f8fafc;
              --text-secondary: #94a3b8;
              --text-muted: #64748b;
              --accent-primary: #3b82f6;
              --accent-success: #22c55e;
              --accent-warning: #f59e0b;
              --accent-error: #ef4444;
              --border-color: #475569;
            }
            body {
              background-color: var(--bg-primary);
              color: var(--text-primary);
              font-family: system-ui, -apple-system, sans-serif;
            }
            .card {
              background-color: var(--bg-secondary);
              border: 1px solid var(--border-color);
              border-radius: 0.5rem;
              padding: 1.5rem;
            }
            .badge {
              display: inline-flex;
              align-items: center;
              padding: 0.25rem 0.75rem;
              border-radius: 9999px;
              font-size: 0.75rem;
              font-weight: 500;
            }
            .badge-success {
              background-color: rgba(34, 197, 94, 0.2);
              color: #22c55e;
              border: 1px solid rgba(34, 197, 94, 0.3);
            }
            .badge-warning {
              background-color: rgba(245, 158, 11, 0.2);
              color: #f59e0b;
              border: 1px solid rgba(245, 158, 11, 0.3);
            }
            .badge-error {
              background-color: rgba(239, 68, 68, 0.2);
              color: #ef4444;
              border: 1px solid rgba(239, 68, 68, 0.3);
            }
            .badge-neutral {
              background-color: rgba(100, 116, 139, 0.2);
              color: #94a3b8;
              border: 1px solid rgba(100, 116, 139, 0.3);
            }
            .table-container {
              overflow-x: auto;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              padding: 0.75rem 1rem;
              text-align: left;
              border-bottom: 1px solid var(--border-color);
            }
            th {
              background-color: var(--bg-card);
              font-weight: 600;
              color: var(--text-secondary);
              text-transform: uppercase;
              font-size: 0.75rem;
              letter-spacing: 0.05em;
            }
            tr:hover td {
              background-color: rgba(51, 65, 85, 0.5);
            }
          `}
        </style>
      </head>
      <body class="min-h-screen">
        {/* Public Header */}
        <header class="bg-[#1e293b] border-b border-[#475569]">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
              {/* Logo */}
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg
                    class="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-label="Shield icon"
                  >
                    <title>Shield</title>
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 class="text-xl font-bold text-white">DockStore Plugin Status</h1>
                  <p class="text-xs text-gray-400">Public Verification Dashboard</p>
                </div>
              </div>

              {/* API Documentation Link */}
              <div class="flex items-center gap-4">
                <a
                  href="/api/public/plugins"
                  class="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  API
                </a>
                <a
                  href="https://github.com/its4nik/dockstat"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>

        {/* Footer */}
        <footer class="bg-[#1e293b] border-t border-[#475569] mt-auto">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div class="flex items-center justify-between">
              <p class="text-sm text-gray-400">
                &copy; {new Date().getFullYear()} DockStore Verification System
              </p>
              <p class="text-xs text-gray-500">
                Last updated: {new Date().toISOString().split("T")[0]}
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}

/**
 * Status icon component for verification status
 */
function StatusIcon({ status }: { status: "safe" | "unsafe" | "unknown" }) {
  if (status === "safe") {
    return (
      <svg
        class="w-5 h-5 text-green-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-label="Safe"
      >
        <title>Safe</title>
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    )
  }
  if (status === "unsafe") {
    return (
      <svg
        class="w-5 h-5 text-red-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-label="Unsafe"
      >
        <title>Unsafe</title>
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    )
  }
  return (
    <svg
      class="w-5 h-5 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-label="Unknown"
    >
      <title>Unknown</title>
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

/**
 * Public stats card component
 */
function PublicStatsCard({
  title,
  value,
  subtitle,
  variant = "default",
}: {
  title: string
  value: number
  subtitle?: string
  variant?: "default" | "success" | "warning" | "error"
}) {
  const variantStyles = {
    default: "border-l-blue-500",
    success: "border-l-green-500",
    warning: "border-l-yellow-500",
    error: "border-l-red-500",
  }

  return (
    <div class={`card border-l-4 ${variantStyles[variant]}`}>
      <p class="text-sm text-gray-400 uppercase tracking-wide">{title}</p>
      <p class="text-3xl font-bold text-white mt-1">{value}</p>
      {subtitle && <p class="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  )
}

/**
 * Public dashboard view - shows all plugin verification statuses
 */
export function PublicDashboard({ stats, plugins }: PublicDashboardProps) {
  const verificationRate =
    stats.totalVersions > 0 ? Math.round((stats.verifiedVersions / stats.totalVersions) * 100) : 0

  // Group plugins by name to show latest version of each
  const latestPlugins = plugins.reduce(
    (acc, plugin) => {
      if (!acc[plugin.plugin_name]) {
        acc[plugin.plugin_name] = plugin
      }
      return acc
    },
    {} as Record<string, PluginVerificationView>
  )

  const pluginList = Object.values(latestPlugins)

  return (
    <PublicLayout title="Plugin Status">
      {/* Page Header */}
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold text-white mb-2">Plugin Verification Status</h1>
        <p class="text-gray-400 max-w-2xl mx-auto">
          View the security and verification status of all DockStore plugins. Use the API endpoint{" "}
          <code class="bg-gray-800 px-2 py-1 rounded text-sm">/api/compare</code> to validate
          plugins in your applications.
        </p>
      </div>

      {/* Stats Overview */}
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <PublicStatsCard
          title="Total Plugins"
          value={stats.totalPlugins}
          subtitle={`${stats.totalVersions} versions`}
          variant="default"
        />
        <PublicStatsCard
          title="Verified"
          value={stats.verifiedPlugins}
          subtitle={`${verificationRate}% verified`}
          variant="success"
        />
        <PublicStatsCard
          title="Safe"
          value={stats.safePlugins}
          subtitle="Security verified"
          variant="success"
        />
        <PublicStatsCard
          title="Unsafe"
          value={stats.unsafePlugins}
          subtitle="Security issues found"
          variant="error"
        />
      </div>

      {/* Search/Filter */}
      <div class="card mb-6">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex-1">
            <input
              type="text"
              placeholder="Search plugins..."
              class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              hx-get="/public/plugins"
              hx-trigger="keyup changed delay:300ms"
              hx-target="#plugin-list"
              hx-swap="innerHTML"
              name="search"
            />
          </div>
          <div class="flex gap-2">
            <button
              type="button"
              class="px-4 py-2 bg-gray-700 rounded-lg text-white hover:bg-gray-600 transition-colors"
              hx-get="/public/plugins?filter=all"
              hx-target="#plugin-list"
              hx-swap="innerHTML"
            >
              All
            </button>
            <button
              type="button"
              class="px-4 py-2 bg-green-600/20 border border-green-600/30 rounded-lg text-green-400 hover:bg-green-600/30 transition-colors"
              hx-get="/public/plugins?filter=safe"
              hx-target="#plugin-list"
              hx-swap="innerHTML"
            >
              Safe
            </button>
            <button
              type="button"
              class="px-4 py-2 bg-red-600/20 border border-red-600/30 rounded-lg text-red-400 hover:bg-red-600/30 transition-colors"
              hx-get="/public/plugins?filter=unsafe"
              hx-target="#plugin-list"
              hx-swap="innerHTML"
            >
              Unsafe
            </button>
            <button
              type="button"
              class="px-4 py-2 bg-yellow-600/20 border border-yellow-600/30 rounded-lg text-yellow-400 hover:bg-yellow-600/30 transition-colors"
              hx-get="/public/plugins?filter=unverified"
              hx-target="#plugin-list"
              hx-swap="innerHTML"
            >
              Unverified
            </button>
          </div>
        </div>
      </div>

      {/* Plugin List */}
      <div id="plugin-list">
        <PublicPluginList plugins={pluginList} />
      </div>

      {/* API Usage Section */}
      <div class="card mt-8">
        <h2 class="text-xl font-semibold text-white mb-4">API Usage</h2>
        <p class="text-gray-400 mb-4">
          Use the compare API to validate plugins before installation:
        </p>
        <div class="bg-gray-900 rounded-lg p-4 font-mono text-sm">
          <p class="text-gray-500 mb-2"># POST /api/compare</p>
          <pre class="text-green-400">
            {`{
  "pluginName": "example-plugin",
  "pluginHash": "sha256:abc123...",
  "pluginVersion": "1.0.0"
}`}
          </pre>
        </div>
        <p class="text-gray-400 mt-4 text-sm">
          The API will return the verification status, security assessment, and any notes from the
          verification team.
        </p>
      </div>
    </PublicLayout>
  )
}

/**
 * Public plugin list component (for HTMX partial updates)
 */
export function PublicPluginList({ plugins }: { plugins: PluginVerificationView[] }) {
  if (plugins.length === 0) {
    return (
      <div class="card text-center py-12">
        <svg
          class="w-16 h-16 mx-auto text-gray-600 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <title>No plugins</title>
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <p class="text-gray-400">No plugins found matching your criteria</p>
      </div>
    )
  }

  return (
    <div class="card overflow-hidden p-0">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Plugin</th>
              <th>Version</th>
              <th>Author</th>
              <th>Status</th>
              <th>Verified</th>
              <th>Hash</th>
            </tr>
          </thead>
          <tbody>
            {plugins.map((plugin) => (
              <tr>
                <td>
                  <div class="flex flex-col">
                    <span class="font-medium text-white">{plugin.plugin_name}</span>
                    <span class="text-xs text-gray-500 truncate max-w-xs">
                      {plugin.description}
                    </span>
                  </div>
                </td>
                <td>
                  <span class="font-mono text-sm text-gray-300">{plugin.version}</span>
                </td>
                <td>
                  <span class="text-gray-400">{plugin.author_name}</span>
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <StatusIcon status={plugin.security_status} />
                    <span
                      class={`badge ${
                        plugin.security_status === "safe"
                          ? "badge-success"
                          : plugin.security_status === "unsafe"
                            ? "badge-error"
                            : "badge-neutral"
                      }`}
                    >
                      {plugin.security_status}
                    </span>
                  </div>
                </td>
                <td>
                  {plugin.verified ? (
                    <span class="badge badge-success">
                      <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <title>Verified</title>
                        <path
                          fill-rule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clip-rule="evenodd"
                        />
                      </svg>
                      Verified
                    </span>
                  ) : (
                    <span class="badge badge-warning">Pending</span>
                  )}
                </td>
                <td>
                  <code class="text-xs text-gray-500 font-mono">
                    {plugin.version_hash?.slice(0, 12)}...
                  </code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
