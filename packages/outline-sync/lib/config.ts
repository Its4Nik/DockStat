import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import type { TopConfig, TopCollectionConfig, CollectionConfig } from "./types";

export const CONFIG_DIR = "configs";
export const TOP_CONFIG_FILE = path.join("outline-sync.json");

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function ensureConfigDir() {
  if (!existsSync(CONFIG_DIR)) {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  }
}

export async function loadTopConfig(): Promise<TopConfig | null> {
  if (!existsSync(TOP_CONFIG_FILE)) return null;
  const raw = await fs.readFile(TOP_CONFIG_FILE, "utf8");
  return JSON.parse(raw) as TopConfig;
}

export async function saveTopConfig(cfg: TopConfig) {
  await ensureConfigDir();
  await fs.writeFile(
    TOP_CONFIG_FILE,
    `${JSON.stringify(cfg, null, 2)}\n`,
    "utf8",
  );
}

export async function getCollectionFilesBase(collectionId: string): Promise<{
  pagesFile: string;
  configFile: string;
  saveDir: string;
}> {
  const topConfig = await loadTopConfig();

  // If no top config exists, use default paths
  if (!topConfig || !topConfig.collections) {
    return {
      pagesFile: path.join(CONFIG_DIR, `${collectionId}.pages.json`),
      configFile: path.join(CONFIG_DIR, `${collectionId}.config.json`),
      saveDir: "docs",
    };
  }

  // Find the collection configuration
  const collectionConfig = topConfig.collections.find(
    (c) => c.id === collectionId,
  );

  // If no specific collection config found, use default paths
  if (!collectionConfig) {
    return {
      pagesFile: path.join(CONFIG_DIR, `${collectionId}.pages.json`),
      configFile: path.join(CONFIG_DIR, `${collectionId}.config.json`),
      saveDir: "docs",
    };
  }

  // Use custom paths if provided, otherwise fall back to defaults
  return {
    pagesFile:
      collectionConfig.pagesFile ||
      path.join(CONFIG_DIR, `${collectionId}.pages.json`),
    configFile:
      collectionConfig.configFile ||
      path.join(CONFIG_DIR, `${collectionId}.config.json`),
    saveDir: collectionConfig.saveDir || "docs",
  };
}

export async function loadCollectionConfig(
  collectionId: string,
): Promise<CollectionConfig | null> {
  const { configFile } = await getCollectionFilesBase(collectionId);
  if (!existsSync(configFile)) return null;
  const raw = await fs.readFile(configFile, "utf8");
  return JSON.parse(raw) as CollectionConfig;
}

export async function getCollectionTopConfig(
  collectionId: string,
): Promise<TopCollectionConfig | null> {
  const topConfig = await loadTopConfig();
  if (!topConfig || !topConfig.collections) {
    return null;
  }
  return topConfig.collections.find((c) => c.id === collectionId) || null;
}

export async function saveCollectionConfig(c: CollectionConfig) {
  await ensureConfigDir();
  const { configFile } = await getCollectionFilesBase(c.collectionId);
  await fs.writeFile(configFile, `${JSON.stringify(c, null, 2)}\n`, "utf8");
}
