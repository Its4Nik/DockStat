import type { Theme, ThemeOptions } from "~/typings/database";
import { logger } from "../utils/logger";
import { db } from "./database";
import { executeDbOperation } from "./helper";

const stmt = {
  insert: db.prepare(`
      INSERT INTO themes (name, creator, vars, options, tags) VALUES (?, ?, ?, ?, ?)
    `),
  remove: db.prepare("DELETE FROM themes WHERE name = ?"),
  read: db.prepare(
    "SELECT name, creator, vars, tags FROM themes WHERE name = ?",
  ),
  readOptions: db.prepare("SELECT options FROM themes WHERE name = ?"),
  readAll: db.prepare("SELECT * FROM themes"),
};

export function getThemes() {
  return executeDbOperation("Get Themes", () => stmt.readAll.all()) as Theme[];
}

export function addTheme({ name, creator, options, vars, tags }: Theme) {
  return executeDbOperation("Save Theme", () =>
    stmt.insert.run(
      name,
      creator,
      vars,
      JSON.stringify(options),
      tags.toString(),
    ),
  );
}

export function getSpecificTheme(name: string): Theme {
  return executeDbOperation(
    "Getting specific Theme",
    () => stmt.read.get(name) as Theme,
  );
}

export function getThemeOptions(name: string): ThemeOptions {
  const data = executeDbOperation(
    "Getting Theme Options",
    () => (stmt.readOptions.get(name) as { options: string }).options,
  );

  logger.debug(`RAW DB: ${JSON.stringify(stmt.readOptions.get(name))}`);

  return JSON.parse(data);
}

export function deleteTheme(name: string) {
  logger.debug(`Removing ${name} from themes  `);
  return executeDbOperation("Remove Theme", () => stmt.remove.run(name));
}
