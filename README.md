<p align="center">
  <img src="./.github/DockStat2-04.png" alt="DockStat Logo" />
</p>

<p align="center">
  <a href="https://outline.itsnik.de/s/9d88c471-373e-4ef2-a955-b1058eb7dc99">Wiki</a> · <a href="#-getting-started">Getting Started</a> · <a href="#-features">Features</a> · <a href="#-architecture-and-apps">Architecture & Apps</a> · <a href="#-development-workflow">Development</a>
</p>

---

# DockStat

| ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white) | ![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)            | ![Biome](https://img.shields.io/badge/biome-%2360A5FA.svg?style=for-the-badge&logo=biome&logoColor=white)         | ![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)          |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)     | ![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white) | ![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=Prometheus&logoColor=white) | ![Turborepo](https://img.shields.io/badge/Turborepo-%230F0813.svg?style=for-the-badge&logo=Turborepo&logoColor=white) |

DockStat is an extensible container administration and monitoring platform that aims to combine the best ideas from tools like Portainer, Grafana and Dockge into a single, modular solution. It focuses on real-world manageability, deep observability and a runtime plugin-first architecture so the platform can evolve with your stack.

> ⚠️ Disclaimer  
> DockStat is currently in **Pre-Alpha**. Expect breaking changes, missing features and instability. Use for testing and evaluation only unless you know it's suitable for your environment.

---

## 📖 Project overview

DockStat's goal is to be the unified UI and runtime for managing containerized infrastructures (Docker for now, with intentions to expand). It provides:

- A responsive web UI for container & stack lifecycle operations.
- A monitoring layer with table and graph views and network visualizations.
- A runtime plugin system that supports frontend components, backend services and full-stack plugins.
- Stack and template management (prebuilt Docker Compose templates, stack-level plugins).
- Multi-node monitoring via adapters that let a single DockStat instance manage multiple Docker hosts.

---

## ✨ Key features

- Runtime-compatible plugin system:
  - Frontend UI components (widgets, pages)
  - Backend services (collectors, adapters)
  - Full-stack plugins (both frontend and backend)
- Theming:
  - CSS variable driven theming for deep customization
- Stacks & Templates:
  - Prebuilt Docker Compose templates (DockStore)
  - Stack-level plugin hooks (Traefik/Caddy examples)
  - Automatic node provisioning (e.g. Hetzner Cloud plugin)
  - Future: Kubernetes support roadmap
- Monitoring & Visualization:
  - Table-based and graph-based metrics
  - Network visualization with sigma.js / reagraph
  - Whole-stack monitoring (containers, services, networks)
- Custom Dashboards:
  - Home-Assistant style widget system extendable via plugins
- Multi-Node Monitoring:
  - Adapters abstract different backends (local Docker, remote Docker API, SSH, etc.)
  - Per-adapter configuration and credentials
- Extensible datastore:
  - Lightweight persistence (bun:sqlite used in current prototypes) for local storage and historic metrics

---

## 🛠 Tech stack

- Core: React, React Router v7, Bun
- Frontend: TypeScript, TailwindCSS, GSAP, lucide-react
- Backend / Integrations: ElysiaJS, Dockerode, bun:sqlite, @dockstat/\* packages (internal libs)
- Monorepo layout: apps/, packages/ (typings, db, sql-wrapper, plugins, ...)

---

## 📁 Repo structure (high level)

- apps/
  - dockstat — main frontend / UI app (React Router SPA)
  - dockstore — community hub for templates, themes & plugins
  - docs — documentation and Outline wiki sync helpers
- packages/ (internal packages / libraries used by apps)
- .github/ (assets such as logos and CI configs)

See apps/README.md for per-app details.

---

## 🚀 Getting started (developer / local)

Requirements

- Bun (used for development and scripts)
- Node ecosystem tools (if you prefer npm/pnpm for some tasks)
- Docker (for testing container interactions)
- Optional: access to cloud provider API keys (for provisioning plugins)

Quick start (from Repo root)

1. Install dependencies:

```bash
bun install
```

2. Start dockstat in development:

```bash
cd ./apps/dockstat
bun run dev
```

---

## 🧩 Plugin system (overview)

DockStat is designed to grow through plugins. Plugins can register UI components, provide backend services (collectors, adapters, provisioning modules), or both.

Plugin types

- Frontend plugin: Registers routes, pages or widgets in the UI. Usually provides a manifest and runtime hooks.
- Backend plugin: Runs a process/service that collects metrics, talks to external APIs or adds adapters for new node types.
- Full-stack plugin: Includes both frontend and backend parts and ships as a single distributable.

Concepts

- Manifest: A plugin manifest describes name, version, provided capabilities, and entry points.
- Lifecycle: Plugins are discovered at runtime and may be started/stopped without recompiling the host (subject to host safety).

Developer notes

- Keep plugin APIs minimal; prefer well-documented typed contracts.

---

## 🔌 Stacks & DockStore

DockStore is the ecosystem hub for templates, themes and plugins:

- Pre-built Docker Compose templates for common apps (AdGuard, Grafana, Home Assistant, etc.)
- Themes and UI tweaks
- Plugin marketplace / registry for community contributions

---

## ⚙️ Multi-node & adapters

DockStat separates collection and aggregation from visualization via adapters:

- Docker client adapters (can manage multiple hosts)
- Cloud provisioning adapters (Hetzner, others planned)
- Custom adapters can be written as backend plugins to bring new node types under management

Adapters expose:

- Node discovery & registration
- Metrics collection configuration
- Connection and credential management

---

## ✅ Development workflow & guidelines

- Each app/package should have its own README and local dev scripts.
- Use TypeScript and JSDoc for public APIs.
- Follow repository linting and formatting rules (see root scripts and package.json).
- CI should run type checks, linters and tests on PRs.

Common scripts

- bun run dev — start development servers
- bun run build — build production bundles
- biome — linting and type checks (project specific)

Adding an app

- Create directory in apps/
- Add package.json with scripts (dev/build/lint/check-types)
- Add tsconfig.json extending root config
- Update root workspace config if needed

---

## 🧪 Known limitations & stability

- Pre-Alpha: expect breaking API and UX changes.
- Limited production hardening; use only for testing.
- Some features (Kubernetes support, advanced alerting, long-term metrics storage) are planned but not yet implemented.

---

## 📦 Roadmap (high level)

Short term

- Stabilize plugin runtime API
- Improve adapter management and credentials handling
- Expand DockStore templates and build a simple web marketplace

Medium term

- Advanced dashboards and widget editor
- Built-in alerting and notification center
- Optional integration with time-series DB for long-term metrics

Long term

- Kubernetes management support
- Multi-tenant and RBAC features
- Rich plugin ecosystem and marketplace

---

## 🤝 Contributing

Contributions, ideas and bug reports are welcome.

- Check the Wiki for developer docs and architecture notes
- Open issues for bugs or feature requests
- Submit PRs with small, focused changes and good descriptions
- If you're adding a plugin or template, prefer adding it to apps/dockstore for discoverability

---

## 📚 Documentation & Support

Start with the repository Wiki and the Outline docs:

- Wiki: https://outline.itsnik.de/s/9d88c471-373e-4ef2-a955-b1058eb7dc99
- apps/README.md and apps/dockstat/README.md for per-app instructions

---

## 📝 License

> [Mozilla Public License Version 2.0](https://www.mozilla.org/en-US/MPL/2.0/)
