import { describe, expect, test } from "bun:test"
import {
  quoteIdentifier,
  quoteString,
  quoteIdentifiers,
  buildPlaceholders,
  buildSetClause,
  buildInsertSQL,
  buildSelectSQL,
  buildUpdateSQL,
  buildDeleteSQL,
  isSQLFunction,
  escapeValue,
  normalizeOperator,
  buildCondition,
  buildInClause,
  buildBetweenClause,
} from "../utils/sql"

/**
 * Tests for SQL utility functions
 *
 * Tests cover:
 * - Identifier quoting and escaping
 * - String literal quoting
 * - Placeholder generation
 * - SQL statement building
 * - SQL function detection
 * - Value escaping
 * - Operator normalization
 * - Clause builders
 */

describe("quoteIdentifier", () => {
  test("quotes simple identifier", () => {
    expect(quoteIdentifier("users")).toBe('"users"')
  })

  test("quotes identifier with spaces", () => {
    expect(quoteIdentifier("user name")).toBe('"user name"')
  })

  test("escapes double quotes in identifier", () => {
    expect(quoteIdentifier('with"quote')).toBe('"with""quote"')
  })

  test("escapes multiple double quotes", () => {
    expect(quoteIdentifier('a"b"c')).toBe('"a""b""c"')
  })

  test("handles empty string", () => {
    expect(quoteIdentifier("")).toBe('""')
  })

  test("handles special characters", () => {
    expect(quoteIdentifier("table-name")).toBe('"table-name"')
    expect(quoteIdentifier("table.name")).toBe('"table.name"')
    expect(quoteIdentifier("table_name")).toBe('"table_name"')
  })

  test("handles reserved words", () => {
    expect(quoteIdentifier("select")).toBe('"select"')
    expect(quoteIdentifier("from")).toBe('"from"')
    expect(quoteIdentifier("where")).toBe('"where"')
  })
})

describe("quoteString", () => {
  test("quotes simple string", () => {
    expect(quoteString("hello")).toBe("'hello'")
  })

  test("escapes single quotes in string", () => {
    expect(quoteString("it's")).toBe("'it''s'")
  })

  test("escapes multiple single quotes", () => {
    expect(quoteString("it's John's")).toBe("'it''s John''s'")
  })

  test("handles empty string", () => {
    expect(quoteString("")).toBe("''")
  })

  test("handles string with double quotes", () => {
    expect(quoteString('say "hello"')).toBe("'say \"hello\"'")
  })
})

describe("quoteIdentifiers", () => {
  test("quotes array of identifiers", () => {
    expect(quoteIdentifiers(["id", "name", "email"])).toBe('"id", "name", "email"')
  })

  test("handles single identifier", () => {
    expect(quoteIdentifiers(["column"])).toBe('"column"')
  })

  test("handles empty array", () => {
    expect(quoteIdentifiers([])).toBe("")
  })

  test("escapes special characters in identifiers", () => {
    expect(quoteIdentifiers(['col"1', "col 2"])).toBe('"col""1", "col 2"')
  })
})

describe("buildPlaceholders", () => {
  test("builds placeholders from count", () => {
    expect(buildPlaceholders(3)).toBe("?, ?, ?")
  })

  test("builds single placeholder", () => {
    expect(buildPlaceholders(1)).toBe("?")
  })

  test("builds placeholders from array", () => {
    expect(buildPlaceholders(["a", "b", "c", "d"])).toBe("?, ?, ?, ?")
  })

  test("handles zero count", () => {
    expect(buildPlaceholders(0)).toBe("")
  })

  test("handles empty array", () => {
    expect(buildPlaceholders([])).toBe("")
  })
})

describe("buildSetClause", () => {
  test("builds SET clause from columns", () => {
    expect(buildSetClause(["name", "email"])).toBe('"name" = ?, "email" = ?')
  })

  test("handles single column", () => {
    expect(buildSetClause(["status"])).toBe('"status" = ?')
  })

  test("handles empty array", () => {
    expect(buildSetClause([])).toBe("")
  })

  test("handles columns with special characters", () => {
    expect(buildSetClause(['col"1', "col 2"])).toBe('"col""1" = ?, "col 2" = ?')
  })
})

