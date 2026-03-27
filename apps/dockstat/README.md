# @dockstat/dockstat

> Welcome to the main DockStat app. In this folder you can find the source code to it.

## What is DockStat?

DockStat is more than just a simple monitoring tool, it's a full-fledged system for monitoring, deploying and manageing all your Dockerized applications.

## Feature List (not all yet implemented!)

- Monitor multiple Docker Host with configurable intervals
- Community Integration via [@dockstat/repo-cli](../../packages/repo-cli/README.md)
- Deploy and Manage Stacks
  - Support for Default `docker-compose.yaml` Stacks
  - Install Stack-Templates made by the Community
  - Use Docker-Swarm with HA-Proxy integration for easy High availability
- Get a sense of your infrastructure using a easy to undestand Graph-Based-Dashboard
- Customize what matters
  - Use different themes
  - Change your current theme to match your style
  - Add your own custom widgets
  - Add your own custom dashboards
  - Customize the Homepage using a comprehensive widgeting system
  - Pin your most important pages directly to the Nav-Bar
- Fast navigation (Ctrl+K)
- Customizable Hotkeys
- Leverage Bun's speed
- Extensible Plugins
  - Use Hooks to trigger plugin actions (`host:added`, `stack:created`, `container:started`, `container:died`, ...)
  - Use [`@dockstat/plugin-builder`](../../packages/plugin-builder/README.md) to create new Plugins
  - Create Backend and Frontend Plugins (define Backend routes )

## Architecture Description

DockStat is a Bun based Fullstack application that provides a lot of features (see above). Thus the architecture is quite complex. There are multiple abstraction layers to allow the modular development and usage of DockStat.

### Communicating with Containers

To communicate with containers we have to:

1. Pass through the DockStatAPI
2. Find the right Docker-Client
3. Proxy the request to the Docker-Client Worker (allows multithreading in JS/TS)
4. Find the right Docker-Host
5. Do the request for the found host
6. Proxy the request back to the DockStatAPI
7. Asynchronously await the result on the frontend

### Plugins