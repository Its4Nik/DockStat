import type { AppConfig } from '@dockstat/typings';

export interface ApiConfig extends AppConfig {
  database?: {
    url: string;
    type: 'postgresql' | 'mysql' | 'sqlite';
  };
}

export class DockstatApi {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  async start(): Promise<void> {
    console.log(`Starting Dockstat API on port ${this.config.port || 3000}`);
  }

  async stop(): Promise<void> {
    console.log('Stopping Dockstat API');
  }
}

export default DockstatApi;
