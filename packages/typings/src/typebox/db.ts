import { t } from "elysia"

const HotkeyAction = t.Union([
  t.Literal("open:sidebar"),
  t.Literal("close:sidebar"),
  t.Literal("toggle:sidebar"),
  t.Literal("open:quicklinks"),
])

// Hash entry for plugin verification
const PluginHashEntry = t.Object({
  version: t.String(),
  hash: t.String(),
})

// Hashes are only for plugins (themes and stacks don't need verification)
const PluginHashes = t.Nullable(t.Record(t.String(), PluginHashEntry))

// Repository schema for the separate repositories table
const Repo = t.Object({
  id: t.Number(),
  name: t.String(),
  type: t.UnionEnum(["local", "http", "github", "gitlab", "gitea"]),

  // Points to root Manifest
  // Is custom format!
  source: t.String(),

  // The Policy determines whether a repository is fully trusted.
  // - If fully trusted, any plugins, stacks, or themes are accepted without verification.
  // - Hashes for all received code are provided by the API.
  // - These hashes are checked against the verification API, which validates versions
  //   and blocks installation of untrusted or unverified plugins, stacks, or themes.
  // - If the Policy is set to "relaxed", no verification is performed at all.
  policy: t.UnionEnum(["strict", "relaxed"]),
  verification_api: t.Nullable(t.String({ format: "uri" })),
  paths: t.Object({
    themes: t.Object({ dir: t.String() }),
    plugins: t.Object({ dir: t.String(), bundle: t.String() }),
    stacks: t.Object({ dir: t.String() }),
  }),
})

// Schema for creating a new repository (id is auto-generated)
const CreateRepo = t.Object({
  name: t.String(),
  type: t.UnionEnum(["local", "http", "github", "gitlab", "gitea"]),
  source: t.String(),
  policy: t.UnionEnum(["strict", "relaxed"]),
  verification_api: t.Nullable(t.String({ format: "uri" })),
})

// Schema for updating an existing repository (all fields optional except id)
const UpdateRepo = t.Object({
  id: t.Number(),
  name: t.Optional(t.String()),
  type: t.Optional(t.UnionEnum(["local", "http", "github", "gitlab", "gitea"])),
  source: t.Optional(t.String()),
  policy: t.Optional(t.UnionEnum(["strict", "relaxed"])),
  verification_api: t.Optional(t.Nullable(t.String({ format: "uri" }))),
  isVerified: t.Optional(t.Boolean()),
  hashes: t.Optional(PluginHashes),
})

// Response schema for repository operations
const RepoResponse = t.Object({
  success: t.Boolean(),
  message: t.String(),
  data: t.Optional(t.Union([Repo, t.Array(Repo)])),
})

const TableMetaData = t.Object({
  name: t.String(),
  version: t.String(),
  migrations: t.Array(
    t.Object({
      from_version: t.String(),
      to_version: t.String(),
    })
  ),
})

const DockStatConfigTable = t.Object({
  version: t.String(),
  id: t.Number(),
  name: t.Nullable(t.String()),
  default_themes: t.Object({
    dark: t.Number(),
    light: t.Number(),
  }),

  config_database_rev: t.String({
    pattern:
      "^(0|[1-9]d*).(0|[1-9]d*).(0|[1-9]d*)(?:-((?:0|[1-9]d*|d*[a-zA-Z-][0-9a-zA-Z-]*)(?:.(?:0|[1-9]d*|d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:+([0-9a-zA-Z-]+(?:.[0-9a-zA-Z-]+)*))?$",
  }),

  /* Trusted repos will be added later on */
  allow_untrusted_repo: t.Boolean({ default: false }),

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
  tls_certs_and_keys: t.Object({
    web: t.Nullable(
      t.Object({
        key: t.String(),
        cert: t.String(),
      })
    ),
    docker: t.Nullable(
      t.Record(
        t.Number(),
        t.Object({
          key: t.String(),
          cert: t.String(),
        })
      )
    ),
  }),
  nav_links: t.Array(
    t.Object({
      slug: t.String(),
      path: t.String(),
    })
  ),

  addtionalSettings: t.Object({
    showBackendRamUsageInNavbar: t.Optional(t.Boolean()),
  }),

  hotkeys: t.Partial(t.Record(HotkeyAction, t.String())),

  autostart_handlers_monitoring: t.Boolean(),
})

const UpdateDockStatConfigTableResponse = t.Object({
  message: t.String(),
  code: t.Number(),
  update_response: t.Object({
    changes: t.Number(),
  }),
  new_config: t.Nullable(DockStatConfigTable),
})

export {
  PluginHashEntry,
  PluginHashes,
  Repo,
  CreateRepo,
  UpdateRepo,
  RepoResponse,
  TableMetaData,
  DockStatConfigTable,
  UpdateDockStatConfigTableResponse,
}
