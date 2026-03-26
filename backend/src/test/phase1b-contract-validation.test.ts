import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";

vi.setConfig({ testTimeout: 20000, hookTimeout: 20000 });

const { queryDbMock, poolQueryMock, poolConnectMock } = vi.hoisted(() => ({
  queryDbMock: vi.fn(),
  poolQueryMock: vi.fn(),
  poolConnectMock: vi.fn(),
}));

vi.mock("../db/client.js", () => ({
  queryDb: queryDbMock,
  dbPool: { query: poolQueryMock, connect: poolConnectMock, on: vi.fn(), end: vi.fn() },
  checkDatabaseHealth: vi.fn(async () => ({ healthy: true, details: {} })),
}));

vi.mock("pg", () => ({
  Pool: vi.fn(() => ({
    query: poolQueryMock,
    connect: poolConnectMock,
  }))
}));

vi.mock("bcryptjs", () => ({
  hash: vi.fn(async () => "$2a$12$mockhash12345678901234"),
  compare: vi.fn(async () => true),
}));

vi.mock("../middleware/auth.js", async (importOriginal) => {
  const actual = await importOriginal() as any;
  const jwtLib = await import('jsonwebtoken');
  const { getSessionByJti, validateSession, touchSessionActivity } = await import('../services/auth/sessionService.js');
  const TEST_SECRET = "test_jwt_secret_minimum_64_chars_for_vitest_suite_compliance_ok";
  return {
    ...actual,
    requireAuth: async (req: any, res: any, next: any) => {
      const raw = req.headers?.authorization;
      const token = raw?.startsWith('Bearer ') ? raw.slice(7) : null;
      if (token) {
        try {
          const payload = jwtLib.default.verify(token, TEST_SECRET) as any;
          if (payload.jti) {
            const session = await getSessionByJti(payload.jti);
            const validation = validateSession(session);
            if (validation.status === 'revoked') {
              return res.status(401).json({ error: { code: 'SESSION_REVOKED', message: 'Session has been revoked' } });
            }
            if (validation.status !== 'active') {
              return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Session expired or invalid' } });
            }
            await touchSessionActivity(payload.jti);
          }
          req.user = { id: payload.sub, role: payload.role ?? 'business_admin', organization_id: payload.organizationId ?? 'org-001' };
          res.locals.auth = { userId: payload.sub, userRole: payload.role ?? 'business_admin', organizationId: payload.organizationId ?? 'org-001', tokenJti: payload.jti ?? null, sessionId: null };
          return next();
        } catch {
          return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Token verification failed' } });
        }
      }
      req.user = { id: "user-001", role: "business_admin", organization_id: "org-001" };
      res.locals.auth = { userId: "user-001", userRole: "business_admin", organizationId: "org-001", tokenJti: null, sessionId: null };
      next();
    },
    optionalAuth: (_req: any, _res: any, next: any) => next(),
    authenticateRequest: (req: any, res: any, next: any) => {
      req.user = { id: "user-001", role: "business_admin", organization_id: "org-001" };
      res.locals.auth = { userId: "user-001", userRole: "business_admin", organizationId: "org-001", tokenJti: null, sessionId: null };
      next();
    },
  };
});

const JWT_SECRET = "test_jwt_secret_minimum_64_chars_for_vitest_suite_compliance_ok";
const generateToken = (userId: string, role: string, orgId: string, tokenJti = "phase1b-jti") =>
  jwt.sign({ sub: userId, role, organizationId: orgId }, JWT_SECRET, { expiresIn: "24h", jwtid: tokenJti });

