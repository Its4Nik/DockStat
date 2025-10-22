import Elysia, { t } from "elysia";
import {
  openapi
} from '@elysiajs/openapi'
import { WebSocketElysiaInstance } from "./websocket";

const Store = Bun.file("./posts.json")

const PostSchema = t.Object({
  name: t.String(),
  description: t.String(),
  url: t.String()
})

if (!await Store.exists()) {
  Store.write(
    JSON.stringify([
      {
        name: 'React Router and ElysiaJS',
        description:
          'This Article covers on how to use Elysia JS as Backend for React Router',
        url: '#',
      },
      {
        name: "Wait Elysia Plugins also work with this?",
        description: "Yes ofc! Click on me for a working example",
        url: "/api/docs"
      }
    ]))
}

export const API = new Elysia({ prefix: "/api" })
  .use(
    openapi({
      path: "/docs",
      provider: "scalar",
    })
  )
  .use(WebSocketElysiaInstance)
  .get("/posts", async () => await Store.json(), {
    response: t.Array(PostSchema)
  })
  .post('/posts', async ({ body }) => {
    const inStore = await Store.json() as Array<typeof PostSchema.static>
    return await Store.write(JSON.stringify([body, ...inStore]))
  },
    {
      body: PostSchema
    })

export type APIType = typeof API
