import type Logger from "@dockstat/logger"
import type DB from "@dockstat/sqlite-wrapper"
import { column, type QueryBuilder } from "@dockstat/sqlite-wrapper"
import {
  DarkTheme,
  DarkThemeAnimations,
  LightTheme,
  OledTheme,
  UltraDarkTheme,
} from "../default-themes"
import type { themeType } from "./types"

export class ThemeDB {
  private table: QueryBuilder<themeType>
  private logger: Logger

  constructor(DB: DB, logger: Logger) {
    this.logger = logger

    logger.debug("Creating theme table")
    this.table = DB.createTable<themeType>(
      "themes",
      {
        id: column.id(),
        animations: column.json(),
        variables: column.json(),
        name: column.text({ unique: true }),
      },
      { ifNotExists: true }
    )

    this.logger.debug("Checking if default themes exist")
    const names = this.table
      .select(["name"])
      .all()
      .map((t) => t.name)

    !names.includes("DockStat-Dark") &&
      this.table.insert({
        id: -1,
        name: "DockStat-Dark",
        variables: DarkTheme,
        animations: DarkThemeAnimations,
      })

    !names.includes("DockStat-OLED") &&
      this.table.insert({
        id: -2,
        name: "DockStat-OLED",
        variables: OledTheme,
        animations: DarkThemeAnimations,
      })

    !names.includes("DockStat-Light") &&
      this.table.insert({
        id: -3,
        name: "DockStat-Light",
        variables: LightTheme,
        animations: DarkThemeAnimations,
      })

    !names.includes("DockStat-UltraDark") &&
      this.table.insert({
        id: -4,
        name: "DockStat-UltraDark",
        variables: UltraDarkTheme,
        animations: DarkThemeAnimations,
      })
  }

  addTheme(name: string, animations: themeType["animations"], variables: themeType["variables"]) {
    this.table.insert({
      name,
      animations,
      variables,
    })
    this.logger.info(`Added theme: ${name}`)
  }

  getTheme(name?: string, id?: number): themeType | null {
    if (name) {
      this.logger.debug(`Getting theme by name: ${name}`)
      return this.table.select(["*"]).where({ name: name }).first() ?? null
    } else if (id) {
      this.logger.debug(`Getting theme by id: ${id}`)
      return this.table.select(["*"]).where({ id: id }).first() ?? null
    }

    this.logger.error("No theme name or ID provided!")
    return null
  }

  getAllThemes(): themeType[] {
    this.logger.debug("Getting all themes")
    return this.table.select(["*"]).all()
  }

  updateTheme(
    id: number,
    updates: {
      name?: string
      variables?: themeType["variables"]
      animations?: themeType["animations"]
    }
  ): void {
    const updatePayload: Partial<themeType> = {}

    if (updates.name !== undefined) {
      updatePayload.name = updates.name
    }
    if (updates.variables !== undefined) {
      updatePayload.variables = updates.variables
    }
    if (updates.animations !== undefined) {
      updatePayload.animations = updates.animations
    }

    if (Object.keys(updatePayload).length === 0) {
      this.logger.warn(`updateTheme called with no updates for id: ${id}`)
      return
    }

    this.table.where({ id }).update(updatePayload)
    this.logger.info(`Updated theme with id: ${id}`)
  }

  deleteTheme(id: number): void {
    this.table.where({ id }).delete()
    this.logger.info(`Deleted theme with id: ${id}`)
  }
}
