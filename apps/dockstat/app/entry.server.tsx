import { PassThrough } from 'node:stream'
import DockStatDB from '@dockstat/db'
import { createLogger } from '@dockstat/logger'
import type DB from '@dockstat/sqlite-wrapper'
import { ThemeHandler } from '@dockstat/theme-handler'

export const DDB = new DockStatDB()

export const serverLogger = createLogger('dockstat-server')

serverLogger.info('Creating DockStatDB')
const queryBuilderInstance = DDB.getDB()

export const themeHandler = new ThemeHandler(queryBuilderInstance)

import { createReadableStreamFromReadable } from '@react-router/node'
import { isbot } from 'isbot'
import type { RenderToPipeableStreamOptions } from 'react-dom/server'
import { renderToPipeableStream } from 'react-dom/server'
import type { AppLoadContext, EntryContext } from 'react-router'
import { ServerRouter } from 'react-router'

export const streamTimeout = 5_000

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext
  //loadContext: AppLoadContext,
  // If you have middleware enabled:
  // loadContext: unstable_RouterContextProvider
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false
    const userAgent = request.headers.get('user-agent')

    // Ensure requests from bots and SPA Mode renders wait for all content to load before responding
    // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
    const readyOption: keyof RenderToPipeableStreamOptions =
      (userAgent && isbot(userAgent)) || routerContext.isSpaMode
        ? 'onAllReady'
        : 'onShellReady'

    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        [readyOption]() {
          shellRendered = true
          const body = new PassThrough()
          const stream = createReadableStreamFromReadable(body)

          responseHeaders.set('Content-Type', 'text/html')

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          )

          pipe(body)
        },
        onShellError(error: unknown) {
          reject(error)
        },
        onError(error: unknown) {
          // biome-ignore lint/style/noParameterAssign: Default from RR; will be rewritten as soon as the WebServer is Bun Compatible
          responseStatusCode = 500
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error)
          }
        },
      }
    )

    // Abort the rendering stream after the `streamTimeout` so it has time to
    // flush down the rejected boundaries
    setTimeout(abort, streamTimeout + 1000)
  })
}
