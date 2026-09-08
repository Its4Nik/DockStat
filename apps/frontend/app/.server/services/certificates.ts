import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createPublicKey,
  generateKeyPairSync,
  type KeyObject,
  pbkdf2Sync,
  randomBytes,
} from "node:crypto"
import { DockStatError } from "@dockstat/errors"
import type { Logger } from "@dockstat/logger"
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

/**
 * Result of generating/importing a credential, before persistence.
 * The service hands the public material + (encrypted) private material to the
 * caller (the route) which then inserts it into the DB.
 */
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

const ENC_ALGO = "aes-256-gcm"
const PBKDF2_ITERATIONS = 150_000
const KEY_LEN = 32
const SALT_LEN = 16
const IV_LEN = 12

function b64(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64")
}

// ---------------------------------------------------------------------------
// OpenSSH public key formatting (RFC 4252) built from a JWK public key.
// Supports ssh-rsa, ecdsa-sha2-nistp{256,384} and ssh-ed25519.
// ---------------------------------------------------------------------------

function sshString(payload: Buffer | string): Buffer {
  const content = typeof payload === "string" ? Buffer.from(payload, "utf8") : payload
  const header = Buffer.allocUnsafe(4)
  header.writeUInt32BE(content.length, 0)
  return Buffer.concat([header, content])
}

function sshMpint(value: Buffer): Buffer {
  let trimmed = value
  while (trimmed.length > 1 && trimmed[0] === 0x00) {
    trimmed = trimmed.subarray(1)
  }
  if (trimmed.length > 0 && trimmed[0] & 0x80) {
    const padded = Buffer.alloc(trimmed.length + 1)
    trimmed.copy(padded, 1)
    trimmed = padded
  }
  return trimmed
}

function toOpenSshPublicKey(pub: KeyObject, comment = ""): string {
  const jwk = pub.export({ format: "jwk" }) as Record<string, string>
  let type: string
  let blob: Buffer

  if (jwk.kty === "RSA") {
    type = "ssh-rsa"
    const n = sshMpint(Buffer.from(jwk.n, "base64"))
    const e = sshMpint(Buffer.from(jwk.e, "base64"))
    blob = Buffer.concat([sshString(type), sshString(e), sshString(n)])
  } else if (jwk.kty === "EC") {
    const curveName = jwk.crv === "P-256" ? "nistp256" : jwk.crv === "P-384" ? "nistp384" : jwk.crv
    type = `ecdsa-sha2-${curveName}`
    const point = Buffer.from(jwk.x + jwk.y, "base64")
    blob = Buffer.concat([sshString(type), sshString(curveName), sshString(point)])
  } else if (jwk.kty === "OKP") {
    type = "ssh-ed25519"
    const raw = Buffer.from(jwk.x, "base64")
    blob = Buffer.concat([sshString(type), sshString(raw)])
  } else {
    throw new DockStatError("INVALID_INPUT", {
      message: `Unsupported public key type: ${jwk.kty}`,
    })
  }

  const encoded = b64(blob)
  return comment ? `${type} ${encoded} ${comment}` : `${type} ${encoded}`
}

// ---------------------------------------------------------------------------
// Encryption-at-rest (AES-256-GCM with PBKDF2-derived key)
// ---------------------------------------------------------------------------

function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return pbkdf2Sync(passphrase, salt, PBKDF2_ITERATIONS, KEY_LEN, "sha256")
}

function encryptSecret(plaintext: string): string {
  const passphrase = Bun.env.DOCKSTAT_CERT_MASTER_KEY || "dockstat-dev-master-key"
  const salt = randomBytes(SALT_LEN)
  const key = deriveKey(passphrase, salt)
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv(ENC_ALGO, key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `v1:${b64(Buffer.concat([salt, iv, tag, ciphertext]))}`
}

export function decryptSecret(blob: string): string {
  if (!blob.startsWith("v1:")) {
    // Plaintext fallback (e.g. material stored before encryption was enabled).
    return blob
  }
  const passphrase = Bun.env.DOCKSTAT_CERT_MASTER_KEY || "dockstat-dev-master-key"
  const raw = Buffer.from(blob.slice(3), "base64")
  const salt = raw.subarray(0, SALT_LEN)
  const iv = raw.subarray(SALT_LEN, SALT_LEN + IV_LEN)
  const tag = raw.subarray(SALT_LEN + IV_LEN, SALT_LEN + IV_LEN + 16)
  const ciphertext = raw.subarray(SALT_LEN + IV_LEN + 16)
  const key = deriveKey(passphrase, salt)
  const decipher = createDecipheriv(ENC_ALGO, key, iv)
  decipher.setAuthTag(tag)
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return plaintext.toString("utf8")
}

function fingerprintOf(data: string | null): string | null {
  if (!data) return null
  return `SHA256:${createHash("sha256").update(data).digest("base64")}`
}

// ---------------------------------------------------------------------------
// Public service
// ---------------------------------------------------------------------------

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
      days: validityDays,
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
