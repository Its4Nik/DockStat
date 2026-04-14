import type { TSchema } from 'elysia';
import type { ElysiaConfig } from '../types';
import { getRouteMeta } from '../utils/getMeta';
import { updateConfig } from '../utils/config';

/**
 * BodySchema decorator for request body validation
 *
 * IMPORTANT: This decorator stores schema for runtime validation by Elysia.
 * TypeScript CANNOT automatically infer types from this decorator because
 * we're using the old decorator pattern (experimentalDecorators), not the
 * new Stage 3 decorator proposal.
 *
 * You MUST manually annotate types for full type safety:
 *
 * ✅ RECOMMENDED (Type-safe):
 * const Schema = t.Object({ name: t.String() });
 * type BodyType = Static<typeof Schema>;
 *
 * @BodySchema(Schema)
 * async handler({ body }: { body: BodyType }) {
 *   // body is typed as { name: string }
 * }
 *
 * ❌ NOT RECOMMENDED (No type safety):
 * @BodySchema(t.Object({ name: t.String() }))
 * async handler({ body }) {
 *   // body is implicitly 'any'
 * }
 *
 * The user wants automatic type inference like:
 * @BodySchema(t.Object({ name: t.String() }))
 * async handler({ body }) {
 *   // body automatically typed as { name: string }
 * }
 *
 * BUT THIS IS NOT POSSIBLE with experimentalDecorators (old pattern).
 * Automatic type inference requires the NEW decorator proposal which
 * is not yet stable and requires different TypeScript configuration.
 *
 * For automatic type inference, see TYPESAFE_EXAMPLES.md for alternative
 * approaches like using typedRoute helper or property wrappers.
 */
export const BodySchema = (schema: TSchema) => updateConfig('body', schema);

/**
 * QuerySchema decorator for query parameter validation
 * @see BodySchema documentation for type safety notes
 */
export const QuerySchema = (schema: TSchema) => updateConfig('query', schema);

/**
 * ParamsSchema decorator for URL parameters validation
 * @see BodySchema documentation for type safety notes
 */
export const ParamsSchema = (schema: TSchema) => updateConfig('params', schema);

/**
 * HeadersSchema decorator for request headers validation
 * @see BodySchema documentation for type safety notes
 */
export const HeadersSchema = (schema: TSchema) => updateConfig('headers', schema);

/**
 * CookieSchema decorator for cookie validation
 * @see BodySchema documentation for type safety notes
 */
export const CookieSchema = (schema: TSchema) => updateConfig('cookie', schema);

/**
 * Response decorator for response schema validation
 * Multiple @Response decorators can be used for different status codes
 *
 * @param status - HTTP status code
 * @param schema - TypeBox schema for response body
 */
export const Response = (status: number, schema: TSchema) => {
  return function (target: any, propertyKey: string | symbol) {
    const meta = getRouteMeta(target, propertyKey);
    if (!meta.config.response) {
      meta.config.response = {} as ElysiaConfig['response'];
    }
    (meta.config.response as Record<number, unknown>)[status] = schema;
  };
};
