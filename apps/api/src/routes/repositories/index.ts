import Elysia from "elysia"
import { DockStatDB } from "../../database"

const RepositoryRoutes = new Elysia({
  prefix: "/repositories",
  detail: { tags: ["repositories"] },
}).get("/all", () => DockStatDB.repositoriesTable.select(["*"]).all())

export default RepositoryRoutes
