import {
  AddExternalCertificateBody,
  CertificateDeleteResponse,
  CertificateError,
  CertificateListResponse,
  CertificateResolveResponse,
  CertificateResponse,
  CertificateRevealResponse,
  GenerateCertificateBody,
  ImportCertificateBody,
  ResolveCertificateBody,
  UpdateCertificateBody,
} from "@dockstat/typings/schemas"
import { t } from "elysia"

export namespace CertificateModel {
  export const generateBody = GenerateCertificateBody
  export const importBody = ImportCertificateBody
  export const externalBody = AddExternalCertificateBody
  export const updateBody = UpdateCertificateBody
  export const resolveBody = ResolveCertificateBody

  export const response = CertificateResponse
  export const listResponse = CertificateListResponse
  export const deleteResponse = CertificateDeleteResponse
  export const revealResponse = CertificateRevealResponse
  export const resolveResponse = CertificateResolveResponse

  export const error = CertificateError

  export const idParam = t.Object({
    id: t.String({ description: "UUID of the certificate", examples: ["9b1e..."] }),
  })

  export const typeQuery = t.Object({
    type: t.Optional(
      t.UnionEnum(["ssh", "docker-tls", "web-tls", "ca", "generic-secret"], {
        description: "Filter by certificate type",
      })
    ),
  })
}
