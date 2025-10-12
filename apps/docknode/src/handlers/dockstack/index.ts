import { createLogger } from "@dockstat/logger";
import Elysia, { t } from "elysia";
import { getSubdirectories, writeFile } from "./fileHandler";

export const dockStackLogger = createLogger("dockstack");

export const dockstack = new Elysia({ prefix: "/dockstack" });

dockstack.get("/", async () => {
  return await getSubdirectories("./stacks");
});

dockstack.post(
  "/deploy/:id/:name",
  ({ params, body }) => {
    dockStackLogger.info(`Deploying stack with ID: ${params.id}`);
    writeFile(params.id, params.name, body.data).catch((err) => {
      dockStackLogger.error(`Error writing stack file: ${err}`);
      throw new Error(`Error writing stack file: ${err}`);
    });
    return { success: true, message: `Stack ${params.id} deployed.` };
  },
  {
    params: t.Object({ id: t.Number(), name: t.String() }),
    body: t.Object({
      data: t.String(),
    }),
  }
);
