import jwt from "jsonwebtoken";
import type { UserRole } from "../middleware/rbac.js";

export function generateTestToken(
  userId: string,
  role: UserRole = "business_admin",
  organizationId: string = "org-test-" + Date.now(),
  tokenJti?: string
): string {
  const secret = process.env.JWT_SECRET ?? "test-secret";
  const resolvedJti = tokenJti ?? `test-jti-${Date.now()}`;
  const token = jwt.sign(
    { sub: userId, role, organizationId },
    secret,
    { expiresIn: "24h", jwtid: resolvedJti }
  );
  return `Bearer ${token}`;
}

export function getAuthHeader(
  userId: string,
  role: UserRole = "business_admin",
  organizationId: string = "org-test-" + Date.now(),
  tokenJti?: string
): { Authorization: string } {
  return { Authorization: generateTestToken(userId, role, organizationId, tokenJti) };
}
