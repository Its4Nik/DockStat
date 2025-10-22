import { treaty } from '@elysiajs/eden'
import { createStaticHandler } from 'react-router'
import { DockStatAPI, type DockStatAPIType } from './api'
import { logger } from './logger'

DockStatAPI.listen(3000)

logger.info(`Started Elysia ${JSON.stringify(DockStatAPI.config)}`)

const handler = async ({ request }: { request: Request }) => {
  logger.debug(`Handling request [${request.method}] (${request.url}) with DockStatAPI`, request.headers.get("x-dockstatapi-requestid") || "")
  return DockStatAPI.handle(request)
}

export const ApiHandler = createStaticHandler([
  {
    path: '*',
    loader: handler,
    action: handler,
  }
], { basename: '/api' })

export const api = treaty<DockStatAPIType>(typeof window !== 'undefined' ? location.origin : 'http://localhost:3000').api
