---
id: b931ba3f-2f39-4414-9c80-fb1ebbe92771
title: "@dockstat/outline-sync"
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: 75d80211-7262-4064-aaa6-2ead20e17f43
updatedAt: 2025-08-19T18:44:19.206Z
urlId: QdSHhQ3ZXI
---

# Technical Documentation

This document provides a comprehensive technical overview of the outline-sync tool, including architecture, data flow, algorithms, and implementation details.


---

## Architecture Overview

The outline-sync tool follows a modular architecture with clear separation of concerns:

```mermaidjs
graph LR
    subgraph "CLI Layer"
        A[CLI Parser] --> B[Command Router]
        B --> C[Flag Processor]
    end

    subgraph "Core Engine"
        D[Sync Engine] --> E[Conflict Resolver]
        D --> F[File Manager]
        D --> G[Manifest Manager]
    end

    subgraph "Data Layer"
        H[Config Loader] --> I[Collection Config]
        H --> J[Top Config]
        K[Outline API] --> L[Document Fetcher]
        K --> M[Document Updater]
    end

    subgraph "Utilities"
        N[Logger] --> O[Timestamp Utils]
        N --> P[Content Normalizer]
        N --> Q[Path Resolver]
    end

    B --> D
    D --> H
    D --> K
    D --> N

    style A fill:#00537C
    style D fill:#9D009F
    style H fill:#207E00
    style N fill:#680900
```


---

## Core Components

### 1. CLI Entry Point (`bin/cli.ts`)

The CLI acts as the main entry point and handles:

```mermaidjs
flowchart TD
    A[Process Arguments] --> B{Flag Parsing}
    B --> C[API Key Setup]
    B --> D[Collection Resolution]
    C --> E[Dynamic Module Import]
    D --> E
    E --> F[Command Execution]

    subgraph "Commands"
        G[setup] --> H[Interactive Collection Setup]
        I[init] --> J[Bootstrap Collection]
        K[sync/pull/push] --> L[Run Sync Engine]
        M[list-collections] --> N[API Collection List]
    end

    F --> G
    F --> I
    F --> K
    F --> M
```

**Key Features:**

* Repeatable `--collection` flag support
* Early API key injection for module imports
* Comprehensive error handling
* Debug logging control

### 2. Configuration System (`lib/config.ts`)

Manages the hierarchical configuration structure:

```mermaidjs
graph LR
    subgraph "Configuration Hierarchy"
        A[Environment Variables] --> B[CLI Flags]
        B --> C[outline-sync.json]
        C --> D[collection.config.json]
        D --> E[collection.pages.json]
    end

    subgraph "File Structure"
        F[.config/] --> G[outline-sync.json]
        F --> H[collection-id.config.json]
        F --> I[collection-id.pages.json]
    end

    subgraph "Config Types"
        J[TopConfig] --> K[Collections Array]
        L[CollectionConfig] --> M[Mappings Rules]
        N[Manifest] --> O[Page Tree]
    end
```

**Configuration Resolution Order:**


1. CLI flags (highest priority)
2. Environment variables
3. Configuration files
4. Defaults (lowest priority)

### 3. Sync Engine (`lib/syncEngine.ts`)

The core synchronization logic:

```mermaidjs
flowchart TD
    A[Load Configuration] --> B[Load Page Manifest]
    B --> C[Apply Path Mappings]
    C --> D[Normalize File Paths]
    D --> E[Process Each Page]

    subgraph "Page Processing"
        F[Check Local File] --> G[Fetch Remote Document]
        G --> H[Compare Timestamps]
        H --> I[Compare Content]
        I --> J{Sync Decision}

        J -->|Pull| K[Remote → Local]
        J -->|Push| L[Local → Remote]
        J -->|Skip| M[No Changes]
    end

    E --> F
    K --> N[Process Children]
    L --> N
    M --> N
    N --> O[Update Manifest]
```


---

## Data Flow

