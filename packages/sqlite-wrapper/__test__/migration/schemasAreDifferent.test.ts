import { describe, it, expect } from "bun:test"
import { schemasAreDifferent } from "../../src/migration"

import {
  SCHEMA_WITH_IF_NOT_EXISTS,
  SCHEMA_WITHOUT_IF_NOT_EXISTS,
  SCHEMA_WITH_DIFFERENT_COLUMNS,
  SCHEMA_WITH_TEMPORARY,
  SCHEMA_WITHOUT_ROWID,
  COLUMNS_BASIC,
  COLUMNS_WITH_AGE,
  OPTIONS_WITH_IF_NOT_EXISTS,
  OPTIONS_WITHOUT_IF_NOT_EXISTS,
  OPTIONS_WITH_TEMPORARY,
  OPTIONS_WITHOUT_ROWID,
} from "./fixtures/schemas"
import Logger from "@dockstat/logger"

describe("schemasAreDifferent", () => {
  const logger = new Logger("Schema-Test")

  it("should return false when schemas are identical (without IF NOT EXISTS)", () => {
    const result = schemasAreDifferent(
      SCHEMA_WITHOUT_IF_NOT_EXISTS,
      COLUMNS_BASIC,
      OPTIONS_WITHOUT_IF_NOT_EXISTS,
      logger
    )
    expect(result).toBe(false)
  })

  it("should return false when schemas are identical (with IF NOT EXISTS)", () => {
    const result = schemasAreDifferent(
      SCHEMA_WITH_IF_NOT_EXISTS,
      COLUMNS_BASIC,
      OPTIONS_WITH_IF_NOT_EXISTS,
      logger
    )
    expect(result).toBe(false)
  })

  it("should return true when schemas have different columns", () => {
    const result = schemasAreDifferent(
      SCHEMA_WITHOUT_IF_NOT_EXISTS,
      COLUMNS_WITH_AGE,
      OPTIONS_WITHOUT_IF_NOT_EXISTS,
      logger
    )
    expect(result).toBe(true)
  })

  it("should return false when comparing temporary table schemas", () => {
    const result = schemasAreDifferent(
      SCHEMA_WITH_TEMPORARY,
      COLUMNS_BASIC,
      OPTIONS_WITH_TEMPORARY,
      logger
    )
    expect(result).toBe(false)
  })

  it("should return true when comparing schemas with different columns", () => {
    const result = schemasAreDifferent(
      SCHEMA_WITH_DIFFERENT_COLUMNS,
      COLUMNS_BASIC,
      OPTIONS_WITH_IF_NOT_EXISTS,
      logger
    )
    expect(result).toBe(true)
  })

  it("should return false when comparing WITHOUT ROWID table schemas", () => {
    const result = schemasAreDifferent(
      SCHEMA_WITHOUT_ROWID,
      COLUMNS_BASIC,
      OPTIONS_WITHOUT_ROWID,
      logger
    )
    expect(result).toBe(false)
  })

  it("should handle IF NOT EXISTS discrepancy correctly", () => {
    // This test verifies that the fix for IF NOT EXISTS works correctly
    // The original schema from sqlite_master doesn't include IF NOT EXISTS
    // but the new schema does, and they should be considered the same
    const result = schemasAreDifferent(
      SCHEMA_WITHOUT_IF_NOT_EXISTS, // This is what we get from sqlite_master
      COLUMNS_BASIC,
      OPTIONS_WITH_IF_NOT_EXISTS, // This includes IF NOT EXISTS
      logger
    )
    expect(result).toBe(false)
  })
})
