import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { column, DB } from "../index"

/**
 * Tests for WHERE clause functionality including:
 * - Simple equality conditions
 * - Regex conditions (client-side filtering)
 * - Raw SQL expressions
 * - IN/NOT IN clauses
 * - Comparison operators
 * - BETWEEN clauses
 * - NULL checks
 */

const db = new DB(":memory:")

interface TestUser extends Record<string, unknown> {
  id: number
  name: string
  email: string
  age: number | null
  score: number | null
  active: boolean | null
  role: string | null
  created_at: number | null
}

const table = db.createTable<TestUser>(
  "users",
  {
    id: column.id(),
    name: column.text({ notNull: true }),
    email: column.text({ notNull: true, unique: true }),
    age: column.integer({ notNull: false }),
    score: column.integer({ notNull: false }),
    active: column.boolean({ notNull: false }),
    role: column.text({ notNull: false }),
    created_at: column.timestamp({ notNull: false }),
  },
  { ifNotExists: true }
)

beforeAll(() => {
  // Insert test data
  table.insertBatch([
    {
      name: "Alice",
      email: "alice@gmail.com",
      age: 25,
      score: 85,
      active: true,
      role: "admin",
      created_at: 1000,
    },
    {
      name: "Bob",
      email: "bob@yahoo.com",
      age: 30,
      score: 92,
      active: true,
      role: "user",
      created_at: 2000,
    },
    {
      name: "Charlie",
      email: "charlie@gmail.com",
      age: 35,
      score: 78,
      active: false,
      role: "user",
      created_at: 3000,
    },
    {
      name: "Diana",
      email: "diana@outlook.com",
      age: 28,
      score: 95,
      active: true,
      role: "moderator",
      created_at: 4000,
    },
    {
      name: "Eve",
      email: "eve@gmail.com",
      age: null,
      score: null,
      active: null,
      role: null,
      created_at: null,
    },
    {
      name: "Frank",
      email: "frank@test.org",
      age: 40,
      score: 60,
      active: false,
      role: "user",
      created_at: 5000,
    },
  ])
})

afterAll(() => {
  db.close()
})

describe("Simple equality where conditions", () => {
  test("where with single equality condition", () => {
    const result = table.select(["*"]).where({ name: "Alice" }).first()
    expect(result?.name).toBe("Alice")
    expect(result?.email).toBe("alice@gmail.com")
  })

  test("where with multiple equality conditions", () => {
    const result = table.select(["*"]).where({ role: "user", active: true }).first()
    expect(result?.name).toBe("Bob")
  })

  test("where with boolean condition", () => {
    const results = table.select(["*"]).where({ active: true }).all()
    expect(results.length).toBe(3)
    expect(results.every((r) => r.active === true)).toBe(true)
  })

  test("where with null value", () => {
    const result = table.select(["*"]).where({ age: null }).first()
    expect(result?.name).toBe("Eve")
  })

  test("where with undefined value treated as null", () => {
    const result = table.select(["*"]).where({ role: undefined }).first()
    expect(result?.name).toBe("Eve")
  })

  test("where chaining replaces previous condition for same column", () => {
    const result = table.select(["*"]).where({ name: "Alice" }).where({ name: "Bob" }).first()
    expect(result?.name).toBe("Bob")
  })
})

describe("Regex where conditions", () => {
  test("whereRgx with RegExp object", () => {
    const results = table
      .select(["*"])
      .whereRgx({ email: /@gmail\.com$/ })
      .all()
    expect(results.length).toBe(3)
    expect(results.every((r) => r.email.endsWith("@gmail.com"))).toBe(true)
  })

  test("whereRgx with string pattern", () => {
    const results = table.select(["*"]).whereRgx({ email: "@gmail\\.com$" }).all()
    expect(results.length).toBe(3)
  })

  test("whereRgx with case-insensitive regex", () => {
    const results = table.select(["*"]).whereRgx({ name: /^a/i }).all()
    expect(results.length).toBe(1)
    expect(results[0].name).toBe("Alice")
  })

  test("whereRgx with complex pattern", () => {
    const results = table
      .select(["*"])
      .whereRgx({ email: /^[a-e].*@/ })
      .all()
    expect(results.length).toBeGreaterThan(0)
    expect(results.every((r) => /^[a-e].*@/.test(r.email))).toBe(true)
  })

  test("whereRgx combined with regular where", () => {
    const results = table
      .select(["*"])
      .where({ active: true })
      .whereRgx({ email: /@gmail\.com$/ })
      .all()
    expect(results.length).toBe(1)
    expect(results[0].name).toBe("Alice")
  })

  test("whereRgx respects ordering when applied client-side", () => {
    const results = table
      .select(["*"])
      .whereRgx({ email: /@gmail\.com$/ })
      .orderBy("name")
      .asc()
      .all()
    expect(results[0].name).toBe("Alice")
    expect(results[results.length - 1].name).toBe("Eve")
  })

  test("whereRgx respects limit and offset when applied client-side", () => {
    const results = table
      .select(["*"])
      .whereRgx({ email: /@gmail\.com$/ })
      .orderBy("name")
      .asc()
      .limit(2)
      .offset(1)
      .all()
    expect(results.length).toBe(2)
    expect(results[0].name).toBe("Charlie")
  })
})

