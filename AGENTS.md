<!-- CODEGRAPH_START -->
## CodeGraph

In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

- **MCP tool** (when available): `codegraph_explore` answers most code questions in one call — the relevant symbols' verbatim source plus the call paths between them, including dynamic-dispatch hops grep can't follow. Name a file or symbol in the query to read its current line-numbered source. If it's listed but deferred, load it by name via tool search.
- **Shell** (always works): `bunx @colbymchenry/codegraph explore "<symbol names or question>"` prints the same output.

If there is no `.codegraph/` directory, skip CodeGraph entirely — indexing is the user's decision.
<!-- CODEGRAPH_END -->

<!-- ELYSIA_FRONTEND_PATTERN_START -->
## Elysia Frontend pattern

In this Monorepo repository there exists a helper libary for frontend data fetching and manipulation of an elysia JS backend. Use this where possible. 

- **Pattern**: Create and use mutations / queries from a central folder called "hooks/{mutations,queries}"
- **Treaty**: Use the eden treaty api where possible (located in app/lib/api)

The Eden Client source is located in `/home/nik/Projects/Monorepo/packages/utils/src/react/eden/index.ts`
<!-- ELYSIA_FRONTEND_PATTERN_END -->
