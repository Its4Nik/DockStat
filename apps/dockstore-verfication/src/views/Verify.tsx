import { Html } from "@elysiajs/html"
import { Layout } from "../components/Layout"
import type { PluginVerificationView } from "../db/types"

const _ = Html

export interface VerifyViewProps {
  pendingPlugins: PluginVerificationView[]
}

export function VerifyView({ pendingPlugins }: VerifyViewProps) {
  return (
    <Layout title="Verify Plugins" currentPath="/verify">
      {/* Page Header */}
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">Verify Plugins</h1>
        <p class="text-gray-400">
          Manually review and verify plugin versions. Each version must be individually verified
          after code review.
        </p>
      </div>

      {/* Verification Info Card */}
      <div class="card mb-8 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-700/50">
        <div class="flex items-start gap-4">
          <div class="p-3 bg-blue-500/20 rounded-lg">
            <svg
              class="w-8 h-8 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>SVG</title>

              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-semibold text-white mb-2">Verification Process</h2>
            <ol class="text-sm text-gray-300 space-y-2">
              <li class="flex items-start gap-2">
                <span class="flex-shrink-0 w-5 h-5 bg-blue-500/30 rounded-full flex items-center justify-center text-xs text-blue-400">
                  1
                </span>
                <span>
                  Review the plugin source code for security vulnerabilities and malicious code
                </span>
              </li>
              <li class="flex items-start gap-2">
                <span class="flex-shrink-0 w-5 h-5 bg-blue-500/30 rounded-full flex items-center justify-center text-xs text-blue-400">
                  2
                </span>
                <span>Verify the hash matches the source code you reviewed</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="flex-shrink-0 w-5 h-5 bg-blue-500/30 rounded-full flex items-center justify-center text-xs text-blue-400">
                  3
                </span>
                <span>Mark as verified and set security status (safe/unsafe)</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="flex-shrink-0 w-5 h-5 bg-blue-500/30 rounded-full flex items-center justify-center text-xs text-blue-400">
                  4
                </span>
                <span>Each new version requires a separate verification!</span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Pending Verifications */}
      <div class="mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-white">
            Pending Verifications
            {pendingPlugins.length > 0 && (
              <span class="ml-2 text-sm font-normal text-gray-400">
                ({pendingPlugins.length} awaiting review)
              </span>
            )}
          </h2>
        </div>

        {pendingPlugins.length === 0 ? (
          <div class="card text-center py-16">
            <svg
              class="w-20 h-20 mx-auto text-green-500 mb-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>SVG</title>

              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 class="text-xl font-semibold text-gray-300 mb-2">All caught up!</h3>
            <p class="text-gray-500 mb-6">
              There are no plugins waiting for verification. Great job!
            </p>
            <a href="/plugins" class="btn btn-secondary">
              View All Plugins
            </a>
          </div>
        ) : (
          <div class="space-y-4">
            {pendingPlugins.map((plugin) => (
              <VerificationCard plugin={plugin} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

export function VerificationCard({ plugin }: { plugin: PluginVerificationView }) {
  return (
    <div class="card" id={`verify-card-${plugin.plugin_id}-${plugin.version}`}>
      <div class="flex flex-col lg:flex-row lg:items-start gap-6">
        {/* Plugin Info */}
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <h3 class="text-lg font-semibold text-white">{plugin.plugin_name}</h3>
            <code class="text-sm bg-gray-800 px-2 py-0.5 rounded">v{plugin.version}</code>
            <span
              class={`badge ${
                plugin.repo_type === "github"
                  ? "bg-gray-700 text-white"
                  : plugin.repo_type === "gitlab"
                    ? "bg-orange-600 text-white"
                    : "bg-blue-600 text-white"
              }`}
            >
              {plugin.repo_type.charAt(0).toUpperCase() + plugin.repo_type.slice(1)}
            </span>
          </div>
          <p class="text-sm text-gray-400 mb-4">{plugin.description}</p>

          {/* Meta Grid */}
          <div class="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <span class="text-gray-500">Author:</span>
              <span class="ml-2 text-gray-300">{plugin.author_name}</span>
            </div>
            <div>
              <span class="text-gray-500">License:</span>
              <span class="ml-2 text-gray-300">{plugin.license}</span>
            </div>
            <div class="col-span-2">
              <span class="text-gray-500">Hash:</span>
              <code class="ml-2 text-xs bg-gray-800 px-2 py-1 rounded font-mono text-green-400">
                {plugin.version_hash}
              </code>
            </div>
          </div>

          {/* Tags */}
          {plugin.tags && plugin.tags.length > 0 && (
            <div class="flex flex-wrap gap-2">
              {plugin.tags.map((tag) => (
                <span class="text-xs px-2 py-1 bg-gray-700 rounded-full text-gray-300">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Verification Form */}
        <div class="lg:w-80 lg:border-l lg:border-gray-700 lg:pl-6">
          <h4 class="text-sm font-medium text-gray-300 mb-4">Verification</h4>

          <form
            hx-post={`/api/plugins/${plugin.plugin_id}/versions/${plugin.version}/verify`}
            hx-target={`#verify-card-${plugin.plugin_id}-${plugin.version}`}
            hx-swap="outerHTML"
            class="space-y-4"
          >
            {/* Security Status */}
            <div>
              <p class="block text-sm text-gray-400 mb-2">Security Status</p>
              <div class="flex gap-2">
                <label class="flex-1">
                  <input
                    type="radio"
                    name="security_status"
                    value="safe"
                    class="sr-only peer"
                    required
                  />
                  <div class="cursor-pointer text-center py-2 px-4 rounded-lg border border-gray-600 peer-checked:border-green-500 peer-checked:bg-green-500/20 peer-checked:text-green-400 text-gray-400 hover:border-gray-500 transition-colors">
                    <svg
                      class="w-5 h-5 mx-auto mb-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <title>SVG</title>

                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span class="text-xs">Safe</span>
                  </div>
                </label>
                <label class="flex-1">
                  <input
                    type="radio"
                    name="security_status"
                    value="unsafe"
                    class="sr-only peer"
                    required
                  />
                  <div class="cursor-pointer text-center py-2 px-4 rounded-lg border border-gray-600 peer-checked:border-red-500 peer-checked:bg-red-500/20 peer-checked:text-red-400 text-gray-400 hover:border-gray-500 transition-colors">
                    <svg
                      class="w-5 h-5 mx-auto mb-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <title>SVG</title>

                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <span class="text-xs">Unsafe</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Verifier Name */}
            <div>
              <label for={`verifier-${plugin.plugin_id}`} class="block text-sm text-gray-400 mb-2">
                Your Name
              </label>
              <input
                type="text"
                id={`verifier-${plugin.plugin_id}`}
                name="verified_by"
                class="input"
                placeholder="Enter your name"
                required
              />
            </div>

            {/* Notes */}
            <div>
              <label for={`notes-${plugin.plugin_id}`} class="block text-sm text-gray-400 mb-2">
                Notes (optional)
              </label>
              <textarea
                id={`notes-${plugin.plugin_id}`}
                name="notes"
                class="input resize-none"
                rows={"3"}
                placeholder="Any observations during review..."
              />
            </div>

            {/* Actions */}
            <div class="flex items-center gap-3 pt-2">
              <button type="submit" class="btn btn-success flex-1">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                  <title>SVG</title>
                </svg>
                Verify
              </button>
              <a
                href={plugin.repository_url}
                target="_blank"
                class="btn btn-secondary"
                title="View Source"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  <title>SVG</title>
                </svg>
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export function VerifiedCard({ plugin }: { plugin: PluginVerificationView }) {
  return (
    <div class="card bg-green-900/20 border-green-700/30">
      <div class="flex items-center gap-4">
        <div class="p-3 bg-green-500/20 rounded-lg">
          <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <title>SVG</title>
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-lg font-semibold text-white">{plugin.plugin_name}</span>
            <code class="text-sm bg-gray-800 px-2 py-0.5 rounded">v{plugin.version}</code>
            <span class="badge badge-success">Verified</span>
            <span
              class={`badge ${plugin.security_status === "safe" ? "badge-success" : "badge-error"}`}
            >
              {plugin.security_status === "safe" ? "✓ Safe" : "✗ Unsafe"}
            </span>
          </div>
          <p class="text-sm text-green-400">
            Verified by {plugin.verified_by}
            {plugin.verified_at && (
              <span class="text-green-400/60">
                {" "}
                on {new Date(plugin.verified_at * 1000).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>
        <a href={`/plugins/${plugin.plugin_id}`} class="btn btn-secondary text-sm">
          View Details
        </a>
      </div>
    </div>
  )
}
