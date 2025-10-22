import { treaty } from '@elysiajs/eden'
import { createStaticHandler } from 'react-router'
import { API, type APIType } from './elysia'

API.listen(3000)

const handler = async ({ request }: { request: Request }) => {
  return API.handle(request)
}

const ApiHandler = createStaticHandler([
  {
    path: '*',
    loader: handler,
    action: handler,
  }
], { basename: '/api' })

const api = treaty<APIType>(typeof window !== 'undefined' ? location.origin : 'http://localhost:3000').api
const testSocket = api.ws.test.subscribe()

export {
  ApiHandler,
  api,
  testSocket
}
