import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

/** An error whose message is safe to show to API clients. */
export class HttpError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** Domain error thrown by services. It has no HTTP knowledge; the error handler maps it to 404. */
export class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} ${id} not found`);
  }
}

export const notFound: RequestHandler = (req) => {
  throw new HttpError(404, "not_found", `Route ${req.method} ${req.path} not found`);
};

/**
 * Single place that turns errors into the API's error shape:
 *   { "error": { "code": string, "message": string, "details"?: [...] } }
 * Unexpected errors are logged server-side and reported to the client generically, so
 * stack traces and SQL never leak.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "validation_error",
        message: "Request validation failed",
        details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      },
    });
    return;
  }
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: { code: "not_found", message: err.message } });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  // Errors raised by express.json(): malformed JSON (400), payload too large (413), etc.
  // body-parser marks client-safe errors with `expose: true`.
  if (err?.expose === true && typeof err.status === "number" && err.status < 500) {
    const code = err.type === "entity.parse.failed" ? "invalid_json" : "bad_request";
    res.status(err.status).json({ error: { code, message: err.message } });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { code: "internal_error", message: "Internal server error" } });
};
