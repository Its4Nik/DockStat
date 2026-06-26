import { dlopen, FFIType, read, suffix } from "bun:ffi"

const nativePath = `${import.meta.dir}/libvalidator.${suffix}`

export const { symbols } = dlopen(nativePath, {
  compile_schema: {
    args: [FFIType.cstring],
    returns: FFIType.u64,
  },
  free_last_result: {
    args: [],
    returns: FFIType.void,
  },
  free_schema: {
    args: [FFIType.u64],
    returns: FFIType.void,
  },
  get_last_result: {
    args: [],
    returns: FFIType.cstring,
  },
  /**
   * Validate a single JSON payload (raw UTF-8 bytes, no NUL terminator).
   * Writes a compact binary result into `result_buf`.
   * Returns bytes written, or 0 on error.
   */
  validate: {
    args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32],
    returns: FFIType.u32,
  },
  /**
   * Validate multiple length-prefixed JSON payloads in one call.
   * Returns total bytes written into `result_buf`, or 0 on error.
   */
  validate_batch: {
    args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32],
    returns: FFIType.u32,
  },
  // Legacy symbols (kept for existing low-level tests)
  validate_json: {
    args: [FFIType.u64, FFIType.cstring],
    returns: FFIType.void,
  },
})

// ─── Reusable buffers (allocated once, never GC'd) ─────────────────────────

const RESULT_BUF = new Uint8Array(1024 * 1024) // 1 MB
const BATCH_BUF = new Uint8Array(1024 * 1024) // 1 MB for batch input assembly
const BATCH_RESULT_BUF = new Uint8Array(1024 * 1024) // 1 MB for batch results

// ─── Binary result parsing ─────────────────────────────────────────────────

interface ParsedResult {
  valid: boolean
  errors: Array<{ path: string; message: string }>
}

function parseBinaryResult(buf: Uint8Array, offset: number, end: number): ParsedResult {
  let pos = offset
  const valid = buf[pos] === 1
  pos += 1
  const errorCount = buf[pos] | (buf[pos + 1] << 8) // u16 LE
  pos += 2

  if (errorCount === 0) return { errors: [], valid: true }

  const errors: Array<{ path: string; message: string }> = new Array(errorCount)
  for (let i = 0; i < errorCount; i++) {
    const pathLen = buf[pos] | (buf[pos + 1] << 8)
    pos += 2
    const path = Buffer.from(buf.buffer, buf.byteOffset + pos, pathLen).toString("utf-8")
    pos += pathLen
    const msgLen = buf[pos] | (buf[pos + 1] << 8)
    pos += 2
    const message = Buffer.from(buf.buffer, buf.byteOffset + pos, msgLen).toString("utf-8")
    pos += msgLen
    errors[i] = { message, path }
  }
  return { errors, valid: false }
}

function createCstr(str: string): Buffer {
  return Buffer.concat([Buffer.from(str), Buffer.from([0])])
}

// ─── Internal helpers ──────────────────────────────────────────────────────

export { createCstr as cstr }

export function nativeCompile(json: string): number {
  const id = Number(symbols.compile_schema(createCstr(json)))
  symbols.free_last_result()
  return id
}

export function nativeValidate(schemaId: number, dataJson: string): ParsedResult {
  const dataBuf = Buffer.from(dataJson, "utf-8")
  const written = symbols.validate(schemaId, dataBuf, dataBuf.length, RESULT_BUF, RESULT_BUF.length)
  if (written === 0) {
    return { errors: [{ message: "Validation failed", path: "$" }], valid: false }
  }
  return parseBinaryResult(RESULT_BUF, 0, written)
}

export function nativeValidateBatch(schemaId: number, items: Uint8Array): ParsedResult[] {
  const written = symbols.validate_batch(
    schemaId,
    items,
    items.length,
    BATCH_RESULT_BUF,
    BATCH_RESULT_BUF.length
  )
  if (written === 0) {
    return items.length > 0
      ? [{ errors: [{ message: "Batch validation failed", path: "$" }], valid: false }]
      : []
  }

  const results: ParsedResult[] = []
  let offset = 0
  while (offset < written) {
    const valid = BATCH_RESULT_BUF[offset] === 1
    const errCount = BATCH_RESULT_BUF[offset + 1] | (BATCH_RESULT_BUF[offset + 2] << 8)
    let itemEnd = offset + 3
    if (!valid) {
      for (let e = 0; e < errCount; e++) {
        // skip path
        const pLen = BATCH_RESULT_BUF[itemEnd] | (BATCH_RESULT_BUF[itemEnd + 1] << 8)
        itemEnd += 2 + pLen
        // skip msg
        const mLen = BATCH_RESULT_BUF[itemEnd] | (BATCH_RESULT_BUF[itemEnd + 1] << 8)
        itemEnd += 2 + mLen
      }
    }
    results.push(parseBinaryResult(BATCH_RESULT_BUF, offset, itemEnd))
    offset = itemEnd
  }
  return results
}

// ─── Fast path: validate → just boolean (avoids result parsing overhead) ───

export function nativeValidateBool(schemaId: number, dataBuf: Buffer): boolean {
  const written = symbols.validate(schemaId, dataBuf, dataBuf.length, RESULT_BUF, RESULT_BUF.length)
  return written > 0 && RESULT_BUF[0] === 1
}

// ─── Batch input builder ──────────────────────────────────────────────────

/**
 * Build a length-prefixed batch buffer from an array of pre-encoded JSON Buffers.
 * Writes into the shared BATCH_BUF to avoid allocations.
 * Returns the slice of BATCH_BUF that contains the batch data.
 */
export function buildBatchInput(encodedItems: Buffer[]): { buf: Uint8Array; len: number } {
  // Estimate total size
  let total = 0
  for (const item of encodedItems) total += 4 + item.length

  let offset = 0
  const buf = total <= BATCH_BUF.length ? BATCH_BUF : new Uint8Array(total) // fall back to allocation if batch is huge

  for (const item of encodedItems) {
    buf[offset] = item.length & 0xff
    buf[offset + 1] = (item.length >> 8) & 0xff
    buf[offset + 2] = (item.length >> 16) & 0xff
    buf[offset + 3] = (item.length >> 24) & 0xff
    offset += 4
    buf.set(item, offset)
    offset += item.length
  }

  return { buf, len: offset }
}
