import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";

export function requestLogger(req: Request, _res: Response, next: NextFunction) {
  req.headers["x-request-id"] = req.headers["x-request-id"] ?? crypto.randomUUID();
  next();
}