### Complete Synchronization Flow

```mermaidjs
sequenceDiagram
    participant CLI as CLI Interface
    participant Config as Config Manager
    participant Sync as Sync Engine
    participant API as Outline API
    participant FS as File System
    participant Git as Git Repository
    
    CLI->>Config: Load configurations
    Config->>Config: Resolve collection settings
    Config-->>CLI: Configuration data
    
    CLI->>Sync: Initialize sync process
    Sync->>Config: Load page manifest
    Sync->>Sync: Apply path mappings
    
    loop For Each Document
        Sync->>FS: Check local file exists
        Sync->>Git: Get commit timestamp
        Git-->>Sync: Timestamp or null
        
        Sync->>API: Fetch document info
        API-->>Sync: Document data + updatedAt
        
        Sync->>Sync: Compare timestamps & content
        
        alt Content differs & Remote newer
            Sync->>API: Fetch full document
            API-->>Sync: Document content
            Sync->>FS: Write to local file
            FS-->>Sync: Success
        else Content differs & Local newer
            Sync->>FS: Read local content
            FS-->>Sync: File content
            Sync->>API: Update remote document
            API-->>Sync: Success
        else No changes needed
            Sync->>Sync: Skip document
        end
        
        Sync->>Sync: Process child documents
    end
    
    Sync->>Config: Update manifest with new IDs
    Config->>FS: Persist manifest
    Sync-->>CLI: Sync complete
```

### Configuration Loading Flow

```mermaidjs
flowchart TD
    A[Start] --> B{Top config exists?}
    B -->|No| C[Use defaults]
    B -->|Yes| D[Load top config]
    D --> E[Parse collections]
    E --> F{Collection config exists?}
    F -->|No| G[Create default collection config]
    F -->|Yes| H[Load collection config]
    H --> I[Load pages manifest]
    G --> I
    C --> I
    I --> J[Apply mappings]
    J --> K[Ready for sync]
```


---

## Sync Algorithm

### Conflict Resolution Algorithm

The tool uses a sophisticated conflict resolution strategy:

```mermaidjs
flowchart TD
    A[Compare Documents] --> B[Normalize Content]
    B --> C{Content Equal?}
    C -->|Yes| D[Skip - No Changes]
    C -->|No| E[Get Timestamps]
    
    E --> F[Get Git Timestamp]
    F --> G{Git timestamp available?}
    G -->|Yes| H[Use Git commit time]
    G -->|No| I[Use filesystem mtime]
    
    H --> J[Compare with remote updatedAt]
    I --> J
    
    J --> K{Remote newer by >500ms?}
    K -->|Yes| L[Pull: Remote → Local]
    K -->|No| M{Local newer by >500ms?}
    M -->|Yes| N[Push: Local → Remote]
    M -->|No| O[Skip - Equal timestamps]
    
    L --> P[Backup existing file]
    N --> Q[Update remote document]
    P --> R[Write new content]
    Q --> S[Log success]
    R --> S
    O --> S
    D --> S
    S --> T[End]
```

### Content Normalization

```typescript
function normalizeContentIgnoreWhitespace(content: string): string {
  return content.replace(/\s+/g, "");
}
```

This approach:

* Removes ALL whitespace characters (spaces, tabs, newlines)
* Enables formatting-agnostic comparison
* Prevents unnecessary syncs due to editor differences

### Timestamp Comparison Logic

```mermaidjs
graph TB
    A[Local File] --> B{Git tracked?}
    B -->|Yes| C[git log -1 --format=%ct]
    B -->|No| D["fs.stat().mtimeMs"]
    C --> E[Git Timestamp]
    D --> F[FS Timestamp]
    E --> G[Compare with Remote]
    F --> G
    G --> H{Difference > 500ms?}
    H -->|Yes| I[Sync Required]
    H -->|No| J[Skip Sync]
```

**Rationale for 500ms threshold:**

