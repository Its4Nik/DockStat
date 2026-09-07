import type {
  CertificateAlgorithmType,
  CertificateFormatType,
  CertificateSourceType,
  CertificateTypeRow,
  CertificateTypeType,
  GenerateCertificateBodyType,
  ImportCertificateBodyType,
  ResolveCertificateBodyType,
} from "@dockstat/typings/types"
import * as selfsigned from "selfsigned"
import type { PreparedCertificate } from "./types"
import type Logger from "@dockstat/logger"
import { DockStatError } from "@dockstat/errors"
import {
  createPublicKey,
  generateKeyPairSync,
  randomBytes,
} from "node:crypto"
import { b64, decryptSecret, encryptSecret, fingerprintOf, toOpenSshPublicKey } from "./lib"


export class CertificateService {
  constructor(private logger: Logger) {}

  /**
   * Generate a brand-new credential of the requested type.
   */
  generate(input: GenerateCertificateBodyType): PreparedCertificate {
    const type = input.type
    const algo = input.algorithm ?? this.defaultAlgorithmFor(type)
    this.logger.info(`Generating ${type} certificate "${input.title}" (${algo})`)

    switch (type) {
      case "ssh":
        return this.generateSsh(algo, input)
      case "docker-tls":
      case "web-tls":
        return this.generateTls(type, algo, input)
      case "ca":
        return this.generateCa(algo, input)
      case "generic-secret":
        return this.generateGenericSecret(input)
      default:
        throw new DockStatError("INVALID_INPUT", {
          message: `Cannot generate certificate of type "${type}"`,
        })
    }
  }

  private defaultAlgorithmFor(type: CertificateTypeType): CertificateAlgorithmType {
    if (type === "ssh") return "ed25519"
    return "self-signed-rsa"
  }

  private generateSsh(
    algo: CertificateAlgorithmType,
    input: GenerateCertificateBodyType
  ): PreparedCertificate {
    let privateKeyPem: string
    let publicKeyPem: string

    if (algo === "rsa") {
      const pair = generateKeyPairSync("rsa", {
        modulusLength: input.rsaKeySize ?? 2048,
        privateKeyEncoding: { format: "pem", type: "pkcs8" },
        publicKeyEncoding: { format: "pem", type: "spki" },
      })
      privateKeyPem = pair.privateKey
      publicKeyPem = pair.publicKey
    } else if (algo === "ecdsa") {
      const pair = generateKeyPairSync("ec", {
        namedCurve: "prime256v1",
        privateKeyEncoding: { format: "pem", type: "pkcs8" },
        publicKeyEncoding: { format: "pem", type: "spki" },
      })
      privateKeyPem = pair.privateKey
      publicKeyPem = pair.publicKey
    } else {
      const pair = generateKeyPairSync("ed25519", {
        privateKeyEncoding: { format: "pem", type: "pkcs8" },
        publicKeyEncoding: { format: "pem", type: "spki" },
      })
      privateKeyPem = pair.privateKey
      publicKeyPem = pair.publicKey
    }

    const pubObj = createPublicKey(publicKeyPem)
    const openSsh = toOpenSshPublicKey(pubObj, input.title)

    return {
      algorithm: algo,
      externalRef: null,
      fingerprint: fingerprintOf(openSsh),
      format: "openssh",
      privateData: encryptSecret(privateKeyPem),
      publicData: openSsh,
      source: "generated",
      title: input.title,
      type: "ssh",
    }
  }

  private generateTls(
    type: CertificateTypeType,
    algo: CertificateAlgorithmType,
    input: GenerateCertificateBodyType
  ): PreparedCertificate {
    const modulusLength = input.rsaKeySize ?? 2048
    const cn = input.commonName || input.title
    const altNames = (input.subjectAltNames ?? []).map((n) =>
      /^\d+\.\d+\.\d+\.\d+$/.test(n) ? { ip: n, type: 7 } : { type: 2, value: n }
    )
    const attrs = [{ name: "commonName", value: cn }]
    const validityDays = input.validityDays ?? 365

    const result = selfsigned.generate(attrs, {
      algorithm: "sha256",
      days: validityDays,
      extensions: altNames.length ? [{ altNames, name: "subjectAltName" }] : undefined,
      keySize: modulusLength,
    })

    // selfsigned returns an object with .private (PEM) and .public/.cert (PEM)
    const cert = (result.cert ?? result.public) as string
    const privateKey = result.private as string

    return {
      algorithm: algo,
      externalRef: null,
      fingerprint: fingerprintOf(cert),
      format: "pem",
      privateData: encryptSecret(privateKey),
      publicData: cert,
      source: "generated",
      title: input.title,
      type,
    }
  }

