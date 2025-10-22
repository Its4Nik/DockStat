import { ApiHandler } from "~/.server/treaty"
import type { Route } from "./+types/api"

async function query(req: Request) {
  const apiRes = await ApiHandler.query(req)
  const method = req.method
  if (apiRes instanceof Response) {
    return apiRes
  }

  const loaderData = apiRes.loaderData[0]

  if (method === "GET") {
    return loaderData
  }

  if (method === "POST") {
    const actionData = apiRes.actionData
    if (actionData) {
      return actionData[0]
    }
  }

  return loaderData
}

export async function loader({ request }: Route.LoaderArgs) {
  return await query(request)
}

export async function action({ request }: Route.ActionArgs) {
  return await query(request)
}
