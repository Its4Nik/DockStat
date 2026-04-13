import { apiKey } from "@better-auth/api-key"
import { betterAuth } from "better-auth"
import { openAPI } from "better-auth/plugins"
import { DockStatDB } from "../database"

export const auth = betterAuth({
  account: { encryptOAuthTokens: true },
  advanced: { useSecureCookies: true },
  appName: "DockStat",
  basePath: "/auth",
  baseURL: process.env.NODE_ENV === "production" ? process.env.BASE_URL : "http://localhost",
  database: DockStatDB._sqliteWrapper.getDb(),
  plugins: [apiKey(), openAPI()],
  telemetry: {
    enabled: true,
  },
})

let _schema: ReturnType<typeof auth.api.generateOpenAPISchema>

// biome-ignore lint/suspicious/noAssignInExpressions: From the better auth examples
const getSchema = async () => (_schema ??= auth.api.generateOpenAPISchema())

export const OpenAPI = {
  components: getSchema().then(({ components }) => components) as Promise<any>,
  getPaths: (prefix = "/auth/api") =>
    getSchema().then(({ paths }) => {
      const reference: typeof paths = Object.create(null)
      for (const path of Object.keys(paths)) {
        const key = prefix + path
        reference[key] = paths[path]
        for (const method of Object.keys(paths[path])) {
          const operation = (reference[key] as any)[method]
          operation.tags = ["Better Auth"]
        }
      }
      return reference
    }) as Promise<any>,
} as const
