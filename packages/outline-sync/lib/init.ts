import { listCollectionsPaged, listDocumentsInCollection } from "./outlineApi";
import {
  loadTopConfig,
  saveTopConfig,
  getCollectionFilesBase,
  saveCollectionConfig,
  ensureConfigDir,
  ensureConfigDirs,
} from "./config";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { slugifyTitle } from "./utils";
import type { PageEntry, Manifest, Document } from "./types";
import { logger } from "../bin/cli";

/**
 * Prompt helper (simple): prints numbered list and reads a line from stdin.
 */
export async function listCollectionsPrompt(opts: {
  dryRun?: boolean;
  nonInteractive?: boolean;
}) {
  const cols = await listCollectionsPaged();
  if (!cols.length) {
    logger.warn("No collections found for this API key.");
    return;
  }
  console.info("Collections:");
  cols.forEach((c, i) => console.info(`${i + 1}) ${c.id}\t${c.name}`));
  if (opts.nonInteractive) {
    return;
  }

  const selection = await question(
    "Select a collection by number (or press Enter to cancel): ",
  );
  const idx = Number(selection.trim());
  if (!idx || idx < 1 || idx > cols.length) {
    logger.warn("Cancelled collection selection.");
    return;
  }

  const chosen = cols[idx - 1];
  logger.info(`You chose: ${chosen.name} (${chosen.id})`);

  await ensureConfigDirs((await loadTopConfig()) || { collections: [] });
  const top = (await loadTopConfig()) || { collections: [] };
  const exists = top.collections.find((c) => c.id === chosen.id);

  let configDir = (
    await question(
      "Enter a base folder path for the collections config files (or press enter for default `.config`): ",
    )
  ).replaceAll("\n", "");

  if (configDir.trim().length <= 1) {
    configDir = ".config";
    logger.debug("Using default configDir `.config`");
  }

  let saveDir = (
    await question(
      "Enter a base folder path for the collections markdown files (or press enter for default `docs`): ",
    )
  ).replaceAll("\n", "");

  if (saveDir.trim().length <= 1) {
    saveDir = "docs";
    logger.debug("Using default saveDir `docs`");
  }

  if (!exists) {
    top.collections.unshift({
      id: chosen.id,
      name: chosen.name,
      configDir: configDir,
      saveDir: saveDir,
      pagesFile: path.join(configDir, `${chosen.id}.pages.json`),
      configFile: path.join(configDir, `${chosen.id}.config.json`),
    });
    await saveTopConfig(top);
    logger.info(
      `Added collection to ${path.join("configs", "outline-sync.json")}`,
    );
  } else {
    logger.warn("Collection already configured.");
  }
}

/**
 * Simple stdin line reader
 */
export function question(promptText: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(promptText);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdin.once("data", (data) => {
      process.stdin.pause();
      resolve(data.toString());
    });
  });
}

/**
 * Bootstrap: fetch documents from collection, create pages.json and write markdown files.
 */
export async function bootstrapCollection(opts: {
  collectionId: string;
  dryRun?: boolean;
}) {
  const { collectionId, dryRun = false } = opts;
  logger.info(`Bootstrapping collection ${collectionId} (dryRun=${dryRun})...`);

  const docs = await listDocumentsInCollection(collectionId);
  logger.info(`Fetched ${docs.length} documents from Outline.`);
  logger.debug(
    `First 3 documents: ${JSON.stringify(docs.slice(0, 3), null, 2)}`,
  );

  // 1) build flat map of nodes
  const map = new Map<string, PageEntry & { raw?: Document }>();
  for (const d of docs) {
    map.set(d.id, {
      title: d.title,
      file: "",
      id: d.id,
      children: [],
      raw: d,
    });
  }

  // 2) attach children
  const roots: (PageEntry & { raw?: Document })[] = [];
  for (const node of map.values()) {
    const raw: Document = node.raw;
    const parentId = raw.parentDocumentId ?? null;
    if (parentId && map.has(parentId)) {
      map.get(parentId).children.push(node);
    } else {
      roots.push(node);
    }
  }
  logger.debug(`Built document tree with ${roots.length} root(s)`);

  // 3) assign paths
  const { saveDir } = await getCollectionFilesBase(collectionId);
  function assignPaths(node: PageEntry & { raw?: Document }, parentDir: string) {
    const slug = slugifyTitle(node.title || "untitled");
    const dir = path.join(parentDir, slug);
    const filePath = path.join(dir, "README.md");
    node.file = filePath;
    if (node.children?.length) {
      for (const c of node.children) {
        assignPaths(c, dir);
      }
    }
  }
  for (const r of roots) {
    assignPaths(r, saveDir);
  }

  // 4) write files
  for (const n of map.values()) {
    const filePath = n.file;
    const content = n.raw?.text ?? `# ${n.title}\n\n`;
    if (!dryRun) {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, "utf8");
      logger.debug(`Wrote file: ${filePath}`);
    } else {
      logger.debug(
        `[dry-run] would write ${filePath} (${content.length} bytes)`,
      );
    }
  }

  // 5) build manifest
  function strip(n: PageEntry & { raw?:Document }): PageEntry {
    return {
      title: n.title,
      file: n.file,
      id: n.id,
      children: (n.children || []).map(strip),
    };
  }
  const manifest: Manifest = { collectionId, pages: roots.map(strip) };

  // save manifest/config
  const {
    pagesFile,
    configFile,
    saveDir: configuredSaveDir,
    configDir,
  } = await getCollectionFilesBase(collectionId);
  logger.debug(
    `Collection (${collectionId}) files: pagesFile=${pagesFile}, configFile=${configFile}, saveDir=${configuredSaveDir}, configDir=${configDir}`,
  );

  await ensureConfigDir(configDir);
  if (!dryRun) {
    await fs.writeFile(
      pagesFile,
      `${JSON.stringify(manifest, null, 2)}\n`,
      "utf8",
    );
    logger.info(`Saved manifest: ${pagesFile}`);

    if (!existsSync(configFile)) {
      await fs.writeFile(
        configFile,
        `${JSON.stringify({ collectionId, saveDir: configuredSaveDir, mappings: [] }, null, 2)}\n`,
        "utf8",
      );
      logger.info(`Created new config: ${configFile}`);
    }
    logger.info(`Saved config: ${configFile}`);

    const top = (await loadTopConfig()) || { collections: [] };
    const existsTop = top.collections.find((c) => c.id === collectionId);
    if (!existsTop) {
      top.collections.unshift({
        id: collectionId,
        saveDir: configuredSaveDir,
        pagesFile,
        configFile,
      });
      await saveTopConfig(top);
      logger.debug(`Updated top config with collection ${collectionId}`);
    }
  } else {
    logger.debug(
      `[dry-run] would save pages to ${pagesFile} and config to ${configFile}`,
    );
  }

  logger.info("Bootstrap complete");
}
