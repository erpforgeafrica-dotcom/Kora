# KORA Authentication Consolidation Strategy

**Status**: Approved for implementation  
**Complexity**: HIGH  
**Timeline**: 2-week rollout  

---

## EXECUTIVE SUMMARY

Current state: Auth split between **Clerk** (primary), **JWT localStorage** (fallback), and **local session handling** (CSRF/session tracking). This creates:
- XSS vulnerabilities (JWT in localStorage)
- Session desynchronization (Clerk vs. custom JWTs)
- Bypass risks (test/local fallbacks)
- Brittle CSRF (client-side session ID tracking)

**Target State**: Single, cookie-based session model with httpOnly cookies, clear lifecycle management, and no client-side token exposure.

---

## Architecture Baseline: BEFORE & AFTER

### BEFORE (Current - Mixed Model)

```
┌─────────────┐
│   Clerk     │ ← org membership, roles, user identity
└──────┬──────┘
       │ Token issued
       ↓
┌──────────────────────────────────────────────────────┐
│ Frontend (React/Zustand)                             │
│ ─────────────────────────────────────────────────────│
│ localStorage.kora_token (JWT)          [XSS risk]    │
│ localStorage.kora_org_id                [XSS risk]   │
│ localStorage.kora_csrf_session_id       [XSS risk]   │
│ localStorage.kora_csrf_token            [XSS risk]   │
│                                                       │
│ → Authorization: Bearer <JWT from localStorage>      │
│ → CSRF: X-CSRF-Token + X-Session-Id (from localStorage)
└──────┬──────────────────────────────────────────────┘
       │ HTTP requests
       ↓
┌─────────────────────────────────────────────────────┐
│ Backend (Express)                                   │
│ ──────────────────────────────────────────────────  │
│ Verify Bearer token (Clerk or Local JWT)            │
│ Extract org_id from JWT payload                     │
│ Validate CSRF (Redis-backed, but session ID unreliable)
│ res.locals.auth = { userId, orgId, role, ... }     │
└─────────────────────────────────────────────────────┘
```

**Issues**:
- Tokens readable by XSS injection
- Session state fragmented (Clerk ≠ custom JWT)
- CSRF session IDs not cryptographically bound
- Logout doesn't invalidate client-side tokens
- Test/dev headers can bypass auth

---

### AFTER (Target - Cookie-based Session)

```
┌─────────────┐
│   Clerk     │ ← org membership, roles, user identity
└──────┬──────┘
       │ POST /api/auth/callback (exchange Clerk token for session)
       ↓
┌──────────────────────────────────────────────────────┐
│ Backend (Express)                                    │
│ ──────────────────────────────────────────────────── │
│ Verify Clerk JWT → Create server session             │
│ Set httpOnly cookies:                                │
│   - session_id (opaque, server-generated)            │
│   - session_sig (HMAC-SHA256 of session_id)          │
│ Store session in Redis:                              │
│   sessions:<session_id> → {userId, orgId, role, ...} │
│                                                      │
│ Response: Set-Cookie headers                         │
└──────┬──────────────────────────────────────────────┘
       │ Set-Cookie (httpOnly, Secure, SameSite=Strict)
       ↓
┌──────────────────────────────────────────────────────┐
│ Frontend (React/Zustand)                             │
│ ──────────────────────────────────────────────────── │
│ Browser automatically includes cookies in requests   │
│ No token storage in JavaScript                       │
│ CSRF: Server-generated token in session              │
│                                                      │
│ → Requests include session_id + session_sig cookies │
│ → X-CSRF-Token header (from /csrf endpoint)          │
└──────┬──────────────────────────────────────────────┘
       │ HTTP requests (cookies auto-sent)
       ↓
┌──────────────────────────────────────────────────────┐
│ Backend (Express)                                    │
│ ──────────────────────────────────────────────────── │
│ Extract session_id from cookies                      │
│ Verify session_sig (HMAC-SHA256)                     │
│ Load session from Redis                              │
│ res.locals.auth = { userId, orgId, role, ... }       │
│                                                      │
│ CSRF: Validate token against session.csrfToken       │
└─────────────────────────────────────────────────────┘
```

