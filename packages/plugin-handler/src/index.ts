import type DB from "@dockstat/sqlite-wrapper";
import { type QueryBuilder, column } from "@dockstat/sqlite-wrapper";
import type { PLUGIN } from "@dockstat/typings";
import Plugin from "./pluginBuilder";
import { buildPluginLink, logger, validatePlugin } from "./utils";

class PluginHandler {
  private DB: DB;
  private pluginTable: QueryBuilder<PLUGIN.PluginRecord>;
  private loadedPlugins: Map<
    string,
    PLUGIN.RegisteredPlugin<PLUGIN.PluginRecord, any>
  > = new Map();

  constructor(db: DB) {
    this.DB = db;

    this.pluginTable = this.DB.createTable<PLUGIN.PluginRecord>(
      "plugin",
      {
        id: column.id(),
        meta: column.json({ notNull: true }),
        plugin: column.json({}),
      },
      {
        ifNotExists: true,
      }
    );
  }

  private getComponentPath = (fileName: string) => `.components/${fileName}.js`;

  getPlugins() {
    return this.pluginTable.select(["*"]).all();
  }

  getLoadedPlugins() {
    return Array.from(this.loadedPlugins.entries()).map(([name, registry]) => ({
      name,
      meta: registry.instance.meta,
      routes: registry.routes,
    }));
  }

  /**
   * Load a plugin instance from stored configuration
   */
  async loadPlugin(
    pluginData: PLUGIN.PluginRecord
  ): Promise<Plugin<Record<string, unknown>, any>> {
    try {
      // Extract the backend configuration from the stored plugin data
      const { meta } = pluginData;
      const { backendConfig, actions } = pluginData.plugin;

      if (!backendConfig || !actions) {
        throw new Error(
          `Plugin ${pluginData.meta.name} has no backend configuration`
        );
      }

      // Create the Plugin instance
      const plugin = new Plugin<any, any>(
        meta as PLUGIN.PluginMeta,
        backendConfig,
        actions
      );

      if (backendConfig.table?.name) {
        plugin.implementTable(this.DB);
      }

      // Register in the loaded plugins map
      this.loadedPlugins.set(pluginData.meta.name, {
        instance: plugin,
        routes: backendConfig.apiRoutes || {},
        actions: actions,
      });

      logger.debug(`Loaded plugin: ${pluginData.meta.name}`);
      return plugin;
    } catch (error) {
      logger.error(`Failed to load plugin ${pluginData.meta.name}: ${error}`);
      throw error;
    }
  }

  /**
   * Load all registered plugins on startup
   */
  async loadAllPlugins() {
    const plugins = this.getPlugins();
    const results = await Promise.allSettled(
      plugins.map((plugin) => this.loadPlugin(plugin))
    );

    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      logger.warn(`Failed to load ${failed.length} plugins`);
    }

