import { describe, expect, test } from "bun:test"
import { symbols } from "../native/loader"

function cstr(str: string): Buffer {
  return Buffer.concat([Buffer.from(str), Buffer.from([0])])
}

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

    schemaId = Number(symbols.compile_schema(cstr(schemaJson)))
    expect(schemaId).toBeNumber()
  })

  test("Can validate successfully", () => {
    const dataJson = JSON.stringify({
      name: "Alice",
    })

    symbols.validate(schemaId, cstr(dataJson))
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

    schemaId = Number(symbols.compile_schema(cstr(schemaJson)))
    expect(schemaId).toBeEmpty()
  })

  test("Free last result", () => {
    symbols.free_last_result()
  })
})
