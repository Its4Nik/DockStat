import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import type { TopConfig, TopCollectionConfig, CollectionConfig } from "./types";
import { logger } from "../bin/cli";

export const TOP_CONFIG_FILE = path.join("outline-sync.json");

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function ensureConfigDir(dir: string) {
  logger.debug(`Ensuring config dir: ${dir}`);
  if (!existsSync(dir)) {
    logger.warn(`Dir (${dir}) does not exist, creating...`);
    await fs.mkdir(dir, { recursive: true });
  }
}

export async function ensureConfigDirs(cfg: TopConfig) {
  const collections = cfg.collections;
  console.debug(`Ensuring config dir for ${collections.length} collection(s)`);
  for (const collection of collections) {
    const dir = collection.configDir;
    logger.debug(`Ensuring config dir: ${dir}`);
    if (!existsSync(dir)) {
      logger.warn(`Dir (${dir}) does not exist, creating...`);
      await fs.mkdir(dir, { recursive: true });
    }
  }
}

export async function loadTopConfig(): Promise<TopConfig | null> {
  logger.debug(`Loading top config from: ${TOP_CONFIG_FILE}`);
  if (!existsSync(TOP_CONFIG_FILE)) {
    logger.warn("Top config file not found");
    return null;
  }
  const raw = await fs.readFile(TOP_CONFIG_FILE, "utf8");
  return JSON.parse(raw) as TopConfig;
}

export async function saveTopConfig(cfg: TopConfig) {
  logger.debug("Saving top config");
  await ensureConfigDirs(cfg);
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
  configDir: string;
}> {
  logger.debug("Getting Collection file base");
  const topConfig = await loadTopConfig();
  const CONFIG_DIR = topConfig.collections.find(
    (collection) => collection.id === collectionId,
  ).configDir;

  // If no top config exists, use default paths
  if (!topConfig || !topConfig.collections) {
    logger.warn(`No Top config found for ${collectionId}, returning default`);
    return {
      pagesFile: path.join(CONFIG_DIR, `${collectionId}.pages.json`),
      configFile: path.join(CONFIG_DIR, `${collectionId}.config.json`),
      saveDir: "docs",
      configDir: CONFIG_DIR,
    };
  }

  // Find the collection configuration
  const collectionConfig = topConfig.collections.find(
    (c) => c.id === collectionId,
  );

  // If no specific collection config found, use default paths
  if (!collectionConfig) {
    logger.warn(
      `Collection config for ${collectionId} not found, returning default paths`,
    );
    return {
      pagesFile: path.join(CONFIG_DIR, `${collectionId}.pages.json`),
      configFile: path.join(CONFIG_DIR, `${collectionId}.config.json`),
      saveDir: "docs",
      configDir: ".config",
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
    configDir: collectionConfig.configDir || ".config",
  };
}

export async function loadCollectionConfig(
  collectionId: string,
): Promise<CollectionConfig> {
  logger.debug(`Loading collection config for ${collectionId}`);
  const { configFile } = await getCollectionFilesBase(collectionId);
  if (!existsSync(configFile)) {
    logger.warn(`Collection config file for ${collectionId} not found`);
    return null;
  }
  const raw = await fs.readFile(configFile, "utf8");
  return JSON.parse(raw) as CollectionConfig;
}

export async function getCollectionTopConfig(
  collectionId: string,
): Promise<TopCollectionConfig | null> {
  logger.debug(`Getting Top Collection Config for ${collectionId}`);
  const topConfig = await loadTopConfig();
  if (!topConfig || !topConfig.collections) {
    logger.debug(`No Top Config found for ${collectionId}`);
    return null;
  }
  return topConfig.collections.find((c) => c.id === collectionId) || null;
}

export async function saveCollectionConfig(c: CollectionConfig) {
  logger.debug(`Saving Collection config for ${c.collectionId}`);
  const { configFile, configDir } = await getCollectionFilesBase(
    c.collectionId,
  );
  await ensureConfigDir(configDir);
  await fs.writeFile(configFile, `${JSON.stringify(c, null, 2)}\n`, "utf8");
}
