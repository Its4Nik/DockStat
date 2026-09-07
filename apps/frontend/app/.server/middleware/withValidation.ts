import type { ActionFunction } from "react-router";
import type { MiddlewareFunction } from "react-router";
import { z } from "zod";

export function withValidation<T extends z.ZodType>(
  schema: T,
  action: A
): MiddlewareFunction {
  return async ({ request, context, params, url, pattern }, next) => {
    const formData = await request.formData();
    const rawData = Object.fromEntries(formData);
    const result = schema.safeParse(rawData);

    if (!result.success) {
      return new Response(JSON.stringify({ errors: z.treeifyError(result.error).errors }), { status: 400 }
      );
    }

    // Call the original action with the validated data
    return action({ request, context, params, url ,pattern}, result.data);
  };
}
