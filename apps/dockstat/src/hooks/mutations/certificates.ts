import { useEdenClient } from "@dockstat/utils/react"
import type { CertificateType } from "@/hooks/queries/certificates"
import { api } from "@/lib/api"

export interface GenerateCertificateInput {
  title: string
  type: CertificateType
  algorithm?: "rsa" | "ecdsa" | "ed25519" | "self-signed-rsa" | "self-signed-ecdsa"
  comment?: string | null
  tags?: string[]
  commonName?: string
  subjectAltNames?: string[]
  validityDays?: number
  rsaKeySize?: number
}

export interface ImportCertificateInput {
  title: string
  type: CertificateType
  privateData: string
  publicData?: string
  format?: "pem" | "openssh" | "der"
  comment?: string | null
  tags?: string[]
  passphrase?: string
  expiresAt?: string | null
}

export interface ExternalCertificateInput {
  title: string
  type: CertificateType
  externalRef: string
  publicData?: string
  comment?: string | null
  tags?: string[]
}

export interface UpdateCertificateInput {
  title?: string
  comment?: string | null
  tags?: string[]
  expiresAt?: string | null
}

export const useCertificatesMutations = () => {
  const eden = useEdenClient()

  const generateCertificateMutation = eden.mutate({
    invalidateQueries: [["fetchCertificates"]],
    mutationKey: ["generateCertificate"],
    route: api.certificates.generate.post,
    toast: {
      errorTitle: () => "Failed to generate certificate",
      successTitle: (input: GenerateCertificateInput) => `Generated "${input.title}"`,
    },
  })

  const importCertificateMutation = eden.mutate({
    invalidateQueries: [["fetchCertificates"]],
    mutationKey: ["importCertificate"],
    route: api.certificates.import.post,
    toast: {
      errorTitle: () => "Failed to import certificate",
      successTitle: (input: ImportCertificateInput) => `Imported "${input.title}"`,
    },
  })

  const addExternalCertificateMutation = eden.mutate({
    invalidateQueries: [["fetchCertificates"]],
    mutationKey: ["addExternalCertificate"],
    route: api.certificates.external.post,
    toast: {
      errorTitle: () => "Failed to register external certificate",
      successTitle: (input: ExternalCertificateInput) => `Registered "${input.title}"`,
    },
  })

  const deleteCertificateMutation = eden.mutateRoute({
    invalidateQueries: [["fetchCertificates"]],
    mutationKey: ["deleteCertificate"],
    routeBuilder: ({ id }: { id: string }) => api.certificates({ id }).delete,
    toast: {
      errorTitle: () => "Failed to delete certificate",
      successTitle: () => "Certificate deleted",
    },
  })

  const updateCertificateMutation = eden.mutateRoute({
    invalidateQueries: [["fetchCertificates"]],
    mutationKey: ["updateCertificate"],
    routeBuilder: ({ id }: { id: string }) => api.certificates({ id }).put,
    toast: {
      errorTitle: () => "Failed to update certificate",
      successTitle: () => "Certificate updated",
    },
  })

  const revealCertificateMutation = eden.mutateRoute({
    invalidateQueries: [["fetchCertificates"]],
    mutationKey: ["revealCertificate"],
    routeBuilder: ({ id }: { id: string }) => api.certificates({ id }).reveal.post,
    toast: {
      errorTitle: () => "Failed to reveal private material",
      successTitle: () => "Private material decrypted",
    },
  })

  return {
    addExternalCertificateMutation,
    deleteCertificateMutation,
    generateCertificateMutation,
    importCertificateMutation,
    revealCertificateMutation,
    updateCertificateMutation,
  }
}
