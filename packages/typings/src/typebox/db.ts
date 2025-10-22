import { t } from "elysia";

const Repo = t.Object({
  name: t.String(),
  type: t.UnionEnum(["local", "http", "github", "gitlab", "gitea"]),
  // Points to root Manifest
  source: t.String(),

  // The Policy defines if you want to trust a Repo completely and accept any Plugins/Stacks/Themes without veryfing with a compatible verification server
  // The Hashes will be servered by the API, where their code was receiced from.
  // After receiving all the hashes they will be verified by the compatible verification api
  // This Verification API will then in turn check all versions of the Hashes and mark any plugin/stack/theme version that is not verified and also block installations of untrusted plugins
  // If the Policy is set to relaxed there will be no verification for anythin at all.
  policy: t.UnionEnum(["strict", "relaxed"]),
  verificatioh_api: t.Nullable(t.String({ format: 'uri' })),
  isVerified: t.Boolean(),
  hashes: t.Nullable(
    t.Object({
      plugins: t.Record(
        t.String(),
        t.Object({
          version: t.String(),
          hash: t.String(),
        })
      ),
      stacks: t.Record(
        t.String(),
        t.Object({
          version: t.String(),
          hash: t.String(),
        })
      ),
      themes: t.Record(
        t.String(),
        t.Object({
          version: t.String(),
          hash: t.String(),
        })
      ),
    })
  )
})

const TableMetaData = t.Object({
  name: t.String(),
  version: t.String(),
  migrations: t.Array(t.Object({
    from_version: t.String(),
    to_version: t.String()
  })),
})

const DockStatConfigTable = t.Object({
  version: t.String(),
  id: t.Number(),
  name: t.Nullable(t.String()),
  default_themes: t.Object({
    dark: t.Number(),
    light: t.Number()
  }),

  /* Trusted repos will be added later on */
  allow_untrusted_repo: t.Boolean({ default: false }),

  /* Where the plugins/themes/stacks will be downloadable from */
  registered_repos: t.Array(Repo),

  /* Tables that are used by dockstat will have to be registered here */
  tables: t.Array(TableMetaData),

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
  })),
  nav_links: t.ArrayString(),
  hotkeys: t.Record(t.String(), t.UnionEnum(["open:nav", "close:nav", "toggle:nav"]))
})

const UpdateDockStatConfigTableResponse = t.Object({
  message: t.String(),
  code: t.Number(),
  update_response: t.Object({
    changes: t.Number()
  }),
  new_config: t.Nullable(DockStatConfigTable)
})

export {
  Repo,
  TableMetaData,
  DockStatConfigTable,
  UpdateDockStatConfigTableResponse
}
