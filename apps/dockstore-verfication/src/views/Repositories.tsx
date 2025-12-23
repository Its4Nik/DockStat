import { Html } from "@elysiajs/html"
import { Layout } from "../components/Layout"
import type { RepositoryWithStats } from "../db/types"

const _ = Html

export interface RepositoriesViewProps {
  repositories: RepositoryWithStats[]
}

export function RepositoriesView({ repositories }: RepositoriesViewProps) {
  return (
    <Layout title="Repositories" currentPath="/repositories">
      {/* Page Header */}
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-white mb-2">Repositories</h1>
          <p class="text-gray-400">Manage plugin repositories for verification tracking.</p>
        </div>
        <a href="/repositories/add" class="btn btn-primary">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
            <title>SVG</title>
          </svg>
          Add Repository
        </a>
      </div>

      {/* Repositories List */}
      {repositories.length === 0 ? (
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
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <h3 class="text-xl font-semibold text-gray-300 mb-2">No repositories added</h3>
          <p class="text-gray-500 mb-6">
            Add a repository to start tracking and verifying plugins.
          </p>
          <a href="/repositories/add" class="btn btn-primary">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
              <title>SVG</title>
            </svg>
            Add Your First Repository
          </a>
        </div>
      ) : (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {repositories.map((repo) => (
            <RepositoryCard repository={repo} />
          ))}

          {/* Add New Card */}
          <a
            href="/repositories/add"
            class="card border-dashed border-2 border-gray-600 hover:border-blue-500 transition-colors flex items-center justify-center min-h-[200px]"
          >
            <div class="text-center">
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span class="text-gray-400">Add Repository</span>
            </div>
          </a>
        </div>
      )}
    </Layout>
  )
}

export function RepositoryCard({ repository }: { repository: RepositoryWithStats }) {
  const verificationPercentage =
    repository.total_plugins > 0
      ? Math.round((repository.verified_plugins / repository.total_plugins) * 100)
      : 0

  return (
    <div class="card">
      {/* Header */}
      <div class="flex items-start justify-between mb-4">
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-white truncate">{repository.name}</h3>
          <p class="text-xs text-gray-500 truncate">{repository.url}</p>
        </div>
        <span class={`badge ${repository.enabled ? "badge-success" : "badge-neutral"}`}>
          {repository.enabled ? "Active" : "Disabled"}
        </span>
      </div>

      {/* Stats */}
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="bg-gray-800 rounded-lg p-3 text-center">
          <div class="text-2xl font-bold text-white">{repository.total_plugins}</div>
          <div class="text-xs text-gray-500">Plugins</div>
        </div>
        <div class="bg-gray-800 rounded-lg p-3 text-center">
          <div class="text-2xl font-bold text-green-400">{repository.verified_plugins}</div>
          <div class="text-xs text-gray-500">Verified</div>
        </div>
        <div class="bg-gray-800 rounded-lg p-3 text-center">
          <div class="text-2xl font-bold text-blue-400">{repository.total_versions}</div>
          <div class="text-xs text-gray-500">Versions</div>
        </div>
        <div class="bg-gray-800 rounded-lg p-3 text-center">
          <div class="text-2xl font-bold text-yellow-400">{repository.verified_versions}</div>
          <div class="text-xs text-gray-500">Ver. Verified</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div class="mb-4">
        <div class="flex justify-between text-xs mb-1">
          <span class="text-gray-400">Verification Progress</span>
          <span class="text-white font-medium">{verificationPercentage}%</span>
        </div>
        <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-300"
            style={`width: ${verificationPercentage}%`}
          />
        </div>
      </div>

      {/* Actions */}
      <div class="flex items-center gap-2 pt-4 border-t border-gray-700">
        <button
          class="btn btn-secondary text-sm flex-1"
          hx-post={`/api/repositories/${repository.id}/sync`}
          hx-target="closest .card"
          hx-swap="outerHTML"
          hx-indicator=".sync-indicator"
          type="button"
        >
          <span class="htmx-indicator sync-indicator">
            <svg class="animate-spin w-4 h-4 mr-1" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
                fill="none"
              />
              <title>SVG</title>

              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
          Sync
        </button>
        <a href={`/repositories/${repository.id}`} class="btn btn-secondary text-sm flex-1">
          Details
        </a>
        <button
          class="btn btn-danger text-sm"
          hx-delete={`/api/repositories/${repository.id}`}
          hx-target="closest .card"
          hx-swap="outerHTML"
          type="button"
          hx-confirm="Are you sure you want to delete this repository? This will also delete all associated plugins and verifications."
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
            <title>SVG</title>
          </svg>
        </button>
      </div>
    </div>
  )
}

