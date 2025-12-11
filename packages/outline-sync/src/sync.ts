import { mkdir, writeFile, readFile, readdir, stat } from "node:fs/promises"
import { join } from "node:path"
import { watch } from "chokidar"
import fm from "front-matter"
import YAML from "yaml"
import type { OutlineConfig, Document, DocumentMetadata } from "./types"
import { OutlineClient } from "./client"

export class OutlineSync {
  private client: OutlineClient
  private outputDir: string
  private customPaths: Record<string, string>
  private documentMap: Map<string, DocumentMetadata> = new Map()

  constructor(config: OutlineConfig) {
    this.client = new OutlineClient(config)
    this.outputDir = config.outputDir || "./outline-docs"
    this.customPaths = config.customPaths || {}
  }

  private sanitizePath(name: string): string {
    return name
      .replace(/[<>:"/\\|?*]/g, "-")
      .replace(/\s+/g, "-")
      .toLowerCase()
  }

  private getDocumentPath(doc: Document, collectionName: string): string {
    const customPath = this.customPaths[doc.id]
    if (customPath) {
      return join(this.outputDir, customPath)
    }

    const collectionPath = this.sanitizePath(collectionName)
    const docPath = this.sanitizePath(doc.title)
    return join(this.outputDir, collectionPath, docPath)
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

  async syncDown(): Promise<void> {
    console.log("📥 Syncing from Outline to local...")

    const collections = await this.client.getCollections()
    console.log(`Found ${collections.length} collections`)

    for (const collection of collections) {
      console.log(`\n📚 Syncing collection: ${collection.name}`)
      const documents = await this.client.getDocuments(collection.id)

      for (const doc of documents) {
        const fullDoc = await this.client.getDocument(doc.id)
        const docPath = this.getDocumentPath(fullDoc, collection.name)
        const filePath = join(docPath, "README.md")

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

        console.log(`  ✓ ${fullDoc.title}`)
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

    watcher.on("change", async (path: string) => {
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