**Benefits**:
- Tokens never in JavaScript (XSS-safe)
- Single session source of truth (Redis)
- Cryptographically bound session ID
- Logout invalidates session immediately
- Proper cookie security (httpOnly, Secure, SameSite)
- Horizontal scaling friendly (Redis-backed)

---

## Implementation Plan

### Phase 1: Backend Session Foundation (Days 1-3)

**1.1** Create session store (`backend/src/services/sessionService.ts`):
- Generate cryptographically secure session IDs
- Store/retrieve sessions in Redis (TTL: 24h)
- HMAC session signature for tamper-proofing
- Session invalidation (logout)

**1.2** Create session middleware (`backend/src/middleware/session.ts`):
- Load session from cookies (session_id + session_sig)
- Verify HMAC signature
- Attach to `res.locals.auth`
- Handle expired sessions (redirect to login)

**1.3** Create CSRF refresh endpoint (`GET /api/csrf`):
- Generate new CSRF token per session
- Store in Redis under `sessions:<session_id>:csrf`
- Return token in response body (or header)

**1.4** Update auth endpoints:
- `POST /api/auth/callback`: Exchange Clerk JWT for session
  - Verify Clerk token
  - Create server session
  - Set httpOnly cookies
  - Return CSRF token
- `POST /api/auth/logout`: Invalidate session from Redis
  - Clear cookies
  - Delete session record

### Phase 2: Frontend Migration (Days 4-6)

**2.1** Create session hook (`frontend/src/hooks/useSessionAuth.ts`):
- Fetch CSRF token on mount from `/api/csrf`
- Store CSRF token in memory (or Zustand)
- Never store session ID or token in localStorage

**2.2** Update API client (`frontend/src/services/api.ts`):
- Remove Bearer token logic
- Add X-CSRF-Token header interceptor
- Rely on browser cookie auto-sending

**2.3** Update auth flow:
- Login: POST /api/auth/callback (exchange Clerk token)
- Browser receives Set-Cookie headers
- Subsequent requests use cookies automatically

**2.4** Update logout:
- POST /api/auth/logout
- Clear Redux/Zustand auth state
- Redirect to login

### Phase 3: Security Hardening (Days 7-10)

**3.1** Cookie security:
- `httpOnly`: True (no JavaScript access)
- `Secure`: True (HTTPS only)
- `SameSite`: Strict (prevent CSRF)
- `Path`: / (global)
- `Max-Age`: 86400 (24 hours)

**3.2** Remove test/dev auth bypasses:
- Delete NODE_ENV=test auth bypass in `middleware/auth.ts`
- Use proper test fixtures instead

**3.3** CSRF hardening:
- Rotate CSRF token on each successful request
- Validate referer/origin headers
- Rate limit token generation

**3.4** Audit trails:
- Log session creation (user, IP, org)
- Log session invalidation
- Log CSRF token mismatches

### Phase 4: Testing & Rollout (Days 11-14)

**4.1** End-to-end auth tests:
- Session creation → logout
- CSRF token lifecycle
- Cross-org isolation
- Session expiry

**4.2** Integration with existing modules:
- Test each dashboard's auth flow
- Verify role-based access still works
- Check multi-org routing

**4.3** Gradual rollout:
- Feature flag: `USE_COOKIE_SESSIONS` (default: false)
- Parallel run both models for 1 week
- Flip flag to true
- Monitor for regressions

---

## Key Design Decisions

### Session ID Generation
```typescript
// Cryptographically secure, base64url encoded
sessionId = base64url(crypto.randomBytes(32))
// Example: aB3_dXkZ9mL-pQ2rFgH1j_K4vW5xS6nY7t8uC9oL0p
```

### HMAC Session Signature
```typescript
sessionSig = hmacSha256(sessionId, SESSION_SECRET)
// Prevents forged/tampered session IDs
```

