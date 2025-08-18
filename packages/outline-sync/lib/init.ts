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
  // ask user to pick index
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
  // add to top config
  await ensureConfigDir();
  const top = (await loadTopConfig()) || { collections: [] };
  const exists = top.collections.find((c) => c.id === chosen.id);
  if (!exists) {
    top.collections.unshift({
      id: chosen.id,
      name: chosen.name,
      saveDir: "docs",
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
    process.stdin.once("data", function (data) {
      process.stdin.pause();
      resolve(data.toString());
    });
  });
}

/**
 * Bootstrap: fetch documents from collection, create pages.json and optionally write markdown files.
 * Also create a simple config file (<collection_id>.config.json) with no mappings by default.
 */
export async function bootstrapCollection(opts: {
  collectionId: string;
  dryRun?: boolean;
}) {
  const { collectionId, dryRun = false } = opts;
  console.log(`Bootstrapping collection ${collectionId} (dryRun=${dryRun})...`);
  const docs = await listDocumentsInCollection(collectionId);
  console.log(`Fetched ${docs.length} documents from Outline.`);
  // materialize docs to files under saveDir (default "docs")
  const saveDir = "docs";
  const idToFilename = new Map<string, string>();
  const used = new Set<string>();
  for (const d of docs) {
    const slug = slugifyTitle(d.title || "untitled");
    let candidate = `${slug}.md`;
    if (used.has(candidate)) {
      const short = (d.id || "").slice(0, 6);
      let i = 1;
      let attempt = `${slug}-${short}.md`;
      while (used.has(attempt)) {
        i++;
        attempt = `${slug}-${short}-${i}.md`;
      }
      candidate = attempt;
    }
    used.add(candidate);
    const fullPath = path.join(saveDir, candidate);
    idToFilename.set(d.id, fullPath);
    const content = d.text ?? `# ${d.title}\n\n`;
    if (!dryRun) {
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, "utf8");
    } else {
      console.log(
        `[dry-run] would write ${fullPath} (${content.length} bytes)`,
      );
    }
  }
  // build tree
  const map = new Map<string, PageEntry & { raw?: any }>();
  for (const d of docs) {
    map.set(d.id, {
      title: d.title,
      file:
        idToFilename.get(d.id) ||
        path.join(saveDir, `${slugifyTitle(d.title)}.md`),
      id: d.id,
      children: [],
      raw: d,
    } as any);
  }
  const roots: (PageEntry & { raw?: any })[] = [];
  for (const node of map.values()) {
    const raw = node.raw || {};
    const parentId = raw.parentDocumentId ?? raw.parentId ?? null;
    if (parentId && map.has(parentId)) {
      const parent = map.get(parentId);
      parent.children!.push(node);
    } else {
      roots.push(node);
    }
  }
  function strip(n: any): PageEntry {
    return {
      title: n.title,
      file: n.file,
      id: n.id,
      children: (n.children || []).map(strip),
    };
  }
  const manifest: Manifest = { collectionId, pages: roots.map(strip) };
  // save manifest and config
  await ensureConfigDir();
  const { pagesFile, configFile } = getCollectionFilesBase(collectionId);
  if (!dryRun) {
    await fs.writeFile(
      pagesFile,
      JSON.stringify(manifest, null, 2) + "\n",
      "utf8",
    );
    if (!existsSync(configFile)) {
      await fs.writeFile(
        configFile,
        JSON.stringify({ collectionId, saveDir, mappings: [] }, null, 2) + "\n",
        "utf8",
      );
    }
    // ensure top config includes this
    const top = (await loadTopConfig()) || { collections: [] };
    const exists = top.collections.find((c) => c.id === collectionId);
    if (!exists) {
      top.collections.unshift({
        id: collectionId,
        saveDir,
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
