import Elysia from "elysia";
import PluginHandlerFactory from "@dockstat/plugin-handler";
import { DockStatDB } from "~/.server/db";
import { Elogger } from "../handlers";

const PluginHandler = new PluginHandlerFactory(
  DockStatDB._sqliteWrapper,
  Elogger.getParentsForLoggerChaining()
);
export const PluginTable = PluginHandler.getTable();

const PluginElysiaInstance = new Elysia({ prefix: "/plugins" })
  .get("/", () => PluginTable.select(["*"]).all())
  .get("/status", () => {
    const installedPlugins: number = PluginTable.select(["*"]).count();
  })
  .post("/install", async () => {})
  .post("/delete", async () => {})
  .post("/routes/*", async () => {});

export default PluginElysiaInstance;
