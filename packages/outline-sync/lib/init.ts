import { listCollectionsPaged, listDocumentsInCollection } from "./outlineApi";
import {
  loadTopConfig,
  saveTopConfig,
  getCollectionFilesBase,
  saveCollectionConfig,
  ensureConfigDir,
} from "./config";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { slugifyTitle } from "./utils";
import type { PageEntry, Manifest } from "./types";

/**
 * Prompt helper (simple): prints numbered list and reads a line from stdin.
 */
export async function listCollectionsPrompt(opts: {
  dryRun?: boolean;
  nonInteractive?: boolean;
}) {
  const cols = await listCollectionsPaged();
  if (!cols.length) {
    console.log("No collections found for this API key.");
    return;
  }
  console.log("Collections:");
  cols.forEach((c, i) => console.log(`${i + 1}) ${c.id}\t${c.name}`));
  if (opts.nonInteractive) return;
  const selection = await question(
    "Select a collection by number (or press Enter to cancel): ",
  );
  const idx = Number(selection.trim());
  if (!idx || idx < 1 || idx > cols.length) {
    console.log("Cancelled.");
    return;
  }
  const chosen = cols[idx - 1];
  console.log(`You chose: ${chosen.name} (${chosen.id})`);
  await ensureConfigDir();
  const top = (await loadTopConfig()) || { collections: [] };
  const exists = top.collections.find((c) => c.id === chosen.id);
  if (!exists) {
    const defaultSaveDir = "docs";
    top.collections.unshift({
      id: chosen.id,
      name: chosen.name,
      saveDir: defaultSaveDir,
      pagesFile: path.join("configs", `${chosen.id}.pages.json`),
      configFile: path.join("configs", `${chosen.id}.config.json`),
    });
    await saveTopConfig(top);
    console.log(
      `Added collection to ${path.join("configs", "outline-sync.json")}`,
    );
  } else {
    console.log("Collection already configured.");
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
 * Now: folder-based structure by inheritance. Each page gets a directory named from the slug,
 * and the page itself is saved as `index.md` inside that directory. Children become subdirectories.
 */
export async function bootstrapCollection(opts: {
  collectionId: string;
  dryRun?: boolean;
}) {
  const { collectionId, dryRun = false } = opts;
  console.log(`Bootstrapping collection ${collectionId} (dryRun=${dryRun})...`);
  const docs = await listDocumentsInCollection(collectionId);
  console.log(`Fetched ${docs.length} documents from Outline.`);

  // 1) build flat map of nodes with raw
  const map = new Map<string, PageEntry & { raw?: any }>();
  for (const d of docs) {
    map.set(d.id, {
      title: d.title,
      file: "",
      id: d.id,
      children: [],
      raw: d,
    } as any);
  }

  // 2) attach children using parentDocumentId or parentId
  const roots: (PageEntry & { raw?: any })[] = [];
  for (const node of map.values()) {
    const raw = node.raw || {};
    const parentId = raw.parentDocumentId ?? raw.parentId ?? null;
    if (parentId && map.has(parentId)) {
      const parent = map.get(parentId);
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // 3) assign folder-based file paths recursively
  // pattern: <saveDir>/<ancestor-slug-1>/<ancestor-slug-2>/<this-slug>/index.md
  // Get the configured saveDir
  const { saveDir } = await getCollectionFilesBase(collectionId);

  function assignPaths(node: any, parentDir: string) {
    const slug = slugifyTitle(node.title || "untitled");
    const dir = path.join(parentDir, slug);
    const filePath = path.join(dir, "index.md");
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

  // 4) write files to disk
  for (const n of map.values()) {
    const filePath = n.file;
    const content = n.raw?.text ?? `# ${n.title}\n\n`;
    if (!dryRun) {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, "utf8");
    } else {
      console.log(
        `[dry-run] would write ${filePath} (${content.length} bytes)`,
      );
    }
  }

  // 5) strip raw and build manifest
  function strip(n: any): PageEntry {
    return {
      title: n.title,
      file: n.file,
      id: n.id,
      children: (n.children || []).map(strip),
    };
  }
  const manifest: Manifest = { collectionId, pages: roots.map(strip) };

  // save manifest and config files
  await ensureConfigDir();
  const {
    pagesFile,
    configFile,
    saveDir: configuredSaveDir,
  } = await getCollectionFilesBase(collectionId);
  if (!dryRun) {
    await fs.writeFile(
      pagesFile,
      `${JSON.stringify(manifest, null, 2)}\n`,
      "utf8",
    );
    if (!existsSync(configFile)) {
      await fs.writeFile(
        configFile,
        `${JSON.stringify({ collectionId, saveDir: configuredSaveDir, mappings: [] }, null, 2)}\n`,
        "utf8",
      );
    }
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
    }
  } else {
    console.log(
      `[dry-run] would save pages to ${pagesFile} and config to ${configFile}`,
    );
  }
  console.log(`Bootstrap complete: wrote ${pagesFile} and ${configFile}`);
}
