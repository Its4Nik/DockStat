#!/usr/bin/env bun

import { existsSync } from "node:fs";
import { readdir, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { generateMarkdown } from "./src/.utils/render";

// Types
interface Author {
  name: string;
  website?: string;
  email?: string;
}

export interface BaseMeta {
  name: string;
  description: string;
  author: Author;
  version: string;
  license: string;
  tags: string[];
  repository: string;
  path: string;
}

export interface PluginMeta extends BaseMeta {
  type: "plugin";
  builtPath: string;
}

export interface ThemeMeta extends BaseMeta {
  type: "theme";
}

export interface StackMeta extends BaseMeta {
  type: "stack";
  composePath: string;
}

export type ContentItem = PluginMeta | ThemeMeta | StackMeta;

interface Manifest {
  plugins: PluginMeta[];
  themes: ThemeMeta[];
  stacks: StackMeta[];
}

// Configuration
const CONTENT_DIR = "./src/content";
const OUTPUT_FILE = "./manifest.json";
const ALLOWED_MANIFEST_EXTENSIONS = [".json", ".jsonc", ".yml", ".yaml"];

// Helper functions
async function directoryExists(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isFile();
  } catch {
    return false;
  }
}

function getRelativePath(path: string): string {
  return relative(process.cwd(), path);
}

async function findManifestFile(
  basePath: string,
  baseName: string
): Promise<string | null> {
  for (const ext of ALLOWED_MANIFEST_EXTENSIONS) {
    const manifestPath = join(basePath, `${baseName}${ext}`);
    if (await fileExists(manifestPath)) {
      return manifestPath;
    }
  }
  return null;
}

async function parseManifestFile(filePath: string): Promise<ContentItem> {
  const content = await Bun.file(filePath).text();

  if (filePath.endsWith(".json") || filePath.endsWith(".jsonc")) {
    // Simple JSONC parser (removes comments)
    const jsonWithoutComments = content.replace(
      /\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g,
      (m, g) => (g ? "" : m)
    );
    return JSON.parse(jsonWithoutComments) as ContentItem;
  }
  if (filePath.endsWith(".yml") || filePath.endsWith(".yaml")) {
    return Bun.YAML.parse(content) as ContentItem;
  }

  throw new Error(`Unsupported manifest file format: ${filePath}`);
}

async function buildPlugin(
  pluginName: string,
  pluginVersion: string
): Promise<string> {
  const pluginEntryPath = `./src/content/plugins/${pluginName}/index.ts`;
  const outputPath = `./.dist/plugins/${pluginName}@${pluginVersion}/build.js`;

  if (!existsSync(pluginEntryPath)) {
    throw new Error(`Plugin entry point not found: ${pluginEntryPath}`);
  }

  console.log(`Building plugin: ${pluginName}@${pluginVersion}`);

  const result = await Bun.build({
    entrypoints: [pluginEntryPath],
    outdir: dirname(outputPath),
    target: "bun",
    format: "esm",
    sourcemap: "inline",
    env: `${pluginName.toUpperCase()}_*`,
    banner: `/*　　　　　.　　　　　　　　　　⠀✦
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡐⠈⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠔⠉⢆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡐⠀⠈⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⢱⠀⠀⢀⣧⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡀⠀⠀⠀⠀⠀⢋⠀⠀⢀⠗⠤⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠗⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠀⠃⠀⠀⠀⠀⠀⠀⢥⠊⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⢀⠇⠀⢨⠀⠀⠀⠀⠀⡰⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢀⠔⠁⠀⠀⠐⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⠐⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠉⢏⠀⠀⠀⠀⠀⠀⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠁⠂⠀⠀⠀⡠⠚⠒⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠄⠀⠀⠀⠀⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠘⠀⠀⡎⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠁⠀⠀⠀⠀⠀⠀⠀⠗⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⡃⢠⠃⠀DockStore     ⠀⠀⢀⡄⠀⠀⠒⠂⡀⠀⢀⠊⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢈
⠀⠀⠀⠀⠀⠀⠀⠀⠇⡞⠀⠀⠀⠀Plugin⠀⠀⠀⠀⠀⣀⡤⡎⡃⠀⠀⠀⠀⠈⢤⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠂
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠁⠀⠀Builder⠀⠀⠀⠀⠀⢰⢫⠀⠈⠑⡀⠀⠀⠀⠀⠹⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠂
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡃⢀⠖⠋⠉⠀⠀⠀⡎⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠄⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠂
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣡⠜⢱⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡰⠁⠀⠀⢀⠭⠲⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢆⠀⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢈⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
*/`,
    minify: true,
    naming: "/build.js",
  });

  if (!result.success) {
    const errors = result.logs.map((log) => log.message).join("\n");
    throw new Error(`Failed to build plugin ${pluginName}:\n${errors}`);
  }

  console.log(`✓ Successfully built plugin: ${pluginName}`);
  return outputPath;
}

