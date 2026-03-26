import { Router } from "express";
import { createTenantBranch, listTenantBranchesForOrganization } from "../../db/repositories/tenantBranchRepository.js";
import { withTenantAlias } from "../../shared/blueprintAliases.js";
import { getRequiredOrganizationId } from "../../shared/http.js";
import { respondSuccess, respondError } from "../../shared/response.js";

export const tenantRoutes = Router();

tenantRoutes.get("/branches", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const branches = await listTenantBranchesForOrganization(organizationId);
    return respondSuccess(res,
      withTenantAlias(
        {
          count: branches.length,
          branches: branches.map((branch) => ({
            ...branch,
            tenant_id: branch.organization_id
          }))
        },
        organizationId
      )
    );
  } catch (error) {
    return next(error);
  }
});

tenantRoutes.post("/branches", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const name = String(req.body?.name ?? "").trim();
    if (!name) {
      return respondError(res, "MISSING_BRANCH_NAME", "Missing branch name", 400);
    }

    const branch = await createTenantBranch({
      organizationId,
      name,
      address: req.body?.address ? String(req.body.address) : null,
      city: req.body?.city ? String(req.body.city) : null,
      country: req.body?.country ? String(req.body.country) : null,
      latitude: typeof req.body?.latitude === "number" ? req.body.latitude : null,
      longitude: typeof req.body?.longitude === "number" ? req.body.longitude : null,
      phone: req.body?.phone ? String(req.body.phone) : null
    });

    return res.status(201).json(withTenantAlias(branch ?? {}, organizationId));
  } catch (error) {
    return next(error);
  }
});

