/**
 * backend/src/modules/auth/threatIntegration.ts
 * 
 * Integration points between auth module and threat detection
 * Captures login events, failures, and suspicious activity
 */

import {
  captureLoginFailure,
  captureLoginSuccess,
  capturePrivilegeEscalation
} from "../../middleware/threatEventCapture.js";
import { logger } from "../../shared/logger.js";

/**
 * Called when login attempt fails
 */
export async function onLoginFailure(
  email: string,
  organizationId: string | null,
  ipAddress: string,
  userAgent: string,
  reason: string
): Promise<void> {
  try {
    await captureLoginFailure(email, organizationId || "SYSTEM", ipAddress, userAgent, reason);
  } catch (err) {
    logger.error("Failed to capture login failure", err);
  }
}

/**
 * Called when login succeeds
 */
export async function onLoginSuccess(
  userId: string,
  organizationId: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  try {
    await captureLoginSuccess(userId, organizationId, ipAddress, userAgent);
  } catch (err) {
    logger.error("Failed to capture login success", err);
  }
}

/**
 * Called when user attempts privileged action
 */
export async function onPrivilegeEscalationAttempt(
  userId: string,
  organizationId: string,
  userRole: string,
  attemptedAction: string,
  ipAddress: string
): Promise<void> {
  try {
    await capturePrivilegeEscalation(userId, organizationId, userRole, attemptedAction, ipAddress);
  } catch (err) {
    logger.error("Failed to capture privilege escalation", err);
  }
}
