import { describe, expect, test } from "bun:test"
import { cstr, nativeCompile, nativeValidate, nativeValidateBatch, symbols } from "../loader"

let schemaId = 0

describe("Basic schema compilation, validation and memmory freeing", () => {
  test("can compile schema", () => {
    const schemaJson = JSON.stringify({
      properties: {
        name: { type: "string" },
      },
      required: ["name"],
      type: "object",
    })

    schemaId = nativeCompile(schemaJson)
    expect(schemaId).toBeNumber()
  })

  test("Can validate successfully (binary protocol)", () => {
    const result = nativeValidate(schemaId, JSON.stringify({ name: "Alice" }))
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test("Can detect validation error (binary protocol)", () => {
    const result = nativeValidate(schemaId, JSON.stringify({ name: 42 }))
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  test("Batch validation", () => {
    const items = [
      JSON.stringify({ name: "Alice" }),
      JSON.stringify({ name: 42 }),
      JSON.stringify({ name: "Bob" }),
    ]
    const bufs = items.map((s) => Buffer.from(s))
    const { buf, len } = (() => {
      let total = 0
      for (const b of bufs) total += 4 + b.length
      const batch = new Uint8Array(total)
      let off = 0
      for (const b of bufs) {
        batch[off] = b.length & 0xff
        batch[off + 1] = (b.length >> 8) & 0xff
        batch[off + 2] = (b.length >> 16) & 0xff
        batch[off + 3] = (b.length >> 24) & 0xff
        off += 4
        batch.set(b, off)
        off += b.length
      }
      return { buf: batch, len: off }
    })()

    const results = nativeValidateBatch(schemaId, buf.subarray(0, len))
    expect(results).toHaveLength(3)
    expect(results[0].valid).toBe(true)
    expect(results[1].valid).toBe(false)
    expect(results[2].valid).toBe(true)
  })

  test("Can validate with legacy JSON protocol", () => {
    symbols.validate_json(schemaId, cstr(JSON.stringify({ name: "Alice" })))
    const ptr = symbols.get_last_result()
    expect(ptr).not.toBeNull()
    symbols.free_last_result()
  })

  test("Can free specific schema", () => {
    symbols.free_schema(schemaId)
  })

  test("Can spot error in basic schema", () => {
    const schemaJson = JSON.stringify({
      properties: {
        name: { type: "ThisIsAnAmazingErrorRight?" },
      },
      required: ["name"],
      type: "object",
    })

    schemaId = nativeCompile(schemaJson)
    expect(schemaId).toBe(0)
  })

  test("Free last result", () => {
    symbols.free_last_result()
  })
})
