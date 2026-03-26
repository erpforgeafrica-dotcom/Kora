import { Router } from "express";
import { z } from "zod";
import { staffRepository } from "../../db/repositories/staffRepository.js";
import { availabilityRepository } from "../../db/repositories/availabilityRepository.js";
import { queryDb } from "../../db/client.js";
import { getRequiredOrganizationId } from "../../shared/http.js";
import { requireRole } from "../../middleware/rbac.js";
import { logger } from "../../shared/logger.js";
import { embeddingService } from "../../services/ai/embeddingService.js";
import { respondSuccess, respondError } from "../../shared/response.js";

export const staffRoutes = Router();

const createStaffSchema = z.object({
  user_id: z.string().uuid().optional(),
  full_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(["receptionist", "practitioner", "manager", "admin"]),
  specializations: z.array(z.string()).default([]),
  qualifications: z.array(z.string()).default([]),
  bio: z.string().optional(),
  profile_photo_url: z.string().url().optional(),
  hourly_rate: z.number().positive().optional(),
  commission_percentage: z.number().min(0).max(100).optional()
});

const updateStaffSchema = createStaffSchema.partial();

const staffSkillSchema = z.object({
  skill_name: z.string().min(1),
  proficiency_level: z.enum(["beginner", "intermediate", "advanced", "expert"]),
  certified_at: z.string().datetime().optional(),
  expires_at: z.string().datetime().optional()
});

const serviceAssignmentSchema = z.object({
  service_id: z.string().uuid(),
  is_available: z.boolean().default(true),
  can_perform_independently: z.boolean().default(false),
  requires_supervision: z.boolean().default(false),
  min_experience_hours: z.number().int().min(0).default(0)
});

const availabilityRuleSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string(),
  end_time: z.string(),
  break_start: z.string().optional(),
  break_end: z.string().optional(),
  max_appointments_per_day: z.number().int().min(1).default(10),
  is_active: z.boolean().default(true)
});

const availabilityExceptionSchema = z.object({
  exception_type: z.enum(["blockout", "holiday", "training", "day_off", "special_hours"]),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  requires_approval: z.boolean().default(false)
});

// ── CRUD ──────────────────────────────────────────────────────────────────────

staffRoutes.get("/", requireRole("business_admin", "platform_admin", "staff"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    let staff = await staffRepository.listByBusiness(organizationId);
    const status = req.query.status as string | undefined;
    const role = req.query.role as string | undefined;
    if (status && ["active", "inactive", "on_leave", "archived"].includes(status)) {
      staff = staff.filter(s => s.status === status);
    }
    if (role && ["receptionist", "practitioner", "manager", "admin"].includes(role)) {
      staff = staff.filter(s => s.role === role);
    }
    logger.info("Listed staff members", { organizationId, count: staff.length });
    return respondSuccess(res, staff);
  } catch (error) { return next(error); }
});

staffRoutes.post("/", requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const validated = createStaffSchema.parse(req.body);
    const staff = await staffRepository.create({ ...validated, organization_id: organizationId, status: "active", is_active: true });
    embeddingService.generateAndStoreEmbedding(
      "staff", staff.id,
      `${staff.full_name} ${staff.role} ${(staff.specializations || []).join(" ")} ${staff.bio || ""}`,
      { organizationId: staff.organization_id, role: staff.role }
    );
    logger.info("Created staff member", { organizationId, staffId: staff.id });
    return respondSuccess(res, staff, 201);
  } catch (error) { return next(error); }
});

staffRoutes.get("/:id", requireRole("business_admin", "platform_admin", "staff"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const staff = await staffRepository.getById(req.params.id);
    if (!staff) return respondError(res, "STAFF_MEMBER_NOT_FOUND", "Staff member not found", 404);
    if (staff.organization_id !== organizationId) return respondError(res, "FORBIDDEN", "Access denied", 403);
    const skills = await staffRepository.listSkills(req.params.id);
    const services = await staffRepository.listServices(req.params.id);
    return respondSuccess(res, { ...staff, skills, services });
  } catch (error) { return next(error); }
});

staffRoutes.patch("/:id", requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const validated = updateStaffSchema.parse(req.body);
    const staff = await staffRepository.getById(req.params.id);
    if (!staff || staff.organization_id !== organizationId) return respondError(res, "STAFF_MEMBER_NOT_FOUND", "Staff member not found", 404);
    const updated = await staffRepository.update(req.params.id, { ...validated, organization_id: organizationId });
    if (!updated) return respondError(res, "STAFF_MEMBER_NOT_FOUND", "Staff member not found", 404);
    embeddingService.generateAndStoreEmbedding(
      "staff", updated.id,
      `${updated.full_name} ${updated.role} ${(updated.specializations || []).join(" ")} ${updated.bio || ""}`,
      { organizationId: updated.organization_id, role: updated.role }
    );
    logger.info("Updated staff member", { organizationId, staffId: req.params.id });
    return respondSuccess(res, updated);
  } catch (error) { return next(error); }
});

