import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { watch } from "chokidar"
import fm from "front-matter"
import YAML from "yaml"
import { OutlineClient } from "./client"
import type { Document, DocumentMetadata, OutlineConfig } from "./types"

interface DocumentNode {
  document: Document
  children: DocumentNode[]
}

interface SyncTableRow {
  Document: string
  Collection: string
  "Local mtime": string
  Frontmatter: string
  "Remote Date": string
  Status: string
}

function parseToDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null
  if (value instanceof Date) return value
  if (typeof value === "number") return new Date(value)
  if (typeof value === "string") {
    const t = Date.parse(value)
    if (isNaN(t)) return null
    return new Date(t)
  }
  return null
}

export class OutlineSync {
  private client: OutlineClient
  private outputDir: string
  private customPaths: Record<string, string>
  private includeCollections?: string[]
  private excludeCollections?: string[]
  private documentMap: Map<string, DocumentMetadata> = new Map()
  private verbose: boolean
  private syncTableData: SyncTableRow[] = []

  constructor(config: OutlineConfig, options?: { verbose?: boolean }) {
    this.client = new OutlineClient(config, options?.verbose ?? config.verbose)
    this.outputDir = config.outputDir || "./outline-docs"
    this.customPaths = config.customPaths || {}
    this.includeCollections = config.includeCollections
    this.excludeCollections = config.excludeCollections
    this.verbose = Boolean(options?.verbose ?? config.verbose)

    this.trace("OutlineSync initialized", {
      outputDir: this.outputDir,
      customPathsCount: Object.keys(this.customPaths).length,
      customPaths: this.customPaths,
      includeCollections: this.includeCollections,
      excludeCollections: this.excludeCollections,
    })
  }

  private trace(message: string, meta?: unknown): void {
    if (!this.verbose) return
    const timestamp = new Date().toISOString()
    if (meta === undefined) {
      console.log(`[trace ${timestamp}] ${message}`)
      return
    }
    console.log(`[trace ${timestamp}] ${message}`, JSON.stringify(meta, null, 2))
  }

  private formatDate(date: Date): string {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  }