  private generateCa(
    algo: CertificateAlgorithmType,
    input: GenerateCertificateBodyType
  ): PreparedCertificate {
    const modulusLength = input.rsaKeySize ?? 4096
    const cn = input.commonName || input.title
    const attrs = [{ name: "commonName", value: cn }]
    const validityDays = input.validityDays ?? 3650

    const result = selfsigned.generate(attrs, {
      algorithm: "sha256",
      notAfterDate
      keySize: modulusLength,
    })

    const cert = (result.cert ?? result.public) as string
    const privateKey = result.private as string

    return {
      algorithm: algo,
      externalRef: null,
      fingerprint: fingerprintOf(cert),
      format: "pem",
      privateData: encryptSecret(privateKey),
      publicData: cert,
      source: "generated",
      title: input.title,
      type: "ca",
    }
  }

  private generateGenericSecret(input: GenerateCertificateBodyType): PreparedCertificate {
    const token = b64(randomBytes(32))
    return {
      algorithm: null,
      externalRef: null,
      fingerprint: fingerprintOf(token),
      format: "pem",
      privateData: encryptSecret(token),
      publicData: null,
      source: "generated",
      title: input.title,
      type: "generic-secret",
    }
  }

  /**
   * Import existing material supplied by the user.
   */
  import(input: ImportCertificateBodyType): PreparedCertificate {
    const format: CertificateFormatType = input.format ?? "pem"
    const publicData = input.publicData ?? null

    return {
      algorithm: null,
      externalRef: null,
      fingerprint: fingerprintOf(publicData ?? input.privateData),
      format,
      privateData: encryptSecret(input.privateData),
      publicData,
      source: "imported",
      title: input.title,
      type: input.type,
    }
  }

  /**
   * Register an external reference (e.g. a file path) without storing material.
   */
  external(input: {
    title: string
    type: CertificateTypeType
    externalRef: string
    publicData?: string
    comment?: string | null
    tags?: string[]
  }): PreparedCertificate {
    return {
      algorithm: null,
      externalRef: input.externalRef,
      fingerprint: fingerprintOf(input.publicData ?? input.externalRef),
      format: "pem",
      privateData: null,
      publicData: input.publicData ?? null,
      source: "external",
      title: input.title,
      type: input.type,
    }
  }

  /**
   * Reveal the decrypted private material for a stored row. Only the
   * `/certificates/:id/reveal` endpoint should call this.
   */
  reveal(row: CertificateTypeRow): string {
    if (!row.privateData) {
      throw new DockStatError("NOT_FOUND", {
        message: `Certificate "${row.title}" has no private material (external reference)`,
      })
    }
    return decryptSecret(row.privateData)
  }

  /**
   * Internal resolution used by other backend services to obtain material by
   * type. Optionally disambiguated by title, tag, or externalRef.
   */
  resolve(rows: CertificateTypeRow[], query: ResolveCertificateBodyType): CertificateTypeRow {
    let candidates = rows.filter((r) => r.type === query.type)

    if (query.title) {
      const byTitle = candidates.filter((r) => r.title === query.title)
      if (byTitle.length) candidates = byTitle
    }
    if (query.tag) {
      const byTag = candidates.filter((r) => (r.tags ?? []).includes(query.tag as string))
      if (byTag.length) candidates = byTag
    }
    if (query.externalRef) {
      const byRef = candidates.filter((r) => r.externalRef === query.externalRef)
      if (byRef.length) candidates = byRef
    }

    if (candidates.length === 0) {
      throw new DockStatError("NOT_FOUND", {
        message: `No certificate found for type "${query.type}"`,
      })
    }

    // Most recently updated wins.
    candidates.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
    return candidates[0]
  }

  /**
   * Strip the private material from a row so it can be returned to the UI
   * safely.
   */
  sanitize(row: CertificateTypeRow): CertificateTypeRow {
    return { ...row, privateData: null }
  }
}
