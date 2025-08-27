import { serverLogger } from '~/entry.server'
import { themeHandler } from '~/entry.server'

export async function loader({ params }: { params: { name: string } }) {
  try {
    serverLogger.info(`Setting active theme to ${params.name}`)
    themeHandler.setActiveTheme(params.name)
    const theme = themeHandler.getTheme(params.name)
    if (!theme) {
      serverLogger.error(`Theme ${params.name} not found`)
      throw new Error(`Theme ${params.name} not found`)
    }
    return theme
  } catch (error) {
    serverLogger.error(`Error setting active theme: ${error}`)
    return new Response((error as Error).message, { status: 400 })
  }
}
