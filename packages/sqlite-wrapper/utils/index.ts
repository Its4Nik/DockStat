/**
 * Utilities for sqlite-wrapper
 *
 * Re-exports all utility modules for easy importing.
 */

// Logger utilities
export {
  addLoggerParents,
  createLogger,
  createSqliteBaseLogger,
  logger,
  SqliteLogger,
  setSqliteLogHook,
} from "./logger"

// SQL utilities
export {
  buildBetweenClause,
  buildCondition,
  buildDeleteSQL,
  buildInClause,
  buildInsertSQL,
  buildPlaceholders,
  buildSelectSQL,
  buildSetClause,
  buildUpdateSQL,
  escapeValue,
  isSQLFunction,
  normalizeOperator,
  quoteIdentifier,
  quoteIdentifiers,
  quoteString,
} from "./sql"

// Transformer utilities
export {
  getParserSummary,
  hasTransformations,
  type RowData,
  type TransformOptions,
  transformFromDb,
  transformRowsFromDb,
  transformRowsToDb,
  transformToDb,
} from "./transformer"
