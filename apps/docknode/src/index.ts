import { Elysia } from "elysia";
import { dockstack } from "./handlers/dockstack";

const app = new Elysia().use(dockstack).listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
