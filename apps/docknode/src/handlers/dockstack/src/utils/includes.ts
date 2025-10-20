import { dockNodeAuthHandlerLogger } from "./loggers";

/** Cache compiled regexes for performance */
const compiledRegexCache = new Map<string, RegExp>();

function escapeRegExp(s: string) {
  return s.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
}

function globToRegExpStr(glob: string) {
  let tGlob = glob;

  // Normalize: keep leading slash if provided. If pattern starts with '*'
  // (e.g. "*/docs" or "**/docs") we will treat that as "match anywhere"
  // and convert to leading '/**/...'.
  if (!tGlob.startsWith("/")) {
    if (tGlob.startsWith("*") || tGlob.startsWith("?")) {
      // convert leading '*' or '**' into '/**' (match across directories)
      // e.g. "*/docs" -> "/**/docs"
      tGlob = tGlob.replace(/^\*+/, "**"); // normalize multiple * to **
      if (!tGlob.startsWith("**")) {
        // if it started with '?', leave it; we'll prefix '/**' anyway
        tGlob = `**${tGlob}`;
      }
      tGlob = `/${tGlob}`; // ensure it begins with slash for regex generation
    } else {
      // typical case: "docs" -> "/docs"
      tGlob = `/${tGlob}`;
    }
  }

  // Escape then replace special tokens
  let re = "";
  for (let i = 0; i < tGlob.length; i++) {
    const ch = tGlob[i];

    // handle **
    if (ch === "*" && tGlob[i + 1] === "*") {
      // consume the second *
      i++;
      // replace with '.*' (can match slashes)
      re += ".*";
      continue;
    }
    if (ch === "*") {
      // single * should not match slash
      re += "[^/]*";
      continue;
    }
    if (ch === "?") {
      re += ".";
      continue;
    }
    re += escapeRegExp(ch);
  }

  // Anchor to full path to avoid accidental partial matches
  return `^${re}$`;
}

/**
 * Route-safe glob matcher with detailed logging and caching.
 *
 * - route: full URL or path (e.g. "http://localhost:4000/api/x" or "/api/x")
 * - patterns: string or array of strings (supports negation with leading '!')
 *
 * Logging: for each pattern we log the normalized pattern, produced regex,
 * and the match result. Final decision is also logged.
 */
export function globMatch(route: string, patterns: string | string[]) {
  try {
    dockNodeAuthHandlerLogger.debug(
      `globMatch called — raw route=${route} patterns=${JSON.stringify(
        patterns
      )}`
    );

    if (!route) {
      dockNodeAuthHandlerLogger.debug("globMatch: empty route -> false");
      return false;
    }

    // Normalize route to pathname (strip query/hash). Keep leading slash.
    let pathname = route;
    try {
      // If route is a full URL, extract pathname; otherwise treat as path
      const u = new URL(route, "http://localhost");
      pathname = u.pathname;
    } catch (_) {
      // route was probably already a pathname like "/api/x" — keep as-is
    }

    dockNodeAuthHandlerLogger.debug(
      `globMatch: normalized pathname=${pathname}`
    );

    const list = Array.isArray(patterns) ? patterns : [patterns];
    let matched = false;

    for (const raw of list) {
      if (!raw) {
        dockNodeAuthHandlerLogger.debug("globMatch: skipping empty pattern");
        continue;
      }

      const negated = raw.startsWith("!");
      const body = negated ? raw.slice(1) : raw;
      const pat = body.trim();

      // Normalize pattern for consistent logging and caching
      let normalizedPattern = pat;
      if (!normalizedPattern.startsWith("/")) {
        // If the pattern starts with '*' or '?', treat as "match anywhere" -> prefix '/**'
        if (/^[*?]/.test(normalizedPattern)) {
          normalizedPattern = normalizedPattern.replace(/^\*+/, "**");
          normalizedPattern = `/${normalizedPattern}`;
        } else {
          normalizedPattern = `/${normalizedPattern}`;
        }
      }

      // Build or retrieve compiled regex
      const cacheKey = `${negated ? "!" : ""}${normalizedPattern}`;
      let rx = compiledRegexCache.get(cacheKey);
      let regexStr = "";

      if (!rx) {
        try {
          regexStr = globToRegExpStr(normalizedPattern);
          rx = new RegExp(regexStr);
          compiledRegexCache.set(cacheKey, rx);
        } catch (e) {
          dockNodeAuthHandlerLogger.error(
            `globMatch: failed to compile pattern=${raw} normalized=${normalizedPattern} -> ${String(
              e
            )}`
          );
          // Skip invalid pattern
          continue;
        }
      } else {
        // Build regexStr for logging from the stored RegExp, if needed
        regexStr = rx.source;
      }

      const doesMatch = rx.test(pathname);
      dockNodeAuthHandlerLogger.debug(
        `globMatch: pattern='${raw}' normalized='${normalizedPattern}' negated=${negated} regex='${regexStr}' test=${doesMatch}`
      );

      // Apply pattern precedence: later patterns override earlier ones
      if (negated) {
        if (doesMatch) {
          dockNodeAuthHandlerLogger.debug(
            `globMatch: negation matched -> setting matched=false (pattern ${raw})`
          );
          matched = false;
        } else {
          dockNodeAuthHandlerLogger.debug(
            `globMatch: negation did not match -> keep matched=${matched}`
          );
        }
      } else {
        if (doesMatch) {
          dockNodeAuthHandlerLogger.debug(
            `globMatch: positive pattern matched -> setting matched=true (pattern ${raw})`
          );
          matched = true;
        } else {
          dockNodeAuthHandlerLogger.debug(
            `globMatch: positive pattern did not match -> keep matched=${matched}`
          );
        }
      }
    }

    dockNodeAuthHandlerLogger.debug(
      `globMatch result for ${pathname}: ${matched}`
    );
    return matched;
  } catch (err) {
    dockNodeAuthHandlerLogger.error(
      `globMatch unexpected error: ${String(err)}`
    );
    return false;
  }
}
