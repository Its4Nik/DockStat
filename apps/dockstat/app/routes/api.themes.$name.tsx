import type { LoaderFunctionArgs } from 'react-router'
import { serverLogger, themeHandler } from '~/.server'

export async function loader({ params }: LoaderFunctionArgs) {
  const { name } = params

  if (!name) {
    return { error: 'Theme name is required', status: 400 }
  }

  try {
    serverLogger.info(`Loading theme: ${name}`)

    // Check if the theme exists
    const themeExists = themeHandler.themeExists(name)
    if (!themeExists) {
      serverLogger.error(`Theme ${name} not found`)
      return { error: `Theme ${name} not found`, status: 404 }
    }

    // Just fetch and return the theme without modifying active state
    const theme = themeHandler.getTheme(name)
    if (!theme) {
      serverLogger.error(`Failed to retrieve theme ${name}`)
      return { error: `Failed to retrieve theme ${name}`, status: 500 }
    }

    serverLogger.info(`Successfully loaded theme ${name}`)
    return { theme }
  } catch (error) {
    serverLogger.error(`Error loading theme: ${error}`)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return { error: errorMessage, status: 500 }
  }
}
