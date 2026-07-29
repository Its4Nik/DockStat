import { DockStatError } from "@dockstat/errors"
import Elysia from "elysia"
import { DockStatDB } from "../../database"
import BaseLogger from "../../logger"
import { CertificateModel } from "../../models/certificates"
import { CertificateService } from "../../services/certificates"

const logger = BaseLogger.spawn("Certificates")

/**
 * Certificate management routes.
 *
 * Stores and generates credentials used throughout DockStat:
 *  - `ssh`            : OpenSSH key pairs for SSH authentication
 *  - `docker-tls`     : X.509 client cert + key for TLS-secured Docker daemons
 *  - `web-tls`        : X.509 cert + key for serving the DockStat WebUI over HTTPS
 *  - `ca`             : Certificate Authorities used to sign other certs
 *  - `generic-secret` : opaque secret material (tokens, passwords)
 *
 * Private material is encrypted at rest (AES-256-GCM). It is only ever
 * returned by the dedicated `/:id/reveal` endpoint or the internal
 * `/resolve` endpoint.
 */
const CertificateRoutes = new Elysia({
  detail: {
    description:
      "Create, import, manage and resolve certificates, SSH keys and secrets used across DockStat.",
    tags: ["Certificates"],
  },
  name: "CertificateElysiaInstance",
  prefix: "/certificates",
})
  .decorate("certService", new CertificateService(logger))
  .get(
    "/",
    ({ query, certService }) => {
      const rows = DockStatDB.certificatesTable.select(["*"]).all()
      const filtered = query.type ? rows.filter((r) => r.type === query.type) : rows
      return {
        data: filtered.map((r) => certService.sanitize(r)),
        message: `Found ${filtered.length} certificates`,
        success: true as const,
      }
    },
    {
      detail: {
        description:
          "Lists all stored certificates, SSH keys and secrets. Private material is never included.",
        summary: "List Certificates",
      },
      query: CertificateModel.typeQuery,
      response: { 200: CertificateModel.listResponse },
    }
  )
  .get(
    "/:id",
    ({ params, certService }) => {
      const row = DockStatDB.certificatesTable.select(["*"]).where({ id: params.id }).get()
      if (!row) {
        throw new DockStatError("NOT_FOUND", {
          message: `Certificate with id ${params.id} not found`,
        })
      }
      return {
        data: certService.sanitize(row),
        message: "Certificate found",
        success: true as const,
      }
    },
    {
      detail: {
        description: "Fetches a single certificate by ID. Private material is never included.",
        summary: "Get Certificate",
      },
      params: CertificateModel.idParam,
      response: { 200: CertificateModel.response, 404: CertificateModel.error },
    }
  )
  .post(
    "/generate",
    ({ body, certService }) => {
      const prepared = certService.generate(body)
      DockStatDB.certificatesTable.insert({
        ...prepared,
        comment: body.comment ?? null,
        expiresAt: null,
        tags: body.tags ?? [],
      })
      const row = DockStatDB.certificatesTable
        .select(["*"])
        .where({ title: prepared.title, type: prepared.type })
        .all()
        .at(-1)
      if (!row) {
        throw new DockStatError("DATABASE_ERROR", {
          message: "Failed to persist generated certificate",
        })
      }
      return {
        data: certService.sanitize(row),
        message: `Generated ${prepared.type} certificate`,
        success: true as const,
      }
    },
    {
      body: CertificateModel.generateBody,
      detail: {
        description:
          "Generates a brand-new credential on the server. The algorithm is chosen automatically based on the type unless `algorithm` is provided. Private material is encrypted at rest before storage.",
        summary: "Generate Certificate",
      },
      response: { 200: CertificateModel.response, 400: CertificateModel.error },
    }
  )
  .post(
    "/import",
    ({ body, certService }) => {
      const prepared = certService.import(body)
      DockStatDB.certificatesTable.insert({
        ...prepared,
        comment: body.comment ?? null,
        expiresAt: body.expiresAt ?? null,
        tags: body.tags ?? [],
      })
      const row = DockStatDB.certificatesTable
        .select(["*"])
        .where({ title: prepared.title, type: prepared.type })
        .all()
        .at(-1)
      if (!row) {
        throw new DockStatError("DATABASE_ERROR", {
          message: "Failed to persist imported certificate",
        })
      }
      return {
        data: certService.sanitize(row),
        message: `Imported ${prepared.type} certificate`,
        success: true as const,
      }
    },
    {
      body: CertificateModel.importBody,
      detail: {
        description:
          "Imports existing credential material (PEM/OpenSSH text). Private material is encrypted at rest.",
        summary: "Import Certificate",
      },
      response: { 200: CertificateModel.response, 400: CertificateModel.error },
    }
  )
  .post(
    "/external",
    ({ body, certService }) => {
      const prepared = certService.external(body)
      DockStatDB.certificatesTable.insert({
        ...prepared,
        comment: body.comment ?? null,
        expiresAt: null,
        tags: body.tags ?? [],
      })
      const row = DockStatDB.certificatesTable
        .select(["*"])
        .where({ title: prepared.title, type: prepared.type })
        .all()
        .at(-1)
      if (!row) {
        throw new DockStatError("DATABASE_ERROR", {
          message: "Failed to persist external certificate reference",
        })
      }
      return {
        data: certService.sanitize(row),
        message: `Registered external ${prepared.type} certificate`,
        success: true as const,
      }
    },
    {
      body: CertificateModel.externalBody,
      detail: {
        description:
          "Registers an external credential reference (e.g. a file path or vault URI) without copying material into the DockStat database.",
        summary: "Add External Certificate",
      },
      response: { 200: CertificateModel.response, 400: CertificateModel.error },
    }
  )
  .put(
    "/:id",
    ({ params, body, certService }) => {
      const existing = DockStatDB.certificatesTable.select(["*"]).where({ id: params.id }).get()
      if (!existing) {
        throw new DockStatError("NOT_FOUND", {
          message: `Certificate with id ${params.id} not found`,
        })
      }
      const update: Record<string, unknown> = { updatedAt: new Date().toISOString() }
      if (body.title !== undefined) update.title = body.title
      if (body.comment !== undefined) update.comment = body.comment
      if (body.tags !== undefined) update.tags = body.tags
      if (body.expiresAt !== undefined) update.expiresAt = body.expiresAt

      DockStatDB.certificatesTable.where({ id: params.id }).update(update)
      const updated = DockStatDB.certificatesTable.select(["*"]).where({ id: params.id }).get()
      if (!updated) {
        throw new DockStatError("DATABASE_ERROR", {
          message: "Failed to retrieve updated certificate",
        })
      }
      return {
        data: certService.sanitize(updated),
        message: "Certificate updated",
        success: true as const,
      }
    },
    {
      body: CertificateModel.updateBody,
      detail: {
        description:
          "Updates mutable metadata (title, comment, tags, expiry) of a certificate. The key material itself cannot be changed.",
        summary: "Update Certificate Metadata",
      },
      params: CertificateModel.idParam,
      response: { 200: CertificateModel.response, 404: CertificateModel.error },
    }
  )
  .delete(
    "/:id",
    ({ params }) => {
      const existing = DockStatDB.certificatesTable.select(["*"]).where({ id: params.id }).get()
      if (!existing) {
        throw new DockStatError("NOT_FOUND", {
          message: `Certificate with id ${params.id} not found`,
        })
      }
      DockStatDB.certificatesTable.where({ id: params.id }).delete()
      return {
        message: `Certificate "${existing.title}" deleted`,
        success: true as const,
      }
    },
    {
      detail: {
        description: "Permanently deletes a stored certificate. This cannot be undone.",
        summary: "Delete Certificate",
      },
      params: CertificateModel.idParam,
      response: { 200: CertificateModel.deleteResponse, 404: CertificateModel.error },
    }
  )
  .post(
    "/:id/reveal",
    ({ params, certService }) => {
      const row = DockStatDB.certificatesTable.select(["*"]).where({ id: params.id }).get()
      if (!row) {
        throw new DockStatError("NOT_FOUND", {
          message: `Certificate with id ${params.id} not found`,
        })
      }
      const privateData = certService.reveal(row)
      return {
        data: certService.sanitize(row),
        message: "Private material revealed",
        privateData,
        success: true as const,
      }
    },
    {
      detail: {
        description:
          "Returns the decrypted private material for a certificate. Use with care — this is the only endpoint that exposes private data.",
        summary: "Reveal Certificate Private Material",
      },
      params: CertificateModel.idParam,
      response: { 200: CertificateModel.revealResponse, 404: CertificateModel.error },
    }
  )
  .post(
    "/resolve",
    ({ body, certService }) => {
      const rows = DockStatDB.certificatesTable.select(["*"]).all()
      const resolved = certService.resolve(rows, body)

      let privateData = ""
      if (resolved.privateData) {
        privateData = certService.reveal(resolved)
      } else if (resolved.externalRef) {
        privateData = ""
      }

      return {
        data: {
          externalRef: resolved.externalRef,
          fingerprint: resolved.fingerprint,
          id: resolved.id,
          privateData,
          publicData: resolved.publicData,
          title: resolved.title,
          type: resolved.type,
        },
        message: "Certificate resolved",
        success: true as const,
      }
    },
    {
      body: CertificateModel.resolveBody,
      detail: {
        description:
          "Internal resolution endpoint used by other DockStat services to obtain credential material by type. Returns decrypted private data. Optionally disambiguated by title, tag or externalRef.",
        summary: "Resolve Certificate by Type",
      },
      response: { 200: CertificateModel.resolveResponse, 404: CertificateModel.error },
    }
  )

export default CertificateRoutes