staffRoutes.delete("/:id", requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const staff = await staffRepository.getById(req.params.id);
    if (!staff || staff.organization_id !== organizationId) return respondError(res, "STAFF_MEMBER_NOT_FOUND", "Staff member not found", 404);
    const archived = await staffRepository.update(req.params.id, { status: "archived" });
    if (!archived) return respondError(res, "STAFF_MEMBER_NOT_FOUND", "Staff member not found", 404);
    logger.info("Archived staff member", { organizationId, staffId: req.params.id });
    return respondSuccess(res, { id: req.params.id, status: "archived" });
  } catch (error) { return next(error); }
});

// ── Skills ────────────────────────────────────────────────────────────────────

staffRoutes.post("/:id/skills", requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const validated = staffSkillSchema.parse(req.body);
    const staff = await staffRepository.getById(req.params.id);
    if (!staff || staff.organization_id !== organizationId) return respondError(res, "STAFF_MEMBER_NOT_FOUND", "Staff member not found", 404);
    const skill = await staffRepository.addSkill(req.params.id, validated.skill_name, validated.proficiency_level);
    logger.info("Added skill to staff member", { staffId: req.params.id, skillName: validated.skill_name });
    return respondSuccess(res, skill, 201);
  } catch (error) { return next(error); }
});

staffRoutes.get("/:id/skills", requireRole("business_admin", "platform_admin", "staff"), async (req, res, next) => {
  try {
    const skills = await staffRepository.listSkills(req.params.id);
    return respondSuccess(res, skills);
  } catch (error) { return next(error); }
});

// ── Service Assignments ───────────────────────────────────────────────────────

staffRoutes.post("/:id/services", requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const validated = serviceAssignmentSchema.parse(req.body);
    const staff = await staffRepository.getById(req.params.id);
    if (!staff || staff.organization_id !== organizationId) return respondError(res, "STAFF_MEMBER_NOT_FOUND", "Staff member not found", 404);
    const assignment = await staffRepository.assignService(req.params.id, validated.service_id, {
      canPerformIndependently: validated.can_perform_independently,
      requiresSupervision: validated.requires_supervision,
      minExperienceHours: validated.min_experience_hours
    });
    logger.info("Assigned service to staff", { staffId: req.params.id, serviceId: validated.service_id });
    return respondSuccess(res, assignment, 201);
  } catch (error) { return next(error); }
});

staffRoutes.get("/:id/services", requireRole("business_admin", "platform_admin", "staff"), async (req, res, next) => {
  try {
    const services = await staffRepository.listServices(req.params.id);
    return respondSuccess(res, services);
  } catch (error) { return next(error); }
});

staffRoutes.delete("/:id/services/:serviceId", requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    await queryDb(
      `DELETE FROM staff_service_assignments WHERE staff_member_id = $1 AND service_id = $2`,
      [req.params.id, req.params.serviceId]
    );
    logger.info("Removed service assignment", { staffId: req.params.id, serviceId: req.params.serviceId });
    return respondSuccess(res, { id: req.params.serviceId, removed: true });
  } catch (error) { return next(error); }
});

// ── Availability Rules ────────────────────────────────────────────────────────

staffRoutes.put("/:id/availability/rules", requireRole("business_admin", "platform_admin", "staff"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const validated = availabilityRuleSchema.parse(req.body);
    const staff = await staffRepository.getById(req.params.id);
    if (!staff || staff.organization_id !== organizationId) return respondError(res, "STAFF_MEMBER_NOT_FOUND", "Staff member not found", 404);
    const rule = await availabilityRepository.upsertRule(
      req.params.id, validated.day_of_week, validated.start_time, validated.end_time,
      { breakStart: validated.break_start, breakEnd: validated.break_end, maxAppointmentsPerDay: validated.max_appointments_per_day, isActive: validated.is_active }
    );
    logger.info("Upserted availability rule", { staffId: req.params.id, dayOfWeek: validated.day_of_week });
    return respondSuccess(res, rule);
  } catch (error) { return next(error); }
});

