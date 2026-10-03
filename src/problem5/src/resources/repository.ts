import type { SQLInputValue } from "node:sqlite";
import type { Database } from "../db.ts";
import type { ListResourcesQuery, Resource, ResourceStatus, UpdateResourceInput } from "./schemas.ts";

interface ResourceRow {
  id: string;
  name: string;
  description: string;
  status: ResourceStatus;
  created_at: string;
  updated_at: string;
}

const toResource = (row: ResourceRow): Resource => ({
  id: row.id,
  name: row.name,
  description: row.description,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/** Escapes LIKE wildcards so a search for "50%" matches the literal text. */
const escapeLike = (text: string) => text.replace(/[\\%_]/g, (c) => `\\${c}`);

/**
 * Data access only: maps between `Resource` objects and SQL rows. No business rules here.
 * All queries use bound parameters; user input is never concatenated into SQL.
 */
export function createResourceRepository(db: Database) {
  const insert = db.prepare(`
    INSERT INTO resources (id, name, description, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    RETURNING *`);
  const selectById = db.prepare("SELECT * FROM resources WHERE id = ?");
  // COALESCE keeps the current value for fields the client did not send. One statement,
  // so the read-modify-write is atomic and concurrent PATCHes cannot interleave.
  const update = db.prepare(`
    UPDATE resources SET
      name        = COALESCE(:name, name),
      description = COALESCE(:description, description),
      status      = COALESCE(:status, status),
      updated_at  = :updatedAt
    WHERE id = :id
    RETURNING *`);
  const remove = db.prepare("DELETE FROM resources WHERE id = ?");

  return {
    insert(resource: Resource): Resource {
      const { id, name, description, status, createdAt, updatedAt } = resource;
      const row = insert.get(id, name, description, status, createdAt, updatedAt);
      return toResource(row as unknown as ResourceRow);
    },

    findById(id: string): Resource | undefined {
      const row = selectById.get(id);
      return row ? toResource(row as unknown as ResourceRow) : undefined;
    },

    list({ status, q, limit, offset }: ListResourcesQuery): { items: Resource[]; total: number } {
      const conditions: string[] = [];
      const params: SQLInputValue[] = [];
      if (status) {
        conditions.push("status = ?");
        params.push(status);
      }
      if (q) {
        // SQLite's LIKE is case-insensitive for ASCII by default.
        conditions.push("name LIKE ? ESCAPE '\\'");
        params.push(`%${escapeLike(q)}%`);
      }
      const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

      const { total } = db.prepare(`SELECT COUNT(*) AS total FROM resources ${where}`).get(...params) as { total: number };
      const rows = db
        .prepare(`SELECT * FROM resources ${where} ORDER BY created_at DESC, rowid DESC LIMIT ? OFFSET ?`)
        .all(...params, limit, offset);
      return { items: (rows as unknown as ResourceRow[]).map(toResource), total };
    },

    /** Returns `undefined` when no resource has this id. */
    update(id: string, changes: UpdateResourceInput, updatedAt: string): Resource | undefined {
      const row = update.get({
        id,
        name: changes.name ?? null,
        description: changes.description ?? null,
        status: changes.status ?? null,
        updatedAt,
      });
      return row ? toResource(row as unknown as ResourceRow) : undefined;
    },

    /** Returns `false` when no resource has this id. */
    delete(id: string): boolean {
      return remove.run(id).changes > 0;
    },
  };
}

export type ResourceRepository = ReturnType<typeof createResourceRepository>;
