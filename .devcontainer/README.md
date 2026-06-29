# Dockstat Bun Monorepo Development Container

This `.devcontainer` configuration provides a complete development environment for the **Dockstat Bun-only monorepo** with all necessary tools pre-installed.

## 🚀 Features

### Pre-installed Tools
- **Bun 1.3.6** - Fast JavaScript runtime and package manager (exclusive package manager)
- **Biome 2.3.3** - Linting and formatting
- **Turbo 2.10.0** - Build system for monorepo
- **TypeScript 5.9.3** - TypeScript compiler
- **Docker & Docker Compose** - Full Docker-in-Docker support
- **Git & GitHub CLI** - Version control tools
- **Build Essentials** - Native module compilation support

### VS Code Extensions
The following extensions are automatically installed:
- Bun for VS Code (official extension)
- Biome (linting/formatting)
- TypeScript Next
- Tailwind CSS
- GitLens
- Docker
- GitHub Copilot & Copilot Chat
- Code Spell Checker
- GitHub Pull Requests
- Error Lens (inline error display)
- Path Intellisense
- Import Cost (bundle size visualization)

## 🐳 Docker-in-Docker Support

This container supports Docker-in-Docker with:
- Full Docker CLI access
- Docker Compose support
- Socket proxy for local Docker communication
- Privileged mode for container operations

### Available Services Ports
- **3000** - Frontend development server
- **4000** - API server
- **4040** - DockNode service
- **8080** - SQLite Web (main database)
- **8181** - SQLite Web (verification database)
- **9090** - Prometheus monitoring
- **2375** - Docker Socket Proxy

## 📋 Quick Start

1. **Open in Dev Container**
   - Open the project in VS Code
   - Press `F1` or `Ctrl+Shift+P`
   - Select "Dev Containers: Reopen in Container"
   - Wait for the container to build and start (first time takes longer)

2. **Verify Installation**
   ```bash
   bun --version      # Should show 1.3.6
   biome --version    # Should show 2.3.3
   docker --version   # Should show Docker version
   ```

3. **Install Dependencies**
   ```bash
   bun install
   ```

4. **Start Development**
   ```bash
   bun run dev:dockstat
   
   # Or start minimal services
   bun run dev:minimal
   ```

## 🔧 Manual Docker Management

If Docker service isn't running automatically:

```bash
# Start Docker service manually
sudo service docker start

# Check Docker status
sudo docker info
sudo docker ps
```

## Development Scripts

Available bun scripts (see `package.json`):

- `bun run dev:dockstat` - Start with Docker services
- `bun run dev:minimal` - Start minimal services
- `bun run dev:dockstat:no-docker` - Start without Docker
- `bun run build` - Build all packages
- `bun run lint` - Run linters
- `bun run lint:all` - Run Biome on all files
- `bun run lint:fix:all` - Fix all linting issues
- `bun run format:all` - Format all files with Biome
- `bun run check-types` - Type-check all packages
- `bun run clean` - Clean all build artifacts

## 🐛 Troubleshooting

### Docker Permission Issues
If you get permission errors with Docker, the devuser is already added to the docker group. Use sudo:
```bash
sudo docker ps
sudo docker compose up
```

### Docker Service Not Starting
```bash
# Check service status
sudo service docker status

# Start manually
sudo service docker start

# Check logs
sudo journalctl -u docker -f
```

### Bun Installation Issues
If Bun commands don't work, check the PATH:
```bash
echo $PATH
# Should include /root/.bun/bin
```

### Bun Installation Issues
If Bun commands don't work, check the PATH:
```bash
echo $PATH
# Should include /root/.bun/bin
```

### Turbo/Bun Issues
If Turbo or Bun has issues:
```bash
# Check versions
bun --version
turbo --version

# Reinstall dependencies
bun install

# Clear Bun cache
bun pm cache rm
```

### Port Already in Use
If ports are already bound, you can:
1. Stop the conflicting service on your host
2. Modify the `forwardPorts` in `.devcontainer/devcontainer.json`
3. Use different ports in your application configuration

## 🔐 Security Notes

- The container runs in privileged mode for Docker-in-Docker support
- Docker socket is mounted from the host for container communication
- This configuration is intended for development only

## 📚 Additional Resources

### Bun & Turborepo
- [Bun Documentation](https://bun.sh/docs)
- [Bun Package Manager](https://bun.sh/docs/install/manager)
- [Turbo Documentation](https://turbo.build/repo/docs)
- [Bun VS Code Extension](https://marketplace.visualstudio.com/items?itemName=oven.bun-vscode)

### Code Quality
- [Biome Documentation](https://biomejs.dev/)
- [Biome VS Code Extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

### Docker & Dev Containers
- [Docker-in-Docker](https://docs.docker.com/engine/security/rootless/)
- [VS Code Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## 🤝 Contributing

When contributing to the devcontainer configuration:

1. **Test changes in a fresh container** - Always test in a clean environment
2. **Update this README** with new features or changes
3. **Ensure Docker-in-Docker still works** - Critical for this project
4. **Verify all tools install correctly** - Check Bun, Turbo, Biome versions
5. **Test the helper scripts** - Ensure `docker-start.sh` and `bun-helper.sh` work
6. **Keep Bun-only philosophy** - No npm, pnpm, or yarn dependencies
7. **Verify Turborepo functionality** - Ensure build pipeline works correctly

### Testing Checklist
- [ ] Container builds successfully
- [ ] Bun works and correct version (1.3.6)
- [ ] Docker-in-Docker works
- [ ] Turborepo builds work
- [ ] Biome formatting/linting works
- [ ] Helper scripts are executable and work
- [ ] VS Code extensions install correctly
- [ ] Port forwarding works for all services

### Performance Tips
- Use `bun run dev:minimal` when you don't need all services
- Keep Docker containers running when doing iterative development
- Use Turborepo's caching to speed up builds
- The Bun package manager is significantly faster than alternatives
