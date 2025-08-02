// Export common types used across the monorepo
export interface BaseConfig {
  name: string;
  version: string;
}

export interface AppConfig extends BaseConfig {
  port?: number;
  host?: string;
}

export interface PackageConfig extends BaseConfig {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}
