/**
 * Outline <> Git Markdown two-way sync (single-collection) + init
 * - Bun runtime (uses Bun.spawnSync, global fetch)
 *
 * New features:
 *  - --init : bootstrap pages.json + markdown files from an existing collection
 *  - --list-collections : prints collections (id + name)
 *
 * Usage:
 *  OUTLINE_API_KEY=... bun run sync.ts --init --collection-id=COLLECTION_UUID
 *  OUTLINE_API_KEY=... bun run sync.ts --list-collections
 *  OUTLINE_API_KEY=... bun run sync.ts            # normal sync
 *
 * NOTE: if you run --init without --dry-run it will actually write files & pages.json
 */

import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

type PageEntry = {
  title: string;
  file: string;
  id: string | null;
  children?: PageEntry[];
};

type Manifest = {
  collectionId: string;
  pages: PageEntry[];
};

const MANIFEST = "pages.json";

const argv = process.argv.slice(2);
let BASE_URL = process.env.OUTLINE_BASE_URL || null;
let API_KEY = process.env.OUTLINE_API_KEY || null;
let CLI_COLLECTION_OVERRIDE: string | null = null;
let DRY_RUN = false;
let DO_INIT = false;
let LIST_COLLECTIONS = false;

for (const a of argv) {
  if (a.startsWith("--collection-id=")) {
    CLI_COLLECTION_OVERRIDE = a.split("=")[1] || null;
  } else if (a === "--dry-run") {
    DRY_RUN = true;
  } else if (a === "--init") {
    DO_INIT = true;
  } else if (a === "--list-collections") {
    LIST_COLLECTIONS = true;
  } else if (a === "init") {
    DO_INIT = true;
  } else if (a === "list-collections") {
    LIST_COLLECTIONS = true;
  } else if (a === "--help" || a === "-h") {
    printHelpAndExit();
  } else if (a.startsWith("--api-key=")) {
    API_KEY = a.split("=")[1] || null;
  } else if (a.startsWith("--base-url=")) {
    BASE_URL = a.split("=")[1] || null;
  } else {
    // ignore unknown, allow other flags in future
  }
}

if (!BASE_URL) {
  BASE_URL = "https://app.getoutline.com";
}

const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

function printHelpAndExit() {
  console.log(`
Usage:
  OUTLINE_API_KEY=... bun run sync.ts [options]

Options:
  --init                      Bootstrap pages.json + markdown files from a collection
  --collection-id=COL_ID      Use this collection id (required with --init unless OUTLINE_COLLECTION_ID set)
  --list-collections          List collections you have access to (prints id + name)
  --dry-run                   Print actions without writing anything
  --help                      Show this help
Examples:
  OUTLINE_API_KEY=... bun run sync.ts --list-collections
  OUTLINE_API_KEY=... bun run sync.ts --init --collection-id=abc-uuid
  OUTLINE_API_KEY=... bun run sync.ts                  # perform regular sync
  OUTLINE_API_KEY=... bun run sync.ts --dry-run
`);
  process.exit(0);
}

const ENV_COLLECTION = process.env.OUTLINE_COLLECTION_ID || null;
function resolveCollectionId(manifestCollectionId: string | null): string {
  if (CLI_COLLECTION_OVERRIDE) return CLI_COLLECTION_OVERRIDE;
  if (ENV_COLLECTION) return ENV_COLLECTION;
  if (manifestCollectionId) return manifestCollectionId;
  throw new Error(
    "No collection id found. Provide collectionId in pages.json, or set OUTLINE_COLLECTION_ID env var, or pass --collection-id=ID",
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function slugifyTitle(title: string) {
  return title
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036F]/g, "") // remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 120);
}

function getGitTimestampMs(filePath: string): number | null {
  try {
    const resolved = path.resolve(filePath);
    const out = Bun.spawnSync(
      ["git", "log", "-1", "--format=%ct", "--", resolved],
      { cwd: process.cwd() },
    );
    if (out.exitCode !== 0) {
      return null;
    }
    const txt = new TextDecoder().decode(out.stdout).trim();
    if (!txt) return null;
    const sec = Number(txt);
    if (Number.isNaN(sec)) return null;
    return sec * 1000;
  } catch {
    return null;
  }
}

