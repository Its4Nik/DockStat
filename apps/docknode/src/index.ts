import { Elysia } from "elysia"

const DockNode = new Elysia({ prefix: "/api" }).get("/", () => "Hi")

export { DockNode }
