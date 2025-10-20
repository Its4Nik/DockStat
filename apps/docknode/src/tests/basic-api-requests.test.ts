import { expect, test } from "bun:test";

await import("../index");

test("Basic API Status Test", async () => {
  const res = (await (
    await fetch("http://localhost:4000/api/status")
  ).json()) as { status: number };

  expect(res.status).toBe(200);
});

test("Basic Unauthorized Call", async () => {
  const res = await (
    await fetch("http://localhost:4000/api/dockstack/deploy", {
      method: "POST",
    })
  ).json();
});