async function getLocalTimestampMs(filePath: string): Promise<number> {
  const gitTs = getGitTimestampMs(filePath);
  if (gitTs) return gitTs;
  const st = await fs.stat(filePath);
  return st.mtimeMs;
}

async function safeWriteFile(filePath: string, content: string) {
  if (existsSync(filePath)) {
    const bak = `${filePath}.outline-sync.bak.${Date.now()}`;
    if (!DRY_RUN) {
      await fs.copyFile(filePath, bak);
    }
    console.log(`Backed up existing file to ${bak}`);
  } else {
    if (!DRY_RUN) {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
    }
  }
  if (!DRY_RUN) {
    await fs.writeFile(filePath, content, "utf8");
  } else {
    console.log(
      `[dry-run] would write file ${filePath} (${content.length} bytes)`,
    );
  }
}

async function outlineRequest(
  endpoint: string,
  body: any,
  retries = 3,
): Promise<any> {
  const url = `${BASE_URL}/api/${endpoint}`;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify(body),
      });
      if (res.status === 429) {
        const backoff = 1000 * (attempt + 1);
        console.warn(`Rate limited. Backing off ${backoff}ms`);
        await sleep(backoff);
        continue;
      }
      const json = await res.json();
      if (!res.ok) {
        console.error(
          `[Outline] ${res.status} ${endpoint} payload=`,
          body,
          "response=",
          json,
        );
        throw new Error(
          `Outline API error ${res.status}: ${JSON.stringify(json)}`,
        );
      }
      return json;
    } catch (err) {
      if (attempt === retries - 1) throw err;
      console.warn(
        `Request failed (attempt ${attempt + 1}): ${err}. Retrying...`,
      );
      await sleep(500 * (attempt + 1));
    }
  }
  throw new Error("outlineRequest: unreachable");
}

/* -------------------------
   API helpers for normal sync
   ------------------------- */

async function fetchOutlineInfo(documentId: string) {
  const payload = { id: documentId };
  const json = await outlineRequest("documents.info", payload);
  return json.data ?? null;
}

async function createOutlineDocument(
  title: string,
  text: string,
  collectionId: string,
  parentDocumentId: string | null,
) {
  const payload = {
    title,
    text,
    collectionId,
    parentDocumentId: parentDocumentId || null,
    publish: true,
  };
  if (DRY_RUN) {
    console.log(
      `[dry-run] would create doc title="${title}" collection=${collectionId} parent=${parentDocumentId}`,
    );
    return {
      id: `dry-run-${Math.random().toString(36).slice(2, 9)}`,
      title,
      text,
      collectionId,
      parentDocumentId,
    };
  }
  const json = await outlineRequest("documents.create", payload);
  return json.data;
}

async function updateOutlineDocument(
  id: string,
  title: string | undefined,
  text: string,
) {
  const payload: any = { id, text, publish: true };
  if (title) payload.title = title;
  if (DRY_RUN) {
    console.log(`[dry-run] would update doc id=${id} title=${title}`);
    return { id, title, text };
  }
  const json = await outlineRequest("documents.update", payload);
  return json.data;
}

/* -------------------------
   Init helpers
   ------------------------- */

/**
 * List Outline collections (paged)
 */
async function listCollections(): Promise<{ id: string; name: string }[]> {
  const out: { id: string; name: string }[] = [];
  let offset = 0;
  let limit = 100; // Outline max is 100
  while (true) {
    try {
      const json = await outlineRequest("collections.list", { offset, limit });
      const data = json.data || [];
      for (const c of data) out.push({ id: c.id, name: c.name });
      if (data.length < limit) break;
      offset += data.length;
    } catch (err: any) {
      // Defensive: if API complains about limit, retry once with limit=100
      const msg = err?.message ?? "";
      if (msg.includes("Pagination limit is too large") && limit !== 100) {
        console.warn(
          "Outline API complained about limit; retrying with limit=100",
        );
        limit = 100;
        continue;
      }
      throw err;
    }
  }
  return out;
}

/**
 * List all documents in a collection (paged).
 * Returns array of documents { id, title, text, parentDocumentId, updatedAt }
 */
