import { Glob } from 'bun'
import YAML from 'js-yaml'
const pluginPath = 'src/content/plugins'
import { PluginMeta } from '@dockstat/typings/schemas'
import Ajv from 'ajv'
import type { PluginMetaType } from '@dockstat/typings/types'
import { WrappedPluginMeta } from '@dockstat/typings/schemas'

const ajv = new Ajv({ allErrors: true, strict: false })

function validatePluginMeta(meta: unknown) {
	const validate = ajv.compile(WrappedPluginMeta)
	if (!validate(meta)) {
		throw new Error(
			`Invalid Plugin Meta:\n${ajv.errorsText(validate.errors, { separator: '\n' })}`
		)
	}
}

async function createSchemas() {
	const schemaRoot = './.schemas'

	console.log('Creating plugin meta schema')

	await Bun.write(
		`${schemaRoot}/plugin-meta.schema.json`,
		JSON.stringify(PluginMeta, null, 2)
	)
	// you can add more schema generation logic here if needed
}

const getPluginBuildDir = (path: string) => {
	const t = path.replaceAll('/index.ts', '')
	return `${t}/bundle`
}

const getPluginManifestPath = (path: string) => {
	const t = path.replaceAll('/index.ts', '')
	return `${t}/manifest.yml`
}

const getPluginName = (path: string) => {
	return path
		.replaceAll('/index.ts', '')
		.replaceAll(`${pluginPath}/`, '')
}

const plugins = new Glob(`${pluginPath}/*/index.ts`)
const pluginPaths = [...plugins.scanSync()]

type Status = 'pending' | 'building' | 'done' | 'failed'
type PluginRecord = {
	name: string
	path: string
	status: Status
	message?: string
	startedAt?: number
	finishedAt?: number
}

const records: PluginRecord[] = pluginPaths.map((p) => ({
	name: getPluginName(p),
	path: p,
	status: 'pending',
}))

records.push({
	name: 'Generate plugin schemas',
	path: '__TASK__GENERATE_SCHEMAS',
	status: 'pending',
})
records.push({
	name: 'Write repo manifest',
	path: '__TASK__WRITE_REPO_MANIFEST',
	status: 'pending',
})

const BUNDLED_PLUGINS: PluginMetaType[] = []

/* --- Progress UI helpers --- */
const spinnerFrames = [
	'⠋',
	'⠙',
	'⠹',
	'⠸',
	'⠼',
	'⠴',
	'⠦',
	'⠧',
	'⠇',
	'⠏',
]
let spinnerIndex = 0
const barWidth = 40

function formatDuration(ms: number) {
	if (ms < 1000) return `- ⌛ ${ms}ms`
	const sec = (ms / 1000).toFixed(1)
	return `${sec}s`
}

function renderProgress() {
	// counts
	const total = records.length
	const done = records.filter((r) => r.status === 'done').length
	const failed = records.filter((r) => r.status === 'failed').length
	const building = records.filter(
		(r) => r.status === 'building'
	).length
	const completed = done + failed
	const pct = Math.round((completed / total) * 100)

	// overall bar
	const filled = Math.round((completed / total) * barWidth)
	const empty = barWidth - filled
	const bar = `[${'█'.repeat(filled)}${' '.repeat(empty)}]`

	// header
	console.clear()
	console.log(
		`Building plugins — ${completed}/${total} (${pct}%) ${bar}`
	)
	console.log(
		`Building: ${building}  Done: ${done}  Failed: ${failed}\n`
	)

	// per-plugin lines
	for (const rec of records) {
		let line = ''
		const elapsed =
			rec.finishedAt && rec.startedAt
				? formatDuration(rec.finishedAt - rec.startedAt)
				: ''
		switch (rec.status) {
			case 'pending':
				line = `  [ ] ${rec.name}`
				break
			case 'building':
				line = `  [${spinnerFrames[spinnerIndex % spinnerFrames.length]}] ${rec.name}`
				break
			case 'done':
				line = `  [✓] ${rec.name}  ${rec.message ?? ''} ${elapsed}`
				break
			case 'failed':
				line = `  [✗] ${rec.name}  ${rec.message ?? ''} ${elapsed}`
				break
		}
		console.log(line)
	}
	spinnerIndex++
}

