/**
 * Check if a string looks like a SQL function call
 */
export function isSQLFunction(str: string): boolean {
  // Simple heuristic: contains parentheses and common SQL function patterns
  const functionPatterns = [
    /^\w+\s*\(/, // Function name followed by (
    /^(datetime|date|time|strftime|current_timestamp|current_date|current_time)/i,
    /^(random|abs|length|upper|lower|trim)/i,
    /^(coalesce|ifnull|nullif|iif)/i,
    /^(json|json_extract|json_valid)/i,
  ]

  return functionPatterns.some((pattern) => pattern.test(str.trim()))
}
