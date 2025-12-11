import Elysia from "elysia"
import { openapi } from "@elysiajs/openapi"
import { serverTiming } from "@elysiajs/server-timing"

const DockStatElysiaPlugins = new Elysia()
  .use(
    openapi({
      path: "/docs",
      provider: "scalar",
    })
  )
  .use(
    serverTiming({
      enabled: Bun.env.DOCKSTATAPI_SHOW_TRACES !== "false",
      trace: {
        afterHandle: true,
        beforeHandle: true,
        error: true,
        handle: true,
        mapResponse: true,
        parse: true,
        request: true,
        total: true,
        transform: true,
      },
    })
  )

export default DockStatElysiaPlugins
