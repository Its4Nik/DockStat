import { serverLogger } from '~/entry.server'
import { themeHandler } from '~/entry.server'

export async function loader() {
  serverLogger.info('Listing themes')
  try {
    const themes = themeHandler.getThemeNames()
    serverLogger.debug(`Got ${themes.length} themes`)
    return themes
  } catch (error) {
    serverLogger.error(`Failed to list themes: ${error}`)
    return new Response((error as Error).message, { status: 500 })
  }
}