staffRoutes.get("/:id/availability/rules", requireRole("business_admin", "platform_admin", "staff"), async (req, res, next) => {
  try {
    const rules = await availabilityRepository.listRulesByStaff(req.params.id);
    return respondSuccess(res, rules);
  } catch (error) { return next(error); }
});

// ── Availability Exceptions ───────────────────────────────────────────────────

staffRoutes.post("/:id/availability/exceptions", requireRole("business_admin", "platform_admin", "staff"), async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const validated = availabilityExceptionSchema.parse(req.body);
    const staff = await staffRepository.getById(req.params.id);
    if (!staff || staff.organization_id !== organizationId) return respondError(res, "STAFF_MEMBER_NOT_FOUND", "Staff member not found", 404);
    const exception = await availabilityRepository.createException(
      req.params.id, validated.exception_type, validated.start_time, validated.end_time,
      { reason: validated.reason, notes: validated.notes, requiresApproval: validated.requires_approval }
    );
    logger.info("Created availability exception", { staffId: req.params.id, exceptionType: validated.exception_type });
    return respondSuccess(res, exception, 201);
  } catch (error) { return next(error); }
});

staffRoutes.get("/:id/availability/exceptions", requireRole("business_admin", "platform_admin", "staff"), async (req, res, next) => {
  try {
    const exceptions = await availabilityRepository.listExceptionsByStaff(req.params.id);
    return respondSuccess(res, exceptions);
  } catch (error) { return next(error); }
});

// ── Availability Queries ──────────────────────────────────────────────────────

staffRoutes.get("/:id/available-slots", requireRole("business_admin", "platform_admin", "staff"), async (req, res, next) => {
  try {
    const date = req.query.date as string | undefined;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return respondError(res, "INVALID_DATE_FORMAT", "Date must be YYYY-MM-DD", 400);
    const slots = await availabilityRepository.listAvailableSlots(req.params.id, `${date}T00:00:00Z`, `${date}T23:59:59Z`, true);
    return respondSuccess(res, { data: slots, date });
  } catch (error) { return next(error); }
});

staffRoutes.get("/:id/day-schedule", requireRole("business_admin", "platform_admin", "staff"), async (req, res, next) => {
  try {
    const date = req.query.date as string | undefined;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return respondError(res, "INVALID_DATE_FORMAT", "Date must be YYYY-MM-DD", 400);
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();
    const rules = await availabilityRepository.listRulesByStaff(req.params.id);
    const rule = rules.find(r => r.day_of_week === dayOfWeek && r.is_active);
    const startOfDay = new Date(targetDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate); endOfDay.setHours(23, 59, 59, 999);
    const allExceptions = await availabilityRepository.listExceptionsByStaff(req.params.id);
    const dayExceptions = allExceptions.filter(ex => new Date(ex.start_time) <= endOfDay && new Date(ex.end_time) >= startOfDay);
    const bookings = await queryDb(
      `SELECT bsa.*, b.start_time, b.end_time, b.status
       FROM booking_staff_assignments bsa
       JOIN bookings b ON b.id = bsa.booking_id
       WHERE bsa.staff_member_id = $1 AND DATE(b.start_time) = $2
       ORDER BY b.start_time ASC`,
      [req.params.id, date]
    );
    return respondSuccess(res, {
      date, day_of_week: dayOfWeek, recurring_rule: rule || null,
      exceptions: dayExceptions, bookings,
      is_available: !!(rule && rule.is_active) && dayExceptions.length === 0
    });
  } catch (error) { return next(error); }
});

staffRoutes.get("/:id/conflicts", requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const resolved = req.query.resolved !== "false";
    const conflicts = await queryDb(
      `SELECT * FROM availability_conflicts WHERE staff_member_id = $1 AND (resolved_at IS ${resolved ? "NOT" : ""} NULL) ORDER BY detected_at DESC`,
      [req.params.id]
    );
    return respondSuccess(res, { data: conflicts, showResolved: resolved });
  } catch (error) { return next(error); }
});

staffRoutes.post("/:id/check-availability", requireRole("business_admin", "platform_admin"), async (req, res, next) => {
  try {
    const { start_time, end_time } = req.body as { start_time: string; end_time: string };
    if (!start_time || !end_time) return respondError(res, "MISSING_TIME_WINDOW", "start_time and end_time are required", 400);
    const conflicts = await availabilityRepository.checkConflicts(req.params.id, start_time, end_time);
    return respondSuccess(res, { is_available: conflicts.length === 0, conflictCount: conflicts.length, conflicts });
  } catch (error) { return next(error); }
});
