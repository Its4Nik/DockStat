import Elysia from "elysia";
import { openapi } from "@elysiajs/openapi";

const DockStatElysiaPlugins = new Elysia().use(
  openapi({
    path: "/docs",
    provider: "scalar",
  }),
);

export default DockStatElysiaPlugins;
