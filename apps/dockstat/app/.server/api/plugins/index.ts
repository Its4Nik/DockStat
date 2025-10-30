import Elysia, { t } from "elysia";
import PluginHandlerFactory from "@dockstat/plugin-handler";
import { DockStatDB } from "~/.server/db";
import { Elogger } from "../handlers";
import type { QueryBuilder } from "@dockstat/sqlite-wrapper";
import type { DBPluginShemaT } from "@dockstat/typings/types";
import { DBPluginShema } from "@dockstat/typings/schemas";

export const PluginHandler = new PluginHandlerFactory(
  DockStatDB._sqliteWrapper,
  Elogger.getParentsForLoggerChaining()
);

const PluginTable: QueryBuilder<DBPluginShemaT> = PluginHandler.getTable();

const PluginElysiaInstance = new Elysia({
  prefix: "/plugins",
  detail: { tags: ["Plugins"] },
})
  .get("/all", () => PluginTable.select(["*"]).all())
  .get("/status", () => PluginHandler.getStatus())
  .post("/install", ({ body }) => PluginHandler.savePlugin(body), {
    body: DBPluginShema,
  })
  .post(
    "/install/url",
    ({ body }) => PluginHandler.installFromManifestLink(body),
    { body: t.String() }
  )
  .post(
    "/activate",
    async ({ body }) => await PluginHandler.loadPlugins(body),
    {
      body: t.Array(t.Number()),
      response: t.Object({
        successes: t.Array(t.Number()),
        errors: t.Array(t.Number()),
      }),
    }
  )
  .post("/delete", ({ body }) => PluginHandler.deletePlugin(body), {
    body: t.Number(),
  })
  .post(
    "/:id/routes/*",
    async ({ request, params }) => PluginHandler.handleRoute(request, params),
    {
      detail: {
        description:
          "This route proxies all Plugin-API requests to the specified Plugin's Elysia Instance",
      },
    }
  );

export default PluginElysiaInstance;
