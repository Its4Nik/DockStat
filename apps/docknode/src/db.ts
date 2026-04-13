import DB from "@dockstat/sqlite-wrapper"

export const DockNodeDB = new DB("docknode.db", {
  autoBackup: {
    compress: true,
    directory: "./.backups",
    enabled: true,
    maxBackups: 12,
  },
  pragmas: [["journal_mode", "WAL"]],
})
