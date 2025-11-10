import Elysia from 'elysia'

const ExtensionsProxyElysiaInstance = new Elysia({
	prefix: '/proxy',
}).get('/plugins')
