import Elysia, { redirect, t } from 'elysia'
import { buildGitHubLink } from './parsers/github'
import { logger } from '.'

const ExtensionsProxyElysiaInstance = new Elysia({
	prefix: '/proxy',
	detail: {
		tags: ['Extensions', 'Proxy'],
	},
})
	.get('/:raw/github/*', ({ params, request }) => {
		const raw = params.raw === 'true'
		logger.debug(
			`Redirecting plugin Link (GitHub): ${params['*']}`,
			request.headers.get('x-dockstatapi-requestid') as string
		)
		return redirect(buildGitHubLink(params['*'], raw), 301)
	})
	.use(
		new Elysia({ prefix: '/plugin/bundle' }).post(
			'/github',
			async ({ request, status, body }) => {
				logger.debug(
					`Getting Plugin Bundle for: ${body.path.replace('/manifest.yml', '/bundle/index.js')}`,
					request.headers.get('x-dockstatapi-requestid') as string
				)
				const res = await fetch(
					buildGitHubLink(
						`${body.path.replace('/manifest.yml', '/bundle/index.js')}`,
						true
					)
				)

				if (!res.ok) {
					return status(404)
				}

				const pluginBundle = await res.text()
				return new Response(pluginBundle, {
					headers: {
						'Content-Type': 'text/javascript',
					},
				})
			},
			{
				body: t.Object({
					path: t.String(),
				}),
			}
		)
	)

export default ExtensionsProxyElysiaInstance
