import type { LoaderFunctionArgs } from 'react-router'
import { serverLogger, themeHandler } from '~/.server'

export async function loader({ params }: LoaderFunctionArgs) {
  const { name } = params

  if (!name) {
    return { error: 'Theme name is required', status: 400 }
  }

  try {
    serverLogger.info(`Loading theme: ${name}`)

    // First check if the theme exists
    const themeExists = themeHandler.themeExists(name)
    if (!themeExists) {
      serverLogger.error(`Theme ${name} not found`)
      return { error: `Theme ${name} not found` , status: 404 }
    }

    // Set it as active
    serverLogger.info(`Setting active theme to ${name}`)
    const updateResult = themeHandler.setActiveTheme(name)
    serverLogger.debug(`Theme update result: ${JSON.stringify(updateResult)}`)

    // Fetch and return the theme
    const theme = themeHandler.getTheme(name)
    if (!theme) {
      serverLogger.error(`Failed to retrieve theme ${name} after setting active`)
      return { error: `Failed to retrieve theme ${name}`,  status: 500 }
    }

    serverLogger.info(`Successfully loaded theme ${name}`)
    return theme
  } catch (error) {
    serverLogger.error(`Error loading theme: ${error}`)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return { error: errorMessage ,  status: 500 }
  }
}