describe("API Contract Validation - End-to-End", () => {
  let app: any;
  let failureCountOverride: number | null = null;
  let mockUserLockedUntil: string | null = null;
  let nextServicesListResponse: any[] | null = null;
  let nextServiceByIdResponse: any[] | null = null;
  let serviceError: Error | null = null;

  beforeEach(async () => {
    vi.clearAllMocks();
    failureCountOverride = null;
    mockUserLockedUntil = null;
    nextServicesListResponse = null;
    nextServiceByIdResponse = null;
    serviceError = null;
    type SessionRecord = {
      id: string;
      user_id: string;
      organization_id: string;
      token_jti: string;
      issued_at: string;
      expires_at: string;
      last_activity_at: string;
      revoked_at: string | null;
      revoke_reason: string | null;
    };
    const sessionStoreByJti = new Map<string, SessionRecord>();
    const sessionStoreById = new Map<string, SessionRecord>();
    const bootstrapSession: SessionRecord = {
      id: "session-phase1b-jti",
      user_id: "user-001",
      organization_id: "org-001",
      token_jti: "phase1b-jti",
      issued_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      last_activity_at: new Date().toISOString(),
      revoked_at: null,
      revoke_reason: null,
    };
    sessionStoreByJti.set(bootstrapSession.token_jti, bootstrapSession);
    sessionStoreById.set(bootstrapSession.id, bootstrapSession);

    poolQueryMock.mockImplementation(async (query: string, params?: any[]) => {
      const normalizedEmail = params ? String(params[0] || "test@example.com").toLowerCase() : "test@example.com";
      if (query.includes("INSERT INTO users")) {
        return {
          rows: [
            {
              id: "user-001",
              email: normalizedEmail,
              role: params ? (params[2] as string) : "business_admin",
              organization_id: "org-001",
              created_at: new Date().toISOString(),
              password_hash: "$2a$12$mockhash12345678901234",
            },
          ],
        };
      }
      if (query.includes("SELECT id, email, password_hash")) {
        return {
          rows: [
            {
              id: "user-001",
              email: normalizedEmail,
              password_hash: "$2a$12$mockhash12345678901234",
              role: "business_admin",
              organization_id: "org-001",
            },
          ],
        };
      }
      return { rows: [] };
    });

    queryDbMock.mockImplementation(async (query: string, params?: any[]) => {
      const normalizedQuery = query.trim().toLowerCase();
      const identifier = params ? String(params[0] || "test@example.com").toLowerCase() : "test@example.com";

      if (normalizedQuery.includes("insert into users")) {
        return [
          {
            id: "user-001",
            email: identifier,
            role: params ? (params[2] as string) : "business_admin",
            organization_id: "org-001",
            password_hash: "$2a$12$mockhash12345678901234",
          },
        ];
      }

      if (normalizedQuery.includes("select id, email, password_hash")) {
        return [
          {
            id: "user-001",
            email: identifier,
            password_hash: "$2a$12$mockhash12345678901234",
            role: "business_admin",
            organization_id: "org-001",
            locked_until: mockUserLockedUntil,
            failed_attempts: 0,
          },
        ];
      }

      if (normalizedQuery.includes("select id, email, role, organization_id")) {
        return [
          {
            id: params?.[0] ?? "user-001",
            email: "test@example.com",
            role: "business_admin",
            organization_id: "org-001",
          },
        ];
      }

      if (normalizedQuery.includes("insert into login_sessions")) {
        const tokenJti = params ? String(params[2]) : "session-jti";
        const row = {
          id: `session-${tokenJti}`,
          user_id: params?.[0] as string,
          organization_id: params?.[1] as string,
          token_jti: tokenJti,
          issued_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          last_activity_at: new Date().toISOString(),
          revoked_at: null,
          revoke_reason: null,
        };
        sessionStoreByJti.set(tokenJti, row);
        sessionStoreById.set(row.id, row);
        return [row];
      }

      if (normalizedQuery.includes("from login_sessions")) {
        const tokenJti = params ? String(params[0]) : "session-jti";
        const row = sessionStoreByJti.get(tokenJti);
        return row ? [row] : [];
      }

      if (normalizedQuery.includes("update login_sessions")) {
        if (normalizedQuery.includes("last_activity_at")) {
          const tokenJti = params ? String(params[0]) : "";
          const row = sessionStoreByJti.get(tokenJti);
          if (row) row.last_activity_at = new Date().toISOString();
          return [];
        }
        if (normalizedQuery.includes("revoked_at")) {
          // revokeSessionByToken uses token_jti = $1; revokeSessionById uses id = $1
          const key = params ? String(params[0]) : "";
          const byJti = sessionStoreByJti.get(key);
          const byId = sessionStoreById.get(key);
          const row = byJti ?? byId;
          if (row) {
            row.revoked_at = new Date().toISOString();
            row.revoke_reason = params ? (params[1] as string) : "user_logout";
          }
          return [];
        }
        return [];
      }

      if (normalizedQuery.includes("insert into login_attempts")) {
        return [];
      }

      if (normalizedQuery.includes("from services") && normalizedQuery.includes("limit 500")) {
        if (serviceError) {
          const err = serviceError;
          serviceError = null;
          throw err;
        }
        const response = nextServicesListResponse ?? [];
        nextServicesListResponse = null;
        return response;
      }

      if (normalizedQuery.includes("from services") && normalizedQuery.includes("limit 1") && normalizedQuery.includes("and id = $2")) {
        if (serviceError) {
          const err = serviceError;
          serviceError = null;
          throw err;
        }
        const response = nextServiceByIdResponse ?? [];
        nextServiceByIdResponse = null;
        return response;
      }

      if (normalizedQuery.includes("select count(*)") && normalizedQuery.includes("login_attempts")) {
        return [{ count: (failureCountOverride ?? 0).toString() }];
      }

      if (normalizedQuery.includes("update users")) {
        if (normalizedQuery.includes("locked_until = now()")) {
          mockUserLockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
          return [];
        }
        if (normalizedQuery.includes("locked_until = null")) {
          mockUserLockedUntil = null;
          return [];
        }
        return [];
      }

      return [];
    });

    poolConnectMock.mockResolvedValue({
      query: poolQueryMock,
      release: vi.fn(),
    });

    const { createApp } = await import("../app.js");
    app = createApp();
  });

  describe("Auth Endpoints - Response Contracts", () => {
    it("POST /api/auth/register returns user object with required fields", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: "newuser@example.com",
          password: "password123"
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.accessToken).toBe("string");
      expect(res.body.data.user).toHaveProperty("id");
      expect(res.body.data.user).toHaveProperty("organizationId");
      expect(res.body.data.user).toHaveProperty("email");
      expect(res.body.data.user).toHaveProperty("role");
    });

    it("POST /api/auth/login returns tokens with correct types", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "password123"
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.accessToken).toBe("string");
      expect(res.body.data.user).toHaveProperty("id");
    });

    it("GET /api/auth/me returns user context", async () => {
      const token = generateToken("user-001", "business_admin", "org-001");
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toHaveProperty("id");
      expect(res.body.data.user).toHaveProperty("role");
      expect(res.body.data.user).toHaveProperty("organizationId");
    });

    it("POST /api/auth/logout revokes session and prevents reuse", async () => {
      const login = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "password123"
        });

      expect(login.status).toBe(200);
      const token = login.body.data.accessToken;
      const logout = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${token}`);

      expect(logout.status).toBe(200);
      expect(logout.body.success).toBe(true);
      expect(logout.body.data).toHaveProperty("revoked", true);

      const replay = await request(app)
        .get("/api/services")
        .set("Authorization", `Bearer ${token}`);

      expect(replay.status).toBe(401);
      expect(replay.body.error.code).toBe("SESSION_REVOKED");
    });

    it("POST /api/auth/login returns 429 when account locked", async () => {
      mockUserLockedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "password123"
        });

      expect(res.status).toBe(429);
      expect(res.body.error).toHaveProperty("code", "ACCOUNT_LOCKED");
    });
  });

  describe("Services Endpoints - Response Contracts", () => {
    const token = generateToken("user-001", "business_admin", "org-001");

    it("GET /api/services returns paginated list with metadata", async () => {
      const services = [{
        id: "svc-001",
        organization_id: "org-001",
        category_id: null,
        name: "Massage",
        description: "Professional massage",
        duration_minutes: 60,
        price_cents: "15000",
        currency: "GBP",
        notes: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }];
      nextServicesListResponse = services;

      const res = await request(app)
        .get("/api/services?page=1&limit=10")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe("svc-001");
      expect(res.body.meta).toMatchObject({
        page: 1,
        limit: 10,
        total: 1,
        total_pages: 1,
      });
    });

    it("GET /api/services/:id returns single service object", async () => {
      const service = {
        id: "svc-001",
        organization_id: "org-001",
        category_id: null,
        name: "Massage",
        description: "Professional massage",
        duration_minutes: 60,
        price_cents: "15000",
        currency: "GBP",
        notes: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      nextServiceByIdResponse = [service];

      const res = await request(app)
        .get("/api/services/svc-001")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe("svc-001");
      expect(res.body.data.name).toBe("Massage");
      expect(res.body.data.price_cents).toBe("15000");
    });
  });

  describe("Bookings Endpoints - Response Contracts", () => {
    const token = generateToken("user-001", "business_admin", "org-001");

    it("GET /api/bookings returns list with context-aware filtering", async () => {
      const bookings = [{
        id: "bk-001",
        organization_id: "org-001",
        client_id: "user-001",
        staff_id: null,
        service_id: "svc-001",
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        status: "confirmed",
        notes: null,
        client_name: "Test Client",
        staff_name: null,
        service_name: "Massage",
        created_at: new Date().toISOString()
      }];
      queryDbMock.mockResolvedValue(bookings);

      const res = await request(app)
        .get("/api/bookings")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0]).toHaveProperty("id");
      expect(res.body.data[0]).toHaveProperty("status");
      expect(res.body.data[0]).toHaveProperty("start_time");
      expect(res.body.meta).toMatchObject({
        page: 1,
        limit: 20,
        total: 1,
        total_pages: 1,
      });
    });

    it("POST /api/bookings returns created booking with required fields", async () => {
      const createResult = [{
        id: "bk-001",
        organization_id: "org-001",
        client_id: null,
        staff_member_id: null,
        service_id: "svc-001",
        start_time: "2026-03-15T10:00:00Z",
        end_time: "2026-03-15T11:00:00Z",
        status: "pending",
        notes: null,
        created_at: new Date().toISOString()
      }];
      queryDbMock.mockResolvedValue(createResult);

      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          service_id: "svc-001",
          start_time: "2026-03-15T10:00:00Z",
          end_time: "2026-03-15T11:00:00Z"
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data).toHaveProperty("status");
      expect(res.body.data).toHaveProperty("created_at");
    });
  });

  describe("Error Response Contracts", () => {
    const token = generateToken("user-001", "business_admin", "org-001");

    it("422 Bad Request returns error with message and code", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: "invalid",
          password: "short"
        });

      expect(res.status).toBe(422);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toHaveProperty("code");
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("401 Unauthorized returns error consistent format", async () => {
      const res = await request(app)
        .get("/api/bookings")
        .set("Authorization", "Bearer invalid");

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("404 Not Found returns error with message", async () => {
      nextServiceByIdResponse = [];

      const res = await request(app)
        .get("/api/services/nonexistent")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error.code).toBe("SERVICE_NOT_FOUND");
    });

    it("500 Server Error returns error with message", async () => {
      serviceError = new Error("DB error");

      const res = await request(app)
        .get("/api/services")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error.code).toBe("INTERNAL_SERVER_ERROR");
      expect(res.body.error.message).toBe("DB error");
    });
  });

  describe("Pagination Contract", () => {
    const token = generateToken("user-001", "business_admin", "org-001");

    it("List endpoints return pagination metadata", async () => {
      const services: Record<string, unknown>[] = [];
      nextServicesListResponse = services;

      const res = await request(app)
        .get("/api/services?page=1&limit=10")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toMatchObject({
        page: 1,
        limit: 10,
        total: 0,
        total_pages: 1,
      });
    });

    it("Page parameter are validated", async () => {
      const res = await request(app)
        .get("/api/services?page=1&limit=10")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });
});
