import { t } from "elysia";

const DockStatConfigTable = t.Object({
  version: t.String(),
  default_themes: t.Object({
    dark: t.Number(),
    light: t.Number()
  }),

  /* Trusted repos will be added later on */
  allow_untrusted_repo: t.Boolean({ default: false }),
  trusted_repos: t.Array(t.String()),

  /* Where the plugins/themes/stacks will be downloadable from */
  registered_plugin_repos: t.Array(t.String()),

  /* Tables that are used by dockstat will have to be registered here */
  tables: t.Array(t.Object({
    name: t.String(),
    version: t.String(),
    migrations: t.Array(t.Object({
      from_version: t.String(),
      to_version: t.String()
    })),
  })),

  /*
    TLS/SSL certs are not required if you are using a reverse proxy. Just make sure to secure the network access to the DockStat container
    The type defines where the tls cert and key can be usable, when selecting stack, a stackID is needed.

    Docker-Socket and DockStat-Frontend Keys lie all in the database.

    The only real key files that get created are stack specific.
    They key and cert files get stored according to this config:

    ./stacks
        /my-stack
          /docker-compose.yml
          /.@dockstat
            /template.yml
            /ssl
              /certs
                ${containerName}.cert
              /keys
                ${containerName}.key
  */
  tls_certs_and_keys: t.Record(t.Number(), t.Object({
    key: t.String(),
    cert: t.String()
  }))
})

type DockStatConfigTableType = typeof DockStatConfigTable.static

export {
  DockStatConfigTable,
  type DockStatConfigTableType
}