describe("buildInsertSQL", () => {
  test("builds basic INSERT statement", () => {
    const sql = buildInsertSQL("users", ["name", "email"])
    expect(sql).toBe('INSERT INTO "users" ("name", "email") VALUES (?, ?)')
  })

  test("builds INSERT with IGNORE conflict resolution", () => {
    const sql = buildInsertSQL("users", ["name"], "IGNORE")
    expect(sql).toBe('INSERT OR IGNORE INTO "users" ("name") VALUES (?)')
  })

  test("builds INSERT with REPLACE conflict resolution", () => {
    const sql = buildInsertSQL("users", ["name", "email"], "REPLACE")
    expect(sql).toBe('INSERT OR REPLACE INTO "users" ("name", "email") VALUES (?, ?)')
  })

  test("builds INSERT with ABORT conflict resolution", () => {
    const sql = buildInsertSQL("users", ["name"], "ABORT")
    expect(sql).toBe('INSERT OR ABORT INTO "users" ("name") VALUES (?)')
  })

  test("builds INSERT with FAIL conflict resolution", () => {
    const sql = buildInsertSQL("users", ["name"], "FAIL")
    expect(sql).toBe('INSERT OR FAIL INTO "users" ("name") VALUES (?)')
  })

  test("builds INSERT with ROLLBACK conflict resolution", () => {
    const sql = buildInsertSQL("users", ["name"], "ROLLBACK")
    expect(sql).toBe('INSERT OR ROLLBACK INTO "users" ("name") VALUES (?)')
  })
})

describe("buildSelectSQL", () => {
  test("builds basic SELECT statement", () => {
    const sql = buildSelectSQL("users", ["id", "name"])
    expect(sql).toBe('SELECT "id", "name" FROM "users"')
  })

  test("builds SELECT * statement", () => {
    const sql = buildSelectSQL("users", "*")
    expect(sql).toBe('SELECT * FROM "users"')
  })

  test("builds SELECT with WHERE clause", () => {
    const sql = buildSelectSQL("users", "*", { where: "id = ?" })
    expect(sql).toBe('SELECT * FROM "users" WHERE id = ?')
  })

  test("builds SELECT with ORDER BY clause", () => {
    const sql = buildSelectSQL("users", "*", { orderBy: "name" })
    expect(sql).toBe('SELECT * FROM "users" ORDER BY "name" ASC')
  })

  test("builds SELECT with ORDER BY DESC", () => {
    const sql = buildSelectSQL("users", "*", { orderBy: "created_at", orderDirection: "DESC" })
    expect(sql).toBe('SELECT * FROM "users" ORDER BY "created_at" DESC')
  })

  test("builds SELECT with LIMIT", () => {
    const sql = buildSelectSQL("users", "*", { limit: 10 })
    expect(sql).toBe('SELECT * FROM "users" LIMIT 10')
  })

  test("builds SELECT with OFFSET", () => {
    const sql = buildSelectSQL("users", "*", { offset: 20 })
    expect(sql).toBe('SELECT * FROM "users" OFFSET 20')
  })

  test("builds SELECT with all options", () => {
    const sql = buildSelectSQL("users", ["id", "name"], {
      where: "active = 1",
      orderBy: "name",
      orderDirection: "ASC",
      limit: 10,
      offset: 5,
    })
    expect(sql).toBe(
      'SELECT "id", "name" FROM "users" WHERE active = 1 ORDER BY "name" ASC LIMIT 10 OFFSET 5'
    )
  })
})

describe("buildUpdateSQL", () => {
  test("builds UPDATE statement", () => {
    const sql = buildUpdateSQL("users", ["name", "email"], "id = ?")
    expect(sql).toBe('UPDATE "users" SET "name" = ?, "email" = ? WHERE id = ?')
  })

  test("builds UPDATE with single column", () => {
    const sql = buildUpdateSQL("users", ["status"], "id = 1")
    expect(sql).toBe('UPDATE "users" SET "status" = ? WHERE id = 1')
  })
})

describe("buildDeleteSQL", () => {
  test("builds DELETE statement", () => {
    const sql = buildDeleteSQL("users", "id = ?")
    expect(sql).toBe('DELETE FROM "users" WHERE id = ?')
  })

  test("builds DELETE with complex where", () => {
    const sql = buildDeleteSQL("users", "active = 0 AND deleted_at IS NOT NULL")
    expect(sql).toBe('DELETE FROM "users" WHERE active = 0 AND deleted_at IS NOT NULL')
  })
})