/* --- Build each plugin concurrently --- */
async function buildAll() {
	if (records.length === 0) {
		console.log('No plugins found.')
		return
	}

	// start UI animation
	const tick = setInterval(renderProgress, 10)

	// builder for a single plugin record (only for real plugin entrypoints)
	async function buildPlugin(rec: PluginRecord) {
		rec.status = 'building'
		rec.startedAt = Date.now()
		try {
			const build = await Bun.build({
				entrypoints: [rec.path],
				outdir: getPluginBuildDir(rec.path),
				minify: true,
				sourcemap: 'inline',
				splitting: false,
				env: `${rec.name.toUpperCase()}_*`,
				banner: `/*　Bundled by DockStore　*/`,
			})

			// Import meta from plugin entry
			const imported = await import(`./${rec.path}`)
			const { meta } = imported as { meta: PluginMetaType }

			validatePluginMeta(meta)
			// write manifest file for plugin
			await Bun.write(getPluginManifestPath(rec.path), YAML.dump(meta))

			// record success
			rec.status = 'done'
			rec.finishedAt = Date.now()
			rec.message = `${getPluginBuildDir(rec.path)}/index.js`
			BUNDLED_PLUGINS.push(meta)

			// optional small log entry to stdout (won't break the UI)
			console.log(
				`${rec.name} bundled -> ${getPluginBuildDir(rec.path)}/index.js`
			)
			return { ok: true, rec, build }
		} catch (err) {
			rec.status = 'failed'
			rec.finishedAt = Date.now()
			rec.message = String((err as Error)?.message ?? err)
			return { ok: false, rec, error: err }
		}
	}

	const pluginBuildRecords = records.filter((r) =>
		r.path.endsWith('/index.ts')
	)

	const promises = pluginBuildRecords.map((r) => buildPlugin(r))

	const results = await Promise.allSettled(promises)

	// summary of plugin builds
	const succeeded = results.filter(
		(r) => r.status === 'fulfilled' && r.value.ok
	).length
	const failedCount = results.filter(
		(r) => r.status === 'fulfilled' && !r.value.ok
	).length

	console.log(
		`\nPlugin build phase complete — ${succeeded} succeeded, ${failedCount} failed.\n`
	)

	if (failedCount >= 1) {
		for (const r of results) {
			if (r.status === 'fulfilled' && !r.value.ok && r.value.error) {
				const header = '///// Error:'
				console.error(header)
				console.error(r.value.error)
				console.log(`${'/'.repeat(header.length)}\n`)
			}
		}
	}

	// --- Post-build tasks (run sequentially, but visible in the same progress UI) ---

	// 1) Generate schemas
	{
		const rec = records.find(
			(r) => r.path === '__TASK__GENERATE_SCHEMAS'
		)
		if (rec) {
			rec.status = 'building'
			rec.startedAt = Date.now()
			try {
				await createSchemas()
				rec.status = 'done'
				rec.finishedAt = Date.now()
				rec.message = `./.schemas/plugin-meta.schema.json`
				console.log('Schemas generated.')
			} catch (err) {
				rec.status = 'failed'
				rec.finishedAt = Date.now()
				rec.message = String((err as Error)?.message ?? err)
				console.error('Schema generation failed:', err)
			}
		}
	}

	// 2) Write repo manifest (depends on BUNDLED_PLUGINS)
	{
		const rec = records.find(
			(r) => r.path === '__TASK__WRITE_REPO_MANIFEST'
		)
		if (rec) {
			rec.status = 'building'
			rec.startedAt = Date.now()
			try {
				const RepoManifestData = { plugins: BUNDLED_PLUGINS }
				await Bun.write('./manifest.yml', YAML.dump(RepoManifestData))
				rec.status = 'done'
				rec.finishedAt = Date.now()
				rec.message = `./manifest.yml`
				console.log('Wrote Repo Manifest')
			} catch (err) {
				rec.status = 'failed'
				rec.finishedAt = Date.now()
				rec.message = String((err as Error)?.message ?? err)
				console.error('Writing repo manifest failed:', err)
			}
		}
	}

	renderProgress()
	clearInterval(tick)

	const totalDone = records.filter((r) => r.status === 'done').length
	const totalFailed = records.filter(
		(r) => r.status === 'failed'
	).length
	console.log(`\nTotal — ${totalDone} done, ${totalFailed} failed.`)

	return results
}

// Run
await buildAll()
