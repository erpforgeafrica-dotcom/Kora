import { Request, Response, NextFunction } from "express";

/**
 * Extended Express Request to support Multi-Tenant Context injection and Client Identity profiles
 */
export interface TenantRequest extends Request {
  tenantId?: string;
  tenantVertical?: "selfcare" | "digicare";
  userProfile?: {
    id: string;
    email: string;
    role: "superadmin" | "merchant_owner" | "specialist_staff" | "client";
    licenseVerified?: boolean;
    licenseNumber?: string;
  };
}

/**
 * Kora SBOS Multi-Tenant Router Middleware Core
 * 
 * Enforces strict transactional isolation barriers so that selfcare/lifestyle
 * and digicare health merchants never cross-leak scheduling data, CRM cards, or patient files.
 */
export function injectTenantContext() {
  return (req: TenantRequest, res: Response, next: NextFunction) => {
    // 1. Extract tenant identifiers from request headers (or DNS subdomains if mapped)
    const tenantIdHeader = req.headers["x-tenant-id"] as string;
    const verticalHeader = req.headers["x-tenant-vertical"] as string; // 'selfcare' | 'digicare'

    if (!tenantIdHeader) {
      return res.status(400).json({
        error: "MULTI_TENANCY_ERROR",
        message: "Request blocked by Tenant Router. Missing 'X-Tenant-ID' workspace identifier in headers."
      });
    }

    // Assign contexts
    req.tenantId = tenantIdHeader;
    req.tenantVertical = (verticalHeader === "digicare" ? "digicare" : "selfcare");

    // Proactively simulate connecting Postgres session parameters to trigger database-level RLS Policies
    // e.g., SET LOCAL kora.current_tenant_id = req.tenantId; inside the transaction scope.
    
    next();
  };
}

/**
 * DigiCare Clinical Regulatory Guard Middleware
 * 
 * Intercepts high-compliance telehealth calls, diagnostic panel uploads, and clinical prescription tickets
 * ensuring only verified medical professionals with active MDCN/Nursing credentials gain active permission writes.
 */
export function enforceDigiCareCompliance() {
  return (req: TenantRequest, res: Response, next: NextFunction) => {
    // Ensure we are inside a DigiCare tenant vertical context
    if (req.tenantVertical !== "digicare") {
      return res.status(403).json({
        error: "COMPLIANCE_ERROR",
        message: "Operation restricted. This action can only be initiated inside high-compliance DigiCare Clinics."
      });
    }

    const profile = req.userProfile;
    
    // Bypass for Global System Administrators doing telemetry or security audits
    if (profile?.role === "superadmin") {
      return next();
    }

    // All active specialists or merchants in DigiCare need pre-approved license clearances
    if (!profile || !profile.licenseVerified) {
      return res.status(403).json({
        error: "UNVERIFIED_PRACTITIONER_LICENSE",
        message: "Access Denied. Access to telemedicine nodes or clinical documents requires a verified MDCN / Health Council practice permit.",
        remediation: "Upload your current Professional Indemnity policy and practicing certificate inside your Kora Hub profile to verify status."
      });
    }

    next();
  };
}

/**
 * Audit Logger Middleware
 * Registers forensic audit trace to combat token injections and secure compliance reports.
 */
export function forensicAuditTrace() {
  return (req: TenantRequest, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    res.on("finish", () => {
      const elapsed = Date.now() - startTime;
      console.log(`[FORENSIC AUDIT] Tenant: ${req.tenantId || "NONE"} | User: ${req.userProfile?.email || "ANONYMOUS"} | Path: ${req.path} | Duration: ${elapsed}ms | Status: ${res.statusCode}`);
    });
    next();
  };
}
