import { Html } from "@elysiajs/html"
import { Layout } from "../components/Layout"
import { PluginsTable } from "../components/PluginsTable"
import { StatsCard, StatsGrid, StatsIcons } from "../components/StatsCard"
import type { PluginVerificationView, RepositoryWithStats } from "../db/types"

const _ = Html

export interface DashboardStats {
  totalPlugins: number
  verifiedPlugins: number
  totalVersions: number
  verifiedVersions: number
  safePlugins: number
  unsafePlugins: number
  pendingReview: number
  totalRepositories: number
}

export interface DashboardProps {
  stats: DashboardStats
  recentPlugins: PluginVerificationView[]
  repositories: RepositoryWithStats[]
}

export function Dashboard({ stats, recentPlugins, repositories }: DashboardProps) {
  const verificationRate =
    stats.totalVersions > 0 ? Math.round((stats.verifiedVersions / stats.totalVersions) * 100) : 0

  return (
    <Layout title="Dashboard" currentPath="/">
      {/* Page Header */}
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">Verification Dashboard</h1>
        <p class="text-gray-400">
          Monitor plugin verification status and security across all repositories.
        </p>
      </div>

      {/* Stats Grid */}
      <StatsGrid columns={4}>
        <StatsCard
          title="Total Plugins"
          value={stats.totalPlugins}
          subtitle={`${stats.totalVersions} versions tracked`}
          icon={StatsIcons.plugins}
          variant="info"
        />
        <StatsCard
          title="Verified"
          value={stats.verifiedPlugins}
          subtitle={`${verificationRate}% verification rate`}
          icon={StatsIcons.verified}
          variant="success"
        />
        <StatsCard
          title="Safe"
          value={stats.safePlugins}
          subtitle="Security verified"
          icon={StatsIcons.safe}
          variant="success"
        />
        <StatsCard
          title="Pending Review"
          value={stats.pendingReview}
          subtitle="Awaiting verification"
          icon={StatsIcons.pending}
          variant="warning"
        />
      </StatsGrid>

      {/* Main Content Grid */}
      <div class="mt-4">
        {/* Recent Plugins Section */}
        <div>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-white">Recent Plugins</h2>
            <a href="/plugins" class="text-sm text-blue-400 hover:text-blue-300">
              View all →
            </a>
          </div>
          <PluginsTable plugins={recentPlugins} showActions={true} />
        </div>

        {/* Repositories */}
        <div class="mt-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-white">Repositories</h2>
            <a href="/repositories" class="text-sm text-blue-400 hover:text-blue-300">
              Manage →
            </a>
          </div>

          {repositories.length === 0 ? (
            <div class="card text-center py-8">
              <svg
                class="w-12 h-12 mx-auto text-gray-500 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>SVG</title>

                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
              <p class="text-gray-400 mb-4">No repositories added yet</p>
              <a href="/repositories/add" class="btn btn-primary text-sm">
                Add Repository
              </a>
            </div>
          ) : (
            <div class="space-y-3">
              {repositories.map((repo) => (
                <div class="card p-4">
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="font-medium text-white truncate">{repo.name}</h3>
                    <span class={`badge ${repo.enabled ? "badge-success" : "badge-neutral"}`}>
                      {repo.enabled ? "Active" : "Disabled"}
                    </span>
                  </div>
                  <p class="text-xs text-gray-500 truncate mb-3">{repo.url}</p>
                  <div class="grid grid-cols-2 gap-2 text-xs">
                    <div class="bg-gray-800 rounded p-2">
                      <span class="text-gray-500">Plugins:</span>
                      <span class="ml-1 text-white font-medium">{repo.total_plugins}</span>
                    </div>
                    <div class="bg-gray-800 rounded p-2">
                      <span class="text-gray-500">Verified:</span>
                      <span class="ml-1 text-green-400 font-medium">{repo.verified_plugins}</span>
                    </div>
                  </div>
                  <div class="mt-3 flex gap-2">
                    <button
                      type="button"
                      class="btn btn-secondary text-xs flex-1"
                      hx-post={`/api/repositories/${repo.id}/sync`}
                      hx-indicator=".htmx-indicator"
                    >
                      <span class="htmx-indicator">
                        <svg class="animate-spin w-3 h-3 mr-1" viewBox="0 0 24 24">
                          <title>SVG</title>
                          <circle
                            class="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            stroke-width="4"
                            fill="none"
                          />
                          <path
                            class="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      </span>
                      Sync
                    </button>
                    <a href={`/repositories/${repo.id}`} class="btn btn-secondary text-xs flex-1">
                      Details
                    </a>
                  </div>
                </div>
              ))}

              <a
                href="/repositories/add"
                class="card p-4 border-dashed border-2 border-gray-600 hover:border-blue-500 transition-colors text-center block"
              >
                <svg
                  class="w-8 h-8 mx-auto text-gray-500 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>SVG</title>
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span class="text-sm text-gray-400">Add Repository</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div class="mt-8">
        <h2 class="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/verify" class="card hover:border-blue-500 transition-colors">
            <div class="flex items-center gap-4">
              <div class="p-3 bg-blue-500/20 rounded-lg">
                <svg
                  class="w-6 h-6 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>SVG</title>

                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <h3 class="font-medium text-white">Verify Plugin</h3>
                <p class="text-sm text-gray-400">Manually review and verify a plugin version</p>
              </div>
            </div>
          </a>

          <a href="/repositories/add" class="card hover:border-green-500 transition-colors">
            <div class="flex items-center gap-4">
              <div class="p-3 bg-green-500/20 rounded-lg">
                <svg
                  class="w-6 h-6 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>SVG</title>

                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <div>
                <h3 class="font-medium text-white">Add Repository</h3>
                <p class="text-sm text-gray-400">Track plugins from a new repository</p>
              </div>
            </div>
          </a>

          <button
            type="button"
            class="card hover:border-yellow-500 transition-colors text-left"
            hx-post="/api/sync-all"
            hx-indicator=".sync-indicator"
          >
            <div class="flex items-center gap-4">
              <div class="p-3 bg-yellow-500/20 rounded-lg">
                <svg
                  class="w-6 h-6 text-yellow-400 sync-indicator"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>SVG</title>

                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
              <div>
                <h3 class="font-medium text-white">Sync All</h3>
                <p class="text-sm text-gray-400">Fetch latest plugins from all repositories</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </Layout>
  )
}