### Session Storage (Redis)
```
Key: sessions:<sessionId>
Value: {
  userId: "clerk_user_123",
  organizationId: "org_456",
  userRole: "business_admin",
  csrfToken: "xyz789...",
  createdAt: 1714608000,
  expiresAt: 1714694400,
  ipAddress: "203.0.113.45",
  userAgent: "Mozilla/5.0..."
}
TTL: 86400 (24 hours)
```

### Cookie Configuration
```
Set-Cookie: session_id=aB3_dXkZ9mL-pQ2rFgH1j_K4vW5xS6nY7t8uC9oL0p; 
            HttpOnly; 
            Secure; 
            SameSite=Strict; 
            Path=/; 
            Max-Age=86400

Set-Cookie: session_sig=hmac_signature_here; 
            HttpOnly; 
            Secure; 
            SameSite=Strict; 
            Path=/; 
            Max-Age=86400
```

---

## Backwards Compatibility

During migration period, accept both auth models:

1. **Old Model** (2 weeks): Bearer token from localStorage
2. **New Model** (2 weeks): Session cookies
3. **New Model Only** (production): Remove Bearer token support

```typescript
// middleware/auth.ts (transitional)
async function verifyAuth(req, res) {
  // Try session first (new model)
  if (req.cookies.session_id) {
    const session = await loadSession(req.cookies.session_id);
    if (session) return authenticateFromSession(req, res, session);
  }

  // Fallback to Bearer token (old model - temporary)
  if (req.headers.authorization?.startsWith("Bearer ")) {
    const token = req.headers.authorization.slice(7);
    const payload = verifyJWT(token);
    if (payload) return authenticateFromJWT(req, res, payload);
  }

  // No auth found
  return res.status(401).json({ error: "Unauthorized" });
}
```

---

## Rollout Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| **Session loss on Redis crash** | Backup Redis; graceful degradation to login |
| **CSRF token theft** | Token scoped to session; server-side validation |
| **Cookie theft (network)** | Use HTTPS + Secure flag; HSTS headers |
| **Session fixation** | Regenerate session on privilege escalation |
| **User can't logout** | Ensure logout API is reachable; fallback JS logout |
| **Dev/test environments** | Use Redis mock in tests; no NODE_ENV bypass |

---

## Files Modified

### Backend
- `src/services/sessionService.ts` (NEW)
- `src/middleware/session.ts` (NEW)
- `src/middleware/auth.ts` (UPDATE: add transition logic)
- `src/middleware/csrf.ts` (UPDATE: session-scoped tokens)
- `src/modules/auth/routes.ts` (UPDATE: add /callback endpoint)
- `src/app.ts` (UPDATE: add session middleware)

### Frontend
- `src/hooks/useSessionAuth.ts` (NEW)
- `src/services/api.ts` (UPDATE: remove localStorage logic)
- `src/hooks/useAuth.ts` (UPDATE: remove token handling)
- `src/stores/authStore.ts` (UPDATE: remove localStorage tokens)

### Config
- `.env.example` (UPDATE: add SESSION_SECRET)
- `docker-compose.yml` (UPDATE: ensure Redis)

---

## Success Criteria

- [ ] All requests include session cookies (no Bearer tokens)
- [ ] CSRF tokens generated server-side, never in localStorage
- [ ] XSS injection cannot read session ID or token
- [ ] Logout invalidates session within 100ms
- [ ] Sessions survive server restarts (Redis-backed)
- [ ] Horizontal scaling works (no in-memory session state)
- [ ] All E2E tests pass (real middleware, not mocks)
- [ ] Production rollout completes with 0 auth-related escalations
- [ ] Performance: auth validation <10ms per request

---

## Post-Launch Maintenance

1. **Weekly**: Monitor Redis session store size (TTL cleanup)
2. **Monthly**: Rotate SESSION_SECRET (with rolling migration)
3. **Quarterly**: Review session logs for anomalies
4. **On-demand**: Implement session revocation lists for emergencies