async function processPlugins(): Promise<PluginMeta[]> {
  const pluginsDir = join(CONTENT_DIR, "plugins");
  if (!(await directoryExists(pluginsDir))) {
    console.log("No plugins directory found");
    return [];
  }

  const pluginDirs = await readdir(pluginsDir);
  const plugins: PluginMeta[] = [];

  for (const pluginName of pluginDirs) {
    try {
      const pluginPath = join(pluginsDir, pluginName);
      if (!(await directoryExists(pluginPath))) continue;

      const manifestPath = await findManifestFile(pluginPath, "manifest");
      if (!manifestPath) {
        console.warn(`No manifest found for plugin: ${pluginName}`);
        continue;
      }

      const manifestData = await parseManifestFile(manifestPath);
      const builtPath = await buildPlugin(pluginName, manifestData.version);

      const pluginMeta: PluginMeta = {
        type: "plugin",
        name: manifestData.name || pluginName,
        description: manifestData.description || "",
        author: manifestData.author || { name: "Unknown" },
        version: manifestData.version,
        license: manifestData.license,
        tags: manifestData.tags || [],
        repository: manifestData.repository || "",
        path: getRelativePath(manifestPath),
        builtPath: getRelativePath(builtPath),
      };

      plugins.push(pluginMeta);
      console.log(`✓ Processed plugin: ${pluginName}`);
    } catch (error) {
      console.error(`✗ Failed to process plugin ${pluginName}:`, error);
    }
  }

  return plugins;
}

async function processThemes(): Promise<ThemeMeta[]> {
  const themesDir = join(CONTENT_DIR, "themes");
  if (!(await directoryExists(themesDir))) {
    console.log("No themes directory found");
    return [];
  }

  const themeDirs = await readdir(themesDir);
  const themes: ThemeMeta[] = [];

  for (const themeName of themeDirs) {
    try {
      const themePath = join(themesDir, themeName);
      if (!(await directoryExists(themePath))) continue;

      const manifestPath = await findManifestFile(themePath, "theme");
      if (!manifestPath) {
        console.warn(`No theme manifest found for: ${themeName}`);
        continue;
      }

      const manifestData = await parseManifestFile(manifestPath);

      const themeMeta: ThemeMeta = {
        type: "theme",
        name: manifestData.name || themeName,
        description: manifestData.description || "",
        author: manifestData.author || { name: "Unknown" },
        version: manifestData.version || "1.0.0",
        license: manifestData.license || "MIT",
        tags: manifestData.tags || [],
        repository: manifestData.repository || "",
        path: getRelativePath(manifestPath),
      };

      themes.push(themeMeta);
      console.log(`✓ Processed theme: ${themeName}`);
    } catch (error) {
      console.error(`✗ Failed to process theme ${themeName}:`, error);
    }
  }

  return themes;
}

async function processStacks(): Promise<StackMeta[]> {
  const stacksDir = join(CONTENT_DIR, "stacks");
  if (!(await directoryExists(stacksDir))) {
    console.log("No stacks directory found");
    return [];
  }

  const stackDirs = await readdir(stacksDir);
  const stacks: StackMeta[] = [];

  for (const stackName of stackDirs) {
    try {
      const stackPath = join(stacksDir, stackName);
      if (!(await directoryExists(stackPath))) continue;

      const manifestPath = await findManifestFile(stackPath, "manifest");
      if (!manifestPath) {
        console.warn(`No manifest found for stack: ${stackName}`);
        continue;
      }

      const composePath = join(stackPath, "docker-compose.dst.yaml");
      if (!(await fileExists(composePath))) {
        console.warn(
          `No docker-compose.dst.yaml found for stack: ${stackName}`
        );
        continue;
      }

      const manifestData = await parseManifestFile(manifestPath);

      const stackMeta: StackMeta = {
        type: "stack",
        name: manifestData.name || stackName,
        description: manifestData.description || "",
        author: manifestData.author || { name: "Unknown" },
        version: manifestData.version || "1.0.0",
        license: manifestData.license || "MIT",
        tags: manifestData.tags || [],
        repository: manifestData.repository || "",
        path: getRelativePath(manifestPath),
        composePath: getRelativePath(composePath),
      };

      stacks.push(stackMeta);
      console.log(`✓ Processed stack: ${stackName}`);
    } catch (error) {
      console.error(`✗ Failed to process stack ${stackName}:`, error);
    }
  }

  return stacks;
}

// Main function
async function main() {
  console.log("🚀 Starting manifest generation...\n");

  try {
    // Process all content types in parallel
    const [plugins, themes, stacks] = await Promise.all([
      processPlugins(),
      processThemes(),
      processStacks(),
    ]);

    // Create final manifest
    const manifest: Manifest = {
      plugins,
      themes,
      stacks,
    };

    // Write manifest file
    await writeFile(OUTPUT_FILE, JSON.stringify(manifest, null, 2));

    await Bun.write(
      "README.md",
      generateMarkdown({ plugins: plugins, stacks: stacks, themes: themes })
    );

    console.log("\n✅ Manifest generation completed!");
    console.log(`📁 Output file: ${OUTPUT_FILE}`);
    console.log("\n📊 Summary:");
    console.log(`   Plugins: ${plugins.length}`);
    console.log(`   Themes: ${themes.length}`);
    console.log(`   Stacks: ${stacks.length}`);
    console.log(`   Total: ${plugins.length + themes.length + stacks.length}`);
  } catch (error) {
    console.error("\n❌ Manifest generation failed:", error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}

export { main };
