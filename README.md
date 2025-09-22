<p align="center">
  <img src="./.github/DockStat2-04.png" alt="DockStat Logo" width="225" height="150" />
</p>

<h1 align="center">🚢 DockStat</h1>

<p align="center">
  <a href="#project-description">Project Description</a> •
  <a href="#key-features">Key Features</a> •
  <a href="#technology-stack">Tech Stack</a> •
  <a href="https://outline.itsnik.de/s/9d88c471-373e-4ef2-a955-b1058eb7dc99">Wiki</a>
</p>

---

## 📖 Project Description

DockStat aims to combine the best of **Portainer**, **Grafana**, and **Dockge** into a single, unified platform for **container administration** and **monitoring**.
The goal: the ultimate, extensible solution for managing and observing your containerized environments.

---

### ⚠️ Disclaimer

DockStat is currently in **Pre-Alpha**.
Expect **breaking changes, missing features, and no guarantees** at this stage.

---

## ✨ Key Features

DockStat is built with extensibility in mind, powered by a **runtime-compatible plugin system**.

- **Plugin System**
  - Frontend components
  - Backend services
  - Combined (full-stack) plugins
- **Theming Support**
  - Custom CSS variables for deep theming
- **Stacks**
  - Automatic node provisioning
    - (e.g. Hetzner Cloud API plugin)
  - Prebuilt Docker Compose templates
    - _(future: Kubernetes support)_
  - Whole-stack monitoring
  - Stack-level plugin support (e.g. Traefik, Caddy)
- **Monitoring**
  - Table-based views
  - Graph-based insights
  - Network-based visualization with [sigma.js](https://sigmajs.org) / [reagraph](https://www.npmjs.com/package/reagraph)
- **Custom Dashboards**
  - Extend with plugins (e.g. Home Assistant-style widgets)
- **Multi-Node Monitoring**
  - Group nodes using **adapters**
  - Adapters configure monitoring options (e.g. Docker Client can track multiple hosts with its own config)

---

## 🛠 Tech Stack

**Core**: React Router v7 • React • Bun

- **Frontend**: TailwindCSS • GSAP • lucide-react
- **Backend**: Dockerode • bun:sqlite • @dockstat/\*
