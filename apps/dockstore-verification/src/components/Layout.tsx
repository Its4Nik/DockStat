import { Html } from "@elysiajs/html"

const _ = Html

export interface LayoutProps {
  title: string
  children: JSX.Element | JSX.Element[] | string
  currentPath?: string
}

export function Layout({ title, children, currentPath = "/" }: LayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title} - DockStore Verification</title>
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
            .btn {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              padding: 0.5rem 1rem;
              border-radius: 0.375rem;
              font-weight: 500;
              transition: all 0.15s ease;
              cursor: pointer;
            }
            .btn-primary {
              background-color: var(--accent-primary);
              color: white;
            }
            .btn-primary:hover {
              background-color: #2563eb;
            }
            .btn-secondary {
              background-color: var(--bg-card);
              color: var(--text-primary);
              border: 1px solid var(--border-color);
            }
            .btn-secondary:hover {
              background-color: #3f4f63;
            }
            .btn-success {
              background-color: var(--accent-success);
              color: white;
            }
            .btn-success:hover {
              background-color: #16a34a;
            }
            .btn-danger {
              background-color: var(--accent-error);
              color: white;
            }
            .btn-danger:hover {
              background-color: #dc2626;
            }
            .input {
              width: 100%;
              padding: 0.5rem 0.75rem;
              background-color: var(--bg-card);
              border: 1px solid var(--border-color);
              border-radius: 0.375rem;
              color: var(--text-primary);
              outline: none;
              transition: border-color 0.15s ease;
            }
            .input:focus {
              border-color: var(--accent-primary);
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
            .nav-link {
              padding: 0.5rem 1rem;
              border-radius: 0.375rem;
              color: var(--text-secondary);
              transition: all 0.15s ease;
            }
            .nav-link:hover {
              background-color: var(--bg-card);
              color: var(--text-primary);
            }
            .nav-link.active {
              background-color: var(--accent-primary);
              color: white;
            }
            .htmx-request .htmx-indicator {
              display: inline-block;
            }
            .htmx-indicator {
              display: none;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            .animate-spin {
              animation: spin 1s linear infinite;
            }
          `}
        </style>
      </head>
      <body class="min-h-screen">
        {/* Navigation Header */}
        <header class="bg-[#1e293b] border-b border-[#475569] sticky top-0 z-50">
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
                  <h1 class="text-xl font-bold text-white">DockStore Verification</h1>
                  <p class="text-xs text-gray-400">Plugin Security & Integrity</p>
                </div>
              </div>

              {/* Navigation */}
              <nav class="flex items-center gap-2">
                <a href="/" class={`nav-link ${currentPath === "/" ? "active" : ""}`}>
                  Dashboard
                </a>
                <a href="/plugins" class={`nav-link ${currentPath === "/plugins" ? "active" : ""}`}>
                  Plugins
                </a>
                <a
                  href="/repositories"
                  class={`nav-link ${currentPath === "/repositories" ? "active" : ""}`}
                >
                  Repositories
                </a>
                <a href="/verify" class={`nav-link ${currentPath === "/verify" ? "active" : ""}`}>
                  Verify
                </a>
              </nav>
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
              <div class="flex items-center gap-4">
                <a
                  href="https://github.com/its4nik/dockstat"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-gray-400 hover:text-white transition-colors"
                >
                  GitHub
                </a>
                <a href="/api" class="text-gray-400 hover:text-white transition-colors">
                  API
                </a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
