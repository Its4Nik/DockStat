---
id: af6ef73c-2e42-457f-bbf9-00ecb01a3833
title: Contribute
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: 280f8e0a-92e7-4825-8dc0-9a8c886e3d17
updatedAt: 2025-08-18T22:50:57.027Z
urlId: 7yJnHJSw4D
---

Please see this [GitHub topic](https://github.com/topics/dockstat) to find all DockStat components.

# :whale: DockStat

## Summary

DockStat is built using [Remix](https://remix.run), which is based on React. There is no UI Component library, everything is custom-made.

## How to Contribute


1. **Fork the Repository**:
   * Fork this repository to your GitHub account.
   * Clone the forked repository to your local machine.
2. **Create a New Branch**:
   * Name your branch descriptively, e.g., `add-new-route` or `fix-bug-in-logging`.

   
   1. Example:

      ```bash
      git checkout -b my-change
      ```
3. Set up the environment
   * Install [Bun](https://bun.sh) if you haven't already.
   * Run: `bun install`
   * Start dev environment:
     * Frontend: `bun dev:client`
     * Backend: `bun dev:server`
4. **Make Your Changes**
5. **Test Your Changes**
   * Verify that your changes work as expected locally.
   * Lint your files (using Biome): `bun lint`
6. **Commit Your Changes**
   * Write clear and concise commit messages.
   * Example:

     ```bash
     git add .
     git commit -m "Change grid layout"
     ```
7. **Push and Submit a Pull Request**:
   * Push your changes to your fork:

     ```bash
     git push origin change-this-and-that
     ```
   * Open a pull request (PR) from your branch to the `dev` branch of this repository.


---

## Reporting Issues

* Use the [GitHub Issues](https://github.com/its4nik/dockstak/issues) page to report bugs or suggest improvements.
* Provide a clear and detailed description:
  * Steps to reproduce (if a bug).
  * Expected behavior and actual behavior.
  * Screenshots (if applicable).


---

# :gear: DockStatAPI

## Summary

DockStatAPI is the backbone of DockStat. Every functionality (except DockStacks) runs through here. The API is pretty complex by now, offering multiple functions and websocket router for metrics, Stack deployment and more.

The API is built using [Bun](https://bun.sh).

## How to Contribute


1. **Fork the Repository**:
   * Fork this repository to your GitHub account.
   * Clone the forked repository to your local machine.
2. **Create a New Branch**:
   * Name your branch descriptively, e.g., `add-new-route` or `fix-bug-in-logging`.

   
   1. Example:

      ```bash
      git checkout -b my-change
      ```
3. Set up the environment
   * Install [Bun](https://bun.sh) if you haven't already.
   * Run: `bun install`
   * Start dev environment: `bun dev`
4. **Make Your Changes**
5. **Test Your Changes**
   * Verify that your changes work as expected locally.
   * Add Unit tests
   * Run the unit tests: `bun test`
   * Lint your files (using Biome): `bun lint`
6. **Commit Your Changes**
   * Write clear and concise commit messages.
   * Example:

     ```bash
     git add .
     git commit -m "Add template for Redis stack"
     ```
7. **Push and Submit a Pull Request**:
   * Push your changes to your fork:

     ```bash
     git push origin add-my-template
     ```
   * Open a pull request (PR) from your branch to the `dev` branch of this repository.


---

## Reporting Issues

* Use the [GitHub Issues](https://github.com/its4nik/dockstack/issues) page to report bugs or suggest improvements.
* Provide a clear and detailed description:
  * Steps to reproduce (if a bug).
  * Expected behavior and actual behavior.
  * Screenshots (if applicable).


---

## Suggesting Features

* Before suggesting a new feature, check if a similar suggestion already exists in the [Issues](https://github.com/its4nik/dockstack/issues).
* If not, open a new issue and provide:
  * A detailed explanation of the feature.
  * A brief example or use case.


---

# :shopping_trolley: DockStacks

## How to Contribute


1. **Fork the Repository**:
   * Fork this repository to your GitHub account.
   * Clone the forked repository to your local machine.
2. **Create a New Branch**:
   * Name your branch descriptively, e.g., `add-new-template` or `fix-bug-in-grid`.
   * Example:

     ```bash
     git checkout -b add-my-template
     ```
3. **Make Your Changes**:
   * Ensure all new templates follow the folder structure:

     ```txt
     template/{STACK_NAME}/
       ├── schema.json
       ├── README.md
       ├── icon.{svg|png} # Optional
       └── DESCRIPTION.md
     ```
   * Validate JSON schema files using online or CLI JSON schema validators (IDE integration works best for me!).
4. **Test Your Changes**:
   * Verify that your changes work as expected locally.
   * Check the appearance of the grid and modal (if applicable).
5. **Commit Your Changes**:
   * Write clear and concise commit messages.
   * Example:

     ```bash
     git commit -m "Add template for Redis stack"
     ```
6. **Push and Submit a Pull Request**:
   * Push your changes to your fork:

     ```bash
     git push origin add-my-template
     ```
   * Open a pull request (PR) from your branch to the `main` branch of this repository.


---

## Reporting Issues

* Use the [GitHub Issues](https://github.com/its4nik/dockstacks/issues) page to report bugs or suggest improvements.
* Provide a clear and detailed description:
  * Steps to reproduce (if a bug).
  * Expected behavior and actual behavior.
  * Screenshots (if applicable).


---

## Suggesting Features

* Before suggesting a new feature, check if a similar suggestion already exists in the [Issues](https://github.com/its4nik/dockstacks/issues).
* If not, open a new issue and provide:
  * A detailed explanation of the feature.
  * A brief example or use case.


---

## Submitting Templates

When submitting a new template:


1. Create a new folder in the `template/` directory named after the stack (e.g., `redis`, `nginx`), please only use lowercase letters.
2. Add the required files:
   * `**schema.json**`: Follows the repository's JSON schema format.
   * `**README.md**`: Describes the stack, its use, and configuration options.
   * `**DESCRIPTION.md**`: A short description for the stack (max 50 characters).
3. Ensure your files are formatted correctly:
   * Validate `schema.json` using a JSON schema validator.
   * Ensure `README.md` is clear, concise, and well-structured.


---

## Need Help?

Feel free to ask questions or seek help in the [Discussions](https://github.com/its4nik/dockstacks/discussions) section.