* Accounts for minor timing differences
* Prevents unnecessary syncs for simultaneous changes
* Balances precision with practical usage


---

## Configuration System

### Configuration Hierarchy

```mermaidjs
graph TB
    subgraph "Global Level"
        A[outline-sync.json] --> B[Collections List]
        B --> C[Default Paths]
    end
    
    subgraph "Collection Level"
        D[collection-id.config.json] --> E[Mapping Rules]
        E --> F[Save Directory]
    end
    
    subgraph "Runtime Level"
        G[collection-id.pages.json] --> H[Document Tree]
        H --> I[File Paths]
    end
    
    A --> D
    D --> G
    
    style A fill:#0B6C00
    style D fill:#02007F
    style G fill:#005F5A
```

### Mapping Resolution Algorithm

```mermaidjs
flowchart TD
    A[Process Document] --> B{ID mapping exists?}
    B -->|Yes| C[Apply ID mapping]
    B -->|No| D{Title mapping exists?}
    D -->|Yes| E[Apply title mapping]
    D -->|No| F[Use inherited path]
    
    C --> G{Path is directory?}
    E --> G
    F --> H[Generate slug-based path]
    
    G -->|Yes| I[Create README.md in directory]
    G -->|No| J[Use exact file path]
    H --> K[parent-dir/slug/README.md]
    
    I --> L[Resolve final path]
    J --> L
    K --> L
    L --> M[Process children with parent context]
```

### Path Resolution Examples

```typescript
// Directory mapping
{
  "match": { "title": "API Guide" },
  "path": "guides/api/"
}
// Result: guides/api/README.md

// File mapping
{
  "match": { "id": "doc-123" },
  "path": "reference/authentication.md"
}
// Result: reference/authentication.md

// Inherited path (no mapping)
// Parent: docs/product/README.md
// Child: "Installation" → docs/product/installation/README.md
```


---

## File Organization Strategy

### Folder-Based Architecture

The tool employs a folder-based file organization strategy:

```mermaidjs
graph LR
    subgraph "Outline Structure"
        A[Product Docs] --> B[Getting Started]
        A --> C[API Reference]
        B --> D[Installation]
        B --> E[Configuration]
        C --> F[Authentication]
    end
    
    subgraph "File System Result"
        G[docs/product-docs/README.md] --> H[docs/product-docs/getting-started/README.md]
        G --> I[docs/product-docs/api-reference/README.md]
        H --> J[docs/product-docs/getting-started/installation/README.md]
        H --> K[docs/product-docs/getting-started/configuration/README.md]
        I --> L[docs/product-docs/api-reference/authentication/README.md]
    end
    
    A -.-> G
    B -.-> H
    C -.-> I
    D -.-> J
    E -.-> K
    F -.-> L
```

**Benefits:**

* Clean URLs when served by static site generators
* Natural hierarchy representation
* SEO-friendly structure
* Easy navigation in file browsers

### Slug Generation Algorithm

```typescript
function slugifyTitle(title: string): string {
  return title
    .toString()
    .normalize("NFKD")          // Decompose Unicode
    .replace(/\p{M}/gu, "")     // Remove diacritics
    .toLowerCase()              // Convert to lowercase
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/(^-|-$)+/g, "")   // Remove leading/trailing hyphens
    .slice(0, 120);             // Limit length
}
```


---

## API Integration

### Outline API Client Architecture

```mermaidjs
sequenceDiagram
    participant App as Application
    participant Client as API Client
    participant Retry as Retry Logic
    participant Outline as Outline API
    
    App->>Client: Request document list
    Client->>Retry: Execute with backoff
    
    loop "Retry Attempts (max 3)"
        Retry->>Outline: POST /api/documents.list
        
        alt "Success (200)"
            Outline-->>Retry: Document data
            Retry-->>Client: Success response
        else "Rate Limited (429)"
            Outline-->>Retry: Rate limit error
            Retry->>Retry: Exponential backoff
        else Other Error
            Outline-->>Retry: Error response
            Retry->>Retry: Linear backoff
        end
    end
    
    Client-->>App: Final result or error
```

