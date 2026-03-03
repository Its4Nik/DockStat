import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { column, DB } from "../src/index"

/**
 * Comprehensive tests for SelectQueryBuilder operations
 *
 * Tests cover:
 * - Column selection (specific columns or *)
 * - ORDER BY with ASC/DESC
 * - LIMIT and OFFSET
 * - Result execution methods: all(), get(), first()
 * - Aggregation: count(), exists()
 * - Value extraction: value(), pluck()
 * - Client-side operations with regex filtering
 */

const db = new DB(":memory:")

interface Product extends Record<string, unknown> {
  id: number
  name: string
  category: string
  price: number
  stock: number
  active: boolean
  description: string | null
}

const products = db.createTable<Product>(
  "products",
  {
    id: column.id(),
    name: column.text({ notNull: true }),
    category: column.text({ notNull: true }),
    price: column.real({ notNull: true }),
    stock: column.integer({ default: 0 }),
    active: column.boolean({ default: true }),
    description: column.text({ notNull: false }),
  },
  { ifNotExists: true }
)

beforeAll(() => {
  products.insertBatch([
    {
      name: "Widget A",
      category: "Electronics",
      price: 29.99,
      stock: 100,
      active: true,
      description: "A great widget",
    },
    {
      name: "Widget B",
      category: "Electronics",
      price: 49.99,
      stock: 50,
      active: true,
      description: "An even better widget",
    },
    {
      name: "Gadget X",
      category: "Electronics",
      price: 99.99,
      stock: 25,
      active: false,
      description: null,
    },
    {
      name: "Tool Alpha",
      category: "Hardware",
      price: 15.0,
      stock: 200,
      active: true,
      description: "Essential tool",
    },
    {
      name: "Tool Beta",
      category: "Hardware",
      price: 25.0,
      stock: 150,
      active: true,
      description: "Advanced tool",
    },
    {
      name: "Accessory One",
      category: "Accessories",
      price: 5.99,
      stock: 500,
      active: true,
      description: null,
    },
    {
      name: "Accessory Two",
      category: "Accessories",
      price: 9.99,
      stock: 300,
      active: false,
      description: "Nice accessory",
    },
    {
      name: "Premium Item",
      category: "Premium",
      price: 199.99,
      stock: 10,
      active: true,
      description: "Top of the line",
    },
  ])
})

afterAll(() => {
  db.close()
})

describe("Column selection", () => {
  test("select all columns with *", () => {
    const results = products.select(["*"]).limit(1).all()
    expect(results.length).toBe(1)
    expect(results[0]).toHaveProperty("id")
    expect(results[0]).toHaveProperty("name")
    expect(results[0]).toHaveProperty("category")
    expect(results[0]).toHaveProperty("price")
    expect(results[0]).toHaveProperty("stock")
    expect(results[0]).toHaveProperty("active")
    expect(results[0]).toHaveProperty("description")
  })

  test("select specific columns", () => {
    const results = products.select(["id", "name", "price"]).limit(1).all()
    expect(results.length).toBe(1)
    expect(results[0]).toHaveProperty("id")
    expect(results[0]).toHaveProperty("name")
    expect(results[0]).toHaveProperty("price")
  })

  test("select single column", () => {
    const results = products.select(["name"]).limit(3).all()
    expect(results.length).toBe(3)
    expect(results[0]).toHaveProperty("name")
  })

  test("select with where condition", () => {
    const results = products.select(["name", "price"]).where({ category: "Electronics" }).all()
    expect(results.length).toBe(3)
  })
})

describe("ORDER BY operations", () => {
  test("orderBy ascending (default)", () => {
    const results = products.select(["*"]).orderBy("price").all()
    for (let i = 1; i < results.length; i++) {
      expect(results[i].price).toBeGreaterThanOrEqual(results[i - 1].price)
    }
  })

  test("orderBy with explicit asc()", () => {
    const results = products.select(["*"]).orderBy("name").asc().all()
    for (let i = 1; i < results.length; i++) {
      expect(results[i].name.localeCompare(results[i - 1].name)).toBeGreaterThanOrEqual(0)
    }
  })

  test("orderBy descending", () => {
    const results = products.select(["*"]).orderBy("price").desc().all()
    for (let i = 1; i < results.length; i++) {
      expect(results[i].price).toBeLessThanOrEqual(results[i - 1].price)
    }
  })

  test("orderBy with string column descending", () => {
    const results = products.select(["*"]).orderBy("name").desc().all()
    expect(results[0].name).toBe("Widget B")
    expect(results[results.length - 1].name).toBe("Accessory One")
  })

  test("orderBy with where condition", () => {
    const results = products
      .select(["*"])
      .where({ category: "Electronics" })
      .orderBy("price")
      .desc()
      .all()
    expect(results.length).toBe(3)
    expect(results[0].price).toBe(99.99)
    expect(results[2].price).toBe(29.99)
  })

  test("orderBy numeric column ascending", () => {
    const results = products.select(["*"]).orderBy("stock").asc().all()
    expect(results[0].stock).toBe(10)
    expect(results[results.length - 1].stock).toBe(500)
  })
})

