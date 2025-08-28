import type {  LoaderFunctionArgs } from 'react-router'
import { serverLogger, themeHandler } from '~/.server'

export async function loader(_args: LoaderFunctionArgs) {
  serverLogger.info('Loading available themes')

  try {
    const themes = themeHandler.getThemeNames()
    serverLogger.debug(`Found ${themes.length} themes: ${themes.join(', ')}`)

    return { themes }
  } catch (error) {
    serverLogger.error(`Failed to load themes: ${error}`)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    return { error: 'Failed to load themes', message: errorMessage , status: 500 }
  }
}
