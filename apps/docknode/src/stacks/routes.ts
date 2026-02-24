import Elysia, { t } from "elysia"
import StackHandler from "."

const handler = new StackHandler()

export const DockStacksRoutes = new Elysia({ prefix: "/stacks" })
  // ---- List & Get Stacks
  .get("/", () => handler.listStacks())
  .get("/networks", () => handler.getNetworkStats())

  .get("/:id", ({ params }) => handler.getStack(Number(params.id)), {
    params: t.Object({ id: t.Numeric() }),
  })

  .get("/:id/export", ({ params }) => handler.exportStack(Number(params.id)), {
    params: t.Object({ id: t.Numeric() }),
  })

  // ---- Create, Update, Delete
  .post("/", ({ body }) => handler.createStack(body), {
    body: t.Object({
      name: t.String(),
      yaml: t.String(),
      repository: t.String(),
      repoName: t.String(),
      version: t.String(),
      env: t.Record(t.String(), t.Union([t.String(), t.Number(), t.Boolean(), t.Null()])),
    }),
  })

  .patch("/:id", ({ params, body }) => handler.updateStack(Number(params.id), body), {
    params: t.Object({ id: t.Numeric() }),
    body: t.Object({
      version: t.Optional(t.String()),
      yaml: t.Optional(t.String()),
      env: t.Optional(
        t.Record(t.String(), t.Union([t.String(), t.Number(), t.Boolean(), t.Null()]))
      ),
    }),
  })

  .patch("/:id/rename", ({ params, body }) => handler.renameStack(Number(params.id), body.name), {
    params: t.Object({ id: t.Numeric() }),
    body: t.Object({ name: t.String() }),
  })

  .delete(
    "/:id",
    ({ params, query }) =>
      handler.deleteStack(Number(params.id), { removeFiles: query.removeFiles !== "false" }),
    {
      params: t.Object({ id: t.Numeric() }),
      query: t.Object({ removeFiles: t.Optional(t.String()) }),
    }
  )

  // ---- Docker Compose: Lifecycle
  .post("/:id/up", ({ params, body }) => handler.up(Number(params.id), body?.services), {
    params: t.Object({ id: t.Numeric() }),
    body: t.Optional(t.Object({ services: t.Optional(t.Array(t.String())) })),
  })

  .post("/:id/down", ({ params, body }) => handler.down(Number(params.id), body || undefined), {
    params: t.Object({ id: t.Numeric() }),
    body: t.Optional(
      t.Object({
        volumes: t.Optional(t.Boolean()),
        removeOrphans: t.Optional(t.Boolean()),
      })
    ),
  })

  .post("/:id/stop", ({ params, body }) => handler.stop(Number(params.id), body?.services), {
    params: t.Object({ id: t.Numeric() }),
    body: t.Optional(t.Object({ services: t.Optional(t.Array(t.String())) })),
  })

  .post("/:id/restart", ({ params, body }) => handler.restart(Number(params.id), body?.services), {
    params: t.Object({ id: t.Numeric() }),
    body: t.Optional(t.Object({ services: t.Optional(t.Array(t.String())) })),
  })

  // ---- Docker Compose: Build & Pull
  .post("/:id/pull", ({ params, body }) => handler.pull(Number(params.id), body?.services), {
    params: t.Object({ id: t.Numeric() }),
    body: t.Optional(t.Object({ services: t.Optional(t.Array(t.String())) })),
  })

  // ---- Docker Compose: Info & Logs
  .get("/:id/ps", ({ params }) => handler.ps(Number(params.id)), {
    params: t.Object({ id: t.Numeric() }),
  })

  .get(
    "/:id/logs",
    ({ params, query }) =>
      handler.logs(Number(params.id), query.services?.split(","), {
        follow: query.follow === "true",
        tail: query.tail ? Number(query.tail) : undefined,
      }),
    {
      params: t.Object({ id: t.Numeric() }),
      query: t.Object({
        services: t.Optional(t.String()),
        follow: t.Optional(t.String()),
        tail: t.Optional(t.String()),
      }),
    }
  )

  .get(
    "/:id/config",
    ({ params, query }) =>
      handler.config(Number(params.id), {
        services: query.services === "true",
        volumes: query.volumes === "true",
      }),
    {
      params: t.Object({ id: t.Numeric() }),
      query: t.Object({
        services: t.Optional(t.String()),
        volumes: t.Optional(t.String()),
      }),
    }
  )

  .get("/:id/config/services", ({ params }) => handler.configServices(Number(params.id)), {
    params: t.Object({ id: t.Numeric() }),
  })

  .get("/:id/config/volumes", ({ params }) => handler.configVolumes(Number(params.id)), {
    params: t.Object({ id: t.Numeric() }),
  })

  // ---- Docker Compose: Execute & Run
  .post(
    "/:id/exec",
    ({ params, body }) => handler.exec(Number(params.id), body.service, body.command),
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        service: t.String(),
        command: t.Union([t.String(), t.Array(t.String())]),
      }),
    }
  )

  .post(
    "/:id/run",
    ({ params, body }) => handler.run(Number(params.id), body.service, body.command, body.options),
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        service: t.String(),
        command: t.Union([t.String(), t.Array(t.String())]),
        options: t.Optional(t.Object({ rm: t.Optional(t.Boolean()) })),
      }),
    }
  )

  // ---- Docker Compose: Remove & Kill
  .delete(
    "/:id/containers",
    ({ params, body }) => handler.rm(Number(params.id), body?.services, body?.options),
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Optional(
        t.Object({
          services: t.Optional(t.Array(t.String())),
          options: t.Optional(
            t.Object({
              force: t.Optional(t.Boolean()),
              volumes: t.Optional(t.Boolean()),
            })
          ),
        })
      ),
    }
  )

  .post("/:id/kill", ({ params, body }) => handler.kill(Number(params.id), body?.signal), {
    params: t.Object({ id: t.Numeric() }),
    body: t.Optional(
      t.Object({
        signal: t.Optional(t.String()),
      })
    ),
  })

  // ---- Docker Compose: Port
  .get(
    "/:id/port/:service/:port",
    ({ params, query }) =>
      handler.port(Number(params.id), params.service, Number(params.port), {
        protocol: query.protocol,
      }),
    {
      params: t.Object({
        id: t.Numeric(),
        service: t.String(),
        port: t.Numeric(),
      }),
      query: t.Object({ protocol: t.Optional(t.String()) }),
    }
  )

  // ---- Docker Compose Version
  .get("/docker/version", () => handler.version())
