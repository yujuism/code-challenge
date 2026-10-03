import { Router } from "express";
import { createResourceSchema, listResourcesQuerySchema, updateResourceSchema } from "./schemas.ts";
import type { ResourceService } from "./service.ts";

/**
 * HTTP layer: validates input, calls the service and maps results to status codes.
 * Zod `parse` throws a ZodError (400) and the service throws NotFoundError (404); both are
 * turned into responses by the shared error handler.
 */
export function resourcesRouter(service: ResourceService): Router {
  const router = Router();

  router.post("/", (req, res) => {
    const resource = service.create(createResourceSchema.parse(req.body));
    res.status(201).location(`${req.baseUrl}/${resource.id}`).json(resource);
  });

  router.get("/", (req, res) => {
    const query = listResourcesQuerySchema.parse(req.query);
    const { items, total } = service.list(query);
    res.json({ data: items, pagination: { total, limit: query.limit, offset: query.offset } });
  });

  router.get("/:id", (req, res) => {
    res.json(service.get(req.params.id));
  });

  router.patch("/:id", (req, res) => {
    res.json(service.update(req.params.id, updateResourceSchema.parse(req.body)));
  });

  router.delete("/:id", (req, res) => {
    service.delete(req.params.id);
    res.status(204).end();
  });

  return router;
}
