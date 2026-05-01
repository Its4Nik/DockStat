import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { watch } from "chokidar"
import fm from "front-matter"
import YAML from "yaml"
import { OutlineClient, OutlineApiError } from "./client"
import {
  c,
  icon,
  formatStatus,
  formatTable,
  formatDate,
  formatDuration,
  formatBytes,
  truncate,
  Spinner,
  progressBar,
} from "./ui"
import type {
  Document,
  DocumentMetadata,
  DocumentNode,
  OutlineConfig,
  ParsedDocument,
  SyncResult,
  SyncStatus,
  SyncSummary,
} from "./types"

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseToDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null
  if (value instanceof Date) return value
  if (typeof value === "number") return new Date(value)
  if (typeof value === "string") {
    const t = Date.parse(value)
    if (Number.isNaN(t)) return null
    return new Date(t)
  }
  return null
}

function sanitizePath(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, "-")
    .replace(/\s+/g, "-")
    .toLowerCase()
}

function parseFrontmatter(content: string): ParsedDocument | null {
  try {
    const parsed = fm<DocumentMetadata>(content)
    if (!parsed.attributes?.id) return null
    return {
      body: parsed.body,
      metadata: parsed.attributes,
      raw: content,
    }
  } catch {
    return null
  }
}

// ── OutlineSync ─────────────────────────────────────────────────────────────

export class OutlineSync {
  private client: OutlineClient
  private outputDir: string
  private customPaths: Record<string, string>
  private includeCollections?: string[]
  private excludeCollections?: string[]
  private verbose: boolean
  private dryRun: boolean
  private createMissing: boolean
  private defaultCollectionId?: string

  /** Maps absolute file path → metadata as seen during syncDown (the cache). */
  private documentMap: Map<string, DocumentMetadata> = new Map()

  /** Accumulated sync results for the current operation. */
  private results: SyncResult[] = []

  constructor(config: OutlineConfig, options?: { verbose?: boolean }) {
    this.client = new OutlineClient(config, options?.verbose ?? config.verbose)
    this.outputDir = config.outputDir || "./outline-docs"
    this.customPaths = config.customPaths ?? {}
    this.includeCollections = config.includeCollections
    this.excludeCollections = config.excludeCollections
    this.verbose = Boolean(options?.verbose ?? config.verbose)
    this.dryRun = config.dryRun ?? false
    this.createMissing = config.createMissing ?? false
    this.defaultCollectionId = config.defaultCollectionId

    this.trace("OutlineSync initialized", {
      createMissing: this.createMissing,
      customPathsCount: Object.keys(this.customPaths).length,
      defaultCollectionId: this.defaultCollectionId,
      dryRun: this.dryRun,
      outputDir: this.outputDir,
    })
  }

  // ── Trace ──────────────────────────────────────────────────────────────

  private trace(message: string, meta?: unknown): void {
    if (!this.verbose) return
    const ts = new Date().toISOString()
    const prefix = c.dim(`[trace ${ts}]`)
    if (meta === undefined) {
      console.log(`${prefix} ${message}`)
      return
    }
    console.log(`${prefix} ${message}`, JSON.stringify(meta, null, 2))
  }

  // ── Collection filtering ───────────────────────────────────────────────

  private shouldIncludeCollection(id: string, name: string): boolean {
    if (this.includeCollections?.length) {
      return this.includeCollections.some(
        (c) => c === id || c.toLowerCase() === name.toLowerCase(),
      )
    }
    if (this.excludeCollections?.length) {
      return !this.excludeCollections.some(
        (c) => c === id || c.toLowerCase() === name.toLowerCase(),
      )
    }
    return true
  }

  // ── Document tree ──────────────────────────────────────────────────────

  private buildDocumentTree(documents: Document[]): DocumentNode[] {
    const docMap = new Map<string, DocumentNode>()
    const roots: DocumentNode[] = []

    for (const doc of documents) {
      docMap.set(doc.id, { children: [], document: doc })
    }
    for (const doc of documents) {
      const node = docMap.get(doc.id)!
      if (doc.parentDocumentId && docMap.has(doc.parentDocumentId)) {
        docMap.get(doc.parentDocumentId)!.children.push(node)
      } else {
        roots.push(node)
      }
    }

    return roots
  }

  // ── Path resolution ────────────────────────────────────────────────────

