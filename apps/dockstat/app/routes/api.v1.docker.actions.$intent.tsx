import ServerInstance from "~/.server"
import type { Route } from "./+types/api.v1.docker.actions.$intent"

export async function action({ params,request}: Route.ActionArgs){
  const req = await request.json()
  const dockerClient = ServerInstance.getAdapterHandler().getDockerAdapters()[req.clientId]
  switch (params.intent) {
    case "add-host": {
      try {
        const host = dockerClient.addHost(req.url, req.name, req.secure, req.port)
        const isReachable = await dockerClient.checkHostHealth(host.id)
        return { host: host.id, isReachable: isReachable}
      } catch (error: unknown) {
        throw new Error(error as string)
      }
    }
    case "get-allStats": {
      try {
        const allStats = await dockerClient.getAllStats()
        return allStats
      } catch (error: unknown) {
        throw new Error(error as string)
      }
    }
  }
}
