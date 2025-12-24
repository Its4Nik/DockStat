import { Html } from "@elysiajs/html"
import { Layout } from "../components/Layout"

export function AddPluginManuallyView() {
  return (
    <Layout title="Add Plugin Manually" currentPath="/plugins/add">
      {/* Page Header */}
      <div class="mb-8">
        <div class="flex items-center mb-4">
          <a href="/plugins" class="text-blue-400 hover:text-blue-300 mr-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
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
          hx-post="/api/plugins/manual"
          hx-target="#result"
          hx-swap="innerHTML"
          class="space-y-6"
        >
          {/* Plugin Information */}
          <div>
            <h3 class="text-lg font-semibold text-white mb-4">Plugin Information</h3>
            <div class="space-y-4">
              <div>
                <label for="name" class="block text-sm font-medium text-gray-300 mb-2">
                  Plugin Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  class="input w-full"
                  placeholder="e.g., my-awesome-plugin"
                />
              </div>

              <div>
                <label for="version" class="block text-sm font-medium text-gray-300 mb-2">
                  Version *
                </label>
                <input
                  type="text"
                  id="version"
                  name="version"
                  required
                  class="input w-full"
                  placeholder="e.g., 1.0.0"
                />
              </div>

              <div>
                <label for="description" class="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows="3"
                  class="input w-full"
                  placeholder="Brief description of the plugin"
                />
              </div>

              <div>
                <label for="hash" class="block text-sm font-medium text-gray-300 mb-2">
                  Source Hash (SHA-256) *
                </label>
                <input
                  type="text"
                  id="hash"
                  name="hash"
                  required
                  class="input w-full font-mono text-sm"
                  placeholder="e.g., a1b2c3d4e5f6..."
                />
                <p class="text-xs text-gray-500 mt-1">SHA-256 hash of the plugin source code</p>
              </div>

              <div>
                <label for="bundle_hash" class="block text-sm font-medium text-gray-300 mb-2">
                  Bundle Hash (SHA-256)
                </label>
                <input
                  type="text"
                  id="bundle_hash"
                  name="bundle_hash"
                  class="input w-full font-mono text-sm"
                  placeholder="Optional: Hash of the bundled plugin"
                />
              </div>
            </div>
          </div>

          {/* Author Information */}
          <div>
            <h3 class="text-lg font-semibold text-white mb-4">Author Information</h3>
            <div class="space-y-4">
              <div>
                <label for="author_name" class="block text-sm font-medium text-gray-300 mb-2">
                  Author Name *
                </label>
                <input
                  type="text"
                  id="author_name"
                  name="author_name"
                  required
                  class="input w-full"
                  placeholder="e.g., John Doe"
                />
              </div>

              <div>
                <label for="author_email" class="block text-sm font-medium text-gray-300 mb-2">
                  Author Email
                </label>
                <input
                  type="email"
                  id="author_email"
                  name="author_email"
                  class="input w-full"
                  placeholder="e.g., john@example.com"
                />
              </div>

              <div>
                <label for="author_website" class="block text-sm font-medium text-gray-300 mb-2">
                  Author Website
                </label>
                <input
                  type="url"
                  id="author_website"
                  name="author_website"
                  class="input w-full"
                  placeholder="e.g., https://example.com"
                />
              </div>
            </div>
          </div>

          {/* Repository Information */}
          <div>
            <h3 class="text-lg font-semibold text-white mb-4">Repository Information</h3>
            <div class="space-y-4">
              <div>
                <label for="repository_url" class="block text-sm font-medium text-gray-300 mb-2">
                  Repository URL *
                </label>
                <input
                  type="url"
                  id="repository_url"
                  name="repository_url"
                  required
                  class="input w-full"
                  placeholder="e.g., https://github.com/user/plugin"
                />
              </div>

              <div>
                <label for="repo_type" class="block text-sm font-medium text-gray-300 mb-2">
                  Repository Type
                </label>
                <select id="repo_type" name="repo_type" class="input w-full">
                  <option value="github">GitHub</option>
                  <option value="gitlab">GitLab</option>
                  <option value="http">HTTP</option>
                </select>
              </div>

              <div>
                <label for="license" class="block text-sm font-medium text-gray-300 mb-2">
                  License
                </label>
                <input
                  type="text"
                  id="license"
                  name="license"
                  class="input w-full"
                  placeholder="e.g., MIT"
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
                <label for="tags" class="block text-sm font-medium text-gray-300 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  class="input w-full"
                  placeholder="e.g., utility, dashboard, monitoring"
                />
                <p class="text-xs text-gray-500 mt-1">Enter tags separated by commas</p>
              </div>

              <div>
                <label for="security_status" class="block text-sm font-medium text-gray-300 mb-2">
                  Initial Security Status
                </label>
                <select id="security_status" name="security_status" class="input w-full">
                  <option value="unknown">Unknown</option>
                  <option value="safe">Safe</option>
                  <option value="unsafe">Unsafe</option>
                </select>
              </div>

              <div>
                <label for="notes" class="block text-sm font-medium text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows="3"
                  class="input w-full"
                  placeholder="Any additional notes about this plugin"
                />
              </div>
            </div>
          </div>

          {/* Result area */}
          <div id="result" />

          {/* Submit Button */}
          <div class="flex gap-4">
            <button type="submit" class="btn btn-primary">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
                <title>Add Plugin Icon</title>
              </svg>
              Add Plugin
            </button>
            <a href="/plugins" class="btn btn-secondary">
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
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
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
