import { createLogger } from "@dockstat/logger";
import type { DB_target_host } from "@dockstat/typings";
import type { ActionFunctionArgs } from "react-router";
import ServerInstance from "~/.server";
import { getDockerClientFromAdapterID, getHostObjectFromForm } from "~/.server/src/utils";

const AH = ServerInstance.getAdapterHandler()
const logger = createLogger('DA-Action')

export async function action({ request }: ActionFunctionArgs) {
  const DOA = Object.entries(AH.getDockerAdapters())
  const form = await request.formData()
  const intent = form.get('intent')
  logger.info(`Action started, action: ${intent} - Docker Adapters: ${DOA.length}`)

  try {
    switch (intent) {
      case 'add-host-to-adapter': {
        const AOBJ = getDockerClientFromAdapterID(DOA, form)

        const host = getHostObjectFromForm(form)

        logger.debug(`Adding host ${host.name} to client ${AOBJ.id}`)

        const addedHost = AOBJ.client.addHost(host.host, host.name, host.secure, host.port)
        return new Response(JSON.stringify(addedHost), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }

      case 'remove-host-from-adapter': {
        const aID = form.get('adapterID')
        logger.debug(`Adapter ID: ${aID}`)
        const AOBJ = DOA.find(([id]) => id === aID)
        if (!AOBJ) { return new Response('Adapter not found', { status: 404 }) }
        const [id, adapter] = AOBJ

        const host = getHostObjectFromForm(form, true)

        logger.debug(`Removing host ${host.host} from adapter ${id}`)

        adapter.removeHost(host)
        return new Response(`Removed host ${host.name} (${host.id}) from adapter ${id}`, { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      default:
        return new Response('Invalid action', { status: 400 })
    }
  } catch (error) {
    return new Response(`${error}`, { status: 401 })
  }
}

export function loader() {
  const DOA = Object.keys(AH.getDockerAdapters())
  return new Response(JSON.stringify(DOA), { status: 200, headers: { 'Content-Type': 'application/json' } })
}
