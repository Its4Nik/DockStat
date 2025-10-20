import ServerInstance from "~/.server"

export function loader() {
  return ServerInstance.getDB().DB.getConfigTable().select(["*"]).all()[0]
}
