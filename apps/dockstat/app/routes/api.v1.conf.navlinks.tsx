import ServerInstance from "~/.server"

export function loader() {
  const data = ServerInstance.getDB().DB.getConfigTable().select(["*"]).all()[0]

  return data.nav_links ?? []
}
