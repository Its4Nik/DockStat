import { DockStatError } from "@dockstat/errors"
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  type KeyObject,
  pbkdf2Sync,
  randomBytes,
} from "node:crypto"


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
    const curveName: string = jwk.crv === "P-256" ? "nistp256" : jwk.crv === "P-384" ? "nistp384" : jwk.crv as string
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

function decryptSecret(blob: string): string {
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

export {
  b64,
  toOpenSshPublicKey,
  fingerprintOf,
  decryptSecret,
  encryptSecret,
  deriveKey,
  sshMpint,
sshString
}