### API Request Flow

```mermaidjs
flowchart TD
    A[API Request] --> B[Add Authorization Header]
    B --> C[JSON Serialize Body]
    C --> D[Send POST Request]
    D --> E{Response Status}
    
    E -->|200-299| F[Parse JSON Response]
    E -->|429| G[Rate Limit Backoff]
    E -->|4xx/5xx| H[Error Handling]
    
    G --> I[Wait: attempt * 1000ms]
    I --> J{Retry < 3?}
    J -->|Yes| D
    J -->|No| K[Throw Error]
    
    H --> L{Retry < 3?}
    L -->|Yes| M[Wait: attempt * 500ms]
    L -->|No| K
    M --> D
    
    F --> N[Return Data]
    K --> O[Propagate Error]
```

### Pagination Handling

```typescript

async function listDocumentsInCollection(collectionId: string): Promise<any[]> {
  const out: any[] = [];
  let offset = 0;
  const limit = 100;
  
  while (true) {
    const json = await outlineRequest("documents.list", {
      collectionId,
      offset,
      limit,
    });
    
    const data = json.data || [];
    for (const d of data) out.push(d);
    
    if (data.length < limit) break; // No more pages
    offset += data.length;
  }
  
  return out;
}
```


---

## Error Handling & Recovery

### Error Classification

```mermaidjs
graph LR
    A[Error Occurs] --> B{Error Type}
    
    B -->|Network| C[Connection Issues]
    B -->|API| D[Outline API Errors]
    B -->|File System| E[Local File Errors]
    B -->|Configuration| F[Config Errors]
    
    C --> G[Retry with Backoff]
    D --> H{Status Code}
    E --> I[Permission/Path Checks]
    F --> J[Validation & Defaults]
    
    H -->|401/403| K[Authentication Error]
    H -->|429| L[Rate Limit Handling]
    H -->|500+| M[Server Error Retry]
    H -->|Other| N[Client Error]
    
    G --> O[Success or Fail]
    K --> P[Check API Key]
    L --> Q[Exponential Backoff]
    M --> G
    N --> R[User Action Required]
    I --> S[Fix Permissions]
    J --> T[Use Safe Defaults]
```

### Backup and Recovery

```mermaidjs
flowchart TD
    A[File Write Operation] --> B{File Exists?}
    B -->|Yes| C[Create Backup]
    B -->|No| D[Ensure Directory]
    
    C --> E[Copy to .outline-sync.bak.timestamp]
    E --> F[Write New Content]
    D --> F
    
    F --> G{Write Successful?}
    G -->|Yes| H[Log Success]
    G -->|No| I[Restore from Backup]
    
    I --> J[Copy Backup to Original]
    J --> K[Log Recovery]
    K --> L[Throw Error]
    
    H --> M[Continue Processing]
```

### Safe File Operations

```typescript
async function safeWriteFile(
  filePath: string,
  content: string,
  dryRun = false
) {
  // 1. Create backup if file exists
  if (existsSync(filePath)) {
    const backup = `${filePath}.outline-sync.bak.${Date.now()}`;
    if (!dryRun) {
      await fs.copyFile(filePath, backup);
      logger.info(`Backed up existing file to ${backup}`);
    }
  }
  
  // 2. Ensure directory structure
  if (!dryRun) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
  }
  
  // 3. Write new content
  if (!dryRun) {
    await fs.writeFile(filePath, content, "utf8");
    logger.info(`Wrote file ${filePath} (${content.length} bytes)`);
  }
}
```


---

## Performance Considerations

### Optimization Strategies

