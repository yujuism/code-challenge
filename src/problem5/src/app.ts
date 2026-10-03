import express, { type Express } from "express";
import type { Database } from "./db.ts";
import { errorHandler, notFound } from "./errors.ts";
import { createResourceRepository } from "./resources/repository.ts";
import { resourcesRouter } from "./resources/router.ts";
import { createResourceService } from "./resources/service.ts";

export function createApp(db: Database): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  app.use("/resources", resourcesRouter(createResourceService(createResourceRepository(db))));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
