import { Repo } from "@dockstat/typings/schemas";
import { getRepoManifest } from "./parsers";
import Elysia, { t } from "elysia";
import { Elogger } from "../handlers";
import Logger from "@dockstat/logger";
import ExtensionsProxyElysiaInstance from "./proxy";

export const logger = new Logger(
	"Extensions",
	Elogger.getParentsForLoggerChaining(),
);

const ExtensionElysiaInstance = new Elysia({
	prefix: "/extensions",
	detail: { tags: ["Extensions"] },
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
		},
	);

export default ExtensionElysiaInstance;
