import { queryDb } from '../../db/client.js';
import { randomUUID } from 'node:crypto';
import type { PermissionRow, RoleRow } from '../../types/entities.js';

// Simple audit log stub
const auditLogService = {
  async log(data: any) {
    console.log('Audit log:', data);
  }
};

export type Permission = PermissionRow;
export type Role = RoleRow;

export type RolePermission = {
  role_id: string;
  permission_id: string;
  granted_at: Date;
  granted_by: string;
};

export class RoleService {
  async createRole(data: {
    name: string;
    description?: string;
    organization_id: string;
    created_by: string;
  }): Promise<Role> {
    const id = randomUUID();
    
    const result = await queryDb<RoleRow>(
      `INSERT INTO roles (id, name, description, organization_id, is_system_role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, false, NOW(), NOW())
       RETURNING *`,
      [id, data.name, data.description, data.organization_id]
    );

    await auditLogService.log({
      action: 'role.created',
      resource_type: 'role',
      resource_id: id,
      user_id: data.created_by,
      organization_id: data.organization_id,
      details: { role_name: data.name }
    });

    return result[0];
  }

  async getRolesByOrganization(organizationId: string): Promise<Role[]> {
    const result = await queryDb<RoleRow>(
      'SELECT * FROM roles WHERE organization_id = $1 ORDER BY name',
      [organizationId]
    );
    return result;
  }

  async assignPermissionToRole(data: {
    role_id: string;
    permission_id: string;
    granted_by: string;
    organization_id: string;
  }): Promise<void> {
    await queryDb(
      `INSERT INTO role_permissions (role_id, permission_id, granted_at, granted_by)
       VALUES ($1, $2, NOW(), $3)
       ON CONFLICT (role_id, permission_id) DO NOTHING`,
      [data.role_id, data.permission_id, data.granted_by]
    );

    await auditLogService.log({
      action: 'role.permission_assigned',
      resource_type: 'role',
      resource_id: data.role_id,
      user_id: data.granted_by,
      organization_id: data.organization_id,
      details: { permission_id: data.permission_id }
    });
  }

  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const result = await queryDb<PermissionRow>(
      `SELECT p.* FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = $1`,
      [roleId]
    );
    return result;
  }
}

export const roleService = new RoleService();
