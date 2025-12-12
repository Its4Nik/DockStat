import { watch } from "chokidar"
import fm from "front-matter"
import { mkdir, readdir, readFile, stat, writeFile } from "fs/promises"
import { dirname, join } from "path"
import YAML from "yaml"
import { OutlineClient } from "./client"
import type { Collection, Document, DocumentMetadata, OutlineConfig } from "./types"

interface DocumentNode {
  document: Document
  children: DocumentNode[]
}

export class OutlineSync {
  private client: OutlineClient
  private outputDir: string
  private customPaths: Record<string, string>
  private includeCollections?: string[]
  private excludeCollections?: string[]
  private documentMap: Map<string, DocumentMetadata> = new Map()

  constructor(config: OutlineConfig) {
    this.client = new OutlineClient(config)
    this.outputDir = config.outputDir || "./outline-docs"
    this.customPaths = config.customPaths || {}
    this.includeCollections = config.includeCollections
    this.excludeCollections = config.excludeCollections
  }

  private sanitizePath(name: string): string {
    return name
      .replace(/[<>:"/\\|?*]/g, "-")
      .replace(/\s+/g, "-")
      .toLowerCase()
  }

  private shouldIncludeCollection(collectionId: string, collectionName: string): boolean {
    // If include list is specified, only include those collections
    if (this.includeCollections && this.includeCollections.length > 0) {
      return this.includeCollections.some(
        (c) => c === collectionId || c.toLowerCase() === collectionName.toLowerCase()
      )
    }

    // If exclude list is specified, exclude those collections
    if (this.excludeCollections && this.excludeCollections.length > 0) {
      return !this.excludeCollections.some(
        (c) => c === collectionId || c.toLowerCase() === collectionName.toLowerCase()
      )
    }

    // By default, include all collections
    return true
  }

  private buildDocumentTree(documents: Document[]): DocumentNode[] {
    const docMap = new Map<string, DocumentNode>()
    const roots: DocumentNode[] = []

    // Create nodes for all documents
    for (const doc of documents) {
      docMap.set(doc.id, { document: doc, children: [] })
    }

    // Build tree structure
    for (const doc of documents) {
      const node = docMap.get(doc.id)

      if (!node) {
        continue
      }

      if (doc.parentDocumentId && docMap.has(doc.parentDocumentId)) {
        // Add to parent's children
        const parent = docMap.get(doc.parentDocumentId)
        if (parent) {
          parent.children.push(node)
        }
      } else {
        // Root level document
        roots.push(node)
      }
    }

    return roots
  }

  private getDocumentPath(doc: Document, collectionName: string, parentPath?: string): string {
    // Check for custom path first
    const customPath = this.customPaths[doc.id]
    if (customPath) {
      // Handle relative paths that go outside outputDir
      if (customPath.startsWith("..")) {
        return join(process.cwd(), customPath)
      }
      return join(this.outputDir, customPath)
    }

    const collectionPath = this.sanitizePath(collectionName)
    const docPath = this.sanitizePath(doc.title)

    // Build path based on hierarchy
    if (parentPath) {
      // Nested document
      return join(parentPath, docPath)
    } else {
      // Root level document in collection
      return join(this.outputDir, collectionPath, docPath)
    }
  }

  private createFrontMatter(doc: Document): string {
    const metadata: DocumentMetadata = {
      id: doc.id,
      title: doc.title,
      collectionId: doc.collectionId,
      parentDocumentId: doc.parentDocumentId,
      updatedAt: doc.updatedAt,
      urlId: doc.urlId,
    }
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

    // Get full document content
    const fullDoc = await this.client.getDocument(doc.id)
    const docPath = this.getDocumentPath(fullDoc, collectionName, parentPath)
    const filePath = join(docPath, "README.md")

    // Create directory and write document
    await mkdir(docPath, { recursive: true })
    const content = this.createFrontMatter(fullDoc) + fullDoc.text
    await writeFile(filePath, content, "utf-8")

    this.documentMap.set(filePath, {
      id: fullDoc.id,
      title: fullDoc.title,
      collectionId: fullDoc.collectionId,
      parentDocumentId: fullDoc.parentDocumentId,
      updatedAt: fullDoc.updatedAt,
      urlId: fullDoc.urlId,
    })

    console.log(`${indent}✓ ${fullDoc.title}`)

    // Recursively sync children
    for (const child of node.children) {
      await this.syncDocumentNode(child, collectionName, docPath, depth + 1)
    }
  }

  async syncDown(): Promise<void> {
    console.log("📥 Syncing from Outline to local...")

    const allCollections = await this.client.getCollections()
    const collections = allCollections.filter((c) => this.shouldIncludeCollection(c.id, c.name))

    if (collections.length === 0) {
      console.log("⚠️  No collections match your include/exclude filters")
      return
    }

    if (this.includeCollections || this.excludeCollections) {
      console.log(`Filtered to ${collections.length}/${allCollections.length} collections`)
    } else {
      console.log(`Found ${collections.length} collections`)
    }

    for (const collection of collections) {
      console.log(`\n📚 Syncing collection: ${collection.name}`)
      const documents = await this.client.getDocuments(collection.id)

      // Build document tree
      const tree = this.buildDocumentTree(documents)

      // Sync each root document and its children
      for (const node of tree) {
        await this.syncDocumentNode(node, collection.name)
      }
    }

    console.log("\n✅ Sync complete!")
  }

  async syncUp(filePath: string): Promise<void> {
    console.log(`📤 Syncing ${filePath} to Outline...`)

    const content = await readFile(filePath, "utf-8")
    const parsed = fm<DocumentMetadata>(content)

    if (!parsed.attributes || !parsed.attributes.id) {
      console.warn(`⚠️  Skipping ${filePath} - no document ID in frontmatter`)
      return
    }

    const { id, title } = parsed.attributes
    const text = parsed.body

    await this.client.updateDocument(id, text, title)
    console.log(`✓ Updated: ${title}`)
  }

  async watch(): Promise<void> {
    console.log(`👀 Watching ${this.outputDir} for changes...`)

    // Initial sync down
    await this.syncDown()

    const watcher = watch(join(this.outputDir, "**/*.md"), {
      persistent: true,
      ignoreInitial: true,
    })

    watcher.on("change", async (path) => {
      try {
        await this.syncUp(path)
      } catch (error) {
        console.error(`Error syncing ${path}:`, error)
      }
    })

    console.log("✅ Watching for changes. Press Ctrl+C to stop.")
  }

  async ciSync(): Promise<void> {
    console.log("🔄 CI/CD Sync mode...")

    // First sync down to get latest
    await this.syncDown()

    // Check for local changes
    const changedFiles = await this.findChangedFiles()

    if (changedFiles.length === 0) {
      console.log("✅ No local changes detected")
      return
    }

    console.log(`\n📤 Pushing ${changedFiles.length} changed file(s) to Outline...`)
    for (const file of changedFiles) {
      await this.syncUp(file)
    }

    console.log("\n✅ CI/CD sync complete!")
  }

  private async findChangedFiles(): Promise<string[]> {
    const changed: string[] = []
    const files = await this.getAllMarkdownFiles(this.outputDir)

    for (const file of files) {
      const content = await readFile(file, "utf-8")
      const parsed = fm<DocumentMetadata>(content)

      if (!parsed.attributes?.id) continue

      const cached = this.documentMap.get(file)
      if (!cached) {
        changed.push(file)
        continue
      }

      // Compare content or modification time
      const fileStat = await stat(file)
      const cachedTime = new Date(cached.updatedAt)

      if (fileStat.mtime > cachedTime) {
        changed.push(file)
      }
    }

    return changed
  }

  private async getAllMarkdownFiles(dir: string): Promise<string[]> {
    const files: string[] = []

    try {
      const entries = await readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = join(dir, entry.name)

        if (entry.isDirectory()) {
          files.push(...(await this.getAllMarkdownFiles(fullPath)))
        } else if (entry.name.endsWith(".md")) {
          files.push(fullPath)
        }
      }
    } catch (_) {
      // Directory doesn't exist yet
    }

    return files
  }
}