export function RepositoryDetail({ repository }: { repository: RepositoryWithStats }) {
  const verificationPercentage =
    repository.total_plugins > 0
      ? Math.round((repository.verified_plugins / repository.total_plugins) * 100)
      : 0

  return (
    <Layout title={repository.name} currentPath="/repositories">
      {/* Breadcrumb */}
      <nav class="mb-6">
        <ol class="flex items-center gap-2 text-sm">
          <li>
            <a href="/repositories" class="text-gray-400 hover:text-white">
              Repositories
            </a>
          </li>
          <li class="text-gray-600">/</li>
          <li class="text-white">{repository.name}</li>
        </ol>
      </nav>

      {/* Repository Header */}
      <div class="card mb-8">
        <div class="flex items-start justify-between mb-6">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-3xl font-bold text-white">{repository.name}</h1>
              <span class={`badge ${repository.enabled ? "badge-success" : "badge-neutral"}`}>
                {repository.enabled ? "Active" : "Disabled"}
              </span>
            </div>
            <p class="text-gray-400">{repository.url}</p>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="btn btn-secondary"
              hx-post={`/api/repositories/${repository.id}/sync`}
              hx-swap="none"
              type="button"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
                <title>SVG</title>
              </svg>
              Sync Now
            </button>
            <button
              type="button"
              class={`btn ${repository.enabled ? "btn-secondary" : "btn-success"}`}
              hx-patch={`/api/repositories/${repository.id}/toggle`}
              hx-swap="none"
            >
              {repository.enabled ? "Disable" : "Enable"}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-gray-800 rounded-lg p-4 text-center">
            <div class="text-3xl font-bold text-white">{repository.total_plugins}</div>
            <div class="text-sm text-gray-400">Total Plugins</div>
          </div>
          <div class="bg-gray-800 rounded-lg p-4 text-center">
            <div class="text-3xl font-bold text-green-400">{repository.verified_plugins}</div>
            <div class="text-sm text-gray-400">Verified Plugins</div>
          </div>
          <div class="bg-gray-800 rounded-lg p-4 text-center">
            <div class="text-3xl font-bold text-blue-400">{repository.total_versions}</div>
            <div class="text-sm text-gray-400">Total Versions</div>
          </div>
          <div class="bg-gray-800 rounded-lg p-4 text-center">
            <div class="text-3xl font-bold text-yellow-400">{repository.verified_versions}</div>
            <div class="text-sm text-gray-400">Verified Versions</div>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div class="flex justify-between text-sm mb-2">
            <span class="text-gray-400">Overall Verification Progress</span>
            <span class="text-white font-medium">{verificationPercentage}%</span>
          </div>
          <div class="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-300"
              style={`width: ${verificationPercentage}%`}
            />
          </div>
        </div>
      </div>

      {/* Repository Meta */}
      <div class="card">
        <h2 class="text-lg font-semibold text-white mb-4">Repository Details</h2>
        <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt class="text-sm text-gray-400">Created</dt>
            <dd class="text-white">
              {repository.created_at
                ? new Date(repository.created_at * 1000).toLocaleString()
                : "Unknown"}
            </dd>
          </div>
          <div>
            <dt class="text-sm text-gray-400">Last Updated</dt>
            <dd class="text-white">
              {repository.updated_at
                ? new Date(repository.updated_at * 1000).toLocaleString()
                : "Never"}
            </dd>
          </div>
          <div class="md:col-span-2">
            <dt class="text-sm text-gray-400">URL</dt>
            <dd>
              <a href={repository.url} target="_blank" class="text-blue-400 hover:text-blue-300">
                {repository.url}
              </a>
            </dd>
          </div>
        </dl>
      </div>
    </Layout>
  )
}

export function AddRepositoryView() {
  return (
    <Layout title="Add Repository" currentPath="/repositories">
      {/* Breadcrumb */}
      <nav class="mb-6">
        <ol class="flex items-center gap-2 text-sm">
          <li>
            <a href="/repositories" class="text-gray-400 hover:text-white">
              Repositories
            </a>
          </li>
          <li class="text-gray-600">/</li>
          <li class="text-white">Add Repository</li>
        </ol>
      </nav>

      {/* Form Card */}
      <div class="max-w-2xl mx-auto">
        <div class="card">
          <h1 class="text-2xl font-bold text-white mb-6">Add Repository</h1>
          <p class="text-gray-400 mb-6">
            Add a new plugin repository to track and verify. The repository should contain a
            manifest.ts file with plugin information.
          </p>

          <form hx-post="/api/repositories" hx-target="body" hx-swap="outerHTML" class="space-y-6">
            {/* Repository Name */}
            <div>
              <label for="name" class="block text-sm font-medium text-gray-300 mb-2">
                Repository Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                class="input"
                placeholder="My Plugin Repository"
                required
              />
              <p class="mt-1 text-xs text-gray-500">A friendly name to identify this repository</p>
            </div>

            {/* Repository URL */}
            <div>
              <label for="url" class="block text-sm font-medium text-gray-300 mb-2">
                Repository URL
              </label>
              <input
                type="text"
                id="url"
                name="url"
                class="input"
                placeholder="owner/repo or https://github.com/owner/repo"
                required
              />
              <p class="mt-1 text-xs text-gray-500">
                Supports GitHub (owner/repo), GitLab, or direct HTTP URLs
              </p>
            </div>

            {/* Enable */}
            <div class="flex items-center gap-3">
              <input
                type="checkbox"
                id="enabled"
                name="enabled"
                checked
                class="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
              />
              <label for="enabled" class="text-sm text-gray-300">
                Enable automatic syncing
              </label>
            </div>

            {/* Actions */}
            <div class="flex items-center gap-4 pt-4 border-t border-gray-700">
              <button type="submit" class="btn btn-primary">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v16m8-8H4"
                  />
                  <title>SVG</title>
                </svg>
                Add Repository
              </button>
              <a href="/repositories" class="btn btn-secondary">
                Cancel
              </a>
            </div>
          </form>
        </div>

        {/* Help Section */}
        <div class="card mt-6">
          <h2 class="text-lg font-semibold text-white mb-4">Supported URL Formats</h2>
          <ul class="space-y-3 text-sm">
            <li class="flex items-start gap-3">
              <span class="badge badge-neutral">GitHub</span>
              <div>
                <code class="text-gray-300">owner/repo</code>
                <span class="text-gray-500 ml-2">or</span>
                <code class="text-gray-300 ml-2">owner/repo:branch/path</code>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <span class="badge badge-neutral">GitLab</span>
              <div>
                <code class="text-gray-300">https://gitlab.com/owner/repo</code>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <span class="badge badge-neutral">HTTP</span>
              <div>
                <code class="text-gray-300">https://example.com/plugins</code>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </Layout>
  )
}
