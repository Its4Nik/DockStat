import { useEdenClient } from "@dockstat/utils/react"
import { api } from "@/lib/api"

export type CertificateType = "ssh" | "docker-tls" | "web-tls" | "ca" | "generic-secret"

export interface Certificate {
  id: string
  title: string
  type: CertificateType
  source: "generated" | "imported" | "external"
  algorithm: string | null
  format: string
  publicData: string | null
  privateData: null
  fingerprint: string | null
  comment: string | null
  tags: string[]
  externalRef: string | null
  createdAt: string
  updatedAt: string
  expiresAt: string | null
}

interface CertificateListResponse {
  data: Certificate[]
  message: string
  success: true
}

type CertificatesQueryResult = {
  certificates: Certificate[]
  isLoading: boolean
  refetch: () => void
}

/**
 * Fetch all certificates, optionally filtered by type.
 */
export const useCertificatesQuery = (type?: CertificateType): CertificatesQueryResult => {
  const eden = useEdenClient()

  const { data, isLoading, refetch } = eden.query({
    queryKey: ["fetchCertificates", type],
    route: api.certificates.get,
    ...(type ? { query: { type } } : {}),
  })

  const list = (data as CertificateListResponse | undefined)?.data ?? []
  return { certificates: list, isLoading, refetch }
}
