import { describe, expect, test } from "bun:test"
import { symbols } from "../native/loader"

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

    const buf = Buffer.from(schemaJson)

    schemaId = Number(symbols.compile_schema(buf))
    expect(schemaId).toBeNumber()
  })

  test("Can validate successfully", () => {
    const dataJson = JSON.stringify({
      name: "Alice",
    })

    const buf = Buffer.from(dataJson)

    symbols.validate(schemaId, buf)
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

    const buf = Buffer.from(schemaJson)

    schemaId = Number(symbols.compile_schema(buf))
    expect(schemaId).toBeEmpty()
  })

  test("Free last result", () => {
    symbols.free_last_result()
  })
})
