import { cors } from "@elysiajs/cors"
import { openapi } from "@elysiajs/openapi"
import { serverTiming } from "@elysiajs/server-timing"
import Elysia from "elysia"

const DockStatElysiaPlugins = new Elysia()
  .use(
    cors({
      credentials: true,
    })
  )
  .use(
    openapi({
      path: "/docs",
      provider: "scalar",
      documentation: {
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
              description: "A bearer token which is needed for production"
            }
          }
        }
    }
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
