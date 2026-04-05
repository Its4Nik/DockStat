# @dockstat/repo-cli

> Helps you manage repositories for DockStat installations

## Installation

```bash
bun -g @dockstat/repo-cli
# And afterwards
dockstat-repo ...

# OR:

bunx @dockstat/repo-cli ...
```

## Commands

| command | options                                 | description                                                    | Required? |
| ------- | --------------------------------------- | -------------------------------------------------------------- | --------- |
| `init`  |                                         | Initializes a new repository                                   |           |
|         | `-n <name>` / `--name <name>`           | Sets the name for the Repository                               | ✅        |
|         | `-t <path>` / `--themes-dir <path>`     | Themes directory (default: `./content/themes`)                 | ❌        |
|         | `-p <path>` / `--plugin-dir <path>`     | Plugins directory (default: `./content/plugins`)               | ❌        |
|         | `-s <path>` / `--stack-dir <path>`      | Stacks directory (defualt: `./content/stacks`)                 | ❌        |
|         | `--plugin-bundle <dir>`                 | Plugin bundle output directory (default: `bundle`)             | ❌        |
|         | `-r` / `--relaxed`                      | Sets the verification policy to relaxed (default: `false`)     | ❌        |
|         | `-a <URL>` / `--verification-api <URL>` | Sets the verification API Endpoint (default: `undefined`)      | ❌        |
|         | `-v <type>` / `--variant <type>`        | Repository type (`github`, `gitlab`, `gitea`, `http`, `local`) | ❌        |

| command  | options           | description                                             | Required? |
| -------- | ----------------- | ------------------------------------------------------- | --------- |
| `bundle` |                   | Bundles all plugins and updates the repository manifest |           |
|          | `--schema <path>` | Output path for plugin meta schema                      | ❌        |
|          | `--minify`        | Minifies the plugins source code (default: `true`)      | ❌        |
|          | `--sourcemap`     | Generate sourcemaps (default: `true`)                   | ❌        |

| command  | options              | description                                           | Required? |
| -------- | -------------------- | ----------------------------------------------------- | --------- |
| `badges` |                      | Generate SVG badges for the repository                |           |
|          | `-o, --output <dir>` | Output directory for badges (default: `.badges`)      | ❌        |
|          | `--style <style>`    | Badge style (`flat`, `flat-square`) (default: `flat`) | ❌        |
|          | `--plugins`          | Generate plugins count badge (default: `true`)        | ❌        |
|          | `--themes`           | Generate themes count badge (default: `true`)         | ❌        |
|          | `--stacks`           | Generate stacks count badge (default: `true`)         | ❌        |
|          | `--version`          | Generate version badge (default: `true`)              | ❌        |
|          | `--type`             | Generate repository type badge (default: `true`)      | ❌        |
|          | `--status`           | Generate build status badge (default: `true`)         | ❌        |

| command | options             | description                                                                                                                          | Required? |
| ------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| `serve` |                     | Serves the current working directory via Bun.serve — rudimentary; recommended only for testing or deployments behind a reverse proxy |           |
|         | `-p, --port <port>` | The port on which the server should listen (default: `8080`)                                                                         | ❌        |

## License

See repository root
