import { t } from 'elysia'
import { WrappedPluginMeta } from './plugins'

export const RepoManifest = t.Object({
	plugins: t.Array(WrappedPluginMeta),
})