    return {
      loaded: results.filter((r) => r.status === "fulfilled").length,
      failed: failed.length,
    };
  }

  /**
   * Execute a plugin action with support for pre-action hooks
   */
  async executeAction(
    pluginName: string,
    actionName: string,
    params?: Record<string, unknown>,
    previousAction?: unknown
  ) {
    const registry = this.loadedPlugins.get(pluginName);
    if (!registry) {
      throw new Error(`Plugin ${pluginName} not loaded`);
    }

    // Check for pre-action hook
    const preActionName = `pre:${actionName}`;
    if (registry.actions[preActionName]) {
      logger.debug(`Executing pre-action hook: ${preActionName}`);
      await registry.actions[preActionName]({
        table: registry.instance.backendConfig.table,
        db: this.DB,
        params,
        previousAction,
      });
    }

    const action = registry.actions[actionName];
    if (!action) {
      throw new Error(`Action ${actionName} not found in plugin ${pluginName}`);
    }

    return await action({
      table: registry.instance.backendConfig.table,
      db: this.DB,
      params,
      previousAction,
    });
  }

  /**
   * Execute a route with multiple chained actions and pre-action hooks
   */
  async executeRoute(
    pluginName: string,
    routeName: string,
    params?: Record<string, unknown>
  ) {
    const registry = this.loadedPlugins.get(pluginName);
    if (!registry) {
      throw new Error(`Plugin ${pluginName} not loaded`);
    }

    const route = registry.routes[routeName];
    if (!route) {
      throw new Error(`Route ${routeName} not found in plugin ${pluginName}`);
    }

    let previousResult: unknown = undefined;
    const results: Record<string, unknown> = {};

    // Check for route-level pre-action
    const routePreAction = `pre:${routeName}`;
    if (registry.actions[routePreAction]) {
      logger.debug(`Executing route-level pre-action: ${routePreAction}`);
      const preResult = await this.executeAction(
        pluginName,
        routePreAction,
        params,
        undefined
      );
      results[routePreAction] = preResult;
      previousResult = preResult;
    }

    // Execute actions in sequence, passing previous results
    for (const actionName of route.actions) {
      const result = await this.executeAction(
        pluginName,
        actionName,
        params,
        previousResult
      );
      results[actionName] = result;
      previousResult = result;
    }

    return results;
  }

  runPreAction(pluginName: string, actionName?: string) {
    const registry = this.loadedPlugins.get(pluginName);
    let action: any;
    if (!registry) {
      throw new Error(`Plugin ${pluginName} not loaded`);
    }
    if (!actionName) {
      action = registry.actions.pre;
    } else {
      action = registry.actions[`pre:${actionName}`];
    }
    if (!action) {
      logger.error(`Action ${actionName} not found in plugin ${pluginName}`);
    }
    return action.pre({
      table: registry.instance.backendConfig.table,
      db: this.DB,
      logger: logger,
      previousAction: undefined,
    });
  }

  registerPlugin(data: PLUGIN.PluginRecord) {
    validatePlugin(data);

    const insertRes = this.pluginTable.insertAndGet(data);
    if (!insertRes?.id) {
      throw new Error(`Could not register ${data.meta.name}`);
    }

    // Load the plugin immediately after registration
    this.loadPlugin(insertRes).catch((error) => {
      logger.error(`Failed to load newly registered plugin: ${error}`);
    });

    if (data.plugin.frontendConfig) {
      this.writeFrontendComponent(data);
    }

    return insertRes;
  }

  async updatePlugin(id: number) {
    const plugin = this.pluginTable.select(["*"]).where({ id: id }).first();
    if (!plugin) {
      throw new Error(`Plugin with id: ${id} not found`);
    }

    // Unload the current plugin instance if loaded
    if (this.loadedPlugins.has(plugin.meta.name)) {
      this.unloadPlugin(plugin.meta.name);
    }

    const newPluginData = (await (
      await fetch(buildPluginLink(plugin.meta.repository, plugin.meta.path))
    ).json()) as PLUGIN.PluginRecord;

    if (plugin.meta.version === newPluginData.meta.version) {
      throw new Error("Plugin Version cannot stay the same when updating");
    }

    const res = this.pluginTable.where({ id: id }).update(newPluginData);

    const updatedPlugin = this.pluginTable
      .select(["*"])
      .where({ id: id })
      .first();

    if (updatedPlugin) {
      await this.loadPlugin(updatedPlugin);
    }

    return res;
  }

  deletePlugin(id: number) {
    const plugin = this.pluginTable.select(["*"]).where({ id: id }).first();
    if (plugin && this.loadedPlugins.has(plugin.meta.name)) {
      this.unloadPlugin(plugin.meta.name);
    }

    return this.pluginTable.where({ id: id }).delete();
  }

  /**
   * Unload a plugin from memory
   */
  unloadPlugin(pluginName: string) {
    const registry = this.loadedPlugins.get(pluginName);
    if (registry) {
      // Clean up any plugin-specific tables if needed
      if (registry.instance.backendConfig.table?.name) {
        logger.debug(
          `Unloading plugin ${pluginName} with table ${registry.instance.backendConfig.table?.name}`
        );
      }
      this.loadedPlugins.delete(pluginName);
    }
  }

  /**
   * Get a specific loaded plugin instance
   */
  getPluginInstance(
    pluginName: string
  ): PLUGIN.Plugin<PLUGIN.PluginRecord, any> | undefined | undefined {
    return this.loadedPlugins.get(pluginName)?.instance;
  }

  /**
   * Check if a plugin is loaded
   */
  isPluginLoaded(pluginName: string): boolean {
    return this.loadedPlugins.has(pluginName);
  }

  private writeFrontendComponent(data: PLUGIN.PluginRecord) {
    try {
      if (!data.plugin.frontendConfig) {
        logger.debug(`Plugin ${data.meta.name} has no Frontend Page`);
        return;
      }

      const file = Bun.file(
        this.getComponentPath(`${data.meta.name}-component`)
      );

      file.write(JSON.stringify(data.plugin.frontendConfig));
    } catch (error) {
      throw new Error(`${error}`);
    }
  }
}

export default PluginHandler;
