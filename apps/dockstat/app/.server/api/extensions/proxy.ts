import Elysia, { redirect, t } from 'elysia'
import { buildGitHubLink } from './parsers/github'
import { logger } from '.'

const ExtensionsProxyElysiaInstance = new Elysia({
	prefix: '/proxy',
}).get(
	'/:raw/github/*',
	({ params, request }) => {
		const raw = params.raw === 'true'
		logger.debug(
			`Redirecting plugin Link (GitHub): ${params['*']}`,
			request.headers.get('x-dockstatapi-requestid') as string
		)
		return redirect(buildGitHubLink(params['*'], raw), 301)
	},
	{
		headers: t.Object({
			'x-dockstatapi-requestid': t.String(),
		}),
	}
)

export default ExtensionsProxyElysiaInstance