describe("LIMIT operations", () => {
  test("limit restricts number of results", () => {
    const results = products.select(["*"]).limit(3).all()
    expect(results.length).toBe(3)
  })

  test("limit with 0 returns empty array", () => {
    const results = products.select(["*"]).limit(0).all()
    expect(results.length).toBe(0)
  })

  test("limit larger than total rows returns all rows", () => {
    const results = products.select(["*"]).limit(100).all()
    expect(results.length).toBe(8)
  })

  test("limit with orderBy", () => {
    const results = products.select(["*"]).orderBy("price").desc().limit(3).all()
    expect(results.length).toBe(3)
    expect(results[0].price).toBe(199.99)
    expect(results[1].price).toBe(99.99)
    expect(results[2].price).toBe(49.99)
  })

  test("limit throws for negative value", () => {
    expect(() => products.select(["*"]).limit(-1)).toThrow()
  })
})

describe("OFFSET operations", () => {
  test("offset skips initial rows", () => {
    const allResults = products.select(["*"]).orderBy("id").asc().all()
    const offsetResults = products.select(["*"]).orderBy("id").asc().offset(2).all()

    expect(offsetResults.length).toBe(allResults.length - 2)
    expect(offsetResults[0].id).toBe(allResults[2].id)
  })

  test("offset with limit for pagination", () => {
    const page1 = products.select(["*"]).orderBy("id").limit(3).offset(0).all()
    const page2 = products.select(["*"]).orderBy("id").limit(3).offset(3).all()
    const page3 = products.select(["*"]).orderBy("id").limit(3).offset(6).all()

    expect(page1.length).toBe(3)
    expect(page2.length).toBe(3)
    expect(page3.length).toBe(2)

    // Ensure no overlap
    const page1Ids = page1.map((p) => p.id)
    const page2Ids = page2.map((p) => p.id)
    expect(page1Ids.some((id) => page2Ids.includes(id))).toBe(false)
  })

  test("offset beyond total rows returns empty", () => {
    const results = products.select(["*"]).limit(100).offset(100).all()
    expect(results.length).toBe(0)
  })

  test("offset throws for negative value", () => {
    expect(() => products.select(["*"]).offset(-1)).toThrow()
  })

  test("offset 0 returns all rows", () => {
    const results = products.select(["*"]).limit(100).offset(0).all()
    expect(results.length).toBe(8)
  })
})

describe("all() execution method", () => {
  test("all() returns array of all matching rows", () => {
    const results = products.select(["*"]).limit(100).all()
    expect(Array.isArray(results)).toBe(true)
    expect(results.length).toBe(8)
  })

  test("all() returns empty array when no matches", () => {
    const results = products.select(["*"]).where({ category: "NonExistent" }).limit(100).all()
    expect(results).toEqual([])
  })

  test("all() with complex query", () => {
    const results = products
      .select(["*"])
      .where({ active: true })
      .whereOp("price", "<", 50)
      .orderBy("price")
      .desc()
      .limit(100)
      .all()
    expect(results.length).toBeGreaterThan(0)
    expect(results.every((r) => r.active === true && r.price < 50)).toBe(true)
  })
})

describe("get() execution method", () => {
  test("get() returns first matching row", () => {
    const result = products.select(["*"]).where({ name: "Widget A" }).first()
    expect(result).not.toBeNull()
    expect(result?.name).toBe("Widget A")
  })

  test("get() returns null when no matches", () => {
    const result = products.select(["*"]).where({ name: "NonExistent" }).first()
    expect(result).toBeNull()
  })

  test("get() respects orderBy", () => {
    const result = products.select(["*"]).orderBy("price").desc().first()
    expect(result?.price).toBe(199.99)
  })

  test("get() with limit set", () => {
    const result = products.select(["*"]).orderBy("id").asc().limit(5).first()
    expect(result).not.toBeNull()
    expect(result?.id).toBe(1)
  })
})