describe("isSQLFunction", () => {
  test("detects function with parentheses", () => {
    expect(isSQLFunction("datetime('now')")).toBe(true)
    expect(isSQLFunction("strftime('%s', 'now')")).toBe(true)
    expect(isSQLFunction("UPPER(name)")).toBe(true)
    expect(isSQLFunction("COUNT(*)")).toBe(true)
  })

  test("detects CURRENT_TIMESTAMP", () => {
    expect(isSQLFunction("CURRENT_TIMESTAMP")).toBe(true)
    expect(isSQLFunction("current_timestamp")).toBe(true)
  })

  test("detects CURRENT_TIME", () => {
    expect(isSQLFunction("CURRENT_TIME")).toBe(true)
    expect(isSQLFunction("current_time")).toBe(true)
  })

  test("detects CURRENT_DATE", () => {
    expect(isSQLFunction("CURRENT_DATE")).toBe(true)
    expect(isSQLFunction("current_date")).toBe(true)
  })

  test("detects NULL keyword", () => {
    expect(isSQLFunction("NULL")).toBe(true)
    expect(isSQLFunction("null")).toBe(true)
  })

  test("returns false for regular strings", () => {
    expect(isSQLFunction("hello")).toBe(false)
    expect(isSQLFunction("user_name")).toBe(false)
    expect(isSQLFunction("123")).toBe(false)
  })

  test("handles whitespace", () => {
    expect(isSQLFunction("  datetime('now')  ")).toBe(true)
    expect(isSQLFunction("  CURRENT_TIMESTAMP  ")).toBe(true)
  })
})

describe("escapeValue", () => {
  test("escapes null to NULL", () => {
    expect(escapeValue(null)).toBe("NULL")
  })

  test("escapes numbers", () => {
    expect(escapeValue(42)).toBe("42")
    expect(escapeValue(3.14)).toBe("3.14")
    expect(escapeValue(-10)).toBe("-10")
    expect(escapeValue(0)).toBe("0")
  })

  test("escapes booleans", () => {
    expect(escapeValue(true)).toBe("1")
    expect(escapeValue(false)).toBe("0")
  })

  test("escapes strings", () => {
    expect(escapeValue("hello")).toBe("'hello'")
    expect(escapeValue("it's")).toBe("'it''s'")
  })

  test("escapes Uint8Array (BLOB)", () => {
    const blob = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f])
    expect(escapeValue(blob)).toBe("X'48656c6c6f'")
  })

  test("escapes other types as string", () => {
    const result = escapeValue({ toString: () => "custom" } as unknown as string)
    expect(result).toBe("'custom'")
  })
})

describe("normalizeOperator", () => {
  test("normalizes equality operator", () => {
    expect(normalizeOperator("=")).toBe("=")
  })

  test("normalizes inequality operators", () => {
    expect(normalizeOperator("!=")).toBe("!=")
    expect(normalizeOperator("<>")).toBe("<>")
  })

  test("normalizes comparison operators", () => {
    expect(normalizeOperator("<")).toBe("<")
    expect(normalizeOperator("<=")).toBe("<=")
    expect(normalizeOperator(">")).toBe(">")
    expect(normalizeOperator(">=")).toBe(">=")
  })

  test("normalizes LIKE operator", () => {
    expect(normalizeOperator("LIKE")).toBe("LIKE")
    expect(normalizeOperator("like")).toBe("LIKE")
    expect(normalizeOperator("Like")).toBe("LIKE")
  })

  test("normalizes GLOB operator", () => {
    expect(normalizeOperator("GLOB")).toBe("GLOB")
    expect(normalizeOperator("glob")).toBe("GLOB")
  })

  test("normalizes IS operator", () => {
    expect(normalizeOperator("IS")).toBe("IS")
    expect(normalizeOperator("is")).toBe("IS")
  })

  test("normalizes IS NOT operator", () => {
    expect(normalizeOperator("IS NOT")).toBe("IS NOT")
    expect(normalizeOperator("is not")).toBe("IS NOT")
  })

  test("handles whitespace", () => {
    expect(normalizeOperator("  =  ")).toBe("=")
    expect(normalizeOperator("  LIKE  ")).toBe("LIKE")
  })

  test("throws for invalid operator", () => {
    expect(() => normalizeOperator("INVALID")).toThrow()
    expect(() => normalizeOperator("AND")).toThrow()
    expect(() => normalizeOperator("OR")).toThrow()
    expect(() => normalizeOperator("SELECT")).toThrow()
  })
})