  private truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str
    return str.slice(0, maxLength - 3) + "..."
  }

  private sanitizePath(name: string): string {
    const sanitized = name
      .replace(/[<>:"/\\|?*]/g, "-")
      .replace(/\s+/g, "-")
      .toLowerCase()
    this.trace(`sanitizePath: "${name}" -> "${sanitized}"`)
    return sanitized
  }

  private shouldIncludeCollection(collectionId: string, collectionName: string): boolean {
    if (this.includeCollections && this.includeCollections.length > 0) {
      const included = this.includeCollections.some(
        (c) => c === collectionId || c.toLowerCase() === collectionName.toLowerCase()
      )
      this.trace(
        `shouldIncludeCollection (include filter): "${collectionName}" (${collectionId}) -> ${included}`,
        {
          includeCollections: this.includeCollections,
        }
      )
      return included
    }

    if (this.excludeCollections && this.excludeCollections.length > 0) {
      const excluded = this.excludeCollections.some(
        (c) => c === collectionId || c.toLowerCase() === collectionName.toLowerCase()
      )
      this.trace(
        `shouldIncludeCollection (exclude filter): "${collectionName}" (${collectionId}) -> ${!excluded}`,
        {
          excludeCollections: this.excludeCollections,
          excluded,
        }
      )
      return !excluded
    }

    this.trace(`shouldIncludeCollection (no filter): "${collectionName}" (${collectionId}) -> true`)
    return true
  }

  private buildDocumentTree(documents: Document[]): DocumentNode[] {
    this.trace(`buildDocumentTree: processing ${documents.length} documents`)
    const docMap = new Map<string, DocumentNode>()
    const roots: DocumentNode[] = []

    for (const doc of documents) {
      docMap.set(doc.id, { document: doc, children: [] })
      this.trace(`buildDocumentTree: created node for "${doc.title}" (${doc.id})`, {
        parentDocumentId: doc.parentDocumentId,
      })
    }

    for (const doc of documents) {
      const node = docMap.get(doc.id)

      if (!node) {
        this.trace(`buildDocumentTree: WARNING - node not found for ${doc.id}`)
        continue
      }

      if (doc.parentDocumentId && docMap.has(doc.parentDocumentId)) {
        const parent = docMap.get(doc.parentDocumentId)
        if (parent) {
          parent.children.push(node)
          this.trace(
            `buildDocumentTree: "${doc.title}" added as child of "${parent.document.title}"`
          )
        }
      } else {
        roots.push(node)
        this.trace(`buildDocumentTree: "${doc.title}" is a root document`)
      }
    }

    this.trace(`buildDocumentTree: completed with ${roots.length} root documents`)
    return roots
  }

  private getDocumentPath(
    doc: Document,
    collectionName: string,
    parentPath?: string
  ): { dirPath: string; filePath: string; isCustomPath: boolean } {
    this.trace(`getDocumentPath: resolving path for "${doc.title}" (${doc.id})`, {
      collectionName,
      parentPath,
      hasCustomPath: doc.id in this.customPaths,
    })

    const customPath = this.customPaths[doc.id]

    if (customPath) {
      const endsWithMd = customPath.toLowerCase().endsWith(".md")
      this.trace(`getDocumentPath: CUSTOM PATH found for "${doc.title}" (${doc.id})`, {
        customPath,
        startsWithDotDot: customPath.startsWith(".."),
        endsWithMd,
      })

      let resolvedPath: string
      if (customPath.startsWith("..")) {
        resolvedPath = join(process.cwd(), customPath)
        this.trace(`getDocumentPath: resolved relative custom path`, {
          customPath,
          cwd: process.cwd(),
          resolvedPath,
        })
      } else {
        resolvedPath = join(this.outputDir, customPath)
        this.trace(`getDocumentPath: resolved custom path within outputDir`, {
          customPath,
          outputDir: this.outputDir,
          resolvedPath,
        })
      }

      if (endsWithMd) {
        const dirPath = join(resolvedPath, "..")
        this.trace(`getDocumentPath: custom path is a file path`, {
          filePath: resolvedPath,
          dirPath,
        })
        return { dirPath, filePath: resolvedPath, isCustomPath: true }
      }

      return {
        dirPath: resolvedPath,
        filePath: join(resolvedPath, "README.md"),
        isCustomPath: true,
      }
    }

    const collectionPath = this.sanitizePath(collectionName)
    const docPath = this.sanitizePath(doc.title)

    this.trace(`getDocumentPath: using standard path resolution`, {
      collectionPath,
      docPath,
      parentPath,
      isRootLevel: !parentPath,
    })

    if (!parentPath) {
      if (docPath === collectionPath) {
        const resolvedPath = join(this.outputDir, collectionPath)
        this.trace(
          `getDocumentPath: root doc name matches collection name, avoiding duplicate folder`,
          {
            docPath,
            collectionPath,
            resolvedPath,
          }
        )
        return {
          dirPath: resolvedPath,
          filePath: join(resolvedPath, "README.md"),
          isCustomPath: false,
        }
      }
      const resolvedPath = join(this.outputDir, collectionPath, docPath)
      this.trace(`getDocumentPath: root doc with different name -> subfolder`, {
        resolvedPath,
      })
      return {
        dirPath: resolvedPath,
        filePath: join(resolvedPath, "README.md"),
        isCustomPath: false,
      }
    } else {
      const resolvedPath = join(parentPath, docPath)
      this.trace(`getDocumentPath: nested doc -> child folder`, {
        parentPath,
        docPath,
        resolvedPath,
      })
      return {
        dirPath: resolvedPath,
        filePath: join(resolvedPath, "README.md"),
        isCustomPath: false,
      }
    }
  }

  private createFrontMatter(doc: Document): string {
    const metadata: DocumentMetadata = {
      id: doc.id,
      title: doc.title,
      collectionId: doc.collectionId,
      parentDocumentId: doc.parentDocumentId,
      // Normalize to ISO string to avoid parser/timezone differences
      updatedAt: new Date(doc.updatedAt).toISOString(),
      urlId: doc.urlId,
    }
    this.trace(`createFrontMatter: generated metadata for "${doc.title}"`, metadata)
    return `---\n${YAML.stringify(metadata)}---\n\n`
  }

  private async syncDocumentNode(
    node: DocumentNode,
    collectionName: string,
    parentPath?: string,
    depth = 0
  ): Promise<void> {
    const doc = node.document
    const indent = "  ".repeat(depth)

    this.trace(`syncDocumentNode: starting sync for "${doc.title}" (${doc.id})`, {
      collectionName,
      parentPath,
      depth,
      childrenCount: node.children.length,
    })

    this.trace(`syncDocumentNode: fetching full document content for "${doc.title}"`)
    const fullDoc = await this.client.getDocument(doc.id)
    this.trace(`syncDocumentNode: received document content`, {
      id: fullDoc.id,
      title: fullDoc.title,
      textLength: fullDoc.text?.length ?? 0,
      updatedAt: fullDoc.updatedAt,
    })

    const { dirPath, filePath, isCustomPath } = this.getDocumentPath(
      fullDoc,
      collectionName,
      parentPath
    )

    this.trace(`syncDocumentNode: writing to filesystem`, {
      dirPath,
      filePath,
      isCustomPath,
    })

    await mkdir(dirPath, { recursive: true })
    const content = this.createFrontMatter(fullDoc) + fullDoc.text
    await writeFile(filePath, content, "utf-8")

    this.trace(`syncDocumentNode: file written successfully`, {
      filePath,
      contentLength: content.length,
    })

    const remoteDate = parseToDate(fullDoc.updatedAt) || new Date()

    let fileMtime: Date = new Date()
    try {
      const fsStat = await stat(filePath)
      fileMtime = fsStat.mtime
    } catch (err) {
      this.trace("syncDocumentNode: failed to stat written file", { filePath, error: String(err) })
    }

    // Record both the filesystem mtime and the frontmatter (remote) timestamp so it's explicit
    this.syncTableData.push({
      Document: this.truncate(fullDoc.title, 30),
      Collection: this.truncate(collectionName, 15),
      "Local mtime": this.formatDate(fileMtime),
      Frontmatter: this.formatDate(remoteDate),
      "Remote Date": this.formatDate(remoteDate),
      Status: "Pulled",
    })

    // Normalize key to absolute path to match later scans
    const normalizedPath = resolve(filePath)
    this.documentMap.set(normalizedPath, {
      id: fullDoc.id,
      title: fullDoc.title,
      collectionId: fullDoc.collectionId,
      parentDocumentId: fullDoc.parentDocumentId,
      updatedAt: fullDoc.updatedAt,
      urlId: fullDoc.urlId,
    })

    this.trace(`syncDocumentNode: added to documentMap`, {
      filePath: normalizedPath,
      documentMapSize: this.documentMap.size,
    })

    console.log(`${indent}✓ ${fullDoc.title}`)

    if (node.children.length > 0) {
      this.trace(
        `syncDocumentNode: processing ${node.children.length} children of "${fullDoc.title}"`
      )
    }
    for (const child of node.children) {
      await this.syncDocumentNode(child, collectionName, dirPath, depth + 1)
    }
  }

  async syncDown(): Promise<void> {
    console.log("📥 Syncing from Outline to local...")
    this.trace("syncDown: starting", {
      outputDir: this.outputDir,
      customPathsCount: Object.keys(this.customPaths).length,
    })

    this.syncTableData = []

    this.trace("syncDown: fetching all collections from Outline API")
    const allCollections = await this.client.getCollections()
    this.trace(`syncDown: received ${allCollections.length} collections`, {
      collections: allCollections.map((c) => ({ id: c.id, name: c.name })),
    })

    const collections = allCollections.filter((c) => this.shouldIncludeCollection(c.id, c.name))
    this.trace(`syncDown: filtered to ${collections.length} collections`)

    if (collections.length === 0) {
      console.log("⚠️  No collections match your include/exclude filters")
      this.trace("syncDown: no collections to sync after filtering")
      return
    }

    if (this.includeCollections || this.excludeCollections) {
      console.log(`Filtered to ${collections.length}/${allCollections.length} collections`)
      this.trace("syncDown: include/exclude filters applied", {
        includeCollections: this.includeCollections,
        excludeCollections: this.excludeCollections,
        filteredCollections: collections.map((c) => c.name),
      })
    } else {
      console.log(`Found ${collections.length} collections`)
    }

    for (const collection of collections) {
      console.log(`\n📚 Syncing collection: ${collection.name}`)
      this.trace(`syncDown: processing collection "${collection.name}"`, {
        collectionId: collection.id,
        description: collection.description,
      })

      this.trace(`syncDown: fetching documents for collection "${collection.name}"`)
      const documents = await this.client.getDocuments(collection.id)
      this.trace(`syncDown: received ${documents.length} documents for "${collection.name}"`, {
        documentIds: documents.map((d) => ({
          id: d.id,
          title: d.title,
          parentDocumentId: d.parentDocumentId,
        })),
      })

      const tree = this.buildDocumentTree(documents)

      this.trace(`syncDown: syncing ${tree.length} root documents for "${collection.name}"`)
      for (const node of tree) {
        await this.syncDocumentNode(node, collection.name)
      }
    }

    if (this.syncTableData.length > 0) {
      console.log("\n📋 Sync Summary:\n")
      console.table(this.syncTableData)
    }

    this.trace("syncDown: completed", {
      documentMapSize: this.documentMap.size,
    })
    console.log("\n✅ Sync complete!")
  }

  async syncUp(filePath: string): Promise<void> {
    console.log(`📤 Syncing ${filePath} to Outline...`)
    this.trace("syncUp: starting", { filePath })

    const content = await readFile(filePath, "utf-8")
    this.trace("syncUp: read file content", {
      filePath,
      contentLength: content.length,
    })

    const parsed = fm<DocumentMetadata>(content)
    this.trace("syncUp: parsed frontmatter", {
      attributes: parsed.attributes,
      bodyLength: parsed.body.length,
    })

    if (!parsed.attributes || !parsed.attributes.id) {
      console.warn(`⚠️  Skipping ${filePath} - no document ID in frontmatter`)
      this.trace("syncUp: skipping file - missing frontmatter id", {
        filePath,
        attributes: parsed.attributes,
      })
      return
    }

    const { id, title } = parsed.attributes
    const text = parsed.body

    this.trace("syncUp: updating document in Outline", {
      id,
      title,
      textLength: text.length,
    })

    await this.client.updateDocument(id, text, title)
    console.log(`✓ Updated: ${title}`)
    this.trace("syncUp: document updated successfully", { id, title })
  }

  async watch(): Promise<void> {
    console.log(`👀 Watching ${this.outputDir} for changes...`)
    this.trace("watch: starting", { outputDir: this.outputDir })

    await this.syncDown()

    const watchPattern = join(this.outputDir, "**/*.md")
    this.trace("watch: setting up file watcher", { pattern: watchPattern })

    const watcher = watch(watchPattern, {
      persistent: true,
      ignoreInitial: true,
    })

    watcher.on("change", async (path) => {
      this.trace("watch: file change detected", { path })
      try {
        await this.syncUp(path)
      } catch (error) {
        console.error(`Error syncing ${path}:`, error)
        this.trace("watch: sync error", { path, error: String(error) })
      }
    })

    watcher.on("add", (path) => {
      this.trace("watch: new file detected (not syncing)", { path })
    })

    watcher.on("unlink", (path) => {
      this.trace("watch: file deleted (not syncing)", { path })
    })

    console.log("✅ Watching for changes. Press Ctrl+C to stop.")
    this.trace("watch: watcher ready")
  }

  async ciSync(): Promise<void> {
    console.log("🔄 CI/CD Sync mode...")
    this.trace("ciSync: starting")

    await this.syncDown()

    this.trace("ciSync: finding changed files")
    const { changed: changedFiles, tableData } = await this.findChangedFilesWithTable()

    if (changedFiles.length === 0) {
      if (tableData.length > 0) {
        console.log("\n📋 Local Changes Check:\n")
        console.table(tableData)
        console.log("\n✅ All documents are in sync!")
      } else {
        console.log("✅ No local changes detected")
      }
      this.trace("ciSync: no changes detected")
      return
    }

    console.log("\n📋 Local Changes Detected:\n")
    console.table(tableData)

    console.log(`\n📤 Pushing ${changedFiles.length} changed file(s) to Outline...\n`)
    this.trace("ciSync: pushing changed files", { changedFiles })

    for (const file of changedFiles) {
      await this.syncUp(file)
    }

    this.trace("ciSync: completed")
    console.log("\n✅ CI/CD sync complete!")
  }

  private async findChangedFilesWithTable(): Promise<{
    changed: string[]
    tableData: Array<Record<string, string>>
  }> {
    const changed: string[] = []
    const tableData: Array<Record<string, string>> = []
    const files = await this.getAllMarkdownFiles(this.outputDir)

    this.trace("findChangedFilesWithTable: scanning files", {
      totalFiles: files.length,
      documentMapSize: this.documentMap.size,
    })

    for (const file of files) {
      const normalized = resolve(file)
      const content = await readFile(normalized, "utf-8")
      const parsed = fm<DocumentMetadata>(content)

      if (!parsed.attributes?.id) {
        this.trace("findChangedFilesWithTable: skipping file without id", { file: normalized })
        continue
      }

      const title = parsed.attributes.title || normalized.split("/").pop() || normalized
      const cached = this.documentMap.get(normalized)

      if (!cached) {
        this.trace("findChangedFilesWithTable: file not in cache, marking as changed", {
          file: normalized,
        })
        tableData.push({
          Document: this.truncate(title, 30),
          "Local Date": "—",
          "Cached Date": "⚠️  Not cached",
          Source: "—",
          Status: "❓ New",
        })
        changed.push(normalized)
        continue
      }

      const fileFrontUpdated = parseToDate(parsed.attributes.updatedAt) // may be null
      const fileStat = await stat(normalized)
      const fileMtime = fileStat.mtime
      const cachedTime = parseToDate(cached.updatedAt) || new Date(0)

      const localTime = fileFrontUpdated || fileMtime
      const localSource = fileFrontUpdated ? "frontmatter" : "mtime"

      this.trace("findChangedFilesWithTable: comparing timestamps", {
        file: normalized,
        frontmatterUpdatedAt: fileFrontUpdated?.toISOString(),
        fileMtime: fileMtime.toISOString(),
        cachedUpdatedAt: cachedTime.toISOString(),
        usingFrontmatter: !!fileFrontUpdated,
      })

      const isNewer = localTime.getTime() > cachedTime.getTime()

      const status = isNewer ? "⬆️  Push" : "✓ Synced"

      tableData.push({
        Document: this.truncate(title, 30),
        "Local Date": this.formatDate(localTime),
        "Cached Date": this.formatDate(cachedTime),
        Source: localSource,
        Status: status,
      })

      if (isNewer) {
        this.trace("findChangedFilesWithTable: file is newer, marking as changed", {
          file: normalized,
          reason: fileFrontUpdated ? "frontmatter updatedAt is newer" : "file mtime is newer",
        })
        changed.push(normalized)
      } else {
        this.trace("findChangedFilesWithTable: file is not newer, skipping", { file: normalized })
      }
    }

    this.trace("findChangedFilesWithTable: completed", {
      totalScanned: files.length,
      changedCount: changed.length,
    })

    return { changed, tableData }
  }

  private async getAllMarkdownFiles(dir: string): Promise<string[]> {
    const files: string[] = []

    this.trace("getAllMarkdownFiles: scanning directory", { dir })

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
    } catch (err) {
      this.trace("getAllMarkdownFiles: directory not found or error", { dir, error: String(err) })
    }

    return files
  }

  private async findChangedFilesAgainstRemote(
    showTable = false
  ): Promise<{ changed: string[]; tableData: Array<Record<string, string>> }> {
    const changed: string[] = []
    const tableData: Array<Record<string, string>> = []
    const files = await this.getAllMarkdownFiles(this.outputDir)

    this.trace("findChangedFilesAgainstRemote: scanning files against remote", {
      totalFiles: files.length,
    })

    if (showTable && files.length > 0) {
      console.log(`\n🔍 Comparing ${files.length} local file(s) against remote...\n`)
    }

    for (const file of files) {
      const normalized = resolve(file)
      const content = await readFile(normalized, "utf-8")
      const parsed = fm<DocumentMetadata>(content)

      if (!parsed.attributes?.id) {
        this.trace("findChangedFilesAgainstRemote: skipping file without id", { file: normalized })
        continue
      }

      const id = parsed.attributes.id
      const title = parsed.attributes.title || normalized.split("/").pop() || normalized

      this.trace("findChangedFilesAgainstRemote: checking file against remote", {
        file: normalized,
        documentId: id,
      })

      try {
        const remote = await this.client.getDocument(id)
        const remoteTime = parseToDate(remote.updatedAt) || new Date(0)

        const fileFrontUpdated = parseToDate(parsed.attributes.updatedAt)
        const fileStat = await stat(normalized)
        const fileMtime = fileStat.mtime

        const localTime = fileFrontUpdated || fileMtime
        const localSource = fileFrontUpdated ? "frontmatter" : "mtime"

        this.trace("findChangedFilesAgainstRemote: comparing timestamps", {
          file: normalized,
          documentId: id,
          frontmatterUpdatedAt: fileFrontUpdated?.toISOString(),
          fileMtime: fileMtime.toISOString(),
          remoteUpdatedAt: remoteTime.toISOString(),
          usingFrontmatter: !!fileFrontUpdated,
        })

        const isNewer = localTime.getTime() > remoteTime.getTime()
        const status = isNewer ? "⬆️  Push" : "✓ Synced"

        tableData.push({
          Document: this.truncate(title, 30),
          "Local Date": this.formatDate(localTime),
          "Remote Date": this.formatDate(remoteTime),
          Source: localSource,
          Status: status,
        })

        if (isNewer) {
          this.trace(
            "findChangedFilesAgainstRemote: file is newer than remote, marking as changed",
            {
              file: normalized,
              documentId: id,
              reason: fileFrontUpdated ? "frontmatter updatedAt is newer" : "file mtime is newer",
            }
          )
          changed.push(normalized)
        } else {
          this.trace("findChangedFilesAgainstRemote: file is not newer than remote, skipping", {
            file: normalized,
            documentId: id,
          })
        }
      } catch (err) {
        this.trace(
          "findChangedFilesAgainstRemote: failed to fetch remote, marking for inspection",
          {
            file: normalized,
            documentId: id,
            error: String(err),
          }
        )

        tableData.push({
          Document: this.truncate(title, 30),
          "Local Date": "—",
          "Remote Date": "⚠️  Not found",
          Source: "—",
          Status: "❓ Check",
        })

        changed.push(normalized)
      }
    }

    if (showTable && tableData.length > 0) {
      console.table(tableData)
    }

    this.trace("findChangedFilesAgainstRemote: completed", {
      totalScanned: files.length,
      changedCount: changed.length,
      changedFiles: changed,
    })

    return { changed, tableData }
  }

  async push(force = false): Promise<void> {
    if (force) {
      console.log("📤 Force pushing all local files to Outline (ignoring remote timestamps)...")
      const files = await this.getAllMarkdownFiles(this.outputDir)
      for (const file of files) {
        try {
          await this.syncUp(file)
        } catch (err) {
          console.error(`Error pushing ${file}:`, err)
          this.trace("push(force): error pushing file", { file, error: String(err) })
        }
      }
      console.log("\n✅ Force push complete!")
      return
    }

    console.log("📤 Pushing local changes to Outline...")
    this.trace("push: starting", { outputDir: this.outputDir })

    const { changed: changedFiles, tableData } = await this.findChangedFilesAgainstRemote(true)

    if (changedFiles.length === 0) {
      if (tableData.length > 0) {
        console.log("\n✅ All documents are in sync!")
      } else {
        console.log("✅ No local documents found to push")
      }
      this.trace("push: no changes to push")
      return
    }

    console.log(`\n📤 Pushing ${changedFiles.length} changed file(s) to Outline...\n`)
    this.trace("push: pushing changed files", { count: changedFiles.length, files: changedFiles })

    for (const file of changedFiles) {
      try {
        await this.syncUp(file)
      } catch (error) {
        console.error(`Error pushing ${file}:`, error)
        this.trace("push: error pushing file", { file, error: String(error) })
      }
    }

    this.trace("push: completed")
    console.log("\n✅ Push complete!")
  }

  async verify(): Promise<void> {
    console.log("🔍 Verifying outline-sync configuration...\n")

    console.log("📁 Configuration:")
    console.log(`   Output Directory: ${this.outputDir}`)
    console.log(`   Include Collections: ${this.includeCollections?.join(", ") || "(all)"}`)
    console.log(`   Exclude Collections: ${this.excludeCollections?.join(", ") || "(none)"}`)
    console.log(`   Custom Paths: ${Object.keys(this.customPaths).length} defined`)
    console.log(`   Verbose: ${this.verbose}`)

    if (Object.keys(this.customPaths).length === 0) {
      console.log("\n📋 No custom paths configured.")
      console.log("\n✅ Configuration verified!")
      return
    }

    console.log("\n📋 Custom Path Mappings:\n")

    const customPathsTable: Array<{
      "Document ID": string
      "Config Path": string
      "Resolved Path": string
      "Path Type": string
      Exists: string
    }> = []

    for (const [docId, configPath] of Object.entries(this.customPaths)) {
      const endsWithMd = configPath.toLowerCase().endsWith(".md")
      let resolvedPath: string

      if (configPath.startsWith("..")) {
        resolvedPath = join(process.cwd(), configPath)
      } else {
        resolvedPath = join(this.outputDir, configPath)
      }

      const finalPath = endsWithMd ? resolvedPath : join(resolvedPath, "README.md")

      let exists = "❌ No"
      try {
        await stat(finalPath)
        exists = "✅ Yes"
      } catch {
        // File doesn't exist
      }

      customPathsTable.push({
        "Document ID": this.truncate(docId, 20),
        "Config Path": this.truncate(configPath, 30),
        "Resolved Path": this.truncate(finalPath, 45),
        "Path Type": endsWithMd ? "File" : "Directory",
        Exists: exists,
      })
    }

    console.table(customPathsTable)

    console.log("\n🔗 Resolving Document Titles from Outline...\n")

    try {
      const allCollections = await this.client.getCollections()
      const collections = allCollections.filter((c) => this.shouldIncludeCollection(c.id, c.name))

      const docDetailsTable: Array<{
        "Document ID": string
        Title: string
        Collection: string
        "Remote Updated": string
        "Custom Path": string
      }> = []

      for (const collection of collections) {
        const documents = await this.client.getDocuments(collection.id)

        for (const doc of documents) {
          const customPath = this.customPaths[doc.id]
          if (customPath) {
            try {
              const fullDoc = await this.client.getDocument(doc.id)
              docDetailsTable.push({
                "Document ID": this.truncate(doc.id, 20),
                Title: this.truncate(fullDoc.title, 30),
                Collection: this.truncate(collection.name, 15),
                "Remote Updated": this.formatDate(parseToDate(fullDoc.updatedAt) || new Date()),
                "Custom Path": this.truncate(customPath, 35),
              })
            } catch {
              docDetailsTable.push({
                "Document ID": this.truncate(doc.id, 20),
                Title: this.truncate(doc.title, 30),
                Collection: this.truncate(collection.name, 15),
                "Remote Updated": "⚠️ Fetch failed",
                "Custom Path": this.truncate(customPath, 35),
              })
            }
          }
        }
      }

      const foundDocIds = new Set(docDetailsTable.map((d) => d["Document ID"]))
      for (const docId of Object.keys(this.customPaths)) {
        const truncatedId = this.truncate(docId, 20)
        if (!foundDocIds.has(truncatedId)) {
          docDetailsTable.push({
            "Document ID": truncatedId,
            Title: "⚠️ Not found in collections",
            Collection: "—",
            "Remote Updated": "—",
            "Custom Path": this.truncate(this.customPaths[docId], 35),
          })
        }
      }

      if (docDetailsTable.length > 0) {
        console.table(docDetailsTable)
      } else {
        console.log("   No custom path documents found in the filtered collections.")
      }
    } catch (err) {
      console.log(`   ⚠️ Could not fetch documents from Outline: ${err}`)
    }

    console.log("\n✅ Configuration verified!")
  }
}