  private getDocumentPath(
    doc: Document,
    collectionName: string,
    parentPath?: string,
  ): { dirPath: string; filePath: string; isCustomPath: boolean } {
    const customPath = this.customPaths[doc.id]
    if (customPath) {
      const resolvedPath = customPath.startsWith("..")
        ? join(process.cwd(), customPath)
        : join(this.outputDir, customPath)

      if (customPath.toLowerCase().endsWith(".md")) {
        return { dirPath: join(resolvedPath, ".."), filePath: resolvedPath, isCustomPath: true }
      }
      return { dirPath: resolvedPath, filePath: join(resolvedPath, "README.md"), isCustomPath: true }
    }

    const collectionPath = sanitizePath(collectionName)
    const docPath = sanitizePath(doc.title)

    if (!parentPath) {
      if (docPath === collectionPath) {
        const resolvedPath = join(this.outputDir, collectionPath)
        return { dirPath: resolvedPath, filePath: join(resolvedPath, "README.md"), isCustomPath: false }
      }
      const resolvedPath = join(this.outputDir, collectionPath, docPath)
      return { dirPath: resolvedPath, filePath: join(resolvedPath, "README.md"), isCustomPath: false }
    }

    const resolvedPath = join(parentPath, docPath)
    return { dirPath: resolvedPath, filePath: join(resolvedPath, "README.md"), isCustomPath: false }
  }

  // ── Frontmatter ────────────────────────────────────────────────────────

  private createFrontMatter(doc: Document): string {
    const metadata: DocumentMetadata = {
      collectionId: doc.collectionId,
      id: doc.id,
      parentDocumentId: doc.parentDocumentId,
      title: doc.title,
      updatedAt: new Date(doc.updatedAt).toISOString(),
      urlId: doc.urlId,
    }
    return `---\n${YAML.stringify(metadata)}---\n\n`
  }

  // ── File scanning ──────────────────────────────────────────────────────

