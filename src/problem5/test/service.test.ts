import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { openDatabase } from "../src/db.ts";
import { NotFoundError } from "../src/errors.ts";
import { createResourceRepository } from "../src/resources/repository.ts";
import { createResourceService, type ResourceService } from "../src/resources/service.ts";

// Business rules, tested without HTTP. A fresh in-memory database per test.
let service: ResourceService;

beforeEach(() => {
  service = createResourceService(createResourceRepository(openDatabase(":memory:")));
});

describe("ResourceService", () => {
  it("assigns a unique id and matching timestamps on create", () => {
    const a = service.create({ name: "A", description: "", status: "active" });
    const b = service.create({ name: "B", description: "", status: "active" });
    assert.notEqual(a.id, b.id);
    assert.equal(a.createdAt, a.updatedAt);
    assert.ok(!Number.isNaN(Date.parse(a.createdAt)));
  });

  it("gets a resource by id", () => {
    const created = service.create({ name: "A", description: "d", status: "archived" });
    assert.deepEqual(service.get(created.id), created);
  });

  it("updates only the given fields, keeps createdAt and bumps updatedAt", async () => {
    const created = service.create({ name: "A", description: "d", status: "active" });
    await new Promise((r) => setTimeout(r, 5));
    const updated = service.update(created.id, { name: "B" });
    assert.equal(updated.name, "B");
    assert.equal(updated.description, "d");
    assert.equal(updated.createdAt, created.createdAt);
    assert.ok(updated.updatedAt > created.updatedAt);
  });

  it("deletes a resource", () => {
    const created = service.create({ name: "A", description: "", status: "active" });
    service.delete(created.id);
    assert.throws(() => service.get(created.id), NotFoundError);
  });

  it("throws NotFoundError for unknown ids", () => {
    assert.throws(() => service.get("missing"), NotFoundError);
    assert.throws(() => service.update("missing", { name: "x" }), NotFoundError);
    assert.throws(() => service.delete("missing"), NotFoundError);
  });
});
