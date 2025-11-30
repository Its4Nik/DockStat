import { column as c } from "@dockstat/sqlite-wrapper"
import { DockStatDB } from "../db"
import Logger from "@dockstat/logger"
import { logger } from "../logger"

type componentTable = {
	id: number
	name: string
	description: string
	props: Record<string, unknown>
	js: string
}

class ComponentLibrary {
	private logger = new Logger(
		"PageHandler",
		logger.getParentsForLoggerChaining()
	)
	private componentRegistry: Record<string, { url: string; js: string }> = {}
	private componentTable =
		DockStatDB._sqliteWrapper.createTable<componentTable>(
			"components",
			{
				id: c.id(),
				description: c.text(),
				js: c.module(),
				name: c.text({ unique: true }),
				props: c.json(),
			},
			{ parser: { JSON: ["props"] }, ifNotExists: true }
		)

	registerComponent(component: Omit<componentTable, "id">) {
		this.componentRegistry[component.name] = {
			url: `/api/components/${component.name}.js`,
			js: component.js,
		}

		this.logger.debug(
			`Registered component: ${component.name}:${this.componentRegistry[component.name]}`
		)
	}

	saveComponent(component: Omit<componentTable, "id">) {
		const insRes = this.componentTable.insert(component)
		this.registerComponent(component)
		return insRes
	}

	getComponentLibrary() {
		return this.componentTable
			.select(["name", "description", "id", "props"])
			.all()
	}

	getComponentJS(name: string) {
		try {
			return this.componentRegistry[name].js
		} catch (error: unknown) {
			this.logger.error(`Could not get Component JS: ${error}`)
			return null
		}
	}
}

type BentoLayoutConfig = {
	columns: 2 | 3 | 4 | 5 | 6
	rows: number
	gap?: number
	aspectRatio?: "square" | "portrait" | "landscape"
}

type GridLayoutConfig = {
	columns: number
	rows: number
	gap?: number
	minColumnWidth?: number
	autoFlow?: "row" | "column" | "dense"
}

type FlexLayoutConfig = {
	direction?: "row" | "column" | "row-reverse" | "column-reverse"
	wrap?: "nowrap" | "wrap" | "wrap-reverse"
	justifyContent?:
		| "flex-start"
		| "flex-end"
		| "center"
		| "space-between"
		| "space-around"
		| "space-evenly"
	alignItems?: "stretch" | "flex-start" | "flex-end" | "center" | "baseline"
	gap?: number
}

type PageTable = {
	id: number
	slug: string
	url: string
	style: "bento" | "grid" | "flex"
	layoutConfig?: BentoLayoutConfig | GridLayoutConfig | FlexLayoutConfig
	components: Array<{
		url: string
		position?: number
		width?: number
		height?: number
		minWidth?: number
		minHeight?: number
	}>
	metadata?: {
		title?: string
		description?: string
		createdAt?: Date
		updatedAt?: Date
	}
}

class PageHandler extends ComponentLibrary {
	private pageTable = DockStatDB._sqliteWrapper.createTable<PageTable>(
		"pages",
		{
			id: c.id(),
			slug: c.text(),
			url: c.text({ unique: true }),
			style: c.enum(["bento", "grid", "flex"]),
			components: c.json(),
			layoutConfig: c.json(),
			metadata: c.json(),
		},
		{
			ifNotExists: true,
			parser: { JSON: ["components", "layoutConfig", "metadata"] },
		}
	)

	public getPages() {
		return this.pageTable.select(["*"]).all()
	}

	public getPage(url: string) {
		return this.pageTable.select(["*"]).where({ url: url }).first()
	}

	public addPage(page: Omit<PageTable, "id">) {
		return this.pageTable.insert(page)
	}

	public deletePage(url: string) {
		return this.pageTable.where({ url: url }).delete()
	}

	public updatePage(url: string, page: PageTable) {
		return this.pageTable.where({ url: url }).update(page)
	}
}

export default new PageHandler()
