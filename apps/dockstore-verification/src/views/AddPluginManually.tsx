import { Html } from "@elysiajs/html"
import { Layout } from "../components/Layout"

const _ = Html

export function AddPluginManuallyView() {
  return (
    <Layout
      currentPath="/plugins/add"
      title="Add Plugin Manually"
    >
      {/* Page Header */}
      <div class="mb-8">
        <div class="flex items-center mb-4">
          <a
            class="text-blue-400 hover:text-blue-300 mr-4"
            href="/plugins"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M15 19l-7-7 7-7"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              />
              <title>Back</title>
            </svg>
          </a>
          <div>
            <h1 class="text-3xl font-bold text-white">Add Plugin Manually</h1>
            <p class="text-gray-400 mt-1">
              Add a plugin to the verification database without syncing from a repository.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div class="card max-w-3xl">
        <form
          class="space-y-6"
          hx-post="/api/plugins/manual"
          hx-swap="innerHTML"
          hx-target="#result"
        >
          {/* Plugin Information */}
          <div>
            <h3 class="text-lg font-semibold text-white mb-4">Plugin Information</h3>
            <div class="space-y-4">
              <div>
                <label
                  class="block text-sm font-medium text-gray-300 mb-2"
                  for="name"
                >
                  Plugin Name *
                </label>
                <input
                  class="input w-full"
                  id="name"
                  name="name"
                  placeholder="e.g., my-awesome-plugin"
                  required
                  type="text"
                />
              </div>

              <div>
                <label
                  class="block text-sm font-medium text-gray-300 mb-2"
                  for="version"
                >
                  Version *
                </label>
                <input
                  class="input w-full"
                  id="version"
                  name="version"
                  placeholder="e.g., 1.0.0"
                  required
                  type="text"
                />
              </div>

              <div>
                <label
                  class="block text-sm font-medium text-gray-300 mb-2"
                  for="description"
                >
                  Description *
                </label>
                <textarea
                  class="input w-full"
                  id="description"
                  name="description"
                  placeholder="Brief description of the plugin"
                  required
                  rows="3"
                />
              </div>

              <div>
                <label
                  class="block text-sm font-medium text-gray-300 mb-2"
                  for="hash"
                >
                  Source Hash (SHA-256) *
                </label>
                <input
                  class="input w-full font-mono text-sm"
                  id="hash"
                  name="hash"
                  placeholder="e.g., a1b2c3d4e5f6..."
                  required
                  type="text"
                />
                <p class="text-xs text-gray-500 mt-1">SHA-256 hash of the plugin source code</p>
              </div>

              <div>
                <label
                  class="block text-sm font-medium text-gray-300 mb-2"
                  for="bundle_hash"
                >
                  Bundle Hash (SHA-256)
                </label>
                <input
                  class="input w-full font-mono text-sm"
                  id="bundle_hash"
                  name="bundle_hash"
                  placeholder="Optional: Hash of the bundled plugin"
                  type="text"
                />
              </div>
            </div>
          </div>

          {/* Author Information */}
          <div>
            <h3 class="text-lg font-semibold text-white mb-4">Author Information</h3>
            <div class="space-y-4">
              <div>
                <label
                  class="block text-sm font-medium text-gray-300 mb-2"
                  for="author_name"
                >
                  Author Name *
                </label>
                <input
                  class="input w-full"
                  id="author_name"
                  name="author_name"
                  placeholder="e.g., John Doe"
                  required
                  type="text"
                />
              </div>

              <div>
                <label
                  class="block text-sm font-medium text-gray-300 mb-2"
                  for="author_email"
                >
                  Author Email
                </label>
                <input
                  class="input w-full"
                  id="author_email"
                  name="author_email"
                  placeholder="e.g., john@example.com"
                  type="email"
                />
              </div>

              <div>
                <label
                  class="block text-sm font-medium text-gray-300 mb-2"
                  for="author_website"
                >
                  Author Website
                </label>
                <input
                  class="input w-full"
                  id="author_website"
                  name="author_website"
                  placeholder="e.g., https://example.com"
                  type="url"
                />
              </div>
            </div>
          </div>

          {/* Repository Information */}
          <div>
            <h3 class="text-lg font-semibold text-white mb-4">Repository Information</h3>
            <div class="space-y-4">
              <div>
                <label
                  class="block text-sm font-medium text-gray-300 mb-2"
                  for="repository_url"
                >
                  Repository URL *
                </label>
                <input
                  class="input w-full"
                  id="repository_url"
                  name="repository_url"
                  placeholder="e.g., https://github.com/user/plugin"
                  required
                  type="url"
                />
              </div>

              <div>
                <label
                  class="block text-sm font-medium text-gray-300 mb-2"
                  for="repo_type"
                >
                  Repository Type
                </label>
                <select
                  class="input w-full"
                  id="repo_type"
                  name="repo_type"
                >
                  <option value="github">GitHub</option>
                  <option value="gitlab">GitLab</option>
                  <option value="http">HTTP</option>
                </select>
              </div>

              <div>
                <label
                  class="block text-sm font-medium text-gray-300 mb-2"
                  for="license"
                >
                  License
                </label>
                <input
                  class="input w-full"
                  id="license"
                  name="license"
                  placeholder="e.g., MIT"
                  type="text"
                  value="MIT"
                />
              </div>
            </div>
          </div>

          {/* Optional Metadata */}
          <div>
            <h3 class="text-lg font-semibold text-white mb-4">Optional Metadata</h3>
            <div class="space-y-4">
              <div>
                <label
                  class="block text-sm font-medium text-gray-300 mb-2"
                  for="tags"
                >
                  Tags (comma-separated)
                </label>
                <input
                  class="input w-full"
                  id="tags"
                  name="tags"
                  placeholder="e.g., utility, dashboard, monitoring"
                  type="text"
                />
                <p class="text-xs text-gray-500 mt-1">Enter tags separated by commas</p>
              </div>

              <div>
                <label
                  class="block text-sm font-medium text-gray-300 mb-2"
                  for="security_status"
                >
                  Initial Security Status
                </label>
                <select
                  class="input w-full"
                  id="security_status"
                  name="security_status"
                >
                  <option value="unknown">Unknown</option>
                  <option value="safe">Safe</option>
                  <option value="unsafe">Unsafe</option>
                </select>
              </div>

              <div>
                <label
                  class="block text-sm font-medium text-gray-300 mb-2"
                  for="notes"
                >
                  Notes
                </label>
                <textarea
                  class="input w-full"
                  id="notes"
                  name="notes"
                  placeholder="Any additional notes about this plugin"
                  rows="3"
                />
              </div>
            </div>
          </div>

          {/* Result area */}
          <div id="result" />

          {/* Submit Button */}
          <div class="flex gap-4">
            <button
              class="btn btn-primary"
              type="submit"
            >
              <svg
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 4v16m8-8H4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                />
                <title>Add Plugin Icon</title>
              </svg>
              Add Plugin
            </button>
            <a
              class="btn btn-secondary"
              href="/plugins"
            >
              Cancel
            </a>
          </div>
        </form>
      </div>

      {/* Info Box */}
      <div class="mt-6 card max-w-3xl bg-blue-900/20 border-blue-800">
        <div class="flex">
          <svg
            class="w-5 h-5 text-blue-400 mr-3 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
            />
            <title>Info</title>
          </svg>
          <div>
            <h4 class="text-sm font-semibold text-blue-400 mb-2">About Manual Plugin Addition</h4>
            <p class="text-sm text-gray-400">
              Manually added plugins are stored in a special "Manual Entries" repository. You can
              verify these plugins just like any other plugin in the system. The source hash is
              required for plugin validation and should be a SHA-256 hash of the plugin's source
              code.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