async function listDocumentsInCollection(collectionId: string): Promise<any[]> {
  const out: any[] = [];
  let offset = 0;
  let limit = 100; // must be <= 100 per Outline API
  while (true) {
    try {
      const json = await outlineRequest("documents.list", {
        collectionId,
        offset,
        limit,
      });
      const data = json.data || [];
      for (const d of data) out.push(d);
      if (data.length < limit) break;
      offset += data.length;
    } catch (err: any) {
      const msg = err?.message ?? "";
      if (msg.includes("Pagination limit is too large") && limit !== 100) {
        console.warn(
          "Outline API complained about limit; retrying with limit=100",
        );
        limit = 100;
        continue;
      }
      throw err;
    }
  }
  return out;
}

/**
 * Write docs to disk and return pages array (with file paths set)
 */
async function materializeDocsToFiles(
  docs: any[],
  destDir = "docs",
): Promise<PageEntry[]> {
  // docs is flat array with id/title/text/parentDocumentId (or parentId)
  const idToFilename = new Map<string, string>();
  const used = new Set<string>();

  // 1) assign unique filenames and write files
  for (const d of docs) {
    const slug = slugifyTitle(d.title || "untitled");
    let candidate = `${slug}.md`;
    // ensure uniqueness
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

    const fullPath = path.join(destDir, candidate);
    idToFilename.set(d.id, fullPath);

    const content = d.text ?? `# ${d.title}\n\n`;
    if (!DRY_RUN) {
      await fs.mkdir(destDir, { recursive: true });
      await fs.writeFile(fullPath, content, "utf8");
    } else {
      console.log(
        `[dry-run] would write ${fullPath} (${content.length} bytes)`,
      );
    }
  }

  // 2) build nodes map (all nodes present before attaching children)
  const map = new Map<string, PageEntry & { raw?: any }>();
  for (const d of docs) {
    map.set(d.id, {
      title: d.title,
      file:
        idToFilename.get(d.id) ||
        path.join(destDir, `${slugifyTitle(d.title)}.md`),
      id: d.id,
      children: [],
      raw: d,
    } as any);
  }

  // 3) attach children — robust to both parentDocumentId and parentId
  const roots: (PageEntry & { raw?: any })[] = [];
  for (const node of map.values()) {
    const raw = node.raw || {};
    const parentId = raw.parentDocumentId ?? raw.parentId ?? null;
    if (parentId && map.has(parentId)) {
      map.get(parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  // 4) strip internal `raw` and return tree recursively
  function strip(n: any): PageEntry {
    return {
      title: n.title,
      file: n.file,
      id: n.id,
      children: (n.children || []).map(strip),
    };
  }
  return roots.map(strip);
}

/* -------------------------
   Existing sync logic (unchanged)
   ------------------------- */

async function persistManifest(manifest: Manifest, filePath: string) {
  if (DRY_RUN) {
    console.log(`[dry-run] would persist manifest to ${filePath}`);
    return;
  }
  await fs.writeFile(
    filePath,
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
}

async function loadManifest(filePath: string): Promise<Manifest> {
  if (!existsSync(filePath)) {
    throw new Error(
      `Manifest ${filePath} not found. Create ${filePath} with structure described in README.`,
    );
  }
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as Manifest;
}

async function syncPage(
  manifest: Manifest,
  page: PageEntry,
  parentId: string | null,
  manifestPath: string,
  resolvedCollectionId: string,
) {
  const filePath = page.file;
  const absPath = path.resolve(filePath);
  const fileExists = existsSync(absPath);

  let localTs = 0;
  if (fileExists) {
    try {
      localTs = await getLocalTimestampMs(absPath);
    } catch (err) {
      console.warn(`Couldn't stat file ${absPath}: ${err}`);
      localTs = 0;
    }
  }

  if (page.id) {
    let doc: any = null;
    try {
      doc = await fetchOutlineInfo(page.id);
    } catch (err) {
      console.error(
        `Failed to fetch Outline info for ${page.title} (${page.id}): ${err}`,
      );
      return;
    }

    if (!doc) {
      console.log(
        `Outline doc ${page.id} not found - will create as new under collection ${resolvedCollectionId}.`,
      );
      page.id = null;
    } else {
      const remoteUpdatedAt = doc.updatedAt
        ? new Date(doc.updatedAt).getTime()
        : 0;

      if (!fileExists) {
        console.log(
          `[PULL] Local file missing for "${page.title}" -> fetching remote`,
        );
        await safeWriteFile(absPath, doc.text || "");
      } else if (localTs > remoteUpdatedAt + 500) {
        console.log(
          `[PUSH] Local newer for "${page.title}" -> updating Outline`,
        );
        try {
          const content = await fs.readFile(absPath, "utf8");
          await updateOutlineDocument(page.id, page.title, content);
          console.log(`  Updated Outline doc ${page.id}`);
        } catch (err) {
          console.error(`  Failed to push ${page.title}: ${err}`);
        }
      } else if (remoteUpdatedAt > localTs + 500) {
        console.log(
          `[PULL] Outline newer for "${page.title}" -> overwriting local file`,
        );
        try {
          await safeWriteFile(absPath, doc.text || "");
          console.log(`  Wrote local file ${absPath}`);
        } catch (err) {
          console.error(`  Failed to write file ${absPath}: ${err}`);
        }
      } else {
        console.log(`[SKIP] No changes for "${page.title}"`);
      }
    }
  }

  if (!page.id) {
    if (!existsSync(absPath)) {
      await fs.mkdir(path.dirname(absPath), { recursive: true });
      await fs.writeFile(absPath, `# ${page.title}\n\n`, "utf8");
      console.log(`Created local placeholder file ${absPath}`);
    }
    const content = await fs.readFile(absPath, "utf8");
    try {
      const created = await createOutlineDocument(
        page.title,
        content,
        resolvedCollectionId,
        parentId,
      );
      if (created?.id) {
        page.id = created.id;
        console.log(
          `Created Outline doc "${page.title}" id=${page.id} in collection ${resolvedCollectionId}`,
        );
        await persistManifest(manifest, manifestPath);
      } else {
        console.warn(`Create returned no id for "${page.title}"`);
      }
    } catch (err) {
      console.error(`Failed to create Outline doc for "${page.title}": ${err}`);
    }
  }

  const nextParentId = page.id || parentId;
  if (page.children?.length) {
    for (const child of page.children) {
      await syncPage(
        manifest,
        child,
        nextParentId,
        manifestPath,
        resolvedCollectionId,
      );
    }
  }
}

/* -------------------------
   Main
   ------------------------- */

async function main() {
  if (LIST_COLLECTIONS) {
    console.log("Fetching collections...");
    try {
      const cols = await listCollections();
      for (const c of cols) {
        console.log(`${c.id}\t${c.name}`);
      }
    } catch (err) {
      console.error(`Failed to list collections: ${err}`);
    }
    return;
  }

  if (DO_INIT) {
    const collectionId = CLI_COLLECTION_OVERRIDE || ENV_COLLECTION;
    if (!collectionId) {
      console.error(
        "Init requires a collection id. Provide with --collection-id=ID or set OUTLINE_COLLECTION_ID env var.",
      );
      process.exit(1);
    }
    console.log(
      `Bootstrapping manifest from collection ${collectionId} (dry-run=${DRY_RUN})...`,
    );
    try {
      const docs = await listDocumentsInCollection(collectionId);
      console.log(`Fetched ${docs.length} documents from Outline.`);
      const roots = await materializeDocsToFiles(docs, "docs");
      const manifest: Manifest = {
        collectionId,
        pages: roots,
      };
      await persistManifest(manifest, MANIFEST);
      console.log(`Wrote manifest to ${MANIFEST} (pages saved into docs/).`);
    } catch (err) {
      console.error(`Init failed: ${err}`);
    }
    return;
  }

  // normal sync flow
  // if manifest missing, error and hint to use --init
  if (!existsSync(MANIFEST)) {
    console.error(
      `Manifest ${MANIFEST} not found. Run with --init --collection-id=COLLECTION_ID to bootstrap.`,
    );
    process.exit(1);
  }
  const manifest = await loadManifest(MANIFEST);
  const effectiveCollectionId = resolveCollectionId(
    manifest.collectionId ?? null,
  );
  console.log(`Syncing into single collection: ${effectiveCollectionId}`);
  if (DRY_RUN)
    console.log(
      "Running in dry-run mode; no destructive actions will be performed.",
    );

  for (const p of manifest.pages) {
    await syncPage(
      manifest,
      p,
      null,
      path.resolve(MANIFEST),
      effectiveCollectionId,
    );
  }
  await persistManifest(manifest, path.resolve(MANIFEST));
  console.log("Sync complete.");
}

main();
