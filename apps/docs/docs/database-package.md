# Database Package (@dockstat/db)

The `@dockstat/db` package provides a centralized database layer for the DockStat ecosystem, offering type-safe database operations, schema management, and data access patterns for Docker container statistics and configuration.

## 🏗️ Architecture

### Tech Stack

- **Runtime**: Bun native
- **Database**: SQLite with WAL mode
- **Wrapper**: `@dockstat/sqlite-wrapper`
- **Types**: `@dockstat/typings`
- **Language**: TypeScript (strict mode)

### Key Dependencies

```json
{
  "@dockstat/typings": "workspace:*",
  "@dockstat/sqlite-wrapper": "workspace:*"
}
```

## 🚀 Features

### Core Functionality

- **Container Statistics**: Real-time and historical container metrics
- **Host Management**: Docker host configuration and monitoring
- **User Configuration**: Application settings and preferences
- **Plugin Data**: Plugin-specific data storage
- **Migration System**: Schema versioning and upgrades
- **Query Builder**: Type-safe database queries
- **Connection Pooling**: Efficient database connections
- **Transaction Support**: ACID transaction management

### Database Schema

```typescript
interface DatabaseSchema {
  containers: ContainerRecord;
  hosts: HostRecord;
  container_stats: ContainerStatsRecord;
  host_stats: HostStatsRecord;
  configurations: ConfigurationRecord;
  plugins: PluginDataRecord;
  migrations: MigrationRecord;
}
```

## 📁 Project Structure

```
packages/db/
├── src/
│   ├── models/              # Database models
│   │   ├── container.ts     # Container operations
│   │   ├── host.ts          # Host management
│   │   ├── stats.ts         # Statistics operations
│   │   └── config.ts        # Configuration management
│   ├── migrations/          # Database migrations
│   │   ├── 001_initial.ts   # Initial schema
│   │   ├── 002_stats.ts     # Statistics tables
│   │   └── index.ts         # Migration registry
│   ├── queries/             # Pre-built queries
│   │   ├── container.ts     # Container queries
│   │   ├── host.ts          # Host queries
│   │   └── stats.ts         # Statistics queries
│   ├── utils/               # Database utilities
│   │   ├── connection.ts    # Connection management
│   │   ├── transactions.ts  # Transaction helpers
│   │   └── validation.ts    # Data validation
│   ├── types.ts             # Database-specific types
│   └── index.ts             # Main exports
├── tests/                   # Test files
├── build.ts                 # Build configuration
└── package.json             # Package configuration
```

## 🛠️ Core Models

### Container Model

```typescript
export class ContainerModel {
  constructor(private db: SQLiteWrapper) {}
  
  async createContainer(data: CreateContainerData): Promise<Container> {
    const query = this.db.insert('containers')
      .values({
        id: data.id,
        name: data.name,
        image: data.image,
        hostId: data.hostId,
        status: data.status,
        state: data.state,
        created: new Date(),
        updated: new Date()
      });
    
    await query.execute();
    return this.getContainer(data.id);
  }
  
  async getContainer(id: string): Promise<Container | null> {
    const query = this.db.select()
      .from('containers')
      .where('id', '=', id);
    
    const result = await query.execute();
    return result[0] || null;
  }
  
  async getContainersByHost(hostId: string): Promise<Container[]> {
    const query = this.db.select()
      .from('containers')
      .where('hostId', '=', hostId)
      .orderBy('name', 'asc');
    
    return await query.execute();
  }
  
  async updateContainer(id: string, data: UpdateContainerData): Promise<void> {
    const query = this.db.update('containers')
      .set({
        ...data,
        updated: new Date()
      })
      .where('id', '=', id);
    
    await query.execute();
  }
  
  async deleteContainer(id: string): Promise<void> {
    const query = this.db.delete()
      .from('containers')
      .where('id', '=', id);
    
    await query.execute();
  }
  
  async searchContainers(filters: ContainerFilters): Promise<Container[]> {
    let query = this.db.select().from('containers');
    
    if (filters.name) {
      query = query.where('name', 'LIKE', `%${filters.name}%`);
    }
    
    if (filters.state) {
      query = query.where('state', '=', filters.state);
    }
    
    if (filters.hostId) {
      query = query.where('hostId', '=', filters.hostId);
    }
    
    return await query.execute();
  }
}
```

### Host Model