```mermaidjs
graph LR
    subgraph "API Optimization"
        direction LR
        A[Request Batching] --> B[Pagination Efficiency]
        B --> C[Rate Limit Respect]
        C --> D[Connection Pooling]
    end
    
    subgraph "File System Optimization"
        direction LR
        E[Bulk Directory Creation] --> F[Parallel File Operations]
        F --> G[Efficient Timestamp Queries]
    end
    
    subgraph "Content Optimization"
        direction LR
        H[Whitespace Normalization] --> I[Content Hashing]
        I --> J[Skip Unchanged Files]
    end
    
    subgraph "Memory Optimization"
        direction LR
        K[Streaming Large Files] --> L[Incremental Processing]
        L --> M[Garbage Collection Hints]
    end
```

### Concurrency Model

```typescript
// Sequential processing to respect API rate limits

for (const collection of collections) {
  await processCollection(collection);
}

// Within collection: sequential to maintain parent-child relationships

async function processPages(pages: PageEntry[], parentId: string | null) {
  for (const page of pages) {
    await syncPage(page, parentId);
    if (page.children?.length) {
      await processPages(page.children, page.id);
    }
  }
}
```

**Rationale:**

* Sequential processing respects API rate limits
* Maintains document hierarchy integrity
* Predictable resource usage
* Easier error handling and recovery

### Caching Strategy

```mermaidjs
graph LR
    A[Request] --> B{Cache Hit?}
    B -->|Yes| C[Return Cached]
    B -->|No| D[Fetch from API]
    D --> E[Store in Cache]
    E --> F[Return Fresh Data]
    
    subgraph "Cache Invalidation"
        direction LR
        G[Time-based TTL] --> H[Content-based Hashing]
        H --> I[Manual Cache Clear]
    end
```

**Current Implementation:**

* No persistent caching (stateless design)
* In-memory caching for single run
* Git timestamp caching for performance

**Future Enhancements:**

* Persistent cache with TTL
* Content-based cache invalidation
* Collection-level cache management


---

## Security Considerations

### API Key Management

```mermaidjs
flowchart TB
    A[API Key Sources] --> B{CLI Flag Provided?}
    B -->|Yes| C[Use CLI Flag]
    B -->|No| D{Environment Variable Set?}
    D -->|Yes| E[Use Environment Variable]
    D -->|No| F[Error: No API Key]
    
    C --> G[Set Environment Variable]
    G --> H[Continue Execution]
    E --> H
    F --> I[Exit with Error]
    
    subgraph "Security Notes"
        J[CLI flags visible in process list]
        K[Environment variables safer]
        L[Consider --api-key-file option]
    end
```

### File System Security

```typescript
// Path validation to prevent directory traversal

function validatePath(filePath: string): boolean {
  const resolved = path.resolve(filePath);
  const cwd = process.cwd();
  return resolved.startsWith(cwd);
}

// Safe file operations with permission checks

async function ensureWritePermissions(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath, fs.constants.W_OK);
  } catch {
    throw new Error(`No write permission for ${dirPath}`);
  }
}
```

### Content Sanitization

```typescript
// Sanitize document titles for safe file names

function sanitizeFileName(title: string): string {
  return title
    .replace(/[<>:"/\\|?*]/g, '-')  // Replace invalid filename chars
    .replace(/\.\./g, '-')          // Prevent parent directory access
    .substring(0, 255);             // Limit filename length
}
```


---

## Conclusion

The outline-sync tool provides a robust, extensible foundation for synchronizing Outline documentation with local markdown files. Its modular architecture, comprehensive error handling, and intelligent conflict resolution make it suitable for both individual use and large-scale documentation workflows.

Key strengths:

* **Reliability**: Comprehensive error handling and recovery mechanisms
* **Flexibility**: Configurable mapping system and multiple sync modes
* **Safety**: Backup system and dry-run capabilities
* **Performance**: Efficient API usage and content comparison algorithms
* **Maintainability**: Clean separation of concerns and modular design

The tool's design principles of safety, configurability, and extensibility ensure it can evolve with changing requirements while maintaining backward compatibility and user trust.