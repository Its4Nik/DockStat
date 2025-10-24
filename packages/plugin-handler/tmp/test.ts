import { column } from "@dockstat/sqlite-wrapper";
import { definePlugin } from "../src/utils/builder";

export const MyPlugin = definePlugin({
  name: 'DockStack',
  version: '1.0.0',
  description: '',
  type: 'github',
  repository: 'its4nik/dockstat',
  branch: 'dev',
  manifest: '/apps/dockstore/manifest.json',
  author: {
    email: 'info@itsnik.de',
    license: 'MIT',
    name: 'Its4Nik',
    website: 'https://github.com/its4nik',
  },
  table: {
    name: 'DockStack',
    jsonColumns: ["vars", "compose"],
    columns: {
      id: column.id(),
      nodeId: column.integer(),
      compose: column.json(),
      vars: column.json(),
      name: column.text(),
    },
  },

})
