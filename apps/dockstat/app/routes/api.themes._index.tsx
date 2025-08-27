import { clientLogger } from '~/entry.client'
import { themeHandler } from '~/entry.server'

export async function loader() {
  clientLogger.info('Listing themes')
  try {
    const themes = themeHandler.getThemeNames()
    clientLogger.debug(`Got ${themes.length} themes`)
    return themes
  } catch (error) {
    clientLogger.error(`Failed to list themes: ${error}`)
    return new Response((error as Error).message, { status: 500 })
  }
}