```typescript
export class HostModel {
  constructor(private db: SQLiteWrapper) {}
  
  async createHost(data: CreateHostData): Promise<Host> {
    const query = this.db.insert('hosts')
      .values({
        id: data.id,
        name: data.name,
        address: data.address,
        port: data.port,
        secure: data.secure || false,
        enabled: true,
        created: new Date(),
        updated: new Date()
      });
    
    await query.execute();
    return this.getHost(data.id);
  }
  
  async getHost(id: string): Promise<Host | null> {
    const query = this.db.select()
      .from('hosts')
      .where('id', '=', id);
    
    const result = await query.execute();
    return result[0] || null;
  }
  
  async getAllHosts(): Promise<Host[]> {
    const query = this.db.select()
      .from('hosts')
      .where('enabled', '=', true)
      .orderBy('name', 'asc');
    
    return await query.execute();
  }
  
  async updateHostStatus(id: string, status: HostStatus): Promise<void> {
    const query = this.db.update('hosts')
      .set({
        status,
        lastSeen: new Date(),
        updated: new Date()
      })
      .where('id', '=', id);
    
    await query.execute();
  }
  
  async getHostStats(id: string, timeRange?: TimeRange): Promise<HostStats[]> {
    let query = this.db.select()
      .from('host_stats')
      .where('hostId', '=', id)
      .orderBy('timestamp', 'desc');
    
    if (timeRange) {
      query = query.where('timestamp', '>=', timeRange.start)
                   .where('timestamp', '<=', timeRange.end);
    }
    
    return await query.execute();
  }
}
```

### Statistics Model

```typescript
export class StatsModel {
  constructor(private db: SQLiteWrapper) {}
  
  async recordContainerStats(stats: ContainerStats): Promise<void> {
    const query = this.db.insert('container_stats')
      .values({
        containerId: stats.containerId,
        hostId: stats.hostId,
        cpuUsage: stats.cpuUsage,
        memoryUsage: stats.memoryUsage,
        memoryLimit: stats.memoryLimit,
        networkRx: stats.networkRx,
        networkTx: stats.networkTx,
        diskRead: stats.diskRead,
        diskWrite: stats.diskWrite,
        timestamp: new Date()
      });
    
    await query.execute();
  }
  
  async getContainerStats(containerId: string, timeRange?: TimeRange): Promise<ContainerStats[]> {
    let query = this.db.select()
      .from('container_stats')
      .where('containerId', '=', containerId)
      .orderBy('timestamp', 'desc');
    
    if (timeRange) {
      query = query.where('timestamp', '>=', timeRange.start)
                   .where('timestamp', '<=', timeRange.end);
    }
    
    return await query.execute();
  }
  
  async getLatestContainerStats(containerId: string): Promise<ContainerStats | null> {
    const query = this.db.select()
      .from('container_stats')
      .where('containerId', '=', containerId)
      .orderBy('timestamp', 'desc')
      .limit(1);
    
    const result = await query.execute();
    return result[0] || null;
  }
  
  async recordHostStats(stats: HostStats): Promise<void> {
    const query = this.db.insert('host_stats')
      .values({
        hostId: stats.hostId,
        cpuUsage: stats.cpuUsage,
        memoryUsage: stats.memoryUsage,
        memoryTotal: stats.memoryTotal,
        diskUsage: stats.diskUsage,
        diskTotal: stats.diskTotal,
        networkRx: stats.networkRx,
        networkTx: stats.networkTx,
        containerCount: stats.containerCount,
        timestamp: new Date()
      });
    
    await query.execute();
  }
  
  async cleanupOldStats(retentionDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const containerStatsQuery = this.db.delete()
      .from('container_stats')
      .where('timestamp', '<', cutoffDate);
    
    const hostStatsQuery = this.db.delete()
      .from('host_stats')
      .where('timestamp', '<', cutoffDate);
    
    const [containerResult, hostResult] = await Promise.all([
      containerStatsQuery.execute(),
      hostStatsQuery.execute()
    ]);
    
    return containerResult.changes + hostResult.changes;
  }
}
```

### Configuration Model

