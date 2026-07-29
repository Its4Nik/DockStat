import { t } from "elysia"

/**
 * The category of a stored credential. Determines how the material is
 * interpreted and where it can be used throughout DockStat.
 *
 * - `ssh`            : OpenSSH key pairs (RSA/Ed25519/ECDSA) used for SSH auth
 * - `docker-tls`     : X.509 client cert + key used to talk to a TLS-secured Docker daemon
 * - `web-tls`        : X.509 cert + key used to serve the DockStat WebUI over HTTPS
 * - `ca`             : A Certificate Authority (root or intermediate) used to sign other certs
 * - `generic-secret` : Arbitrary opaque secret material (API tokens, passwords, etc.)
 */
const CertificateType = t.UnionEnum(["ssh", "docker-tls", "web-tls", "ca", "generic-secret"])

/**
 * How the credential material was added to DockStat.
 *
 * - `generated` : Created on the fly by DockStat's key generator
 * - `imported`  : Pasted/uploaded by the user
 * - `external`  : Lives on disk or an external source; DockStat only stores a reference
 */
const CertificateSource = t.UnionEnum(["generated", "imported", "external"])

/**
 * Supported algorithms for newly generated keys.
 */
const CertificateAlgorithm = t.UnionEnum([
  "rsa",
  "ecdsa",
  "ed25519",
  "self-signed-rsa",
  "self-signed-ecdsa",
])

/**
 * Storage format for the private/public material.
 * PEM is the default; OpenSSH is used for SSH public keys.
 */
const CertificateFormat = t.UnionEnum(["pem", "openssh", "der"])

/**
 * A single stored credential row as returned by the API.
 *
 * NOTE: `privateData` is only ever returned from explicit "reveal" endpoints.
 * The default list/get responses omit it.
 */
const Certificate = t.Object({
  algorithm: t.Nullable(CertificateAlgorithm),

  comment: t.Nullable(t.String()),

  createdAt: t.String({ description: "ISO 8601 creation timestamp" }),
  expiresAt: t.Nullable(t.String({ description: "ISO 8601 expiry timestamp, if any" })),

  /**
   * Optional reference to an external resource (e.g. a file path on disk when
   * `source === "external"`).
   */
  externalRef: t.Nullable(t.String()),

  /**
   * Optional fingerprint (SHA-256) of the public material, used for display
   * and duplicate detection.
   */
  fingerprint: t.Nullable(t.String()),
  format: CertificateFormat,
  id: t.String({ description: "UUID of the credential" }),

  /**
   * Encrypted private material. NEVER returned by default. Only the dedicated
   * `/certificates/:id/reveal` endpoint returns the decrypted plaintext.
   */
  privateData: t.Nullable(t.String()),

  /**
   * Public material. For SSH this is the OpenSSH public key, for X.509 it is
   * the certificate chain. Safe to expose to the UI.
   */
  publicData: t.Nullable(t.String()),
  source: CertificateSource,
  tags: t.Array(t.String(), { default: [] }),
  title: t.String({ description: "Human-readable title" }),
  type: CertificateType,
  updatedAt: t.String({ description: "ISO 8601 last-update timestamp" }),
})

/**
 * Body for generating a brand-new credential. The server picks sensible
 * defaults for the algorithm depending on `type` when `algorithm` is omitted.
 */
const GenerateCertificateBody = t.Object({
  algorithm: t.Optional(CertificateAlgorithm),
  comment: t.Optional(t.Nullable(t.String())),
  /**
   * For X.509 types (docker-tls, web-tls, ca): the CN/SAN to put on the cert.
   */
  commonName: t.Optional(t.String({ description: "Common Name for X.509 certificates" })),
  /**
   * RSA key size when algorithm is rsa/self-signed-rsa. Defaults to 2048.
   */
  rsaKeySize: t.Optional(t.Number({ description: "RSA key size (e.g. 2048, 4096)" })),
  /**
   * For X.509 types: additional SAN entries (DNS or IP).
   */
  subjectAltNames: t.Optional(t.Array(t.String())),
  tags: t.Optional(t.Array(t.String())),
  title: t.String({ description: "Human-readable title", minLength: 1 }),
  type: CertificateType,
  /**
   * Validity in days for X.509 certs. Defaults to 365.
   */
  validityDays: t.Optional(t.Number({ minimum: 1 })),
})

