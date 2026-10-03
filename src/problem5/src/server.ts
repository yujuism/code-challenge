import { createApp } from "./app.ts";
import { openDatabase } from "./db.ts";

const port = Number(process.env.PORT ?? 3000);
const dbPath = process.env.DB_PATH ?? "data/resources.db";

const db = openDatabase(dbPath);
const server = createApp(db).listen(port, () => {
  console.log(`Server listening on http://localhost:${port} (database: ${dbPath})`);
});

// Finish in-flight requests, then close the database cleanly.
const shutdown = () => {
  server.close(() => {
    db.close();
    process.exit(0);
  });
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