```typescript
export class ConfigModel {
  constructor(private db: SQLiteWrapper) {}
  
  async getConfig<T = any>(key: string): Promise<T | null> {
    const query = this.db.select()
      .from('configurations')
      .where('key', '=', key);
    
    const result = await query.execute();
    if (!result[0]) return null;
    
    try {
      return JSON.parse(result[0].value);
    } catch {
      return result[0].value;
    }
  }
  
  async setConfig<T = any>(key: string, value: T): Promise<void> {
    const serializedValue = typeof value === 'string' 
      ? value 
      : JSON.stringify(value);
    
    const query = this.db.insert('configurations')
      .values({
        key,
        value: serializedValue,
        updated: new Date()
      })
      .onConflict('key')
      .doUpdate({
        value: serializedValue,
        updated: new Date()
      });
    
    await query.execute();
  }
  
  async deleteConfig(key: string): Promise<void> {
    const query = this.db.delete()
      .from('configurations')
      .where('key', '=', key);
    
    await query.execute();
  }
  
  async getAllConfigs(): Promise<Record<string, any>> {
    const query = this.db.select()
      .from('configurations');
    
    const results = await query.execute();
    const configs: Record<string, any> = {};
    
    for (const row of results) {
      try {
        configs[row.key] = JSON.parse(row.value);
      } catch {
        configs[row.key] = row.value;
      }
    }
    
    return configs;
  }
}
```

## 🔄 Migration System

### Migration Structure

```typescript
export interface Migration {
  version: number;
  name: string;
  up: (db: SQLiteWrapper) => Promise<void>;
  down: (db: SQLiteWrapper) => Promise<void>;
}
```

### Initial Migration

```typescript
// migrations/001_initial.ts
export const migration001: Migration = {
  version: 1,
  name: 'initial_schema',
  
  async up(db: SQLiteWrapper): Promise<void> {
    // Create hosts table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS hosts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        port INTEGER NOT NULL DEFAULT 2375,
        secure BOOLEAN NOT NULL DEFAULT 0,
        enabled BOOLEAN NOT NULL DEFAULT 1,
        status TEXT DEFAULT 'unknown',
        lastSeen DATETIME,
        created DATETIME NOT NULL,
        updated DATETIME NOT NULL
      )
    `);
    
    // Create containers table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS containers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        image TEXT NOT NULL,
        hostId TEXT NOT NULL,
        status TEXT NOT NULL,
        state TEXT NOT NULL,
        created DATETIME NOT NULL,
        updated DATETIME NOT NULL,
        FOREIGN KEY (hostId) REFERENCES hosts(id) ON DELETE CASCADE
      )
    `);
    
    // Create configurations table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS configurations (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated DATETIME NOT NULL
      )
    `);
    
    // Create migrations table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        executed DATETIME NOT NULL
      )
    `);
  },
  
  async down(db: SQLiteWrapper): Promise<void> {
    await db.execute('DROP TABLE IF EXISTS migrations');
    await db.execute('DROP TABLE IF EXISTS configurations');
    await db.execute('DROP TABLE IF EXISTS containers');
    await db.execute('DROP TABLE IF EXISTS hosts');
  }
};
```

### Statistics Migration

```typescript
// migrations/002_stats.ts
export const migration002: Migration = {
  version: 2,
  name: 'statistics_tables',
  
  async up(db: SQLiteWrapper): Promise<void> {
    // Container statistics
    await db.execute(`
      CREATE TABLE IF NOT EXISTS container_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        containerId TEXT NOT NULL,
        hostId TEXT NOT NULL,
        cpuUsage REAL NOT NULL,
        memoryUsage INTEGER NOT NULL,
        memoryLimit INTEGER NOT NULL,
        networkRx INTEGER NOT NULL DEFAULT 0,
        networkTx INTEGER NOT NULL DEFAULT 0,
        diskRead INTEGER NOT NULL DEFAULT 0,
        diskWrite INTEGER NOT NULL DEFAULT 0,
        timestamp DATETIME NOT NULL,
        FOREIGN KEY (containerId) REFERENCES containers(id) ON DELETE CASCADE,
        FOREIGN KEY (hostId) REFERENCES hosts(id) ON DELETE CASCADE
      )
    `);
    
    // Host statistics
    await db.execute(`
      CREATE TABLE IF NOT EXISTS host_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hostId TEXT NOT NULL,
        cpuUsage REAL NOT NULL,
        memoryUsage INTEGER NOT NULL,
        memoryTotal INTEGER NOT NULL,
        diskUsage INTEGER NOT NULL DEFAULT 0,
        diskTotal INTEGER NOT NULL DEFAULT 0,
        networkRx INTEGER NOT NULL DEFAULT 0,
        networkTx INTEGER NOT NULL DEFAULT 0,
        containerCount INTEGER NOT NULL DEFAULT 0,
        timestamp DATETIME NOT NULL,
        FOREIGN KEY (hostId) REFERENCES hosts(id) ON DELETE CASCADE
      )
    `);
    
    // Indexes for performance
    await db.execute('CREATE INDEX IF NOT EXISTS idx_container_stats_container_timestamp ON container_stats(containerId, timestamp)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_host_stats_host_timestamp ON host_stats(hostId, timestamp)');
  },
  
  async down(db: SQLiteWrapper): Promise<void> {
    await db.execute('DROP INDEX IF EXISTS idx_host_stats_host_timestamp');
    await db.execute('DROP INDEX IF EXISTS idx_container_stats_container_timestamp');
    await db.execute('DROP TABLE IF EXISTS host_stats');
    await db.execute('DROP TABLE IF EXISTS container_stats');
  }
};
```

