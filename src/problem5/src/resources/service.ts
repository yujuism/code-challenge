import { randomUUID } from "node:crypto";
import { NotFoundError } from "../errors.ts";
import type { ResourceRepository } from "./repository.ts";
import type { CreateResourceInput, ListResourcesQuery, Resource, UpdateResourceInput } from "./schemas.ts";

export interface ResourceList {
  items: Resource[];
  total: number;
}

/**
 * Business logic for resources. It owns identity and timestamps and decides what
 * "not found" means. It knows nothing about HTTP (the router) or SQL (the repository).
 */
export function createResourceService(repo: ResourceRepository) {
  return {
    create(input: CreateResourceInput): Resource {
      const now = new Date().toISOString();
      return repo.insert({ id: randomUUID(), ...input, createdAt: now, updatedAt: now });
    },

    list(query: ListResourcesQuery): ResourceList {
      return repo.list(query);
    },

    get(id: string): Resource {
      const resource = repo.findById(id);
      if (!resource) throw new NotFoundError("Resource", id);
      return resource;
    },

    update(id: string, changes: UpdateResourceInput): Resource {
      const resource = repo.update(id, changes, new Date().toISOString());
      if (!resource) throw new NotFoundError("Resource", id);
      return resource;
    },

    delete(id: string): void {
      if (!repo.delete(id)) throw new NotFoundError("Resource", id);
    },
  };
}

export type ResourceService = ReturnType<typeof createResourceService>;
