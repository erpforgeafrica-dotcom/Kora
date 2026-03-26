import { dbPool } from "../client.js";
import type { QueryResult } from "pg";

export interface StaffMember {
  id: string;
  organization_id: string;
  user_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  role: "receptionist" | "practitioner" | "manager" | "admin";
  specializations?: string[];
  qualifications?: string[];
  bio?: string;
  profile_photo_url?: string;
  hourly_rate?: number;
  commission_percentage?: number;
  status: "active" | "inactive" | "on_leave" | "archived";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffSkill {
  id: string;
  staff_member_id: string;
  skill_name: string;
  proficiency_level: "beginner" | "intermediate" | "advanced" | "expert";
  certified_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface StaffServiceAssignment {
  id: string;
  staff_member_id: string;
  service_id: string;
  is_available: boolean;
  can_perform_independently: boolean;
  requires_supervision: boolean;
  min_experience_hours: number;
  created_at: string;
}

class StaffRepository {
  /**
   * Get staff member by ID with all details
   */
  async getById(staffId: string): Promise<StaffMember | null> {
    const result = await dbPool.query<StaffMember>(
      `SELECT id, organization_id, user_id, full_name, email, phone, role, 
              specializations, qualifications, bio, profile_photo_url, 
              hourly_rate, commission_percentage, status, is_active, 
              created_at, updated_at
       FROM staff_members WHERE id = $1`,
      [staffId]
    );
    return result.rows[0] || null;
  }

  /**
   * List all staff for a business with optional filters
   */
  async listByBusiness(
    businessId: string,
    options?: {
      role?: string;
      status?: string;
      isAvailable?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<StaffMember[]> {
    let query = `
      SELECT id, organization_id, user_id, full_name, email, phone, role, 
             specializations, qualifications, bio, profile_photo_url, 
             hourly_rate, commission_percentage, status, is_active, 
             created_at, updated_at
      FROM staff_members WHERE organization_id = $1
    `;
    const params: unknown[] = [businessId];

    if (options?.role) {
      query += ` AND role = $${params.length + 1}`;
      params.push(options.role);
    }
    if (options?.status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(options.status);
    }

    query += ` ORDER BY full_name ASC`;
    const limit = Math.min(options?.limit ?? 100, 100);
    const offset = options?.offset ?? 0;
    query += ` LIMIT ${limit} OFFSET ${offset}`;

    const result = await dbPool.query<StaffMember>(query, params);
    return result.rows;
  }

  /**
   * List active staff members only
   */
  async listActive(businessId: string): Promise<StaffMember[]> {
    const result = await dbPool.query<StaffMember>(
      `SELECT id, organization_id, user_id, full_name, email, phone, role, 
              specializations, qualifications, bio, profile_photo_url, 
              hourly_rate, commission_percentage, status, is_active, 
              created_at, updated_at
       FROM staff_members 
       WHERE organization_id = $1 AND status = 'active'
       ORDER BY full_name ASC`,
      [businessId]
    );
    return result.rows;
  }

  /**
   * List staff by role
   */
  async listByRole(businessId: string, role: string): Promise<StaffMember[]> {
    const result = await dbPool.query<StaffMember>(
      `SELECT id, organization_id, user_id, full_name, email, phone, role, 
              specializations, qualifications, bio, profile_photo_url, 
              hourly_rate, commission_percentage, status, is_active, 
              created_at, updated_at
       FROM staff_members 
       WHERE organization_id = $1 AND role = $2 AND status = 'active'
       ORDER BY full_name ASC`,
      [businessId, role]
    );
    return result.rows;
  }

  /**
   * Create new staff member
   */
  async create(staffData: Omit<StaffMember, "id" | "created_at" | "updated_at">): Promise<StaffMember> {
    const result = await dbPool.query<StaffMember>(
      `INSERT INTO staff_members 
       (organization_id, user_id, full_name, email, phone, role, specializations, 
        qualifications, bio, profile_photo_url, hourly_rate, commission_percentage, status, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING id, organization_id, user_id, full_name, email, phone, role, 
                 specializations, qualifications, bio, profile_photo_url, 
                 hourly_rate, commission_percentage, status, is_active, 
                 created_at, updated_at`,
      [
        staffData.organization_id,
        staffData.user_id || null,
        staffData.full_name,
        staffData.email,
        staffData.phone || null,
        staffData.role,
        staffData.specializations || [],
        staffData.qualifications || [],
        staffData.bio || null,
        staffData.profile_photo_url || null,
        staffData.hourly_rate || null,
        staffData.commission_percentage || null,
        staffData.status || "active",
        true
      ]
    );
    return result.rows[0]!;
  }

  /**
   * Update staff member
   */
  async update(staffId: string, updates: Partial<StaffMember>): Promise<StaffMember | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.full_name) {
      fields.push(`full_name = $${paramCount++}`);
      values.push(updates.full_name);
    }
    if (updates.email) {
      fields.push(`email = $${paramCount++}`);
      values.push(updates.email);
    }
    if (updates.phone !== undefined) {
      fields.push(`phone = $${paramCount++}`);
      values.push(updates.phone);
    }
    if (updates.role) {
      fields.push(`role = $${paramCount++}`);
      values.push(updates.role);
    }
    if (updates.specializations) {
      fields.push(`specializations = $${paramCount++}`);
      values.push(updates.specializations);
    }
    if (updates.qualifications) {
      fields.push(`qualifications = $${paramCount++}`);
      values.push(updates.qualifications);
    }
    if (updates.bio !== undefined) {
      fields.push(`bio = $${paramCount++}`);
      values.push(updates.bio);
    }
    if (updates.profile_photo_url !== undefined) {
      fields.push(`profile_photo_url = $${paramCount++}`);
      values.push(updates.profile_photo_url);
    }
    if (updates.status) {
      fields.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }
    if (updates.is_active !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(updates.is_active);
    }

    if (fields.length === 0) return this.getById(staffId);

    fields.push(`updated_at = now()`);
    const query = `UPDATE staff_members SET ${fields.join(", ")} WHERE id = $${paramCount}
                   RETURNING id, organization_id, user_id, full_name, email, phone, role, 
                             specializations, qualifications, bio, profile_photo_url, 
                             hourly_rate, commission_percentage, status, is_active, 
                             created_at, updated_at`;
    values.push(staffId);

    const result = await dbPool.query<StaffMember>(query, values);
    return result.rows[0] || null;
  }

  /**
   * Soft delete: change status to archived
   */
  async archive(staffId: string): Promise<StaffMember | null> {
    const result = await dbPool.query<StaffMember>(
      `UPDATE staff_members SET status = 'archived', updated_at = now()
       WHERE id = $1
       RETURNING id, organization_id, user_id, full_name, email, phone, role, 
                 specializations, qualifications, bio, profile_photo_url, 
                 hourly_rate, commission_percentage, status, is_active, 
                 created_at, updated_at`,
      [staffId]
    );
    return result.rows[0] || null;
  }

  /**
   * Add skill to staff member
   */
  async addSkill(
    staffId: string,
    skillName: string,
    proficiencyLevel: "beginner" | "intermediate" | "advanced" | "expert"
  ): Promise<StaffSkill> {
    const result = await dbPool.query<StaffSkill>(
      `INSERT INTO staff_skills (staff_member_id, skill_name, proficiency_level)
       VALUES ($1, $2, $3)
       RETURNING id, staff_member_id, skill_name, proficiency_level, certified_at, expires_at, created_at`,
      [staffId, skillName, proficiencyLevel]
    );
    return result.rows[0]!;
  }

  /**
   * List skills for staff member
   */
  async listSkills(staffId: string): Promise<StaffSkill[]> {
    const result = await dbPool.query<StaffSkill>(
      `SELECT id, staff_member_id, skill_name, proficiency_level, certified_at, expires_at, created_at
       FROM staff_skills WHERE staff_member_id = $1
       ORDER BY proficiency_level DESC, skill_name ASC`,
      [staffId]
    );
    return result.rows;
  }

  /**
   * Assign service to staff member
   */
  async assignService(
    staffId: string,
    serviceId: string,
    options?: {
      canPerformIndependently?: boolean;
      requiresSupervision?: boolean;
      minExperienceHours?: number;
    }
  ): Promise<StaffServiceAssignment> {
    const result = await dbPool.query<StaffServiceAssignment>(
      `INSERT INTO staff_service_assignments 
       (staff_member_id, service_id, can_perform_independently, requires_supervision, min_experience_hours)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (staff_member_id, service_id) DO UPDATE SET
         can_perform_independently = EXCLUDED.can_perform_independently,
         requires_supervision = EXCLUDED.requires_supervision,
         min_experience_hours = EXCLUDED.min_experience_hours
       RETURNING id, staff_member_id, service_id, is_available, can_perform_independently, 
                 requires_supervision, min_experience_hours, created_at`,
      [
        staffId,
        serviceId,
        options?.canPerformIndependently ?? false,
        options?.requiresSupervision ?? false,
        options?.minExperienceHours ?? 0
      ]
    );
    return result.rows[0]!;
  }

  /**
   * List services assigned to staff member
   */
  async listServices(staffId: string): Promise<StaffServiceAssignment[]> {
    const result = await dbPool.query<StaffServiceAssignment>(
      `SELECT id, staff_member_id, service_id, is_available, can_perform_independently, 
              requires_supervision, min_experience_hours, created_at
       FROM staff_service_assignments 
       WHERE staff_member_id = $1 AND is_available = true
       ORDER BY created_at DESC`,
      [staffId]
    );
    return result.rows;
  }

  /**
   * Check if staff can perform service
   */
  async canPerformService(staffId: string, serviceId: string): Promise<boolean> {
    const result = await dbPool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM staff_service_assignments 
       WHERE staff_member_id = $1 AND service_id = $2 AND is_available = true`,
      [staffId, serviceId]
    );
    return parseInt(result.rows[0]?.count || "0", 10) > 0;
  }

  /**
   * Count staff by business
   */
  async countByBusiness(businessId: string, status?: string): Promise<number> {
    const query = status
      ? `SELECT COUNT(*) as count FROM staff_members 
         WHERE organization_id = $1 AND status = $2`
      : `SELECT COUNT(*) as count FROM staff_members WHERE organization_id = $1`;
    const params = status ? [businessId, status] : [businessId];
    const result = await dbPool.query<{ count: string }>(query, params);
    return parseInt(result.rows[0]?.count || "0", 10);
  }
}

export const staffRepository = new StaffRepository();
