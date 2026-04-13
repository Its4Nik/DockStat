import { t } from "elysia"

export const HotkeyAction = t.Union([
  t.Literal("open:sidebar"),
  t.Literal("close:sidebar"),
  t.Literal("toggle:sidebar"),
  t.Literal("open:quicklinks"),
  t.Literal("toggle:themeEditor"),
  t.Literal("open:themeEditor"),
  t.Literal("close:themeEditor"),
])

// Hash entry for plugin verification
const PluginHashEntry = t.Object({
  hash: t.String(),
  version: t.String(),
})

// Hashes are only for plugins (themes and stacks don't need verification)
const PluginHashes = t.Nullable(t.Record(t.String(), PluginHashEntry))

// Repository schema for the separate repositories table
const Repo = t.Object({
  id: t.Number(),
  name: t.String(),
  paths: t.Object({
    plugins: t.Object({ bundle: t.String(), dir: t.String() }),
    stacks: t.Object({ dir: t.String() }),
    themes: t.Object({ dir: t.String() }),
  }),

  // The Policy determines whether a repository is fully trusted.
  // - If fully trusted, any plugins, stacks, or themes are accepted without verification.
  // - Hashes for all received code are provided by the API.
  // - These hashes are checked against the verification API, which validates versions
  //   and blocks installation of untrusted or unverified plugins, stacks, or themes.
  // - If the Policy is set to "relaxed", no verification is performed at all.
  policy: t.UnionEnum(["strict", "relaxed"]),

  // Points to root Manifest
  // Is custom format!
  source: t.String(),
  type: t.UnionEnum(["local", "http", "github", "gitlab", "gitea"]),
  verification_api: t.Nullable(t.String({ format: "uri" })),
})

// Schema for creating a new repository (id is auto-generated)
const CreateRepo = t.Object({
  name: t.String(),
  policy: t.UnionEnum(["strict", "relaxed"]),
  source: t.String(),
  type: t.UnionEnum(["local", "http", "github", "gitlab", "gitea"]),
  verification_api: t.Nullable(t.String({ format: "uri" })),
})

// Schema for updating an existing repository (all fields optional except id)
const UpdateRepo = t.Object({
  hashes: t.Optional(PluginHashes),
  id: t.Number(),
  isVerified: t.Optional(t.Boolean()),
  name: t.Optional(t.String()),
  policy: t.Optional(t.UnionEnum(["strict", "relaxed"])),
  source: t.Optional(t.String()),
  type: t.Optional(t.UnionEnum(["local", "http", "github", "gitlab", "gitea"])),
  verification_api: t.Optional(t.Nullable(t.String({ format: "uri" }))),
})

// Response schema for repository operations
const RepoResponse = t.Object({
  data: t.Optional(t.Union([Repo, t.Array(Repo)])),
  message: t.String(),
  success: t.Boolean(),
})

const TableMetaData = t.Object({
  migrations: t.Array(
    t.Object({
      from_version: t.String(),
      to_version: t.String(),
    })
  ),
  name: t.String(),
  version: t.String(),
})

const DockStatConfigTable = t.Object({
  additionalSettings: t.Object({
    defaultDashboard: t.Optional(t.String()),
    showBackendRamUsageInNavbar: t.Optional(t.Boolean()),
    showBackendErrorLogs: t.Optional(t.Boolean())
  }),

  /* Trusted repos will be added later on */
  allow_untrusted_repo: t.Boolean({ default: false }),

  autostart_handlers_monitoring: t.Boolean(),

  config_database_rev: t.String({
    pattern:
      "^(0|[1-9]d*).(0|[1-9]d*).(0|[1-9]d*)(?:-((?:0|[1-9]d*|d*[a-zA-Z-][0-9a-zA-Z-]*)(?:.(?:0|[1-9]d*|d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:+([0-9a-zA-Z-]+(?:.[0-9a-zA-Z-]+)*))?$",
  }),
  default_themes: t.Object({
    dark: t.Number(),
    light: t.Number(),
  }),

  hotkeys: t.Partial(t.Record(HotkeyAction, t.String())),
  id: t.Number(),

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
  keys: t.Object({
    docker: t.Nullable(
      t.Record(
        t.Number(),
        t.Object({
          cert: t.String(),
          key: t.String(),
        })
      )
    ),
    docknode: t.Nullable(
      t.Record(
        t.Number(),
        t.String() // API KEY
      )
    ),
    web: t.Nullable(
      t.Object({
        cert: t.String(),
        key: t.String(),
      })
    ),
  }),
  name: t.Nullable(t.String()),
  nav_links: t.Array(
    t.Object({
      path: t.String(),
      slug: t.String(),
    })
  ),

  /* Tables that are used by dockstat will have to be registered here */
  tables: t.Array(TableMetaData),
  version: t.String(),
})

const UpdateDockStatConfigTableResponse = t.Object({
  code: t.Number(),
  message: t.String(),
  new_config: t.Nullable(DockStatConfigTable),
  update_response: t.Object({
    changes: t.Number(),
  }),
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
