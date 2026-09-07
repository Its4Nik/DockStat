import type { CertificateAlgorithmType, CertificateFormatType, CertificateSourceType, CertificateTypeType } from "@dockstat/typings/types"

export interface PreparedCertificate {
  title: string
  type: CertificateTypeType
  source: CertificateSourceType
  algorithm: CertificateAlgorithmType | null
  format: CertificateFormatType
  publicData: string | null
  /** Ciphertext blob — already encrypted by the service. */
  privateData: string | null
  fingerprint: string | null
  externalRef: string | null
}
