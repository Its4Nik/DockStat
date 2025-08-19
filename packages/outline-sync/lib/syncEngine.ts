import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  loadTopConfig,
  getCollectionFilesBase,
  loadCollectionConfig,
} from "./config";
import {
  normalizeContentIgnoreWhitespace,
  getLocalTimestampMs,
  safeWriteFile,
  slugifyTitle,
} from "./utils";
import {
  fetchDocumentInfo,
  updateDocument,
  createDocument,
} from "./outlineApi";
import type { Manifest, PageEntry } from "./types";

/**
 * Load pages.json for a collection (if missing, error/ask to init)
 */
export async function loadPagesManifest(
  collectionId: string,
): Promise<Manifest> {
  const { pagesFile } = await getCollectionFilesBase(collectionId);
  if (!existsSync(pagesFile)) {
    throw new Error(`${pagesFile} not found. Run init/setup to create it`);
  }
  const raw = await fs.readFile(pagesFile, "utf8");
  return JSON.parse(raw) as Manifest;
}

export async function persistPagesManifest(
  collectionId: string,
  manifest: Manifest,
  dryRun = false,
) {
  const { pagesFile } = await getCollectionFilesBase(collectionId);
  if (dryRun) {
    console.log(`[dry-run] would persist manifest to ${pagesFile}`);
    return;
  }
  await fs.writeFile(
    pagesFile,
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
}

/**
 * Resolve destination file path for a document using collection config mappings.
 *
 * Rules:
 * - mapping with id exact match wins
 * - mapping with title exact match next
 * - mapping.path may be:
 *    - a file path (ending with `.md`) -> set node.file to that path
 *    - a directory path (ends with `/` or no extension) -> place node in that dir as README.md
 * - if no mapping, fall back to inherited folder approach:
 *    parentDir + slug/README.md
 */
export function applyMappingsToManifest(
  manifest: Manifest,
  collectionConfig: any,
) {
  const rules = (collectionConfig?.mappings || []) as {
    match: any;
    path: string;
  }[];

  function isDirPath(p: string) {
    // treat trailing slash as directory OR lack of .md extension as directory
    if (!p) return false;
    if (p.endsWith("/") || p.endsWith(path.sep)) return true;
    return path.extname(p).toLowerCase() !== ".md";
  }

  function applyToNode(node: any, parentDir: string | null) {
    // try id match then title match
    let matched = false;
    for (const r of rules) {
      if (r.match?.id && node.id === r.match.id) {
        const p = r.path;
        if (isDirPath(p)) {
          const dir = p.endsWith("/") ? p : p;
          node.file = path.join(dir, "README.md");
        } else {
          node.file = p;
        }
        matched = true;
        break;
      }
    }
    if (!matched) {
      for (const r of rules) {
        if (r.match?.title && node.title === r.match.title) {
          const p = r.path;
          if (isDirPath(p)) {
            const dir = p.endsWith("/") ? p : p;
            node.file = path.join(dir, "README.md");
          } else {
            node.file = p;
          }
          matched = true;
          break;
        }
      }
    }

    // if still not assigned, inherit from parentDir by using slug -> README.md
    if (!node.file) {
      const slug = slugifyTitle(node.title || "untitled");
      const dir = parentDir
        ? path.join(parentDir, slug)
        : path.join(collectionConfig?.saveDir || "docs", slug);
      node.file = path.join(dir, "README.md");
    } else {
      // If node.file is a bare filename (no directory) => put under parentDir or saveDir
      const hasDir = path.dirname(node.file) && path.dirname(node.file) !== ".";
      if (!hasDir) {
        const baseDir = parentDir || collectionConfig?.saveDir || "docs";
        node.file = path.join(baseDir, node.file);
      } else {
        // if mapping provided a directory-like path (no .md) we already handled; otherwise path may be relative, keep as-is
      }
    }

    // compute this node's dir to pass to children (directory containing README.md)
    const nodeDir = path.dirname(node.file);

    if (node.children?.length) {
      for (const c of node.children) {
        applyToNode(c, nodeDir);
      }
    }
  }

  for (const p of manifest.pages) {
    applyToNode(p as any, null);
  }
  return manifest;
}

/**
 * Compare content ignoring whitespace/newlines
 */
export function contentsEqualIgnoringWhitespace(a: string, b: string) {
  return (
    normalizeContentIgnoreWhitespace(a) === normalizeContentIgnoreWhitespace(b)
  );
}

/**
 * Decide whether to pull or push or skip for one page.
 */
export async function syncPage(
  collectionId: string,
  manifest: Manifest,
  page: PageEntry,
  parentId: string | null,
  opts: { mode: "pull" | "push" | "sync"; dryRun?: boolean },
) {
  const filePath = page.file;
  const absPath = path.resolve(filePath);
  const fileExists = existsSync(absPath);

  let localTs = 0;
  if (fileExists) {
    try {
      localTs = await getLocalTimestampMs(absPath);
    } catch {
      localTs = 0;
    }
  }

  let remoteDoc: any = null;
  if (page.id) {
    try {
      remoteDoc = await fetchDocumentInfo(page.id);
    } catch (err) {
      console.warn(
        `Failed to fetch remote info for ${page.title} (${page.id}): ${err}`,
      );
      remoteDoc = null;
    }
  }

  const remoteText = remoteDoc?.text ?? null;
  const remoteUpdatedAt = remoteDoc?.updatedAt
    ? new Date(remoteDoc.updatedAt).getTime()
    : 0;

  // ensure local file exists when needed - create parent dirs
  if (!fileExists) {
    if (opts.mode === "pull" || opts.mode === "sync" || opts.mode === "push") {
      const dataToWrite =
        remoteText != null ? remoteText : `# ${page.title}\n\n`;
      await safeWriteFile(absPath, dataToWrite, opts.dryRun || false);
    }
  }

  // create remote if missing
  if (!page.id) {
    const localContent = await fs.readFile(absPath, "utf8");
    if (opts.dryRun) {
      console.log(
        `[dry-run][CREATE] Would create remote doc for "${page.title}" in collection ${collectionId}`,
      );
    } else {
      try {
        const created = await createDocument(
          page.title,
          localContent,
          collectionId,
          parentId,
        );
        page.id = created?.id ?? page.id;
        console.log(`[CREATE] Created remote "${page.title}" id=${page.id}`);
      } catch (err) {
        console.error(
          `[CREATE] Failed to create remote for ${page.title}: ${err}`,
        );
      }
    }
  } else {
    const localContent = await fs.readFile(absPath, "utf8");
    if (opts.mode === "pull") {
      if (
        remoteText != null &&
        !contentsEqualIgnoringWhitespace(localContent, remoteText)
      ) {
        console.log(`[PULL] Remote applied to local for "${page.title}"`);
        await safeWriteFile(absPath, remoteText ?? "", opts.dryRun || false);
      } else {
        console.log(`[SKIP] No change (pull) for "${page.title}"`);
      }
    } else if (opts.mode === "push") {
      if (
        remoteText == null ||
        !contentsEqualIgnoringWhitespace(localContent, remoteText)
      ) {
        if (opts.dryRun) {
          console.log(
            `[dry-run][PUSH] Would update remote "${page.title}" id=${page.id}`,
          );
        } else {
          try {
            await updateDocument(page.id, page.title, localContent);
            console.log(`[PUSH] Updated remote "${page.title}" id=${page.id}`);
          } catch (err) {
            console.error(
              `[PUSH] Failed to update remote for ${page.title}: ${err}`,
            );
          }
        }
      } else {
        console.log(`[SKIP] No change (push) for "${page.title}"`);
      }
    } else {
      // sync: timestamp-based but skip if only whitespace differs
      if (remoteUpdatedAt > localTs + 500) {
        if (!contentsEqualIgnoringWhitespace(localContent, remoteText ?? "")) {
          console.log(
            `[PULL] Remote newer -> overwrite local for "${page.title}"`,
          );
          await safeWriteFile(absPath, remoteText ?? "", opts.dryRun || false);
        } else {
          console.log(
            `[SKIP] equal after normalizing (remote newer timestamp but content same) "${page.title}"`,
          );
        }
      } else if (localTs > remoteUpdatedAt + 500) {
        if (!contentsEqualIgnoringWhitespace(localContent, remoteText ?? "")) {
          console.log(
            `[PUSH] Local newer -> update remote for "${page.title}"`,
          );
          if (opts.dryRun) {
            console.log(`[dry-run] would update remote ${page.title}`);
          } else {
            try {
              await updateDocument(page.id, page.title, localContent);
              console.log(
                `[PUSH] Updated remote "${page.title}" id=${page.id}`,
              );
            } catch (err) {
              console.error(
                `[PUSH] Failed to update remote for ${page.title}: ${err}`,
              );
            }
          }
        } else {
          console.log(
            `[SKIP] equal after normalizing (local newer timestamp but content same) "${page.title}"`,
          );
        }
      } else {
        console.log(`[SKIP] No changes for "${page.title}"`);
      }
    }
  }

  // recurse through children
  const nextParentId = page.id || parentId;
  if (page.children?.length) {
    for (const child of page.children) {
      await syncPage(collectionId, manifest, child, nextParentId, opts);
    }
  }
}

/**
 * Run sync for a collection
 */
export async function runSync(opts: {
  collectionId: string;
  mode: "pull" | "push" | "sync";
  dryRun?: boolean;
}) {
  const { collectionId, mode, dryRun = false } = opts;
  console.log(
    `Starting ${mode} for collection ${collectionId} (dryRun=${dryRun})`,
  );
  const pagesManifest = await loadPagesManifest(collectionId);
  const collCfg = (await loadCollectionConfig(collectionId)) || {
    saveDir: "docs",
    mappings: [],
  };

  // apply mappings (this will set folder-based `file` fields)
  applyMappingsToManifest(pagesManifest, collCfg);

  // ensure local files/folders exist and normalize any relative filenames
  async function normalizePaths(node: any, parentDir: string | null) {
    // if node.file is absent, apply inheritance (applyMappingsToManifest should have set it)
    if (!node.file) {
      const slug = slugifyTitle(node.title || "untitled");
      const dir = parentDir
        ? path.join(parentDir, slug)
        : path.join(collCfg.saveDir || "docs", slug);
      node.file = path.join(dir, "README.md");
    } else {
      // If node.file is bare filename without dir -> put into parentDir or saveDir
      const dirnameOfFile = path.dirname(node.file);
      if (!dirnameOfFile || dirnameOfFile === ".") {
        const baseDir = parentDir || collCfg.saveDir || "docs";
        node.file = path.join(baseDir, node.file);
      }
    }

    // create directory if needed (not writing file contents here, just ensuring structure)
    const dirToMake = path.dirname(node.file);
    if (!dryRun) {
      try {
        await fs.mkdir(dirToMake, { recursive: true });
      } catch {
        // ignore
      }
    } else {
      console.log(`[dry-run] would ensure directory ${dirToMake}`);
    }

    const nodeDir = path.dirname(node.file);
    if (node.children?.length) {
      for (const c of node.children) {
        await normalizePaths(c, nodeDir);
      }
    }
  }

  // normalize for each root
  for (const root of pagesManifest.pages) {
    await normalizePaths(root as any, null);
  }

  // run sync recursion
  for (const p of pagesManifest.pages) {
    await syncPage(collectionId, pagesManifest, p, null, { mode, dryRun });
  }

  // persist manifest (write any created ids back)
  await persistPagesManifest(collectionId, pagesManifest, dryRun);
  console.log("Done.");
}
