import { BaseLogger } from "../logger"
import { CertificateService } from "../services/certificates"
import { DockStatDB } from "./db"

export const Certificates = new CertificateService(BaseLogger.spawn("Certificates"))

/** Persist a prepared certificate and return the stored row */
export function insertCertificate(
  prepared: ReturnType<CertificateService["generate"]>,
  options: { comment?: string | null; expiresAt?: string | null; tags?: string[] }
) {
  const svcLogger = BaseLogger.spawn("Certificates")

  svcLogger.debug(
    `Inserting certificate: title=${prepared.title}, type=${prepared.type}, comment=${(options.comment ?? null)}, tags=[${(options.tags ?? []).join(",")}]`
  )

  DockStatDB.certificatesTable.insert({
    ...prepared,
    comment: options.comment ?? null,
    expiresAt: options.expiresAt ?? null,
    tags: options.tags ?? [],
  })

  svcLogger.info(
    `Certificate inserted: title=${prepared.title}, type=${prepared.type}`
  )

  return DockStatDB.certificatesTable
    .select(["*"])
    .where({ title: prepared.title, type: prepared.type })
    .all()
    .at(-1)
}
