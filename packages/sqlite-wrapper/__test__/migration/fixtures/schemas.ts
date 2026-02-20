// Test fixtures for schema comparison tests
import type { ColumnDefinition } from "../../../src/types"

export const SCHEMA_WITH_IF_NOT_EXISTS = {
  name: "test_table",
  type: "table",
  sql: 'CREATE TABLE IF NOT EXISTS "test_table" (id INTEGER PRIMARY KEY, name TEXT);',
}

export const SCHEMA_WITHOUT_IF_NOT_EXISTS = {
  name: "test_table",
  type: "table",
  sql: 'CREATE TABLE "test_table" (id INTEGER PRIMARY KEY, name TEXT);',
}

export const SCHEMA_WITH_DIFFERENT_COLUMNS = {
  name: "test_table",
  type: "table",
  sql: 'CREATE TABLE "test_table" (id INTEGER PRIMARY KEY, name TEXT, age INTEGER);',
}

export const SCHEMA_WITH_TEMPORARY = {
  name: "test_table",
  type: "table",
  sql: 'CREATE TEMPORARY TABLE "test_table" (id INTEGER PRIMARY KEY, name TEXT);',
}

export const SCHEMA_WITHOUT_ROWID = {
  name: "test_table",
  type: "table",
  sql: 'CREATE TABLE "test_table" (id INTEGER PRIMARY KEY, name TEXT) WITHOUT ROWID;',
}

export const COLUMNS_BASIC: Record<string, ColumnDefinition> = {
  id: {
    type: "INTEGER",
    primaryKey: true,
  },
  name: {
    type: "TEXT",
  },
}

export const COLUMNS_WITH_AGE: Record<string, ColumnDefinition> = {
  id: {
    type: "INTEGER",
    primaryKey: true,
  },
  name: {
    type: "TEXT",
  },
  age: {
    type: "INTEGER",
  },
}

export const OPTIONS_WITH_IF_NOT_EXISTS = {
  ifNotExists: true,
}

export const OPTIONS_WITHOUT_IF_NOT_EXISTS = {}

export const OPTIONS_WITH_TEMPORARY = {
  temporary: true,
}

export const OPTIONS_WITHOUT_ROWID = {
  withoutRowId: true,
}
