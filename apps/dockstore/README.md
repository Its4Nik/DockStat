# DockStore

The ecosystem hub for DockStat - a centralized marketplace for Docker Compose / Swarm templates, themes, and plugins.

## Description

DockStore serves as the official repository and marketplace for the DockStat ecosystem. It provides a centralized location for discovering, sharing, and managing Docker Compose stacks, UI themes, and plugins that extend DockStat's functionality. DockStore includes built-in verification systems and integrates seamlessly with DockStat applications.

## Features

- **Docker Compose Templates**: Ready-to-deploy stacks for popular services (AdGuard, Grafana, Home Assistant, Portainer, etc.)
- **Theme Repository**: Community-crafted UI customizations with preview capabilities
- **Plugin Marketplace**: Extensible plugins for DockStat with verification and ratings
- **DockStacks Plugin**: Built-in plugin for managing Docker container stacks from a centralized point
- **Multi-Host Support**: Manage stacks across multiple Docker hosts (local and remote)
- **Verification System**: Optional verification API for plugin security
- **Repository Management**: CLI tools for bundle, validation, and badge generation

## Installation

DockStore is distributed as a repository configuration that can be integrated with DockStat applications:

```bash
# Clone the repository
git clone https://github.com/Its4Nik/DockStat.git
cd DockStat/apps/dockstore
```

## Usage

### Using DockStore with DockStat

DockStore is typically accessed through the DockStat API or frontend:

1. **Browse Templates**: View available Docker Compose stacks through the DockStat interface
2. **Download Stacks**: Download stack configurations with environment files
3. **Install Plugins**: Install verified plugins directly to your DockStat instance
4. **Apply Themes**: Browse and apply UI themes to customize your DockStat experience

### Repository Configuration

The `repo.json` file defines the repository structure:

```json
{
  "name": "DockStore",
  "variant": "github",
  "repository": "Its4Nik/DockStat",
  "paths": {
    "plugins": "./plugins",
    "stacks": "./stacks",
    "themes": "./themes"
  },
  "policies": {
    "strict": true,
    "requireVerification": false
  },
  "verification": {
    "api": "https://dva.dockstore.itsnik.de"
  }
}
```

### DockStacks Plugin

The included DockStacks plugin demonstrates stack management:

```typescript
import { definePlugin } from "@dockstat/plugin-builder"

const plugin = definePlugin({
  name: "DockStacks",
  description: "Manage Docker Compose stacks",
  version: "1.0.0",
  repository: "Its4Nik/DockStat",
  // ... plugin configuration
})
```

## API Reference

For detailed API documentation, see: [DockStore API Reference](../docs/dockstat/dockstore-app/README.md)

## Contributing

### Adding a New Stack

1. Create a new directory in the stacks folder
2. Add a `docker-compose.yml` file
3. Include a `README.md` with usage instructions
4. Metadata labels are automatically infered

### Adding a New Plugin

1. Create a new directory in the plugins folder
2. Use `@dockstat/plugin-builder` to define your plugin
3. Include `package.json` with metadata
4. Add documentation in a `README.md`

### Adding a New Theme

1. Create a new directory in the themes folder
2. Define theme variables in JSON/YAML format
3. Include preview screenshots
4. Add documentation in a `README.md`

## Repository CLI

Use the `@dockstat/repo-cli` package to manage DockStore:

```bash
# Initialize a new repository
dockstat-repo init --name "My Repo" --variant github

# Bundle plugins
dockstat-repo bundle --schema --minify

# Generate badges
dockstat-repo badges

# Validate stacks
dockstat-repo stacks validate ./stacks/my-stack/docker-compose.yml
```

## Verification

DockStore supports optional plugin verification through the Verification API:

- SHA-256 hash verification for source code
- Bundle integrity checking
- Manual security status tracking (safe/unsafe/unknown)
- Public validation endpoints for automated checks

## License

[Mozilla Public License Version 2.0](../../LICENSE)

## Support

For issues, questions, or contributions:
- GitHub Issues: https://github.com/Its4Nik/DockStat/issues
- Documentation: https://docs.dockstat.itsnik.de

---

**Official DockStore Repository - Part of the DockStat Ecosystem**