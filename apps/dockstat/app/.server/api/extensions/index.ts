import { Repo } from "@dockstat/typings/schemas"
import { getRepoManifest } from "./parsers"
import Elysia, { t } from "elysia"
import Logger from "@dockstat/logger"
import ExtensionsProxyElysiaInstance from "./proxy"
import { ElysiaLogger } from "../logger"

export const logger = new Logger(
	"Extensions",
	ElysiaLogger.getParentsForLoggerChaining()
)

const ExtensionElysiaInstance = new Elysia({
	name: "ExtensionElysiaInstance",
	prefix: "/extensions",
	detail: {
		tags: ["Extensions"],
	},
})
	.use(ExtensionsProxyElysiaInstance)
	.post(
		"/repo/manifest",
		async ({ body }) => getRepoManifest(body.repoType, body.repoSource),
		{
			body: t.Object({
				repoSource: t.String(),
				repoType: Repo.properties.type,
			}),
		}
	)

export default ExtensionElysiaInstance
