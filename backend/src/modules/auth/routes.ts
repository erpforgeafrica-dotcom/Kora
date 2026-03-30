import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { respondSuccess } from "../../shared/response.js";
import { z } from "zod";
import { revokeSessionByToken } from "../../services/auth/sessionService.js";
import { registerUser, loginUser, getUserById } from "./service.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const mapUserRow = (row: any) => ({
  id: row.id,
  email: row.email,
  role: row.role,
  organizationId: row.organizationId,
});

router.post("/register", validateBody(registerSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await registerUser(email, password);

    respondSuccess(res, {
      accessToken: token,
      user: mapUserRow(user),
    }, 201);
  } catch (err) {
    next(err);
  }
});

router.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await loginUser(email, password, req.ip, req.header("user-agent") ?? undefined);

    respondSuccess(res, {
      accessToken: token,
      user: mapUserRow(user),
    }, 200);
  } catch (err) {
    next(err);
  }
});

router.post("/logout", requireAuth, async (req, res, next) => {
  try {
    const auth = res.locals.auth;
    if (auth?.tokenJti) {
      await revokeSessionByToken(auth.tokenJti, "user_logout");
    }

    respondSuccess(res, { revoked: true }, 200);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * CANONICAL SOURCE OF TRUTH for user identity and permissions.
 * Frontend MUST rely ONLY on this endpoint for user state.
 */
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const userId = res.locals.auth.userId;
    const user = await getUserById(userId);

    respondSuccess(res, {
      user: mapUserRow(user),
    }, 200);
  } catch (err) {
    next(err);
  }
});

export { router as authRoutes };
