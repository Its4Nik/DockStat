export type DockStacksTable = {
  id: number;
  name: string;
  stackMeta: DockStacksMeta;
  stackDeployConfig: DockStacksDeployConfig;
  compose: unknown;
};

export type DockStacksMeta = {
  name: string;
  description: string;
  version: string;
  repository: string;
  path: string;
  author: { name: string; website?: string; email?: string };
  tags: string[];
};

export type DockStacksDeployConfig = {
  targetHost: number;
  variables: Record<string, string>; // Placeholder variables for the compose file (e.g., {{VAR_NAME}}
};
