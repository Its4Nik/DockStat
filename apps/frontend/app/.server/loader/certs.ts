import { fail, type RouteArgs, query } from "../lib/http"
import Singletons from "../singletons"

export const CertLoaders = {
  get: ({ params }: RouteArgs<{ id: string }>) => {
    const row = Singletons.DB.certificatesTable.select(["*"]).where({ id: params.id }).get()
    if (!row) return fail(404, `Certificate with id ${params.id} not found`)
    return { data: Singletons.Cert.sanitize(row), message: "Certificate found", success: true }
  },
  list: ({ request }: RouteArgs) => {
    const type = query(request).get("type")
    const rows = Singletons.DB.certificatesTable.select(["*"]).all()
    const filtered = type ? rows.filter((r) => r.type === type) : rows
    return {
      data: filtered.map((r) => Singletons.Cert.sanitize(r)),
      message: `Found ${filtered.length} certificates`,
      success: true,
    }
  },
}
