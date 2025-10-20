import { Elysia, t } from "elysia";

export const ElysiaAdapterRoute = new Elysia({ prefix: "/adapter" }).post(
  "/add-host",
  () => {
    return ":)";
  },
  {
    body: t.Object({
      host: t.Object({
        id: t.Number({ default: -1 }),
        endpoint: t.String(),
        port: t.Number(),
        secure: t.Optional(
          t.Object({
            sslKey: t.File(),
            sslCert: t.File(),
          })
        ),
      }),
    }),
  }
);
