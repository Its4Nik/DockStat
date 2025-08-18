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
  const { pagesFile } = getCollectionFilesBase(collectionId);
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
  const { pagesFile } = getCollectionFilesBase(collectionId);
  if (dryRun) {
    console.log(`[dry-run] would persist manifest to ${pagesFile}`);
    return;
  }
  await fs.writeFile(
    pagesFile,
    JSON.stringify(manifest, null, 2) + "\n",
    "utf8",
  );
}

/**
 * Resolve destination file path for a document using collection config mappings.
 * The mapping rules are applied by exact id match first, then exact title match.
 * If nothing matches, fall back to manifest file.
 */
export function applyMappingsToManifest(
  manifest: Manifest,
  collectionConfig: any,
) {
  // mutate manifest.pages' .file when mapping matches
  const rules = (collectionConfig?.mappings || []) as {
    match: any;
    path: string;
  }[];

  function applyToNode(node: any) {
    // check id match
    for (const r of rules) {
      if (r.match?.id && node.id === r.match.id) {
        node.file = r.path;
        break;
      }
    }
    // title match if not already matched
    for (const r of rules) {
      if (r.match?.title && node.title === r.match.title) {
        node.file = r.path;
        break;
      }
    }
    // ensure children get pathing if path is a directory (ends with /) - inherit
    const parentDir = path.dirname(node.file || "");
    if (node.children?.length) {
      for (const c of node.children) {
        // if child has a path set already skip; else construct from parentDir + slugified title
        if (!c.file || c.file === "") {
          const slug = c.title ? c.title : "untitled";
          c.file = path.join(parentDir, `${slugifySimple(slug)}.md`);
        } else {
          // if child path is relative (no dir) make it inside parentDir
          if (!path.dirname(c.file) || path.dirname(c.file) === ".") {
            c.file = path.join(parentDir, c.file);
          }
        }
        applyToNode(c);
      }
    }
  }

  function slugifySimple(t: string) {
    return t
      .toString()
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  for (const p of manifest.pages) {
    applyToNode(p as any);
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
 * mode:
 *   - 'pull'  : always prefer remote if different
 *   - 'push'  : always push local
 *   - 'sync'  : timestamp-based: newer wins; if equal do nothing
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

  // fetch remote doc if page.id present
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

  // ensure local file exists for pushes/creates
  if (!fileExists) {
    if (opts.mode === "pull" || opts.mode === "sync") {
      if (remoteText != null) {
        console.log(`[PULL] creating local file ${absPath} from remote`);
        await safeWriteFile(
          absPath,
          remoteText ?? `# ${page.title}\n\n`,
          opts.dryRun || false,
        );
      } else {
        // create placeholder local file
        await safeWriteFile(
          absPath,
          `# ${page.title}\n\n`,
          opts.dryRun || false,
        );
      }
    } else if (opts.mode === "push") {
      // create placeholder so we can push
      await safeWriteFile(absPath, `# ${page.title}\n\n`, opts.dryRun || false);
    }
  }

  // decide action
  // if remote missing (page.id null) -> create remote from local
  if (!page.id) {
    const content = await fs.readFile(absPath, "utf8");
    if (opts.dryRun) {
      console.log(
        `[dry-run][CREATE] Would create remote doc for "${page.title}" in collection ${collectionId}`,
      );
    } else {
      try {
        const created = await createDocument(
          page.title,
          content,
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
    // remote exists
    const localContent = await fs.readFile(absPath, "utf8");
    //const localNormalized = normalizeContentIgnoreWhitespace(localContent);
    //const remoteNormalized =
    //  remoteText != null ? normalizeContentIgnoreWhitespace(remoteText) : null;

    if (opts.mode === "pull") {
      // pull wins
      if (
        remoteText != null &&
        !contentsEqualIgnoringWhitespace(localContent, remoteText)
      ) {
        console.log(`[PULL] Remote is applied to local for "${page.title}"`);
        await safeWriteFile(absPath, remoteText ?? "", opts.dryRun || false);
      } else {
        console.log(`[SKIP] No change (pull) for "${page.title}"`);
      }
    } else if (opts.mode === "push") {
      // push local to remote if different
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
      // sync: use timestamps, but ignore whitespace when determining whether content differs
      if (remoteUpdatedAt > localTs + 500) {
        // remote newer
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
        // local newer
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

  // children recursion
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
  const collCfg = await loadCollectionConfig(collectionId);
  // apply mappings
  applyMappingsToManifest(pagesManifest, collCfg || {});
  // ensure files saved into saveDir if provided
  const saveDir = collCfg?.saveDir || "docs";

  // create missing directories and normalize page.file to include saveDir when path is relative without directories
  function normalizePaths(node: any) {
    if (!node.file) {
      // fallback to saveDir + slug
      node.file = path.join(
        saveDir,
        `${(node.title || "untitled").toLowerCase().replace(/\s+/g, "-")}.md`,
      );
    } else {
      // if node.file is a bare filename (no dir) make it under saveDir
      if (!path.dirname(node.file) || path.dirname(node.file) === ".") {
        node.file = path.join(saveDir, node.file);
      }
    }
    if (node.children?.length) node.children.forEach(normalizePaths);
  }
  pagesManifest.pages.forEach(normalizePaths);

  // recursively sync pages
  for (const p of pagesManifest.pages) {
    await syncPage(collectionId, pagesManifest, p, null, { mode, dryRun });
  }

  // persist pages manifest (may have ids updated)
  await persistPagesManifest(collectionId, pagesManifest, dryRun);
  console.log("Done.");
}

/**
 * small export for CLI convenience
 */
export async function runSyncCli(opts: {
  collectionId: string;
  mode: "pull" | "push" | "sync";
  dryRun?: boolean;
}) {
  return runSync(opts);
}
