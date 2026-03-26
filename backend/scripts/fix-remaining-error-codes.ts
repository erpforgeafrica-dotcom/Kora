#!/usr/bin/env node
/**
 * Bulk fix remaining raw JSON error codes across modules
 * Converts all remaining raw res.status().json({ error: { code: ... } }) patterns
 * to use respondError() with UPPER_SNAKE_CASE codes
 * 
 * This is a documentation of remaining fixes needed:
 */

export const REMAINING_FIXES = {
  "reporting/routes.ts": [
    {
      line: 32,
      pattern: 'res.status(400).json({ error: { code: "MISSING_ORGANIZATION_ID"',
      replacement: 'respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);'
    },
    {
      line: 49,
      pattern: 'res.status(400).json({ error: { code: "MISSING_ORGANIZATION_ID"',
      replacement: 'respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);'
    },
    {
      line: 73,
      pattern: 'res.status(400).json({ error: { code: "MISSING_ORGANIZATION_ID"',
      replacement: 'respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);'
    },
    {
      line: 78,
      pattern: 'VALIDATION_ERROR',
      replacement: 'Use respondError: respondError(res, "VALIDATION_ERROR", "type and name are required", 422);'
    },
    {
      line: 81,
      pattern: 'INVALID_CRON',
      replacement: 'Use respondError: respondError(res, "INVALID_CRON", "invalid cron schedule", 422);'
    },
    {
      line: 114,
      pattern: 'EXECUTION_NOT_FOUND',
      replacement: 'Use respondError: respondError(res, "EXECUTION_NOT_FOUND", "execution not found", 404);'
    }
  ],
  
  "chatbot/routes.ts": [
    { line: 37, code: "respondError(res, \"MISSING_ORGANIZATION_ID\", ...)" },
    { line: 76, code: "respondError(res, \"MISSING_ORGANIZATION_ID\", ...)" },
    { line: 84, code: "respondError(res, \"CONTENT_REQUIRED_STRING\", ...)" },
    { line: 89, code: "respondError(res, \"SESSION_NOT_FOUND\", ...)" },
    { line: 93, code: "respondError(res, \"UNAUTHORIZED\", ...)" },
    { line: 173, code: "respondError(res, \"MISSING_ORGANIZATION_ID\", ...)" },
    { line: 180, code: "respondError(res, \"SESSION_NOT_FOUND\", ...)" },
    { line: 184, code: "respondError(res, \"UNAUTHORIZED\", ...)" },
    { line: 209, code: "respondError(res, \"MISSING_ORGANIZATION_ID\", ...)" },
    { line: 216, code: "respondError(res, \"SESSION_NOT_FOUND\", ...)" },
    { line: 220, code: "respondError(res, \"UNAUTHORIZED\", ...)" }
  ],
  
  "billing/billingRoutes.ts": [
    { line: 17, code: "respondError(res, \"MISSING_ORGANIZATION_ID\", ...)" },
    { line: 44, code: "respondError(res, \"MISSING_ORGANIZATION_ID\", ...)" },
    { line: 47, code: "respondError(res, \"MISSING_REFERENCE\", ...)" },
    { line: 61, code: "respondError(res, \"MISSING_ORGANIZATION_ID\", ...)" },
    { line: 93, code: "respondError(res, \"MISSING_ORGANIZATION_ID\", ...)" }
  ],
  
  "social/oauthRoutes.ts": [
    { line: 18, code: "respondError(res, \"INVALID_PLATFORM\", ...)" },
    { line: 47, code: "respondError(res, \"MISSING_CODE_OR_STATE\", ...)" }
  ],
  
  "social/routes.ts": [
    { line: 84, code: "respondError(res, \"MISSING_REQUIRED_FIELDS\", ...)" },
    { line: 120, code: "respondError(res, \"MISSING_REQUIRED_FIELDS\", ...)" },
    { line: 157, code: "respondError(res, \"INSTAGRAM_ACCOUNT_NOT_CONNECTED\", ...)" },
    { line: 179, code: "respondError(res, \"FACEBOOK_PAGE_NOT_CONNECTED\", ...)" },
    { line: 201, code: "respondError(res, \"MISSING_REQUIRED_FIELDS\", ...)" },
    { line: 206, code: "respondError(res, \"INSTAGRAM_ACCOUNT_NOT_CONNECTED\", ...)" },
    { line: 243, code: "respondError(res, \"MISSING_REQUIRED_FIELDS\", ...)" },
    { line: 248, code: "respondError(res, \"FACEBOOK_PAGE_NOT_CONNECTED\", ...)" },
    { line: 299, code: "respondError(res, \"INVALID_PLATFORM\", ...)" },
    { line: 319, code: "respondError(res, \"MISSING_CONTENT_OR_PLATFORMS\", ...)" }
  ]
};

/*
GOVERNANCE NOTES:
- All error codes must be UPPER_SNAKE_CASE (CONTRACT LOCKED)
- All responses must use respondError() helper (not raw res.status().json())
- Message format: sentence case, no trailing period
- HTTP status codes: 400 (validation), 401 (auth), 403 (forbidden), 404 (not found), 422 (validation)

COMPLETION CHECKLIST:
[ ] Reporting routes - 6 errors to fix
[ ] Chatbot routes - 11 errors to fix
[ ] Billing routes - 5 errors to fix
[ ] Social oauth routes - 2 errors to fix
[ ] Social routes - 10 errors to fix
[ ] Categories routes - 1 error to fix
[ ] CRM routes - 3 errors to fix
[ ] Automation routes - 1 error to fix
Total remaining: ~39 raw JSON error codes across modules
*/