/**
 * Body for importing existing credential material by pasting PEM/OpenSSH text.
 */
const ImportCertificateBody = t.Object({
  comment: t.Optional(t.Nullable(t.String())),
  expiresAt: t.Optional(t.Nullable(t.String({ description: "ISO 8601 expiry" }))),
  format: t.Optional(CertificateFormat),
  passphrase: t.Optional(
    t.String({ description: "Passphrase to decrypt an encrypted private key" })
  ),
  privateData: t.String({ description: "Private key material (PEM/OpenSSH)" }),
  publicData: t.Optional(t.String({ description: "Public cert/key material (PEM/OpenSSH)" })),
  tags: t.Optional(t.Array(t.String())),
  title: t.String({ minLength: 1 }),
  type: CertificateType,
})

/**
 * Body for adding an external reference (file on disk) without copying material.
 */
const AddExternalCertificateBody = t.Object({
  comment: t.Optional(t.Nullable(t.String())),
  externalRef: t.String({ description: "Path or URI to the external credential" }),
  publicData: t.Optional(t.String()),
  tags: t.Optional(t.Array(t.String())),
  title: t.String({ minLength: 1 }),
  type: CertificateType,
})

/**
 * Body for updating mutable metadata of a credential. The actual key material
 * cannot be changed — create a new credential instead.
 */
const UpdateCertificateBody = t.Object({
  comment: t.Optional(t.Nullable(t.String())),
  expiresAt: t.Optional(t.Nullable(t.String())),
  tags: t.Optional(t.Array(t.String())),
  title: t.Optional(t.String()),
})

/**
 * Body for resolving a credential by type/reference — used by the internal
 * resolution endpoint and the `/resolve` route.
 */
const ResolveCertificateBody = t.Object({
  externalRef: t.Optional(t.String()),
  /**
   * Optional title, tag or externalRef to disambiguate when multiple
   * credentials of the same type exist.
   */
  tag: t.Optional(t.String()),
  title: t.Optional(t.String()),
  type: CertificateType,
})

/**
 * Safe response shape (no private material).
 */
const CertificateResponse = t.Object({
  data: Certificate,
  message: t.String(),
  success: t.Literal(true),
})

const CertificateListResponse = t.Object({
  data: t.Array(Certificate),
  message: t.String(),
  success: t.Literal(true),
})

const CertificateDeleteResponse = t.Object({
  message: t.String(),
  success: t.Literal(true),
})

/**
 * Response for the reveal endpoint — includes decrypted private material.
 */
const CertificateRevealResponse = t.Object({
  data: t.Omit(Certificate, ["privateData"]),
  message: t.String(),
  privateData: t.String(),
  success: t.Literal(true),
})

/**
 * Response for the internal resolve endpoint. Returns the resolved material
 * so other backend services can use the stored keys.
 */
const CertificateResolveResponse = t.Object({
  data: t.Object({
    externalRef: t.Nullable(t.String()),
    fingerprint: t.Nullable(t.String()),
    id: t.String(),
    privateData: t.String(),
    publicData: t.Nullable(t.String()),
    title: t.String(),
    type: CertificateType,
  }),
  message: t.String(),
  success: t.Literal(true),
})

const CertificateError = t.Object({
  error: t.String(),
  message: t.String(),
  success: t.Literal(false),
})

export {
  Certificate,
  CertificateError,
  CertificateDeleteResponse,
  CertificateListResponse,
  CertificateResolveResponse,
  CertificateResponse,
  CertificateRevealResponse,
  CertificateType,
  CertificateSource,
  CertificateAlgorithm,
  CertificateFormat,
  GenerateCertificateBody,
  ImportCertificateBody,
  AddExternalCertificateBody,
  UpdateCertificateBody,
  ResolveCertificateBody,
}
