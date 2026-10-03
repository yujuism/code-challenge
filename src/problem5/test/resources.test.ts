import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { after, before, beforeEach, describe, it } from "node:test";
import { createApp } from "../src/app.ts";
import { openDatabase, type Database } from "../src/db.ts";

// End-to-end through HTTP against a real (in-memory) SQLite database.
let db: Database;
let server: Server;
let baseUrl: string;

before(async () => {
  db = openDatabase(":memory:");
  server = createApp(db).listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
  server.close();
  db.close();
});

beforeEach(() => db.exec("DELETE FROM resources"));

async function api(method: string, path: string, body?: unknown) {
  const res = await fetch(baseUrl + path, {
    method,
    headers: body === undefined ? {} : { "content-type": "application/json" },
    body: typeof body === "string" ? body : body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, headers: res.headers, body: text ? JSON.parse(text) : undefined };
}

const create = async (body: object) => (await api("POST", "/resources", body)).body;

describe("POST /resources", () => {
  it("creates a resource with defaults", async () => {
    const res = await api("POST", "/resources", { name: "  Widget  " });
    assert.equal(res.status, 201);
    assert.equal(res.body.name, "Widget", "name is trimmed");
    assert.equal(res.body.description, "");
    assert.equal(res.body.status, "active");
    assert.match(res.body.id, /^[0-9a-f-]{36}$/);
    assert.equal(res.body.createdAt, res.body.updatedAt);
    assert.equal(res.headers.get("location"), `/resources/${res.body.id}`);
  });

  it("rejects invalid bodies with field-level details", async () => {
    const res = await api("POST", "/resources", { name: "", status: "deleted", extra: 1 });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "validation_error");
    const paths = res.body.error.details.map((d: { path: string }) => d.path);
    assert.ok(paths.includes("name"));
    assert.ok(paths.includes("status"));
  });

  it("rejects malformed JSON without leaking internals", async () => {
    const res = await api("POST", "/resources", "{ not json");
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "invalid_json");
  });

  it("rejects a missing body", async () => {
    const res = await api("POST", "/resources");
    assert.equal(res.status, 400);
  });

  it("rejects oversized payloads", async () => {
    const res = await api("POST", "/resources", { name: "x", description: "a".repeat(200_000) });
    assert.equal(res.status, 413);
  });
});

describe("GET /resources", () => {
  beforeEach(async () => {
    await create({ name: "Alpha widget" });
    await create({ name: "Beta gadget", status: "archived" });
    await create({ name: "Gamma WIDGET" });
    await create({ name: "100% cotton" });
  });

  it("lists newest first with pagination metadata", async () => {
    const res = await api("GET", "/resources");
    assert.equal(res.status, 200);
    assert.deepEqual(
      res.body.data.map((r: { name: string }) => r.name),
      ["100% cotton", "Gamma WIDGET", "Beta gadget", "Alpha widget"],
    );
    assert.deepEqual(res.body.pagination, { total: 4, limit: 20, offset: 0 });
  });

  it("filters by status", async () => {
    const res = await api("GET", "/resources?status=archived");
    assert.deepEqual(res.body.data.map((r: { name: string }) => r.name), ["Beta gadget"]);
    assert.equal(res.body.pagination.total, 1);
  });

  it("searches by name, case-insensitively", async () => {
    const res = await api("GET", "/resources?q=widget&status=active");
    assert.deepEqual(res.body.data.map((r: { name: string }) => r.name), ["Gamma WIDGET", "Alpha widget"]);
  });

  it("treats LIKE wildcards in the search term literally", async () => {
    const res = await api("GET", "/resources?q=%25");
    assert.deepEqual(res.body.data.map((r: { name: string }) => r.name), ["100% cotton"]);
  });

  it("paginates with limit and offset", async () => {
    const res = await api("GET", "/resources?limit=2&offset=1");
    assert.deepEqual(res.body.data.map((r: { name: string }) => r.name), ["Gamma WIDGET", "Beta gadget"]);
    assert.deepEqual(res.body.pagination, { total: 4, limit: 2, offset: 1 });
  });

  it("rejects invalid or unknown query parameters", async () => {
    for (const qs of ["limit=0", "limit=101", "offset=-1", "status=nope", "stauts=active", "limit=abc"]) {
      const res = await api("GET", `/resources?${qs}`);
      assert.equal(res.status, 400, qs);
    }
  });
});

describe("GET /resources/:id", () => {
  it("returns the resource", async () => {
    const created = await create({ name: "Thing", description: "desc" });
    const res = await api("GET", `/resources/${created.id}`);
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, created);
  });

  it("returns 404 for an unknown id", async () => {
    const res = await api("GET", "/resources/does-not-exist");
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, "not_found");
  });
});

describe("PATCH /resources/:id", () => {
  it("updates only the provided fields and bumps updatedAt", async () => {
    const created = await create({ name: "Thing", description: "keep me" });
    await new Promise((r) => setTimeout(r, 5));
    const res = await api("PATCH", `/resources/${created.id}`, { status: "archived" });
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "archived");
    assert.equal(res.body.name, "Thing");
    assert.equal(res.body.description, "keep me");
    assert.equal(res.body.createdAt, created.createdAt);
    assert.ok(res.body.updatedAt > created.updatedAt);
  });

  it("can clear the description", async () => {
    const created = await create({ name: "Thing", description: "old" });
    const res = await api("PATCH", `/resources/${created.id}`, { description: "" });
    assert.equal(res.body.description, "");
  });

  it("rejects an empty or invalid update", async () => {
    const created = await create({ name: "Thing" });
    assert.equal((await api("PATCH", `/resources/${created.id}`, {})).status, 400);
    assert.equal((await api("PATCH", `/resources/${created.id}`, { name: " " })).status, 400);
    assert.equal((await api("PATCH", `/resources/${created.id}`, { id: "hijack" })).status, 400);
  });

  it("returns 404 for an unknown id", async () => {
    const res = await api("PATCH", "/resources/nope", { name: "x" });
    assert.equal(res.status, 404);
  });
});

describe("DELETE /resources/:id", () => {
  it("deletes once, then 404s", async () => {
    const created = await create({ name: "Thing" });
    assert.equal((await api("DELETE", `/resources/${created.id}`)).status, 204);
    assert.equal((await api("GET", `/resources/${created.id}`)).status, 404);
    assert.equal((await api("DELETE", `/resources/${created.id}`)).status, 404);
  });
});

describe("unknown routes", () => {
  it("return a JSON 404", async () => {
    const res = await api("GET", "/nope");
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, "not_found");
  });
});
