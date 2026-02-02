import DB from "@dockstat/sqlite-wrapper"

export const DockNodeDB = new DB("docknode.db", {
  autoBackup: {
    enabled: true,
    directory: "./.backups",
    compress: true,
    maxBackups: 12,
  },
})

DockNodeDB.createIndex
