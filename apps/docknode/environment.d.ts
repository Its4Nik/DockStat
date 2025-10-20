declare module "bun" {
  interface Env {
    DOCKNODE_DOCKSTACK_AUTH_PSK?: string;
    DOCKNODE_DOCKSTACK_DEV_AUTH?: string;
    DOCKNODE_DOCKSTACK_AUTH_PRIORITY: string;
    PORT?: string;
    NODE_ENV: "development" | "production" | "test";
  }
}