  private async getAllMarkdownFiles(dir: string): Promise<string[]> {
    const files: string[] = []
    try {
      const entries = await readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = resolve(join(dir, entry.name))
        if (entry.isDirectory()) {
          files.push(...(await this.getAllMarkdownFiles(fullPath)))
        } else if (entry.name.endsWith(".md")) {
          files.push(fullPath)
        }
      }
    } catch {
      // directory not found
    }
    return files
  }

  // ── Result tracking ────────────────────────────────────────────────────

  private addResult(result: SyncResult): void {
    this.results.push(result)
  }

  private getSummary(): SyncSummary {
    const counts: Record<string, number> = {}
    for (const r of this.results) {
      counts[r.status] = (counts[r.status] ?? 0) + 1
    }
    return {
      created: counts["created"] ?? 0,
      errors: counts["error"] ?? 0,
      newFiles: counts["new"] ?? 0,
      pulled: counts["pulled"] ?? 0,
      pushed: counts["pushed"] ?? 0,
      skipped: counts["skipped"] ?? 0,
      synced: counts["synced"] ?? 0,
      total: this.results.length,
      durationMs: 0, // set by caller
    }
  }

  // ── Display helpers ────────────────────────────────────────────────────

  private printSyncTable(): void {
    if (this.results.length === 0) return

    const columns = [
      { key: "status", header: "Status", width: 12, align: "left" as const },
      { key: "document", header: "Document", width: 32, align: "left" as const },
      { key: "localDate", header: "Local Date", width: 22, align: "left" as const },
      { key: "remoteDate", header: "Remote Date", width: 22, align: "left" as const },
      { key: "source", header: "Source", width: 12, align: "left" as const },
      { key: "detail", header: "Detail", width: 20, align: "left" as const },
    ]

    const rows = this.results.map((r) => ({
      detail: truncate(r.message ?? "", 20),
      document: truncate(r.title, 32),
      localDate: r.localDate ? formatDate(r.localDate) : c.dim("\u2014"),
      remoteDate: r.remoteDate ? formatDate(r.remoteDate) : c.dim("\u2014"),
      source: r.source ?? c.dim("\u2014"),
      status: formatStatus(r.status),
    }))

    console.log("\n" + formatTable(rows, columns) + "\n")
  }

  private printSummary(startTime: number): void {
    const summary = this.getSummary()
    summary.durationMs = performance.now() - startTime

    console.log(c.bold("\n  Summary"))
    console.log(c.dim("  " + "\u2500".repeat(40)))

    const lines = [
      ["Total documents", String(summary.total)],
      ["Synced (no change)", c.green(String(summary.synced))],
      ["Pulled from remote", c.blue(String(summary.pulled))],
      ["Pushed to remote", c.cyan(String(summary.pushed))],
      ["Created on remote", c.green(String(summary.created))],
      ["New (local only)", c.yellow(String(summary.newFiles))],
      ["Errors", summary.errors > 0 ? c.red(String(summary.errors)) : String(summary.errors)],
      ["Skipped", c.dim(String(summary.skipped))],
      ["Duration", formatDuration(summary.durationMs)],
      ["API calls", String(this.client.getRequestCount())],
    ]

    for (const [label, value] of lines) {
      console.log(`  ${c.dim(label.padEnd(20))} ${value}`)
    }
    console.log()

    if (summary.errors > 0) {
      const errored = this.results.filter((r) => r.status === "error")
      console.log(c.red(`  ${icon.cross} ${summary.errors} error(s):`))
      for (const r of errored) {
        console.log(c.red(`    ${icon.arrow} ${truncate(r.title, 40)}:
${r.message ?? "unknown"}`))
      }
      console.log()
    }
  }

  // ── syncDown (pull from Outline) ───────────────────────────────────────

  async syncDown(): Promise<void> {
    const startTime = performance.now()
    console.log(`\n${c.bold(c.blue(`${icon.pull}  Syncing from Outline to local`))}`)
    if (this.dryRun) {
      console.log(c.yellow(`${icon.warn}  Dry run \u2013 no files will be written`))
    }

    this.results = []
    this.documentMap.clear()

    const spinner = new Spinner("Fetching collections\u2026").start()

    const allCollections = await this.client.getCollections()
    const collections = allCollections.filter((c) => this.shouldIncludeCollection(c.id, c.name))

    spinner.stop()

    if (collections.length === 0) {
      console.log(c.yellow(`\n  ${icon.warn}  No collections match your filters`))
      return
    }

    console.log(
      c.dim(`  Found ${collections.length} collection${collections.length !== 1 ? "s" : ""}`) +
      (this.includeCollections || this.excludeCollections
        ? c.dim(` (filtered from ${allCollections.length})`)
        : ""),
    )

    let docCount = 0
    for (const collection of collections) {
      console.log(`\n  ${c.bold(`${icon.folder} ${collection.name}`)}`)

      const docsSpinner = new Spinner(`  Fetching documents\u2026`).start()
      const documents = await this.client.getDocuments(collection.id)
      docsSpinner.stop()

      const tree = this.buildDocumentTree(documents)
      let pulled = 0

      for (const node of tree) {
        pulled += await this.syncDocumentNode(node, collection.name, undefined, 0)
      }

      docCount += pulled
    }

    this.printSyncTable()
    this.printSummary(startTime)

    if (!this.dryRun && docCount > 0) {
      console.log(c.green(`  ${icon.check} Sync complete!`))
    }
  }

  private async syncDocumentNode(
    node: DocumentNode,
    collectionName: string,
    parentPath?: string,
    depth = 0,
  ): Promise<number> {
    const doc = node.document
    const indent = "    " + "  ".repeat(depth)

    // Fetch full document content
    const fullDoc = await this.client.getDocument(doc.id)
    const { dirPath, filePath } = this.getDocumentPath(fullDoc, collectionName, parentPath)

    const normalizedPath = resolve(filePath)

    // Check if the file already exists and is up-to-date
    let existingParsed: ParsedDocument | null = null
    try {
      const existingContent = await readFile(normalizedPath, "utf-8")
      existingParsed = parseFrontmatter(existingContent)
    } catch {
      // file doesn't exist yet
    }

    const remoteDate = parseToDate(fullDoc.updatedAt) || new Date()
    const isUpToDate = existingParsed
      ? parseToDate(existingParsed.metadata.updatedAt)?.getTime() === remoteDate.getTime()
      : false

    if (isUpToDate && existingParsed) {
      // File is already synced
      this.documentMap.set(normalizedPath, {
        collectionId: fullDoc.collectionId,
        id: fullDoc.id,
        parentDocumentId: fullDoc.parentDocumentId,
        title: fullDoc.title,
        updatedAt: fullDoc.updatedAt,
        urlId: fullDoc.urlId,
      })

      this.addResult({
        documentId: fullDoc.id,
        filePath: normalizedPath,
        localDate: parseToDate(existingParsed.metadata.updatedAt) ?? remoteDate,
        remoteDate,
        source: "frontmatter",
        status: "synced",
        title: fullDoc.title,
      })

      console.log(`${indent}${c.dim(`${icon.check} ${fullDoc.title}`)}`)

      // Still process children
      let childCount = 0
      for (const child of node.children) {
        childCount += await this.syncDocumentNode(child, collectionName, dirPath, depth + 1)
      }
      return childCount
    }

    // Write the file
    if (!this.dryRun) {
      await mkdir(dirPath, { recursive: true })
      const content = this.createFrontMatter(fullDoc) + fullDoc.text
      await writeFile(filePath, content, "utf-8")
    }

    this.documentMap.set(normalizedPath, {
      collectionId: fullDoc.collectionId,
      id: fullDoc.id,
      parentDocumentId: fullDoc.parentDocumentId,
      title: fullDoc.title,
      updatedAt: fullDoc.updatedAt,
      urlId: fullDoc.urlId,
    })

    this.addResult({
      documentId: fullDoc.id,
      filePath: normalizedPath,
      localDate: remoteDate,
      remoteDate,
      source: "remote",
      status: "pulled",
      title: fullDoc.title,
    })

    console.log(`${indent}${c.blue(`${icon.pull} ${fullDoc.title}`)}`)

    let count = 1
    for (const child of node.children) {
      count += await this.syncDocumentNode(child, collectionName, dirPath, depth + 1)
    }
    return count
  }

  // ── syncUp (push single file to Outline) ───────────────────────────────

  async syncUp(filePath: string): Promise<SyncResult> {
    this.trace("syncUp: starting", { filePath })

    const content = await readFile(filePath, "utf-8")
    const parsed = parseFrontmatter(content)

    if (!parsed) {
      this.trace("syncUp: skipping file without valid frontmatter", { filePath })
      const result: SyncResult = {
        documentId: "",
        filePath,
        status: "skipped",
        title: filePath.split("/").pop() ?? filePath,
        message: "No valid frontmatter ID",
      }
      this.addResult(result)
      return result
    }

    const { id, title, collectionId, parentDocumentId } = parsed.metadata
    const body = parsed.body

    this.trace("syncUp: pushing document", {
      id,
      textLength: body.length,
      title,
    })

    if (this.dryRun) {
      const result: SyncResult = {
        documentId: id,
        filePath,
        status: "pushed",
        title: title || filePath,
        message: "Dry run \u2013 not actually pushed",
      }
      this.addResult(result)
      return result
    }

    try {
      // First, verify the document exists on Outline before trying to update.
      // This prevents 400 errors from sending an invalid or stale ID.
      const existing = await this.client.documentExists(id)

      if (existing) {
        // Document exists – update it
        const updated = await this.client.updateDocument(id, body, {
          title: title || undefined,
          publish: true,
        })

        // Update the local frontmatter with the new updatedAt
        const newFrontMatter = this.createFrontMatter(updated)
        const newContent = newFrontMatter + body
        await writeFile(filePath, newContent, "utf-8")

        const result: SyncResult = {
          documentId: id,
          filePath,
          localDate: new Date(),
          remoteDate: parseToDate(updated.updatedAt) ?? new Date(),
          source: "frontmatter",
          status: "pushed",
          title: updated.title,
        }
        this.addResult(result)
        return result
      } else {
        // Document doesn't exist on remote – create it if createMissing is enabled.
        if (this.createMissing) {
          const collectionId = parsed.metadata.collectionId || this.defaultCollectionId

          if (!collectionId) {
            const result: SyncResult = {
              documentId: id,
              filePath,
              status: "error",
              title: title || filePath,
              message: "Document not found on Outline and no collectionId specified (use --default-collection or add collectionId to frontmatter)",
            }
            this.addResult(result)
            return result
          }

          this.trace("syncUp: document not found, creating new document", {
            collectionId,
            title: title || filePath,
          })

          const created = await this.client.createDocument({
            collectionId,
            title: title || filePath.split("/").pop() || "Untitled",
            text: body,
            parentDocumentId: parsed.metadata.parentDocumentId || undefined,
            publish: true,
          })

          // Update the local frontmatter with the NEW document ID and timestamps
          const newMetadata: DocumentMetadata = {
            collectionId: created.collectionId,
            id: created.id,
            parentDocumentId: created.parentDocumentId,
            title: created.title,
            updatedAt: created.updatedAt,
            urlId: created.urlId,
          }
          const newFrontMatter = `---\n${YAML.stringify(newMetadata)}---\n\n`
          const newContent = newFrontMatter + body
          await writeFile(filePath, newContent, "utf-8")

          // Update the document map with the new ID
          this.documentMap.set(resolve(filePath), newMetadata)

          const result: SyncResult = {
            documentId: created.id,
            filePath,
            localDate: new Date(),
            remoteDate: parseToDate(created.updatedAt) ?? new Date(),
            source: "frontmatter",
            status: "created",
            title: created.title,
            message: `Created as new document (old ID ${id} was not found on Outline)`,
          }
          this.addResult(result)
          return result
        } else {
          // Not creating – just report it as not-found.
          const result: SyncResult = {
            documentId: id,
            filePath,
            status: "not-found",
            title: title || filePath,
            message: `Document ${id} not found on Outline (may have been deleted; use --create-missing to recreate)`,
          }
          this.addResult(result)
          return result
        }
      }
    } catch (err) {
      const message =
        err instanceof OutlineApiError
          ? `${err.code ?? "api_error"}: ${err.message}`
          : err instanceof Error
            ? err.message
            : String(err)

      this.trace("syncUp: error pushing document", { error: message, id, filePath })

      const result: SyncResult = {
        documentId: id,
        filePath,
        status: "error",
        title: title || filePath,
        message,
      }
      this.addResult(result)
      return result
    }
  }

  // ── watch mode ─────────────────────────────────────────────────────────

  async watch(): Promise<void> {
    console.log(`\n${c.bold(c.cyan(`${icon.eyes}  Watching for changes`))}`)
    console.log(c.dim(`  Directory: ${this.outputDir}`))

    await this.syncDown()

    const watchPattern = join(this.outputDir, "**/*.md")

    const watcher = watch(watchPattern, {
      ignoreInitial: true,
      persistent: true,
    })

    watcher.on("change", async (path) => {
      this.trace("watch: file change detected", { path })
      try {
        const result = await this.syncUp(path)
        if (result.status === "pushed") {
          console.log(`  ${c.cyan(`${icon.push} ${result.title}`)}`)
        } else if (result.status === "error") {
          console.error(`  ${c.red(`${icon.cross} ${result.title}: ${result.message}`)}`)
        }
      } catch (error) {
        console.error(`  ${c.red(`${icon.cross} Error syncing ${path}:`)} ${error}`)
      }
    })

    watcher.on("add", (path) => {
      this.trace("watch: new file detected", { path })
    })

    watcher.on("unlink", (path) => {
      this.trace("watch: file deleted", { path })
    })

    console.log(c.dim(`  ${icon.check} Watching for changes. Press Ctrl+C to stop.\n`))
  }

  // ── CI sync ────────────────────────────────────────────────────────────

  async ciSync(): Promise<void> {
    const startTime = performance.now()
    console.log(`\n${c.bold(c.magenta(`${icon.sync}  CI/CD Sync`))}`)
    if (this.dryRun) {
      console.log(c.yellow(`  ${icon.warn}  Dry run \u2013 no changes will be pushed`))
    }

    this.results = []
    this.documentMap.clear()

    // Phase 1: Pull from Outline to build cache
    console.log(c.dim("\n  Phase 1: Pulling from Outline\u2026"))
    await this.performSyncDown()

    // Phase 2: Detect changes (compare local against remote)
    console.log(c.dim("\n  Phase 2: Detecting local changes\u2026"))
    const localFiles = await this.getAllMarkdownFiles(this.outputDir)

    this.trace("ciSync: scanning local files", {
      documentMapSize: this.documentMap.size,
      localFilesCount: localFiles.length,
    })

    for (const file of localFiles) {
      const normalized = resolve(file)
      const content = await readFile(normalized, "utf-8")
      const parsed = parseFrontmatter(content)

      if (!parsed) {
        this.trace("ciSync: skipping file without frontmatter", { file: normalized })
        continue
      }

      const title = parsed.metadata.title || normalized.split("/").pop() || normalized
      const cached = this.documentMap.get(normalized)

      if (!cached) {
        // File exists locally but wasn't synced (could be new or from a
        // different collection).  We need to check whether the document
        // actually exists on Outline before deciding what to do.
        this.trace("ciSync: file not in cache, checking remote", { file: normalized })

        if (!this.dryRun) {
          const remoteDoc = await this.client.documentExists(parsed.metadata.id)
          if (remoteDoc) {
            // Document exists on remote – compare timestamps
            const remoteTime = parseToDate(remoteDoc.updatedAt) || new Date(0)
            const localTime = parseToDate(parsed.metadata.updatedAt)
            const fileStat = await stat(normalized)
            const effectiveLocal = localTime ?? fileStat.mtime
            const source = localTime ? "frontmatter" : "mtime"

            if (effectiveLocal.getTime() > remoteTime.getTime()) {
              this.addResult({
                documentId: parsed.metadata.id,
                filePath: normalized,
                localDate: effectiveLocal,
                remoteDate: remoteTime,
                source,
                status: "pushed",
                title,
              })
            } else {
              this.addResult({
                documentId: parsed.metadata.id,
                filePath: normalized,
                localDate: effectiveLocal,
                remoteDate: remoteTime,
                source,
                status: "synced",
                title,
              })
            }
          } else {
            // Document does not exist on remote – create if createMissing enabled
            if (this.createMissing) {
              const collectionId = parsed.metadata.collectionId || this.defaultCollectionId
              if (!collectionId) {
                this.addResult({
                  documentId: parsed.metadata.id,
                  filePath: normalized,
                  status: "error",
                  title,
                  message: "Document not found on Outline and no collectionId (use --default-collection or frontmatter)",
                })
              } else {
                this.addResult({
                  documentId: parsed.metadata.id,
                  filePath: normalized,
                  status: "not-found",
                  title,
                  message: `Will create in collection ${collectionId}`,
                })
              }
            } else {
              this.addResult({
                documentId: parsed.metadata.id,
                filePath: normalized,
                status: "not-found",
                title,
                message: "Document not found on Outline (deleted or invalid ID; use --create-missing to recreate)",
              })
            }
          }
        } else {
          this.addResult({
            documentId: parsed.metadata.id,
            filePath: normalized,
            status: "new",
            title,
            message: "Not in cache (dry run)",
          })
        }
        continue
      }

      // File IS in cache – compare against the cached timestamp
      const cachedTime = parseToDate(cached.updatedAt) || new Date(0)
      const localTime = parseToDate(parsed.metadata.updatedAt)
      const fileStat = await stat(normalized)
      const effectiveLocal = localTime ?? fileStat.mtime
      const source = localTime ? "frontmatter" : "mtime"

      if (effectiveLocal.getTime() > cachedTime.getTime()) {
        this.addResult({
          documentId: parsed.metadata.id,
          filePath: normalized,
          localDate: effectiveLocal,
          remoteDate: cachedTime,
          source,
          status: "pushed",
          title,
        })
      } else {
        this.addResult({
          documentId: parsed.metadata.id,
          filePath: normalized,
          localDate: effectiveLocal,
          remoteDate: cachedTime,
          source,
          status: "synced",
          title,
        })
      }
    }

    // Phase 3: Display detected changes
    const toPush = this.results.filter((r) => r.status === "pushed")
    const synced = this.results.filter((r) => r.status === "synced")
    const notFound = this.results.filter((r) => r.status === "not-found")

    this.printSyncTable()

    if (this.createMissing && notFound.length > 0) {
      console.log(
        c.green(`\n  ${icon.star} ${notFound.length} document${notFound.length !== 1 ? "s" : ""} not found on Outline – will be created (--create-missing)`),
      )
    }

    if (toPush.length === 0 && (!this.createMissing || notFound.length === 0)) {
      console.log(c.green(`\n  ${icon.check} All documents are in sync!`))
      this.printSummary(startTime)
      return
    }

    // Phase 4: Push changed files + create missing documents
    const itemsToSync = this.createMissing
      ? [...toPush, ...notFound]
      : toPush

    if (itemsToSync.length === 0) {
      console.log(c.green(`\n  ${icon.check} All documents are in sync!`))
      this.printSummary(startTime)
      return
    }

    const pushLabel = this.createMissing && notFound.length > 0
      ? `Syncing ${toPush.length} update${toPush.length !== 1 ? "s" : ""} + ${notFound.length} new document${notFound.length !== 1 ? "s" : ""} to Outline`
      : `Pushing ${toPush.length} changed file${toPush.length !== 1 ? "s" : ""} to Outline`

    console.log(
      c.bold(`  ${icon.push}  ${pushLabel}\u2026`),
    )

    // Reset results for push phase
    this.results = []

    for (let i = 0; i < itemsToSync.length; i++) {
      const item = itemsToSync[i]
      process.stdout.write(
        `\r  ${progressBar(i, itemsToSync.length)} ${truncate(item.title, 40)}`,
      )
      await this.syncUp(item.filePath)
    }
    process.stdout.write(`\r${" ".repeat(80)}\r`)

    // Re-add the synced items that were already fine
    for (const s of synced) {
      this.addResult(s)
    }

    this.printSummary(startTime)

    const summary = this.getSummary()
    if (summary.errors === 0) {
      console.log(c.green(`  ${icon.check} CI/CD sync complete!`))
    } else {
      console.log(c.yellow(`  ${icon.warn} CI/CD sync completed with ${summary.errors} error(s)`))
    }
  }

  /** Internal syncDown that doesn't print its own summary (used by ciSync). */
  private async performSyncDown(): Promise<void> {
    const allCollections = await this.client.getCollections()
    const collections = allCollections.filter((c) => this.shouldIncludeCollection(c.id, c.name))

    if (collections.length === 0) return

    for (const collection of collections) {
      const documents = await this.client.getDocuments(collection.id)
      const tree = this.buildDocumentTree(documents)

      for (const node of tree) {
        await this.pullDocumentNode(node, collection.name)
      }
    }
  }

  /** Pull documents silently (for CI mode) – just builds the cache. */
  private async pullDocumentNode(node: DocumentNode, collectionName: string): Promise<void> {
    const doc = node.document

    // We need the full doc to get updatedAt, but we can optimize by checking
    // if we already have this file cached
    const { dirPath, filePath } = this.getDocumentPath(doc, collectionName)
    const normalizedPath = resolve(filePath)

    // Check if we already have this file with matching timestamp
    let existingParsed: ParsedDocument | null = null
    try {
      const existingContent = await readFile(normalizedPath, "utf-8")
      existingParsed = parseFrontmatter(existingContent)
    } catch {
      // doesn't exist
    }

    // If the file exists and has the same updatedAt as the list entry, skip the full fetch
    const listUpdated = parseToDate(doc.updatedAt)
    const cachedUpdated = existingParsed ? parseToDate(existingParsed.metadata.updatedAt) : null

    if (existingParsed && listUpdated && cachedUpdated &&
      listUpdated.getTime() === cachedUpdated.getTime()) {
      // File is already up to date, just add to cache
      this.documentMap.set(normalizedPath, {
        collectionId: doc.collectionId,
        id: doc.id,
        parentDocumentId: doc.parentDocumentId,
        title: doc.title,
        updatedAt: doc.updatedAt,
        urlId: doc.urlId,
      })

      // Still process children
      for (const child of node.children) {
        await this.pullDocumentNode(child, collectionName)
      }
      return
    }

    // Need to fetch full document
    const fullDoc = await this.client.getDocument(doc.id)

    if (!this.dryRun) {
      await mkdir(dirPath, { recursive: true })
      const content = this.createFrontMatter(fullDoc) + fullDoc.text
      await writeFile(filePath, content, "utf-8")
    }

    this.documentMap.set(normalizedPath, {
      collectionId: fullDoc.collectionId,
      id: fullDoc.id,
      parentDocumentId: fullDoc.parentDocumentId,
      title: fullDoc.title,
      updatedAt: fullDoc.updatedAt,
      urlId: fullDoc.urlId,
    })

    for (const child of node.children) {
      await this.pullDocumentNode(child, collectionName)
    }
  }

  // ── push command ───────────────────────────────────────────────────────

  async push(force = false): Promise<void> {
    const startTime = performance.now()
    console.log(`\n${c.bold(c.cyan(`${icon.push}  Pushing to Outline`))}`)
    if (this.dryRun) {
      console.log(c.yellow(`  ${icon.warn}  Dry run \u2013 no changes will be pushed`))
    }

    this.results = []

    if (force) {
      console.log(c.yellow(`  ${icon.warn}  Force mode \u2013 pushing all files with IDs`))
      const files = await this.getAllMarkdownFiles(this.outputDir)

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        process.stdout.write(`\r  ${progressBar(i, files.length)} ${truncate(file.split("/").pop() ?? file, 40)}`)
        await this.syncUp(file)
      }
      process.stdout.write(`\r${" ".repeat(80)}\r`)

      this.printSyncTable()
      this.printSummary(startTime)
      return
    }

    // Compare against remote
    const files = await this.getAllMarkdownFiles(this.outputDir)

    console.log(c.dim(`  Comparing ${files.length} local file(s) against remote\u2026`))

    for (const file of files) {
      const normalized = resolve(file)
      const content = await readFile(normalized, "utf-8")
      const parsed = parseFrontmatter(content)

      if (!parsed) continue

      const title = parsed.metadata.title || normalized.split("/").pop() || normalized

      try {
        const remote = await this.client.getDocument(parsed.metadata.id)
        const remoteTime = parseToDate(remote.updatedAt) || new Date(0)
        const localTime = parseToDate(parsed.metadata.updatedAt)
        const fileStat = await stat(normalized)
        const effectiveLocal = localTime ?? fileStat.mtime
        const source = localTime ? "frontmatter" : "mtime"

        if (effectiveLocal.getTime() > remoteTime.getTime()) {
          this.addResult({
            documentId: parsed.metadata.id,
            filePath: normalized,
            localDate: effectiveLocal,
            remoteDate: remoteTime,
            source,
            status: "pushed",
            title,
          })
        } else {
          this.addResult({
            documentId: parsed.metadata.id,
            filePath: normalized,
            localDate: effectiveLocal,
            remoteDate: remoteTime,
            source,
            status: "synced",
            title,
          })
        }
      } catch {
        this.addResult({
          documentId: parsed.metadata.id,
          filePath: normalized,
          status: "not-found",
          title,
          message: "Could not fetch remote document",
        })
      }
    }

    this.printSyncTable()

    const toPush = this.results.filter((r) => r.status === "pushed")
    if (toPush.length === 0) {
      console.log(c.green(`\n  ${icon.check} All documents are in sync!`))
      this.printSummary(startTime)
      return
    }

    console.log(
      c.bold(`\n  ${icon.push}  Pushing ${toPush.length} file${toPush.length !== 1 ? "s" : ""}\u2026`),
    )

    // Reset and actually push
    this.results = []
    for (let i = 0; i < toPush.length; i++) {
      const item = toPush[i]
      process.stdout.write(`\r  ${progressBar(i, toPush.length)} ${truncate(item.title, 40)}`)
      await this.syncUp(item.filePath)
    }
    process.stdout.write(`\r${" ".repeat(80)}\r`)

    this.printSummary(startTime)

    const summary = this.getSummary()
    if (summary.errors === 0) {
      console.log(c.green(`  ${icon.check} Push complete!`))
    } else {
      console.log(c.yellow(`  ${icon.warn} Push completed with ${summary.errors} error(s)`))
    }
  }

  // ── verify command ─────────────────────────────────────────────────────

  async verify(): Promise<void> {
    console.log(`\n${c.bold(c.cyan(`${icon.search}  Verifying configuration`))}\n`)

    console.log(c.bold("  Configuration"))
    console.log(c.dim("  " + "\u2500".repeat(40)))

    const configLines = [
      ["Output Directory", this.outputDir],
      ["Include Collections", this.includeCollections?.join(", ") || "(all)"],
      ["Exclude Collections", this.excludeCollections?.join(", ") || "(none)"],
      ["Custom Paths", `${Object.keys(this.customPaths).length} defined`],
      ["Verbose", String(this.verbose)],
      ["Dry Run", String(this.dryRun)],
    ]

    for (const [label, value] of configLines) {
      console.log(`  ${c.dim(label.padEnd(20))} ${value}`)
    }

    if (Object.keys(this.customPaths).length === 0) {
      console.log(c.dim("\n  No custom paths configured."))
      console.log(c.green(`\n  ${icon.check} Configuration verified!`))
      return
    }

    // Custom paths table
    console.log(c.bold("\n  Custom Path Mappings"))

    const columns = [
      { key: "docId", header: "Document ID", width: 22, align: "left" as const },
      { key: "configPath", header: "Config Path", width: 32, align: "left" as const },
      { key: "resolvedPath", header: "Resolved Path", width: 42, align: "left" as const },
      { key: "type", header: "Type", width: 10, align: "left" as const },
      { key: "exists", header: "Exists", width: 8, align: "center" as const },
    ]

    const rows: Array<Record<string, string>> = []

    for (const [docId, configPath] of Object.entries(this.customPaths)) {
      const endsWithMd = configPath.toLowerCase().endsWith(".md")
      const resolvedPath = configPath.startsWith("..")
        ? join(process.cwd(), configPath)
        : join(this.outputDir, configPath)
      const finalPath = endsWithMd ? resolvedPath : join(resolvedPath, "README.md")

      let exists: string
      try {
        await stat(finalPath)
        exists = c.green("Yes")
      } catch {
        exists = c.red("No")
      }

      rows.push({
        configPath: truncate(configPath, 32),
        docId: truncate(docId, 22),
        exists,
        resolvedPath: truncate(finalPath, 42),
        type: endsWithMd ? "File" : "Dir",
      })
    }

    console.log("\n" + formatTable(rows, columns))

    // Resolve document titles from Outline
    console.log(c.bold("\n  Resolving from Outline\u2026"))

    try {
      const allCollections = await this.client.getCollections()
      const collections = allCollections.filter((c) => this.shouldIncludeCollection(c.id, c.name))

      const docRows: Array<Record<string, string>> = []

      for (const collection of collections) {
        const documents = await this.client.getDocuments(collection.id)
        for (const doc of documents) {
          if (this.customPaths[doc.id]) {
            try {
              const fullDoc = await this.client.getDocument(doc.id)
              docRows.push({
                collection: truncate(collection.name, 15),
                customPath: truncate(this.customPaths[doc.id], 30),
                docId: truncate(doc.id, 22),
                remoteUpdated: formatDate(parseToDate(fullDoc.updatedAt) ?? new Date()),
                title: truncate(fullDoc.title, 30),
              })
            } catch {
              docRows.push({
                collection: truncate(collection.name, 15),
                customPath: truncate(this.customPaths[doc.id], 30),
                docId: truncate(doc.id, 22),
                remoteUpdated: c.yellow("Fetch failed"),
                title: truncate(doc.title, 30),
              })
            }
          }
        }
      }

      // Check for custom paths that weren't found in any collection
      const foundIds = new Set(docRows.map((r) => r.docId))
      for (const docId of Object.keys(this.customPaths)) {
        const truncated = truncate(docId, 22)
        if (!foundIds.has(truncated)) {
          docRows.push({
            collection: c.dim("\u2014"),
            customPath: truncate(this.customPaths[docId], 30),
            docId: truncated,
            remoteUpdated: c.dim("\u2014"),
            title: c.yellow("Not found in collections"),
          })
        }
      }

      const docColumns = [
        { key: "docId", header: "Document ID", width: 22, align: "left" as const },
        { key: "title", header: "Title", width: 30, align: "left" as const },
        { key: "collection", header: "Collection", width: 15, align: "left" as const },
        { key: "remoteUpdated", header: "Remote Updated", width: 22, align: "left" as const },
        { key: "customPath", header: "Custom Path", width: 30, align: "left" as const },
      ]

      if (docRows.length > 0) {
        console.log("\n" + formatTable(docRows, docColumns))
      } else {
        console.log(c.dim("\n  No custom path documents found in the filtered collections."))
      }
    } catch (err) {
      console.log(c.yellow(`\n  ${icon.warn} Could not fetch from Outline: ${err}`))
    }

    console.log(c.green(`\n  ${icon.check} Configuration verified!`))
  }
}