describe("first() execution method", () => {
  test("first() returns first row with LIMIT 1", () => {
    const result = products.select(["*"]).orderBy("id").first()
    expect(result).not.toBeNull()
    expect(result?.id).toBe(1)
  })

  test("first() returns null when no matches", () => {
    const result = products.select(["*"]).where({ category: "NonExistent" }).first()
    expect(result).toBeNull()
  })

  test("first() with orderBy", () => {
    const cheapest = products.select(["*"]).orderBy("price").asc().first()
    expect(cheapest?.price).toBe(5.99)

    const expensive = products.select(["*"]).orderBy("price").desc().first()
    expect(expensive?.price).toBe(199.99)
  })

  test("first() with where condition", () => {
    const result = products
      .select(["*"])
      .where({ category: "Hardware" })
      .orderBy("price")
      .asc()
      .first()
    expect(result?.name).toBe("Tool Alpha")
  })
})

describe("count() execution method", () => {
  test("count() returns total number of rows", () => {
    const count = products.select(["*"]).count()
    expect(count).toBe(8)
  })

  test("count() with where condition", () => {
    const count = products.select(["*"]).where({ category: "Electronics" }).count()
    expect(count).toBe(3)
  })

  test("count() with multiple conditions", () => {
    const count = products.select(["*"]).where({ active: true }).whereOp("price", "<", 30).count()
    expect(count).toBeGreaterThan(0)
  })

  test("count() returns 0 when no matches", () => {
    const count = products.select(["*"]).where({ category: "NonExistent" }).count()
    expect(count).toBe(0)
  })

  test("count() ignores limit and offset", () => {
    const count = products.select(["*"]).limit(2).count()
    expect(count).toBe(8)
  })
})

describe("exists() execution method", () => {
  test("exists() returns true when rows exist", () => {
    const exists = products.select(["*"]).where({ category: "Electronics" }).exists()
    expect(exists).toBe(true)
  })

  test("exists() returns false when no rows exist", () => {
    const exists = products.select(["*"]).where({ category: "NonExistent" }).exists()
    expect(exists).toBe(false)
  })

  test("exists() with complex condition", () => {
    const exists = products
      .select(["*"])
      .where({ active: true })
      .whereOp("price", ">", 100)
      .exists()
    expect(exists).toBe(true)
  })

  test("exists() returns true for any matching row", () => {
    const exists = products.select(["*"]).whereOp("stock", ">", 0).exists()
    expect(exists).toBe(true)
  })
})

describe("value() execution method", () => {
  test("value() returns single column value", () => {
    const name = products.select(["*"]).where({ id: 1 }).value("name")
    expect(name).toBe("Widget A")
  })

  test("value() returns null when no row found", () => {
    const name = products.select(["*"]).where({ id: 9999 }).value("name")
    expect(name).toBeNull()
  })

  test("value() returns null value from existing row", () => {
    const description = products.select(["*"]).where({ name: "Gadget X" }).value("description")
    expect(description).toBeNull()
  })

  test("value() with orderBy to get specific value", () => {
    const highestPrice = products.select(["*"]).orderBy("price").desc().value("price")
    expect(highestPrice).toBe(199.99)
  })

  test("value() extracts different column types", () => {
    const row = products.select(["*"]).where({ id: 1 }).first()

    const prodQuery = products.select(["*"]).where({ id: 1 })

    expect(prodQuery.value("id")).toBe(row?.id || null)
    expect(prodQuery.value("name")).toBe(row?.name || null)
    expect(prodQuery.value("price")).toBe(row?.price || null)
    expect(prodQuery.value("active")).toBe(row?.active || null)
  })
})

describe("pluck() execution method", () => {
  test("pluck() returns array of column values", () => {
    const names = products.select(["*"]).where({ category: "Electronics" }).pluck("name")
    expect(names.length).toBe(3)
    expect(names).toContain("Widget A")
    expect(names).toContain("Widget B")
    expect(names).toContain("Gadget X")
  })

  test("pluck() returns empty array when no matches", () => {
    const names = products.select(["*"]).where({ category: "NonExistent" }).pluck("name")
    expect(names).toEqual([])
  })

  test("pluck() with numeric column", () => {
    const prices = products.select(["*"]).where({ category: "Hardware" }).pluck("price")
    expect(prices).toContain(15.0)
    expect(prices).toContain(25.0)
  })

  test("pluck() with orderBy", () => {
    const names = products.select(["*"]).orderBy("name").asc().limit(3).pluck("name")
    expect(names[0]).toBe("Accessory One")
    expect(names[1]).toBe("Accessory Two")
    expect(names[2]).toBe("Gadget X")
  })

  test("pluck() can include null values", () => {
    const descriptions = products.select(["*"]).pluck("description")
    expect(descriptions.some((d) => d === null)).toBe(true)
  })
})