describe("buildCondition", () => {
  test("builds equality condition", () => {
    const result = buildCondition("name", "=", "Alice")
    expect(result.sql).toBe('"name" = ?')
    expect(result.params).toEqual(["Alice"])
  })

  test("builds comparison condition", () => {
    const result = buildCondition("age", ">", 18)
    expect(result.sql).toBe('"age" > ?')
    expect(result.params).toEqual([18])
  })

  test("builds LIKE condition", () => {
    const result = buildCondition("email", "LIKE", "%@gmail.com")
    expect(result.sql).toBe('"email" LIKE ?')
    expect(result.params).toEqual(["%@gmail.com"])
  })

  test("handles null with equality operator", () => {
    const result = buildCondition("deleted_at", "=", null)
    expect(result.sql).toBe('"deleted_at" IS NULL')
    expect(result.params).toEqual([])
  })

  test("handles null with IS operator", () => {
    const result = buildCondition("value", "IS", null)
    expect(result.sql).toBe('"value" IS NULL')
    expect(result.params).toEqual([])
  })

  test("handles null with not equal operator", () => {
    const result = buildCondition("name", "!=", null)
    expect(result.sql).toBe('"name" IS NOT NULL')
    expect(result.params).toEqual([])
  })

  test("handles null with IS NOT operator", () => {
    const result = buildCondition("status", "IS NOT", null)
    expect(result.sql).toBe('"status" IS NOT NULL')
    expect(result.params).toEqual([])
  })

  test("handles undefined as null", () => {
    const result = buildCondition("field", "=", undefined)
    expect(result.sql).toBe('"field" IS NULL')
    expect(result.params).toEqual([])
  })
})

describe("buildInClause", () => {
  test("builds IN clause with string values", () => {
    const result = buildInClause("status", ["active", "pending", "completed"])
    expect(result.sql).toBe('"status" IN (?, ?, ?)')
    expect(result.params).toEqual(["active", "pending", "completed"])
  })

  test("builds IN clause with number values", () => {
    const result = buildInClause("id", [1, 2, 3])
    expect(result.sql).toBe('"id" IN (?, ?, ?)')
    expect(result.params).toEqual([1, 2, 3])
  })

  test("builds IN clause with single value", () => {
    const result = buildInClause("role", ["admin"])
    expect(result.sql).toBe('"role" IN (?)')
    expect(result.params).toEqual(["admin"])
  })

  test("builds NOT IN clause", () => {
    const result = buildInClause("status", ["deleted", "banned"], true)
    expect(result.sql).toBe('"status" NOT IN (?, ?)')
    expect(result.params).toEqual(["deleted", "banned"])
  })

  test("throws for empty values array", () => {
    expect(() => buildInClause("column", [])).toThrow("IN clause requires at least one value")
  })
})

describe("buildBetweenClause", () => {
  test("builds BETWEEN clause with numbers", () => {
    const result = buildBetweenClause("age", 18, 65)
    expect(result.sql).toBe('"age" BETWEEN ? AND ?')
    expect(result.params).toEqual([18, 65])
  })

  test("builds BETWEEN clause with strings", () => {
    const result = buildBetweenClause("name", "A", "M")
    expect(result.sql).toBe('"name" BETWEEN ? AND ?')
    expect(result.params).toEqual(["A", "M"])
  })

  test("builds NOT BETWEEN clause", () => {
    const result = buildBetweenClause("score", 0, 50, true)
    expect(result.sql).toBe('"score" NOT BETWEEN ? AND ?')
    expect(result.params).toEqual([0, 50])
  })

  test("handles columns with special characters", () => {
    const result = buildBetweenClause("created at", 1000, 2000)
    expect(result.sql).toBe('"created at" BETWEEN ? AND ?')
    expect(result.params).toEqual([1000, 2000])
  })
})
