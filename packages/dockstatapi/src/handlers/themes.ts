import { dbFunctions } from "~/core/database";
import { logger } from "~/core/utils/logger";
import type { Theme, ThemeOptions } from "~/typings/database";

class themeHandler {
  getThemes(): Theme[] {
    return dbFunctions.getThemes();
  }
  addTheme(theme: Theme) {
    try {
      const rawVars =
        typeof theme.vars === "string" ? JSON.parse(theme.vars) : theme.vars;

      const cssVars = Object.entries(rawVars)
        .map(([key, value]) => `--${key}: ${value};`)
        .join(" ");

      const varsString = `.root, #root, #docs-root { ${cssVars} }`;

      return dbFunctions.addTheme({
        ...theme,
        vars: varsString,
      });
    } catch (error) {
      throw new Error(
        `Could not save theme ${JSON.stringify(theme)}, error: ${error}`,
      );
    }
  }
  deleteTheme(name: string) {
    try {
      dbFunctions.deleteTheme(name);
      return "Deleted theme";
    } catch (error) {
      throw new Error(`Could not save theme ${name}, error: ${error}`);
    }
  }
  getTheme(name: string): Theme {
    return dbFunctions.getSpecificTheme(name);
  }
  getThemeOptions(name: string): ThemeOptions {
    logger.debug(`Getting options for Theme: ${name}`);
    const data = dbFunctions.getThemeOptions(name);
    logger.debug(`Received ${JSON.stringify(data)}`);
    return data;
  }
}

export const ThemeHandler = new themeHandler();