### Migration Runner

```typescript
export class MigrationRunner {
  constructor(private db: SQLiteWrapper) {}
  
  async runMigrations(): Promise<void> {
    const currentVersion = await this.getCurrentVersion();
    const migrations = this.getMigrations();
    
    for (const migration of migrations) {
      if (migration.version > currentVersion) {
        console.log(`Running migration: ${migration.name}`);
        
        await this.db.transaction(async () => {
          await migration.up(this.db);
          await this.recordMigration(migration);
        });
        
        console.log(`Migration completed: ${migration.name}`);
      }
    }
  }
  
  private async getCurrentVersion(): Promise<number> {
    try {
      const result = await this.db.select()
        .from('migrations')
        .orderBy('version', 'desc')
        .limit(1)
        .execute();
      
      return result[0]?.version || 0;
    } catch {
      return 0;
    }
  }
  
  private async recordMigration(migration: Migration): Promise<void> {
    await this.db.insert('migrations')
      .values({
        version: migration.version,
        name: migration.name,
        executed: new Date()
      })
      .execute();
  }
  
  private getMigrations(): Migration[] {
    return [
      migration001,
      migration002
      // Add new migrations here
    ].sort((a, b) => a.version - b.version);
  }
}
```

## 🔧 Database Connection

### Connection Manager

```typescript
export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private db: SQLiteWrapper | null = null;
  
  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }
  
  async connect(dbPath?: string): Promise<SQLiteWrapper> {
    if (this.db) {
      return this.db;
    }
    
    const path = dbPath || process.env.DATABASE_PATH || './dockstat.db';
    
    this.db = new SQLiteWrapper(path, {
      wal: true,
      timeout: 5000,
      busyTimeout: 5000
    });
    
    // Run migrations
    const migrationRunner = new MigrationRunner(this.db);
    await migrationRunner.runMigrations();
    
    return this.db;
  }
  
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
  
  getConnection(): SQLiteWrapper {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }
}
```

## 📊 Query Helpers

### Pre-built Queries

```typescript
export const ContainerQueries = {
  getRunningContainers: (db: SQLiteWrapper) => 
    db.select()
      .from('containers')
      .where('state', '=', 'running'),
  
  getContainersByImage: (db: SQLiteWrapper, image: string) =>
    db.select()
      .from('containers')
      .where('image', 'LIKE', `%${image}%`),
  
  getContainersWithStats: (db: SQLiteWrapper) =>
    db.select()
      .from('containers')
      .leftJoin('container_stats', 'containers.id', 'container_stats.containerId')
      .groupBy('containers.id'),
      
  getRecentlyUpdated: (db: SQLiteWrapper, hours: number = 24) => {
    const since = new Date();
    since.setHours(since.getHours() - hours);
    
    return db.select()
      .from('containers')
      .where('updated', '>=', since)
      .orderBy('updated', 'desc');
  }
};

export const StatsQueries = {
  getLatestStats: (db: SQLiteWrapper) =>
    db.select()
      .from('container_stats')
      .where('timestamp', '>=', 
        db.select('MAX(timestamp)').from('container_stats')
      ),
  
  getAverageResourceUsage: (db: SQLiteWrapper, containerId: string, hours: number = 24) => {
    const since = new Date();
    since.setHours(since.getHours() - hours);
    
    return db.select()
      .from('container_stats')
      .select(['AVG(cpuUsage) as avgCpu', 'AVG(memoryUsage) as avgMemory'])
      .where('containerId', '=', containerId)
      .where('timestamp', '>=', since);
  },
  
  getResourceTrends: (db: SQLiteWrapper, containerId: string, days: number = 7) => {
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    return db.select()
      .from('container_stats')
      .where('containerId', '=', containerId)
      .where('timestamp', '>=', since)
      .orderBy('timestamp', 'asc');
  }
};
```

## 🧪 Testing

### Test Setup

