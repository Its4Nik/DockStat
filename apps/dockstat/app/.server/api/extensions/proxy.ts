import Elysia, { redirect } from 'elysia'
import { buildGitHubLink } from './parsers/github'

const ExtensionsProxyElysiaInstance = new Elysia({
	prefix: '/proxy',
}).get('/plugins/github/*', ({ params }) =>
	redirect(buildGitHubLink(params['*']), 301)
)

export default ExtensionsProxyElysiaInstance
