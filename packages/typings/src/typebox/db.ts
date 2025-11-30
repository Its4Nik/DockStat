import { t } from "elysia"

const Repo = t.Object({
	name: t.String(),
	type: t.UnionEnum(["local", "http", "github", "gitlab", "gitea", "default"]),

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
	),
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
			"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$",
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
	nav_links: t.ArrayString(),
	hotkeys: t.Record(
		t.String(),
		t.UnionEnum(["open:nav", "close:nav", "toggle:nav"])
	),

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
	Repo,
	TableMetaData,
	DockStatConfigTable,
	UpdateDockStatConfigTableResponse,
}
