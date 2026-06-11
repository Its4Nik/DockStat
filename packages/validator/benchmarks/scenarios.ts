import type { FieldType, SchemaDef } from "./shared"

// ─── Preset schemas ───────────────────────────────────────────────────────

export const presetScenarios: SchemaDef[] = [
  {
    fields: {
      active: { kind: "boolean" },
      age: { kind: "number", max: 150, min: 0 },
      email: { kind: "string", maxLength: 100, minLength: 5 },
      name: { kind: "string", maxLength: 50, minLength: 1 },
      score: { kind: "integer", max: 100, min: 0 },
    },
    name: "Simple Object",
  },
  {
    fields: {
      id: { kind: "string" },
      user: {
        fields: {
          address: {
            fields: {
              city: { kind: "string" },
              country: { kind: "string" },
              zip: { kind: "string", maxLength: 10, minLength: 5 },
            },
            kind: "object",
          },
          name: { kind: "string", minLength: 1 },
          tags: { items: { kind: "string" }, kind: "array" },
        },
        kind: "object",
      },
    },
    name: "Nested Object",
  },
  {
    fields: {
      active: { kind: "boolean" },
      id: { kind: "string" },
      labels: { items: { kind: "string", maxLength: 20, minLength: 1 }, kind: "array" },
      matrix: {
        items: {
          items: { kind: "number", max: 1, min: 0 },
          kind: "array",
        },
        kind: "array",
      },
      scores: { items: { kind: "integer", max: 100, min: 0 }, kind: "array" },
    },
    name: "Array Heavy",
  },
  {
    fields: {
      active: { kind: "boolean" },
      age: { kind: "integer", max: 150, min: 0 },
      id: { kind: "string", minLength: 8 },
      metadata: {
        inner: {
          fields: {
            created: { kind: "string" },
            updated: { inner: { kind: "string" }, kind: "optional" },
          },
          kind: "object",
        },
        kind: "nullable",
      },
      name: { kind: "string", maxLength: 100, minLength: 1 },
      permissions: { items: { kind: "string" }, kind: "array" },
      role: { kind: "enum", values: ["admin", "user", "guest", "moderator"] },
    },
    name: "Complex",
  },
  {
    fields: {
      field0: { kind: "string", minLength: 1 },
      field1: { kind: "number", max: 100, min: 0 },
      field2: { kind: "integer", max: 1000, min: 0 },
      field3: { kind: "boolean" },
      field4: { kind: "string", maxLength: 50, minLength: 5 },
      field5: { kind: "number" },
      field6: { kind: "integer" },
      field7: { kind: "boolean" },
      field8: { kind: "string" },
      field9: { kind: "number", max: 100, min: -100 },
      field10: { kind: "integer", min: 0 },
      field11: { kind: "boolean" },
      field12: { kind: "string", maxLength: 200 },
      field13: { kind: "number" },
      field14: { kind: "integer", max: 500, min: 0 },
      field15: { kind: "boolean" },
      field16: { kind: "string" },
      field17: { kind: "number", max: 1000, min: -1000 },
      field18: { kind: "string", maxLength: 30, minLength: 3 },
      field19: { kind: "integer" },
      field20: { kind: "boolean" },
      field21: { kind: "string" },
      field22: { kind: "number" },
      field23: { kind: "integer", min: 1 },
      field24: { kind: "boolean" },
    },
    name: "Large Flat",
  },
]

// ─── Random schema generator ──────────────────────────────────────────────

import { Random } from "./shared"

function randomField(rand: Random, depth: number): FieldType {
  const types: FieldType[] = [
    { kind: "string" },
    { kind: "string", maxLength: rand.int(20, 100), minLength: rand.int(1, 10) },
    { kind: "number", max: rand.int(100, 10000), min: rand.int(0, 50) },
    { kind: "integer", max: rand.int(500, 10000), min: rand.int(0, 100) },
    { kind: "boolean" },
    { kind: "null" },
    {
      kind: "enum",
      values: [`val_${rand.int(0, 9)}`, `val_${rand.int(10, 19)}`, `val_${rand.int(20, 29)}`],
    },
    { kind: "literal", value: `lit_${rand.int(0, 99)}` },
  ]

  if (depth > 0) {
    types.push(
      { items: randomField(rand, depth - 1), kind: "array" },
      {
        fields: Object.fromEntries(
          Array.from({ length: rand.int(2, 4) }, (_, i) => [
            `sub_${i}`,
            randomField(rand, depth - 1),
          ])
        ),
        kind: "object",
      }
    )
  }

  const base = types[rand.int(0, types.length - 1)]

  if (rand.float() < 0.25) return { inner: base, kind: "optional" }
  if (rand.float() < 0.15) return { inner: base, kind: "nullable" }
  return base
}

export function generateRandomSchema(rand: Random, name: string, depth = 2): SchemaDef {
  const fieldCount = rand.int(5, 15)
  const fields: Record<string, FieldType> = {}
  for (let i = 0; i < fieldCount; i++) {
    fields[`f${i}`] = randomField(rand, depth)
  }
  return { fields, name }
}

export function randomScenarios(): SchemaDef[] {
  const rand = new Random(12345)
  return [
    generateRandomSchema(rand, "Random Small", 0),
    generateRandomSchema(rand, "Random Medium", 1),
    generateRandomSchema(rand, "Random Large", 2),
  ]
}
