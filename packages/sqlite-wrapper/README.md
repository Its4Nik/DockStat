# @dockstat/sqlite-wrapper

![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)
![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

**A fast, type-safe TypeScript wrapper for Bun's `bun:sqlite`.**
Schema-first table helpers, an expressive chainable QueryBuilder, safe defaults (WHERE required for destructive ops), JSON + generated columns, and production-minded pragmas & transactions.

## Install
> Requires **Bun** runtime

```bash
bun add @dockstat/sqlite-wrapper
````

## 10-second quickstart

```ts
import { DB, column } from "@dockstat/sqlite-wrapper";

const db = new DB("app.db", { pragmas: [["journal_mode","WAL"], ["foreign_keys","ON"]] });

db.createTable("users", {
  id: column.id(),
  name: column.text({ notNull: true }),
  email: column.text({ unique: true, notNull: true }),
  created_at: column.createdAt()
});

const users = db.table("users")
  .select(["id","name","email"])
  .where({ active: true })
  .orderBy("created_at").desc()
  .limit(10)
  .all();
```

## Why use it?

* ⚡ Bun-native, high-performance bindings
* 🔒 Type-safe table & query APIs (compile-time checks)
* 🧭 Full SQLite feature support: JSON, generated columns, foreign keys, indexes
* 🛡️ Safety-first defaults — prevents accidental full-table updates/deletes
* 🚀 Designed for production workflows: WAL, pragmatic PRAGMAs, bulk ops, transactions

## Docs & examples

See full technical docs in `docs/technical.md` and `examples/` for e-commerce, migrations, and transactions.

## License

MIT — maintained by Dockstat. Contributions welcome.