describe("Raw SQL expression where conditions", () => {
  test("whereExpr with simple expression", () => {
    const results = table.select(["*"]).whereExpr("LENGTH(name) > ?", [4]).all()
    expect(results.every((r) => r.name.length > 4)).toBe(true)
  })

  test("whereExpr without parameters", () => {
    const results = table.select(["*"]).whereExpr("age IS NOT NULL").all()
    expect(results.length).toBe(5)
  })

  test("whereExpr with multiple parameters", () => {
    const results = table.select(["*"]).whereExpr("age BETWEEN ? AND ?", [25, 30]).all()
    expect(results.length).toBe(3)
    expect(results.every((r) => r.age !== null && r.age >= 25 && r.age <= 30)).toBe(true)
  })

  test("whereRaw is alias for whereExpr", () => {
    const results = table.select(["*"]).whereRaw("score > ?", [90]).all()
    expect(results.length).toBe(2)
  })

  test("whereExpr throws for empty expression", () => {
    expect(() => table.select(["*"]).whereExpr("")).toThrow()
  })

  test("whereExpr combined with other conditions", () => {
    const results = table.select(["*"]).where({ active: true }).whereExpr("age > ?", [26]).all()
    expect(results.length).toBe(2)
  })
})

describe("IN clause where conditions", () => {
  test("whereIn with array of values", () => {
    const results = table.select(["*"]).whereIn("name", ["Alice", "Bob", "Charlie"]).all()
    expect(results.length).toBe(3)
  })

  test("whereIn with single value", () => {
    const results = table.select(["*"]).whereIn("role", ["admin"]).all()
    expect(results.length).toBe(1)
    expect(results[0].name).toBe("Alice")
  })

  test("whereIn with numeric values", () => {
    const results = table.select(["*"]).whereIn("age", [25, 30, 35]).all()
    expect(results.length).toBe(3)
  })

  test("whereIn throws for empty array", () => {
    expect(() => table.select(["*"]).whereIn("name", [])).toThrow()
  })

  test("whereNotIn excludes matching values", () => {
    const results = table.select(["*"]).whereNotIn("role", ["admin", "moderator"]).all()
    // Should exclude Alice (admin), Diana (moderator), and include those with role='user' or null
    const roles = results.map((r) => r.role)
    expect(roles).not.toContain("admin")
    expect(roles).not.toContain("moderator")
  })

  test("whereNotIn throws for empty array", () => {
    expect(() => table.select(["*"]).whereNotIn("name", [])).toThrow()
  })

  test("whereIn combined with other conditions", () => {
    const results = table
      .select(["*"])
      .where({ active: true })
      .whereIn("role", ["admin", "user"])
      .all()
    expect(results.length).toBe(2)
  })
})

describe("Comparison operator where conditions", () => {
  test("whereOp with greater than", () => {
    const results = table.select(["*"]).whereOp("age", ">", 30).all()
    expect(results.every((r) => r.age !== null && r.age > 30)).toBe(true)
  })

  test("whereOp with greater than or equal", () => {
    const results = table.select(["*"]).whereOp("age", ">=", 35).all()
    expect(results.every((r) => r.age !== null && r.age >= 35)).toBe(true)
  })

  test("whereOp with less than", () => {
    const results = table.select(["*"]).whereOp("score", "<", 80).all()
    expect(results.every((r) => r.score !== null && r.score < 80)).toBe(true)
  })

  test("whereOp with less than or equal", () => {
    const results = table.select(["*"]).whereOp("score", "<=", 78).all()
    expect(results.every((r) => r.score !== null && r.score <= 78)).toBe(true)
  })

  test("whereOp with not equal", () => {
    const results = table.select(["*"]).whereOp("role", "!=", "user").all()
    expect(results.every((r) => r.role !== "user")).toBe(true)
  })

  test("whereOp with <> (alternative not equal)", () => {
    const results = table.select(["*"]).whereOp("role", "<>", "admin").all()
    expect(results.every((r) => r.role !== "admin")).toBe(true)
  })

  test("whereOp with LIKE pattern", () => {
    const results = table.select(["*"]).whereOp("email", "LIKE", "%@gmail.com").all()
    expect(results.length).toBe(3)
  })

  test("whereOp with GLOB pattern", () => {
    const results = table.select(["*"]).whereOp("name", "GLOB", "A*").all()
    expect(results.length).toBe(1)
    expect(results[0].name).toBe("Alice")
  })

  test("whereOp with null value converts to IS NULL", () => {
    const results = table.select(["*"]).whereOp("age", "=", null).all()
    expect(results.length).toBe(1)
    expect(results[0].name).toBe("Eve")
  })

  test("whereOp with IS operator and null", () => {
    const results = table.select(["*"]).whereOp("score", "IS", null).all()
    expect(results.length).toBe(1)
    expect(results[0].name).toBe("Eve")
  })

  test("whereOp with != null converts to IS NOT NULL", () => {
    const results = table.select(["*"]).whereOp("age", "!=", null).all()
    expect(results.length).toBe(5)
  })

  test("whereOp with IS NOT operator and null", () => {
    const results = table.select(["*"]).whereOp("role", "IS NOT", null).all()
    expect(results.length).toBe(5)
  })

  test("whereOp normalizes lowercase operators", () => {
    const results = table.select(["*"]).whereOp("email", "like", "%@gmail%").all()
    expect(results.length).toBe(3)
  })

  test("whereOp throws for invalid operator", () => {
    expect(() => table.select(["*"]).whereOp("age", "INVALID", 25).all()).toThrow()
  })
})

