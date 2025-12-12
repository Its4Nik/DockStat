<p align="center">
  <img src="./.github/DockStat2-04.png" alt="DockStat Logo" width="200" />
</p>

<p align="center">
  <strong>
    The Next-Gen All-in-One Container Platform
  </strong>
</p>

<p align="center">
  <i>Combines the best of Portainer, Grafana, and Dockge into one powerful, extensible platform</i>
</p>

<p align="center">
  <a href="https://outline.itsnik.de/s/9d88c471-373e-4ef2-a955-b1058eb7dc99">📚 Wiki</a> · 
  <a href="#-why-dockstat">🎯 Why DockStat?</a> · 
  <a href="#-quick-start">⚡ Quick Start</a> · 
  <a href="#-features">✨ Features</a> · 
  <a href="#-plugins">🔌 Plugins</a>
</p>

---

<div align="center">

![Status](https://img.shields.io/badge/status-Pre--Alpha-orange?style=for-the-badge)
![License](https://img.shields.io/badge/license-MPL--2.0-blue?style=for-the-badge)

**⚠️ DockStat is in Pre-Alpha. Expect breaking changes and use for testing/evaluation only.**

</div>

---

## 🤔 What is DockStat?

**DockStat is your mission control for Docker.**

Instead of juggling multiple tools to manage, monitor, and visualize your containers, DockStat brings everything into one sleek, modern interface. Think of it as the Swiss Army Knife for container management. Built from the ground up to be **modular, observable, and actually enjoyable to use**.

### What makes it different?

- **🧩 Plugin-first architecture** - Add features without waiting for releases
- **📊 Built-in observability** - Metrics, logs, and visualizations out of the box
- **🎨 Actually customizable** - Deep theming that doesn't fight you
- **🌐 Multi-node made simple** - Manage all your Docker hosts from one place

---

## 🎯 Why DockStat?

| Problem                                                   | How DockStat Solves It                                                                   |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **"I need 5 different tools to manage my stack"**         | One platform for containers, monitoring, and deployments                                 |
| **"Portainer is too enterprise-y, Dockge is too simple"** | Perfect balance of power and usability                                                   |
| **"Adding features takes forever"**                       | Runtime plugin system; install features on the fly                                       |
| **"Monitoring is an afterthought"**                       | Observability is built-in from day one                                                   |
| **"My tools don't talk to each other"**                   | Unified architecture with shared data stores, plugins can also integrate with containers |

---

## ✨ Key Features at a Glance

### 🎛️ **Container Management**

- Manage and control containers with an intuitive UI
- Stack-level operations (not just individual containers)
- Template library with pre-built Docker Compose stacks

### 📈 **Deep Observability**

- Real-time metrics with beautiful graphs
- Network topology visualizations
- Unified logs and event tracking
- Custom dashboards with widget system

### 🔌 **Powerful Plugin System**

- **Frontend plugins**: Add UI components, pages, widgets
- **Backend plugins**: Collectors, Adapters, Hooks, provisioning modules, Cloud Integration, ...
- **Full-stack plugins**: Complete features in one package
- Install/uninstall without restarting the platform

### 🌐 **Multi-Node Management**

- Manage multiple Docker hosts from a single instance
- Currently only Docker-Socket API supported
- Automatic node discovery and provisioning

### 🎨 **True Customization**

- variable driven theming
- Home-Assistant style dashboard editor
- Custom widgets and layouts

---

## ⚡ Quick Start

Get DockStat running in under 5 minutes:

```bash
# 1. Clone the repository
git clone https://github.com/its4nik/dockstat.git
cd dockstat

# 2. Install dependencies
bun install

# 3. Start the development server
cd apps/dockstat
bun run dev
```

That's it! Visit `http://localhost:5173` to see DockStat in action, for the Developer API Docs, go to: `http://localhost:3000/api/v2/docs`.

> **New to Bun?** It's like Node.js but faster. [Install it here](https://bun.sh).

---

## 🔌 Plugin Ecosystem

DockStat's superpower is its plugin system. Here's how it works:

| Plugin Type    | What It Does       | Example                  |
| -------------- | ------------------ | ------------------------ |
| **Frontend**   | Adds UI components | Custom dashboard widgets |
| **Backend**    | Adds data sources  | Prometheus collector     |
| **Full-Stack** | Complete features  | Kubernetes adapter       |

**Installing a plugin:**

> Plugins can be loaded from a local folder, or from a registered Repository.
>
> Plugin verification is also supported, useful for "official" Repositories that want to validate the bundle Hashes directly in DockStat rather than on their own.

**Creating a plugin:**

```bash
# Use our plugin template for a head start
bun create @dockstat/plugin my-awesome-plugin
```

---

## 🛠️ Tech Stack

| Category      | Technologies                  |
| ------------- | ----------------------------- |
| **Core**      | React, React Router v7, Bun   |
| **Frontend**  | TypeScript, TailwindCSS, GSAP |
| **Backend**   | ElysiaJS, Dockerode, SQLite   |
| **Monorepo**  | Turborepo                     |
| **Dev Tools** | Biome (linting/formatting)    |

---

## 📁 Project Structure

```
dockstat/
├── apps/
│   ├── dockstat/          # Main UI application
│   ├── dockstore/         # Template & plugin marketplace
│   └── docs/              # Documentation
├── packages/              # Shared libraries
│   ├── typings/           # TypeScript definitions
│   ├── db/                # Database layer
│   ├── create-plugin/     # Plugin Templates
│   └── plugin-handler/    # Plugin Handling
└── .github/               # Assets & CI
```

---

## 🚀 Use Cases

### **For Homelab Enthusiasts**

- Manage your entire self-hosted stack from one dashboard
- Monitor resource usage across multiple Raspberry Pis and servers
- Deploy pre-configured templates for popular apps

### **For Developers**

- Visualize microservice architectures
- Debug container issues with integrated logs and metrics
- Create custom dashboards for your team's needs

### **For DevOps Teams**

- Multi-environment management (dev/staging/prod)
- Plugin-based automation and provisioning
- Centralized observability platform

---

## 📦 DockStore: Your App Marketplace

DockStore is built into DockStat and provides:

- **100+ (not yet) ready-to-use templates** (AdGuard, Home Assistant, Plex, etc.)
- **Community plugins** - Extend functionality with one click
- **Custom themes** - Make DockStat yours

Access it directly from the DockStat UI under the "Store" tab.

---

## 🧪 Current Status & Roadmap

**Pre-Alpha (Current)**

- 🔧 Core container management
- 🔧 Basic monitoring and visualization
- ✅ Plugin system foundation
- ⚠️ Breaking changes likely

**Short Term** (Next 3 months)

- Stabilize plugin API
- Expand plugin capabilities
- Build up the Frontend

**Medium Term** (6 months)

- Advanced alerting system
- Support for Docker Swarm
- Integration with multiple cloud providers and Selfhosted infrastructure via Cloud Init

**Long Term** (1 year)

- Rich marketplace ecosystem
- Enterprise features

---

## 🤝 Contributing

We love contributions! Here's how to help:

1. **Try it out** - Install and report bugs
2. **Create a plugin** - Extend DockStat's capabilities
3. **Add templates** - Share your Docker Compose stacks
4. **Improve docs** - Help others get started ([`apps/docs/dockstat`](apps/docs/dockstat))

**Getting started:**

- Check the [Wiki](https://outline.itsnik.de/s/9d88c471-373e-4ef2-a955-b1058eb7dc99)
- Join discussions in GitHub Issues
- Read `apps/dockstat/README.md` for dev setup

---

## 📚 Documentation

- **User Guide**: [Wiki](https://outline.itsnik.de/s/9d88c471-373e-4ef2-a955-b1058eb7dc99)
- **API Reference**: `apps/dockstat/README.md`
- **Plugin Development**: `packages/plugins/README.md`
- **FAQ**: Check the Wiki's FAQ section

---

## 📝 License

Mozilla Public License Version 2.0 - See [LICENSE](LICENSE) for details.

---

<div align="center">

**Made with ❤️ by Its4Nik**

⭐ Star DockStat on GitHub to show your support!

</div>