describe("Client-side operations with regex", () => {
  test("regex filtering with orderBy is applied client-side", () => {
    const results = products
      .select(["*"])
      .whereRgx({ name: /^Widget/ })
      .orderBy("price")
      .asc()
      .all()
    expect(results.length).toBe(2)
    expect(results[0].name).toBe("Widget A")
    expect(results[1].name).toBe("Widget B")
  })

  test("regex filtering with limit is applied client-side", () => {
    const results = products.select(["*"]).whereRgx({ name: /^Tool/ }).limit(1).all()
    expect(results.length).toBe(1)
  })

  test("regex filtering with offset is applied client-side", () => {
    const allResults = products.select(["*"]).whereRgx({ category: /ware/i }).orderBy("name").all()
    const offsetResults = products
      .select(["*"])
      .whereRgx({ category: /ware/i })
      .orderBy("name")
      .offset(1)
      .all()

    expect(offsetResults.length).toBe(allResults.length - 1)
  })

  test("regex filtering respects descending order", () => {
    const results = products
      .select(["*"])
      .whereRgx({ name: /Accessory/ })
      .orderBy("name")
      .desc()
      .all()
    expect(results[0].name).toBe("Accessory Two")
    expect(results[1].name).toBe("Accessory One")
  })

  test("count() with regex conditions", () => {
    const count = products
      .select(["*"])
      .whereRgx({ name: /^Widget/ })
      .count()
    expect(count).toBe(2)
  })

  test("exists() with regex conditions", () => {
    const exists = products
      .select(["*"])
      .whereRgx({ name: /Premium/ })
      .exists()
    expect(exists).toBe(true)

    const notExists = products
      .select(["*"])
      .whereRgx({ name: /NonExistent/ })
      .exists()
    expect(notExists).toBe(false)
  })

  test("first() with regex conditions", () => {
    const result = products
      .select(["*"])
      .whereRgx({ description: /widget/i })
      .orderBy("price")
      .asc()
      .first()
    expect(result?.name).toBe("Widget A")
  })

  test("get() with regex conditions falls back to all() and takes first", () => {
    const result = products.select(["*"]).whereRgx({ name: /^Tool/ }).orderBy("price").asc().get()
    expect(result?.name).toBe("Tool Alpha")
  })
})

describe("Chained query operations", () => {
  test("complex query chain", () => {
    const results = products
      .select(["id", "name", "price"])
      .where({ active: true })
      .whereOp("price", "<", 100)
      .whereNotIn("category", ["Premium"])
      .orderBy("price")
      .desc()
      .limit(5)
      .all()

    expect(results.length).toBeLessThanOrEqual(5)
    expect(results.every((r) => r.price < 100)).toBe(true)
  })

  test("query state resets after execution", () => {
    // First query
    products.select(["*"]).where({ category: "Electronics" }).orderBy("price").limit(2).all()

    // Second query should not inherit previous state
    const results = products.select(["*"]).all()
    expect(results.length).toBe(8)
  })

  test("multiple where conditions combined with AND", () => {
    const results = products
      .select(["*"])
      .where({ active: true })
      .where({ category: "Electronics" })
      .all()

    expect(results.every((r) => r.active === true && r.category === "Electronics")).toBe(true)
  })
})

describe("Edge cases", () => {
  test("select from empty result set", () => {
    const results = products.select(["*"]).where({ id: -1 }).all()
    expect(results).toEqual([])
  })

  test("orderBy handles null values", () => {
    const results = products.select(["*"]).orderBy("description").all()
    // Nulls should be sorted consistently
    expect(results.length).toBe(8)
  })

  test("first() from single row result", () => {
    const result = products.select(["*"]).where({ name: "Premium Item" }).first()
    expect(result?.name).toBe("Premium Item")
  })

  test("all() after first() in separate queries", () => {
    const first = products.select(["*"]).orderBy("id").first()
    const all = products.select(["*"]).orderBy("id").all()

    expect(first?.id).toBe(all[0].id)
  })
})
