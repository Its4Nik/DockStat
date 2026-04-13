import { DockerAdapterOptionsSchema } from "@dockstat/typings"
import { t } from "elysia"

export namespace DockerModel {
  export const status = t.Object({
    activeWorkers: t.Integer(),
    averageHostsPerWorker: t.Integer(),
    hosts: t.Array(t.Object({ clientId: t.Integer(), id: t.Integer(), name: t.String() })),
    totalClients: t.Integer(),
    totalHosts: t.Integer(),
    totalWorkers: t.Integer(),
    workers: t.Array(
      t.Object({
        activeStreams: t.Number(),
        clientId: t.Number(),
        clientName: t.String(),
        hostsManaged: t.Number(),
        initialized: t.Boolean(),
        isMonitoring: t.Boolean(),
        memoryUsage: t.Object({
          external: t.Number(),
          heapTotal: t.Number(),
          heapUsed: t.Number(),
          rss: t.Number(),
        }),
        uptime: t.Number(),
        workerId: t.Number(),
      })
    ),
  })
  export const error = t.Object({
    success: t.Boolean(),
    error: t.Unknown(),
    message: t.String(),
  })

  export const poolStatus = t.Object({
    activeWorkers: t.Integer(),
    averageHostsPerWorker: t.Integer(),
    totalClients: t.Integer(),
    totalHosts: t.Integer(),
    totalWorkers: t.Integer(),
    workers: t.Array(
      t.Object({
        activeStreams: t.Number(),
        clientId: t.Number(),
        clientName: t.String(),
        hostsManaged: t.Number(),
        initialized: t.Boolean(),
        isMonitoring: t.Boolean(),
        memoryUsage: t.Object({
          external: t.Number(),
          heapTotal: t.Number(),
          heapUsed: t.Number(),
          rss: t.Number(),
        }),
        uptime: t.Number(),
        workerId: t.Number(),
      })
    ),
  })

  export const initAllClientsRes = t.Array(
    t.Object({
      id: t.Number(),
      initialized: t.MaybeEmpty(t.Boolean()),
      name: t.String(),
    })
  )

  export const registerClientBody = t.Object({
    clientName: t.String(),
    options: t.Nullable(DockerAdapterOptionsSchema),
  })
  export const registerClientSuccess = t.Object({
    clientId: t.Number(),
    message: t.String(),
    success: t.Boolean(),
  })

  export const updateClientBody = t.Object({
    clientId: t.Number(),
    clientName: t.String(),
    options: t.Nullable(DockerAdapterOptionsSchema),
  })

  export const updateClientSuccess = t.Object({
    clientId: t.Number(),
    message: t.String(),
    success: t.Literal(true),
  })

  export const allHosts = t.Array(
    t.Object({
      clientId: t.Number(),
      id: t.Number(),
      name: t.String(),
      reachable: t.Boolean(),
    })
  )

  export const addHostBody = t.Object({
    clientId: t.Number(),
    hostname: t.String(),
    name: t.String(),
    port: t.Number(),
    secure: t.Boolean(),
  })

  export const updateBody = t.Object({
    clientId: t.Number(),
    host: t.Object({
      host: t.String(),
      id: t.Number(),
      name: t.String(),
      port: t.Number(),
      secure: t.Boolean(),
    }),
  })
}
