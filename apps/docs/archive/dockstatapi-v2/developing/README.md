# Dependencies:

* bash
* git
* Node.js
* **npm >= v10.8.2**
* npx
* nodemon
* **node >= v20.18.1**
* jq
* docker (compose)


:::info
Recommended Environment(s):

* Linux
* OSX (untested)
* WSL (untested but should work)

:::

# Quick start

# 0. Change to correct node version using nvm

```bash
nvm install 20
nvm use 20
node -v
```

## 1. Clone the repository via ssh

```bash
git clone git@github.com:Its4Nik/dockstatapi.git
```

## 2. Install dependencies

```bash
npm install
```

## 3. Start the development environment

```bash
npm run dev
```

# All available `npm run` commands

| `npm run` | What will happen? |
|----|----|
| `local-env-file` | `bash ./src/misc/createEnvDev.sh`<br>=> [Creating a local environment file](/doc/maintaining-functions-svuZbEHH9g) |
| `start` | `npm run local-env-file && tsx src/server.ts`=> Creates the env file and starts the server via tsx |
| `start:build` | `npx tsc && node dist/server.js`=> Compiles and runs DockStatAPI via Node.js |
| `dev` | `npm run local-env-file && nodemon`=> Creates the env file and starts the dev server using nodemon |
| `dev:trace` | `npm run local-env-file && nodemon --trace-uncaught --trace-warnings`=> See above (`dev`), but with tracing warnings |
| `dep` | `bash ./src/utils/createDependencyGraph.sh`=> [Creates dependency graphs](/doc/maintaining-functions-svuZbEHH9g) |
| `dep:remove` | `bash ./src/utils/removeUnusedDeps.sh && npm run dep`=> [Remove unused dependencies](https://outline.itsnik.de/doc/maintaining-functions-svuZbEHH9g#h-removing-unused-dependencies) and [Creates dependency graphs](/doc/maintaining-functions-svuZbEHH9g) |
| `build` | `npx tsc`=> Compiles the TypeScript code to JavaScript |
| `build:mini` | `npx tsc && bash ./src/misc/minifyDist.sh --build-only`=> Compiles the TypeScript code to JavaScript and [minifies the JavaScript](https://outline.itsnik.de/doc/maintaining-functions-svuZbEHH9g#h-minifying-compiled-javascript) |
| `mini` | `bash ./src/misc/minifyDist.sh`=> Same as `build:mini`, but runs the minified JS as well |
| `docker` | `docker compose up -d`=> Starts the docker compose file (without building the images!) |
| `docker:full` | See: [npm run docker:full](https://outline.itsnik.de/doc/maintaining-functions-svuZbEHH9g#h-npm-run-dockerfull) |
| `docker:build` | See: [npm run docker:build](https://outline.itsnik.de/doc/maintaining-functions-svuZbEHH9g#h-npm-run-dockerbuild) |
| `docker:build:full` | See: [npm run docker:build:full](https://outline.itsnik.de/doc/maintaining-functions-svuZbEHH9g#h-npm-run-dockerbuildfull) |
| `prettier` | See: [npm run prettier](https://outline.itsnik.de/doc/maintaining-functions-svuZbEHH9g#h-npm-run-prettier) |
| `lint` | `npx eslint`=> Uses ESLint to check all files against the config (./eslint.config.mjs) |
| `lint:fix` | `npx eslint --fix`=> Tries to fix any linting errors / warnings |
| `license` | See: [credits.sh](https://outline.itsnik.de/doc/maintaining-functions-svuZbEHH9g#h-credits) |
| `finish` | Runs:\* `npm run local-env-file` |

* `npm run prettier`
* `npm run license`
* `npm run lint` |

# Contributing

Please see above on how to set things up for developing on this project