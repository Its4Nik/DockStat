import type { PluginActions } from "@dockstat/typings";
import type {
  DockStacksDeployConfig,
  DockStacksMeta,
  DockStacksTable,
} from "./types";

export const actions: PluginActions<DockStacksTable> = {
  // Action that always runs before any other action, can be used for validation, logging, authentication, etc.
  pre: ({ table, dockerClient }) => {
    if (!table) {
      throw new Error("Table has not been initialized");
    }
    if (!dockerClient) {
      throw new Error("Docker client not initialized");
    }
  },
  saveStack: async ({ params, table, logger }) => {
    const pParams = {
      ...params,
      compose: JSON.stringify((params as { compose: unknown }).compose || {}),
    } as {
      name: string;
      meta: DockStacksMeta;
      compose: string;
      stackDeployConfig: DockStacksDeployConfig;
    };

    if (
      !pParams.name ||
      !pParams.compose ||
      !pParams.meta ||
      !pParams.stackDeployConfig
    ) {
      throw new Error(
        `Missing required parameters to save stack name=${pParams.name} meta=${pParams.meta} compose=${pParams.compose} stackDeployConfig=${pParams.stackDeployConfig}`
      );
    }

    try {
      table?.insertOrFail({
        name: pParams.name,
        stackMeta: pParams.meta,
        compose: pParams.compose,
        stackDeployConfig: pParams.stackDeployConfig,
      });
    } catch (error) {
      logger.error(`Error inserting stack: ${error}`);
      throw new Error(`Error inserting stack: ${error}`);
    }

    //return await writeStackToDisk(
    //pParams.name,
    //   pParams.compose,
    //    pParams.stackDeployConfig
    //    );
  },
  startStack: ({ params }) => {
    const { id } = params as { id: number };
    if (!id) {
      throw new Error("Missing required parameter: id");
    }
  },
};
