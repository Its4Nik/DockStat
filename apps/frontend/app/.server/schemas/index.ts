import type { SchemaRegistry } from "../middleware/withValidation"
import { AuthValidation } from "./auth"
import { PinValidator } from "./pin"
import { UserValidation } from "./user"

/**
 * Single source of truth for the generated API surface.
 *
 * Every group becomes a route module under `routes/gen/` mounted at
 * `/api/v3/<path>` (see `.server/scripts/index.ts`); every operation becomes
 * a fully-typed entry in `lib/executeAction.ts`. `User.Basic` is mounted by
 * the login page itself, so it is excluded from generation via `ignored`.
 */
export const Schemas = {
  Auth: AuthValidation,
  Config: {
    Pin: PinValidator,
  },
  User: UserValidation,
} satisfies SchemaRegistry
