import { rm } from "node:fs/promises";
import Logger from "@dockstat/logger";
import openapi from "@elysiajs/openapi";
import Elysia, { t } from "elysia";
import { getStackDir, writeDockerCompose } from "./src/deployStack";

export const dockStackLogger = new Logger("DockStack", ["DockNode"]);

export const DockStackHandler = new Elysia({ prefix: "/dockstack" })
  .use(
    openapi({
      path: "/docs",
      provider: "scalar",
    })
  )
  .post(
    "/deploy",
    async ({ body }) => {
      try {
        await writeDockerCompose(body.id, body.name, body.vars, body.data);
        return new Response(
          JSON.stringify({
            status: "200",
            message: `Succesfully deployed ${body.name}`,
          })
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            status: "400",
            message: "An error occured while writing the Docker Compose file!",
            error: `${error}`,
          })
        );
      }
    },
    {
      body: t.Object({
        id: t.Number(),
        name: t.String(),
        data: t.String(),
        vars: t.Record(t.String(), t.String()),
      }),
    }
  )
  .delete(
    "/delete",
    async ({ body }) => {
      try {
        await rm(getStackDir(body.id, body.name), { recursive: true });
      } catch (error) {
        if ((error as { code: string }).code === "ENOENT") {
          console.log("Directory doesn't exist");
        } else {
          throw error;
        }
      }
    },
    {
      body: t.Object({
        id: t.Number(),
        name: t.String(),
      }),
    }
  );
