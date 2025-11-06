import { Repo } from "@dockstat/typings/schemas";
import { getRemotePluginManifest } from "./parsers"
import Elysia, { t } from "elysia";
import { Elogger } from "../handlers";
import Logger from "@dockstat/logger";

export const logger = new Logger("Extensions", Elogger.getParentsForLoggerChaining())

const ExtensionElysiaInstance = new Elysia({ prefix: "/extensions", detail: { tags: ["Extensions"] } })
  .post("/plugin/manifest", async ({ body }) => await getRemotePluginManifest(body.repoType, body.repoSource, body.pluginName), {
    body: t.Object({
      pluginName: t.String(),
      repoSource: t.String(),
      repoType: Repo.properties.type
    })
  })

export default ExtensionElysiaInstance
