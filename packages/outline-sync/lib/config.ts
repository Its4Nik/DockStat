import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import type { TopConfig, TopCollectionConfig, CollectionConfig } from "./types";

export const CONFIG_DIR = "configs";
export const TOP_CONFIG_FILE = path.join(CONFIG_DIR, "outline-sync.json");

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
    JSON.stringify(cfg, null, 2) + "\n",
    "utf8",
  );
}

export function getCollectionFilesBase(collectionId: string): {
  pagesFile: string;
  configFile: string;
} {
  return {
    pagesFile: path.join(CONFIG_DIR, `${collectionId}.pages.json`),
    configFile: path.join(CONFIG_DIR, `${collectionId}.config.json`),
  };
}

export async function loadCollectionConfig(
  collectionId: string,
): Promise<CollectionConfig | null> {
  const { configFile } = getCollectionFilesBase(collectionId);
  if (!existsSync(configFile)) return null;
  const raw = await fs.readFile(configFile, "utf8");
  return JSON.parse(raw) as CollectionConfig;
}

export async function saveCollectionConfig(c: CollectionConfig) {
  await ensureConfigDir();
  const { configFile } = getCollectionFilesBase(c.collectionId);
  await fs.writeFile(configFile, JSON.stringify(c, null, 2) + "\n", "utf8");
}
