---
title: "TypeScript: Strict, Modular, JSDoc-first"
description: |
  Enforce strict TypeScript patterns: avoid `any`, prefer modular single-responsibility files,
  minimal inline comments, JSDoc for every function, clear exports, and practical QoL rules.
globs: ["**/*.ts", "**/*.tsx"]
alwaysApply: true
---
You are a senior TypeScript engineer working in Bun.sh/React-Router/Tailwind/Docker environments.
When editing, refactoring, or generating TypeScript code please follow these rules exactly:

1) Types & `any`
   - **Never introduce `any`** in public or exported APIs. If a type is unknown, prefer `unknown` or a generic and narrow it as you discover shape.
   - If a third-party library has no types, create a small typed wrapper (a `.d.ts` or local typed adapter) and confine `any` to that adapter only.
   - **Do not use** the non-null assertion operator (`!`) except when you can prove via control flow that the value cannot be null/undefined.
   - Prefer `readonly` for arrays/objects that are not mutated.
   - Add explicit return types to all exported functions and to any function the AI generates or refactors.

2) Modularisation
   - Prefer small files with a single responsibility. If a file exceeds ~250-300 lines or contains more than 3 top-level exported items, propose splitting it.
   - Default to **named exports**. Use `index.ts` barrel files only at feature boundaries (not for deep libraries).
   - For React components: one component per file unless they are tiny helper components tightly coupled to the parent.
   - Group related files into feature folders (e.g. `auth/`, `ui/`, `api/`) and keep cross-cutting concerns (types, utils) in shared modules.

3) Comments, JSDoc & docs
   - **Minimal inline comments**: avoid comments that restate code. Use comments only for explaining *why* (non-obvious decisions).
   - **JSDoc REQUIRED** for every function (exported or public). Each JSDoc must include:
     - short one-line description
     - `@param` with type explanation if not obvious from name
     - `@returns` with type description
     - an example `@example` when the function's usage could be unclear
   - For React components include `@component` and `@prop` descriptions for props interfaces when helpful.

4) Safety & correctness
   - Favor exhaustive checks for discriminated unions (`never` branches).
   - Avoid `as` type assertions unless necessary — prefer safe type guards and refinement.
   - When refactoring, keep behavior identical by including tests (unit or small example) or at minimum a short usage example in the comment.

5) Code style & formatting
   - Respect project formatter settings (Biome/EditorConfig). Do not change formatting rules unless requested.
   - Prefer smaller, named helper functions over very long inline lambdas.
   - For boolean-returning functions, prefer `isX()` naming.

6) Tests & examples
   - When making non-trivial changes, propose a small test or usage example (unit test, or a snippet showing expected inputs/outputs).
   - Suggest adding a type declaration test (a `.d.ts` compile-only check) if you add complex types.

7) DX / QoL (assistant behavior)
   - When refactoring, show a concise summary of the changes at the top of the reply (1–3 bullets).
   - Offer a "split proposal" when modularization is suggested: list files to extract, rough types, and example imports.
   - Prefer incremental, small diffs over huge single edits. If a large refactor is necessary, produce it in clear steps.
   - If asked to fix a `tsc` or Biome error, give the *minimal* code change to pass; avoid broad suppression comments like `// biome-ignore`.
   - If you cannot avoid `any` or `// biome-ignore`, explain why and mark precisely where to revisit with a TODO JSDoc tag: `@todo replace any with concrete type (reason)`

8) Examples & templates
   - When generating a function, include:
     - JSDoc
     - explicit param and return types
     - a short inline example under `@example`
   - When generating React components, include props interface, default props if applicable, and an export with explicit type.

9) Refactor guidance
   - If older code uses `var`/loose JS patterns, modernize to `const/let` and typed interfaces.
   - When collapsing duplicate code, keep variable names clear and add a short JSDoc to the new shared function.

If a user asks for code in contexts outside TypeScript (scripts, Dockerfiles, tailwind config), adapt rules sensibly but do not weaken the "no anys" rule for TypeScript code.
