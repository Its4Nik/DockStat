import type { DashboardConfig } from "@/types";
import type Logger from "@dockstat/logger";
import type DB from "@dockstat/sqlite-wrapper";
import { column, type QueryBuilder } from "@dockstat/sqlite-wrapper";
import Elysia, { t } from "elysia";
import { DashboardModel } from "./model";

export class DashboardHandler {
  db: DB;
  table: QueryBuilder<DashboardConfig>;
  logger: Logger;

  constructor(db: DB, logger: Logger) {
    this.logger = logger.spawn("WidgetHandler");
    this.db = db;

    this.table = this.db.createTable<DashboardConfig>(
      "dashboards",
      {
        name: column.text(),
        id: column.text(),
        createdAt: column.date(),
        description: column.text(),
        updatedAt: column.date(),
        version: column.text(),
        grid: column.json(),
        widgets: column.json(),
        settings: column.json(),
      },
      {
        ifNotExists: true,
      },
    );
  }

  getRoutes() {
    return new Elysia({
      prefix: "/dashboards",
      detail: { tags: ["Dashboards"] },
    })
      .get("/", () => this.table.select(["*"]).all(), {
        response: t.Array(DashboardModel.DashboardConfig),
      })
      .post("/", ({ body }) => this.table.insert(body), {
        body: DashboardModel.DashboardConfig,
      })
      .patch(
        "/",
        ({ body }) => this.table.where({ id: body.id }).update(body),
        {
          body: DashboardModel.DashboardConfig,
        },
      )
      .delete("/", ({ body }) => this.table.where({ id: body.id }).delete(), {
        body: t.Object({ id: t.String() }),
      });
  }

  getTable() {
    return this.table;
  }
}