describe("BETWEEN where conditions", () => {
  test("whereBetween with numeric values", () => {
    const results = table.select(["*"]).whereBetween("age", 25, 35).all()
    expect(results.length).toBe(4)
    expect(results.every((r) => r.age !== null && r.age >= 25 && r.age <= 35)).toBe(true)
  })

  test("whereBetween with score range", () => {
    const results = table.select(["*"]).whereBetween("score", 80, 95).all()
    expect(results.every((r) => r.score !== null && r.score >= 80 && r.score <= 95)).toBe(true)
  })

  test("whereNotBetween excludes range", () => {
    const results = table.select(["*"]).whereNotBetween("age", 25, 35).all()
    expect(results.every((r) => r.age === null || r.age < 25 || r.age > 35)).toBe(true)
  })

  test("whereBetween with timestamp values", () => {
    const results = table.select(["*"]).whereBetween("created_at", 2000, 4000).all()
    expect(results.length).toBe(3)
  })

  test("whereBetween combined with other conditions", () => {
    const results = table.select(["*"]).where({ active: true }).whereBetween("score", 85, 100).all()
    expect(results.length).toBe(3)
  })
})

describe("NULL check where conditions", () => {
  test("whereNull finds rows with null values", () => {
    const results = table.select(["*"]).whereNull("age").all()
    expect(results.length).toBe(1)
    expect(results[0].name).toBe("Eve")
  })

  test("whereNotNull finds rows with non-null values", () => {
    const results = table.select(["*"]).whereNotNull("age").all()
    expect(results.length).toBe(5)
  })

  test("whereNull on different columns", () => {
    const ageNull = table.select(["*"]).whereNull("age").count()
    const roleNull = table.select(["*"]).whereNull("role").count()
    expect(ageNull).toBe(1)
    expect(roleNull).toBe(1)
  })

  test("whereNotNull combined with other conditions", () => {
    const results = table.select(["*"]).whereNotNull("score").where({ active: true }).all()
    expect(results.length).toBe(3)
  })

  test("whereNull replaces existing condition for column", () => {
    const results = table.select(["*"]).where({ age: 25 }).whereNull("age").all()
    expect(results.length).toBe(1)
    expect(results[0].name).toBe("Eve")
  })
})

describe("Complex where condition combinations", () => {
  test("multiple different where types combined", () => {
    const results = table
      .select(["*"])
      .whereNotNull("age")
      .whereOp("age", ">=", 25)
      .whereOp("age", "<=", 35)
      .where({ active: true })
      .limit(100)
      .all()
    expect(results.length).toBeGreaterThanOrEqual(2)
  })

  test("where conditions with ordering", () => {
    const results = table.select(["*"]).whereBetween("age", 25, 40).orderBy("age").asc().all()
    expect(results[0].age).toBe(25)
    expect(results[results.length - 1].age).toBe(40)
  })

  test("where conditions with limit", () => {
    const results = table.select(["*"]).whereNotNull("score").orderBy("score").desc().limit(3).all()
    expect(results.length).toBe(3)
    expect(results[0].score).toBe(95)
  })

  test("where with count", () => {
    const count = table.select(["*"]).where({ active: true }).count()
    expect(count).toBe(3)
  })

  test("where with exists", () => {
    const exists = table.select(["*"]).where({ role: "admin" }).exists()
    expect(exists).toBe(true)

    const notExists = table.select(["*"]).where({ role: "superadmin" }).exists()
    expect(notExists).toBe(false)
  })

  test("where with value extraction", () => {
    const email = table.select(["*"]).where({ name: "Alice" }).value("email")
    expect(email).toBe("alice@gmail.com")
  })

  test("where with pluck", () => {
    const names = table.select(["*"]).where({ active: true }).pluck("name")
    expect(names).toContain("Alice")
    expect(names).toContain("Bob")
    expect(names).toContain("Diana")
    expect(names.length).toBe(3)
  })
})
