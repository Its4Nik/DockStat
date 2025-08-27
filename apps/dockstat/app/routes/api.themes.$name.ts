import { serverLogger } from '~/entry.server'
import { themeHandler } from '~/entry.server'

export async function loader({ params }: { params: { name: string } }) {
  try {
    serverLogger.info(`Setting active theme to ${params.name}`)
    const out = themeHandler.setActiveTheme(params.name)
    serverLogger.debug(`themeHandler.setActiveTheme(params.name): ${JSON.stringify(out)}`)
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
