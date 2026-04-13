import { apiKey } from "@better-auth/api-key"
import { betterAuth } from "better-auth"
import { admin, openAPI } from "better-auth/plugins"
import { DockStatDB } from "../database"
import Elysia from "elysia"

const auth = betterAuth({
  account: { encryptOAuthTokens: true },
  advanced: { useSecureCookies: true },
  appName: "DockStat",
  basePath: "/auth",
  baseURL: process.env.NODE_ENV === "production" ? process.env.BASE_URL : "http://localhost:3030",
  database: DockStatDB._sqliteWrapper.getDb(),
  onAPIError: {
    throw: true,
  },
  plugins: [apiKey(), admin(), openAPI()],
  telemetry: {
    enabled: true,
  },
})

let _schema: ReturnType<typeof auth.api.generateOpenAPISchema>

// biome-ignore lint/suspicious/noAssignInExpressions: From the better auth examples
const getSchema = async () => (_schema ??= auth.api.generateOpenAPISchema())

export const OpenAPI = {
  // biome-ignore lint/suspicious/noExplicitAny: from better auth example
  components: getSchema().then(({ components }) => components) as Promise<any>,
  getPaths: (prefix = "/api/v2/auth") =>
    getSchema().then(({ paths }) => {
      const reference: typeof paths = Object.create(null)
      for (const path of Object.keys(paths)) {
        const key = prefix + path
        reference[key] = paths[path]
        for (const method of Object.keys(paths[path])) {
          // biome-ignore lint/suspicious/noExplicitAny: from better auth example
          const operation = (reference[key] as any)[method]
          operation.tags = ["Auth"]
        }
      }
      return reference
      // biome-ignore lint/suspicious/noExplicitAny: from better auth example
    }) as Promise<any>,
} as const

export const betterAuthPlugin = new Elysia({ name: "better-auth" })
  .mount(auth.handler)
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({
          headers,
        });

        if (!session) return status(401);

        return {
          user: session.user,
          session: session.session,
        };
      },
    },
  });