```typescript
// tests/setup.ts
import { DatabaseConnection } from '../src/index';

export async function setupTestDatabase(): Promise<void> {
  const db = DatabaseConnection.getInstance();
  await db.connect(':memory:'); // Use in-memory database for tests
}

export async function cleanupTestDatabase(): Promise<void> {
  const db = DatabaseConnection.getInstance();
  await db.close();
}
```

### Model Tests

```typescript
// tests/container.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { ContainerModel } from '../src/models/container';
import { setupTestDatabase, cleanupTestDatabase } from './setup';

describe('ContainerModel', () => {
  let containerModel: ContainerModel;
  
  beforeEach(async () => {
    await setupTestDatabase();
    const db = DatabaseConnection.getInstance().getConnection();
    containerModel = new ContainerModel(db);
  });
  
  afterEach(async () => {
    await cleanupTestDatabase();
  });
  
  it('should create a container', async () => {
    const containerData = {
      id: 'test-container',
      name: 'test',
      image: 'nginx:latest',
      hostId: 'test-host',
      status: 'running',
      state: 'running'
    };
    
    const container = await containerModel.createContainer(containerData);
    expect(container.id).toBe(containerData.id);
    expect(container.name).toBe(containerData.name);
  });
  
  it('should get containers by host', async () => {
    // Create test containers
    await containerModel.createContainer({
      id: 'container1',
      name: 'test1',
      image: 'nginx:latest',
      hostId: 'host1',
      status: 'running',
      state: 'running'
    });
    
    await containerModel.createContainer({
      id: 'container2',
      name: 'test2',
      image: 'redis:latest',
      hostId: 'host1',
      status: 'running',
      state: 'running'
    });
    
    const containers = await containerModel.getContainersByHost('host1');
    expect(containers).toHaveLength(2);
  });
});
```

## 🚀 Usage Examples

### Basic Usage

```typescript
import { DatabaseConnection, ContainerModel, HostModel, StatsModel } from '@dockstat/db';

// Initialize database connection
const dbConnection = DatabaseConnection.getInstance();
await dbConnection.connect('./dockstat.db');

const db = dbConnection.getConnection();
const containerModel = new ContainerModel(db);
const hostModel = new HostModel(db);
const statsModel = new StatsModel(db);

// Create a host
const host = await hostModel.createHost({
  id: 'localhost',
  name: 'Local Docker',
  address: 'localhost',
  port: 2375,
  secure: false
});

// Create a container
const container = await containerModel.createContainer({
  id: 'nginx-container',
  name: 'nginx',
  image: 'nginx:latest',
  hostId: 'localhost',
  status: 'running',
  state: 'running'
});

// Record statistics
await statsModel.recordContainerStats({
  containerId: 'nginx-container',
  hostId: 'localhost',
  cpuUsage: 0.5,
  memoryUsage: 134217728, // 128MB
  memoryLimit: 536870912, // 512MB
  networkRx: 1024,
  networkTx: 2048,
  diskRead: 0,
  diskWrite: 512
});
```

### Advanced Queries

```typescript
// Get containers with recent high CPU usage
const highCpuContainers = await db.select()
  .from('containers')
  .innerJoin('container_stats', 'containers.id', 'container_stats.containerId')
  .where('container_stats.cpuUsage', '>', 0.8)
  .where('container_stats.timestamp', '>=', new Date(Date.now() - 3600000)) // Last hour
  .groupBy('containers.id')
  .execute();

// Get host resource utilization summary
const hostSummary = await db.select()
  .from('hosts')
  .leftJoin('host_stats', 'hosts.id', 'host_stats.hostId')
  .select([
    'hosts.name',
    'AVG(host_stats.cpuUsage) as avgCpu',
    'AVG(host_stats.memoryUsage) as avgMemory',
    'MAX(host_stats.containerCount) as maxContainers'
  ])
  .where('host_stats.timestamp', '>=', new Date(Date.now() - 86400000)) // Last 24 hours
  .groupBy('hosts.id')
  .execute();
```

## 🔧 Configuration

### Environment Variables

```bash
# Database configuration
DATABASE_PATH=./dockstat.db
DATABASE_WAL_MODE=true
DATABASE_TIMEOUT=5000
DATABASE_BUSY_TIMEOUT=5000

# Retention settings
STATS_RETENTION_DAYS=30
LOG_RETENTION_DAYS=7
```

### Database Options

```typescript
interface DatabaseOptions {
  path?: string;
  wal?: boolean;
  timeout?: number;
  busyTimeout?: number;
  retentionDays?: number;
}
```

The `@dockstat/db` package provides a robust, type-safe database layer that handles all data persistence needs for the DockStat ecosystem, from real-time container statistics to configuration management.