import Elysia from "elysia";

const DockStacksElysia = new Elysia()
  .get("/", () => "OK")


export default DockStacksElysia
