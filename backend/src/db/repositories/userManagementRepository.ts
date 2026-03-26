import { createHash, randomUUID } from "node:crypto";
import { queryDb } from "../client.js";

type UserRow = {
  id: string;
  organization_id: string | null;
  branch_id: string | null;
  first_name: string | null;
  last_name: string | null;
  name: string | null;
  email: string;
  phone: string | null;
  profile_image_url: string | null;
  status: string | null;
  email_verified: boolean | null;
  phone_verified: boolean | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string | null;
  role_id: string | null;
  role_name: string | null;
  role_description: string | null;
};

type UserSchemaSupport = {
  managedRoleTable: boolean;
  managedRoleIdColumn: boolean;
  managedProfileColumns: boolean;
  managedStatusColumn: boolean;
  managedUpdatedAtColumn: boolean;
  legacyRoleColumn: boolean;
  legacyLastLoginColumn: boolean;
};

let userSchemaSupportPromise: Promise<UserSchemaSupport> | null = null;

const FALLBACK_ROLE_NAMES = [
  "platform_admin",
  "business_admin",
  "operations",
  "staff",
  "client",
  "inventory_manager",
  "sales_manager",
  "sales_agent",
  "dispatcher",
  "delivery_agent",
  "kora_admin",
  "kora_superadmin"
] as const;

function legacyStatusSql(alias?: string) {
  const prefix = alias ? `${alias}.` : "";
  return `case when ${prefix}locked_until is not null and ${prefix}locked_until > now() then 'suspended' else 'active' end`;
}

function toLegacyUserRow(row: {
  id: string;
  organization_id: string | null;
  branch_id: string | null;
  email: string;
  role_id: string | null;
  status: string;
  last_login_at: string | null;
  created_at: string;
}): UserRow {
  return {
    id: row.id,
    organization_id: row.organization_id,
    branch_id: row.branch_id,
    first_name: null,
    last_name: null,
    name: row.email.split("@")[0] ?? row.email,
    email: row.email,
    phone: null,
    profile_image_url: null,
    status: row.status,
    email_verified: false,
    phone_verified: false,
    last_login_at: row.last_login_at,
    created_at: row.created_at,
    updated_at: row.created_at,
    role_id: row.role_id,
    role_name: row.role_id,
    role_description: null
  };
}

async function getUserSchemaSupport() {
  if (!userSchemaSupportPromise) {
    userSchemaSupportPromise = (async () => {
      const [roleTableRows, userColumnRows] = await Promise.all([
        queryDb<{ exists: boolean }>(
          `select exists (
             select 1
               from information_schema.tables
              where table_schema = 'public'
                and table_name = 'roles'
           ) as exists`
        ),
        queryDb<{ column_name: string }>(
          `select column_name
             from information_schema.columns
            where table_schema = 'public'
              and table_name = 'users'`
        )
      ]);

      const columns = new Set(userColumnRows.map((row) => row.column_name));

      return {
        managedRoleTable: Boolean(roleTableRows[0]?.exists),
        managedRoleIdColumn: columns.has("role_id"),
        managedProfileColumns: columns.has("first_name") && columns.has("last_name") && columns.has("name"),
        managedStatusColumn: columns.has("status"),
        managedUpdatedAtColumn: columns.has("updated_at"),
        legacyRoleColumn: columns.has("role"),
        legacyLastLoginColumn: columns.has("last_login")
      };
    })();
  }

  return userSchemaSupportPromise;
}

async function usesLegacyUserSchema() {
  const support = await getUserSchemaSupport();
  return !(
    support.managedRoleTable &&
    support.managedRoleIdColumn &&
    support.managedProfileColumns &&
    support.managedStatusColumn &&
    support.managedUpdatedAtColumn
  );
}

export type UserListFilters = {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

export type UpsertUserInput = {
  organizationId?: string | null;
  branchId?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  roleId?: string | null;
  roleName?: string | null;
  password?: string | null;
  profileImageUrl?: string | null;
  status?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
};

export type UpsertRoleInput = {
  organizationId?: string | null;
  name: string;
  description?: string | null;
  permissionIds: string[];
  userIds?: string[];
};

type InvitationInput = {
  organizationId?: string | null;
  emails: string[];
  roleId?: string | null;
  customMessage?: string | null;
  invitedBy?: string | null;
};

export async function listManagedUsers(filters: UserListFilters) {
  if (await usesLegacyUserSchema()) {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(100, Math.max(10, filters.pageSize ?? 20));
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (filters.search?.trim()) {
      params.push(`%${filters.search.trim().toLowerCase()}%`);
      const index = params.length;
      conditions.push(`lower(u.email) like $${index}`);
    }

    if (filters.role?.trim() && filters.role !== "all") {
      params.push(filters.role.trim().toLowerCase());
      const index = params.length;
      conditions.push(`lower(coalesce(u.role, '')) = $${index}`);
    }

    if (filters.status?.trim() && filters.status !== "all") {
      params.push(filters.status.trim().toLowerCase());
      const index = params.length;
      conditions.push(`lower(${legacyStatusSql("u")}) = $${index}`);
    }

    const whereClause = conditions.length > 0 ? `where ${conditions.join(" and ")}` : "";
    const offset = (page - 1) * pageSize;

    const [countRows, rows] = await Promise.all([
      queryDb<{ count: string }>(
        `select count(*)::text as count
           from users u
           ${whereClause}`,
        params
      ),
      queryDb<{
        id: string;
        organization_id: string | null;
        branch_id: string | null;
        email: string;
        role_id: string | null;
        status: string;
        last_login_at: string | null;
        created_at: string;
      }>(
        `select u.id::text,
                u.organization_id::text,
                u.branch_id::text,
                u.email,
                coalesce(u.role, 'unassigned') as role_id,
                ${legacyStatusSql("u")} as status,
                u.last_login::text as last_login_at,
                u.created_at::text
           from users u
           ${whereClause}
          order by u.created_at desc
          limit $${params.length + 1}
         offset $${params.length + 2}`,
        [...params, pageSize, offset]
      )
    ]);

    return {
      count: Number(countRows[0]?.count ?? 0),
      page,
      pageSize,
      users: rows.map(toLegacyUserRow)
    };
  }

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, filters.pageSize ?? 20));
  const params: unknown[] = [];
  const conditions: string[] = [];

  if (filters.search?.trim()) {
    params.push(`%${filters.search.trim().toLowerCase()}%`);
    const index = params.length;
    conditions.push(
      `(lower(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '') || ' ' || coalesce(u.name, '')) like $${index} or lower(u.email) like $${index})`
    );
  }

  if (filters.role?.trim() && filters.role !== "all") {
    params.push(filters.role.trim().toLowerCase());
    const index = params.length;
    conditions.push(`lower(coalesce(r.name, '')) = $${index}`);
  }

  if (filters.status?.trim() && filters.status !== "all") {
    params.push(filters.status.trim().toLowerCase());
    const index = params.length;
    conditions.push(`lower(coalesce(u.status, 'active')) = $${index}`);
  }

  const whereClause = conditions.length > 0 ? `where ${conditions.join(" and ")}` : "";
  const offset = (page - 1) * pageSize;

  const [countRows, rows] = await Promise.all([
    queryDb<{ count: string }>(
      `select count(*)::text as count
         from users u
         left join roles r on r.id = u.role_id
         ${whereClause}`,
      params
    ),
    queryDb<UserRow>(
      `select u.id::text,
              u.organization_id::text,
              u.branch_id::text,
              u.first_name,
              u.last_name,
              u.name,
              u.email,
              u.phone,
              u.profile_image_url,
              u.status,
              u.email_verified,
              u.phone_verified,
              u.last_login_at::text,
              u.created_at::text,
              u.updated_at::text,
              u.role_id::text,
              r.name as role_name,
              r.description as role_description
         from users u
         left join roles r on r.id = u.role_id
         ${whereClause}
        order by u.created_at desc
        limit $${params.length + 1}
       offset $${params.length + 2}`,
      [...params, pageSize, offset]
    )
  ]);

  return {
    count: Number(countRows[0]?.count ?? 0),
    page,
    pageSize,
    users: rows
  };
}

export async function getManagedUser(userId: string) {
  if (await usesLegacyUserSchema()) {
    const rows = await queryDb<{
      id: string;
      organization_id: string | null;
      branch_id: string | null;
      email: string;
      role_id: string | null;
      status: string;
      last_login_at: string | null;
      created_at: string;
    }>(
      `select u.id::text,
              u.organization_id::text,
              u.branch_id::text,
              u.email,
              coalesce(u.role, 'unassigned') as role_id,
              ${legacyStatusSql("u")} as status,
              u.last_login::text as last_login_at,
              u.created_at::text
         from users u
        where u.id = $1
        limit 1`,
      [userId]
    );

    if (!rows[0]) {
      return null;
    }

    const sessions = await queryDb<{
      id: string;
      ip_address: string | null;
      device: string | null;
      created_at: string;
    }>(
      `select id::text,
              ip_address,
              user_agent as device,
              issued_at::text as created_at
         from login_sessions
        where user_id = $1
        order by issued_at desc
        limit 20`,
      [userId]
    );

    return {
      ...toLegacyUserRow(rows[0]),
      activity: [],
      sessions,
      connected_accounts: [],
      stats: {
        bookings: 0,
        spent_cents: 0,
        reviews: 0
      },
      payments: [],
      bookings: [],
      reviews: []
    };
  }

  const rows = await queryDb<UserRow>(
    `select u.id::text,
            u.organization_id::text,
            u.branch_id::text,
            u.first_name,
            u.last_name,
            u.name,
            u.email,
            u.phone,
            u.profile_image_url,
            u.status,
            u.email_verified,
            u.phone_verified,
            u.last_login_at::text,
            u.created_at::text,
            u.updated_at::text,
            u.role_id::text,
            r.name as role_name,
            r.description as role_description
       from users u
       left join roles r on r.id = u.role_id
      where u.id = $1
      limit 1`,
    [userId]
  );

  if (!rows[0]) {
    return null;
  }

  const [activity, sessions, connectedAccounts, bookingStats, paymentStats, reviews] = await Promise.all([
    queryDb<{
      id: string;
      action: string;
      metadata: Record<string, unknown> | null;
      created_at: string;
    }>(
      `select id::text, action, metadata, created_at::text
         from audit_logs
        where actor_id = $1
        order by created_at desc
        limit 25`,
      [userId]
    ),
    queryDb<{
      id: string;
      ip_address: string | null;
      device: string | null;
      created_at: string;
    }>(
      `select id::text, ip_address, device, created_at::text
         from login_sessions
        where user_id = $1
        order by created_at desc
        limit 20`,
      [userId]
    ),
    queryDb<{
      id: string;
      provider: string;
      external_id: string | null;
      created_at: string;
    }>(
      `select id::text, provider, external_id, created_at::text
         from connected_accounts
        where user_id = $1
        order by created_at desc`,
      [userId]
    ),
    queryDb<{ count: string }>(
      `select '0'::text as count`
    ),
    queryDb<{ total: string; count: string }>(
      `select '0'::text as total, '0'::text as count`
    ),
    queryDb<{ id: string; rating: string; review: string | null; created_at: string }>(
      `select id::text, '0'::text as rating, null::text as review, now()::text as created_at
       where false`
    )
  ]);

  return {
    ...rows[0],
    activity,
    sessions,
    connected_accounts: connectedAccounts,
    stats: {
      bookings: Number(bookingStats[0]?.count ?? 0),
      spent_cents: Number(paymentStats[0]?.total ?? 0),
      reviews: reviews.length
    },
    payments: [],
    bookings: [],
    reviews
  };
}

async function resolveRoleId(roleId?: string | null, roleName?: string | null) {
  if (await usesLegacyUserSchema()) {
    return roleId ?? roleName ?? null;
  }

  if (roleId) {
    return roleId;
  }

  if (!roleName) {
    return null;
  }

  const rows = await queryDb<{ id: string }>(
    `select id::text
       from roles
      where lower(name) = lower($1)
      limit 1`,
    [roleName]
  );
  return rows[0]?.id ?? null;
}

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export async function createManagedUser(input: UpsertUserInput) {
  if (await usesLegacyUserSchema()) {
    const roleId = await resolveRoleId(input.roleId, input.roleName);
    const rows = await queryDb<{
      id: string;
      organization_id: string | null;
      branch_id: string | null;
      email: string;
      role_id: string | null;
      status: string;
      last_login_at: string | null;
      created_at: string;
    }>(
      `insert into users (
         id,
         organization_id,
         branch_id,
         role,
         email,
         password_hash,
         locked_until,
         created_at
       ) values (
         $1, $2, $3, $4, lower($5), $6,
         case when $7 = 'suspended' then now() + interval '3650 days' else null end,
         now()
       )
       returning id::text,
                 organization_id::text,
                 branch_id::text,
                 email,
                 coalesce(role, 'unassigned') as role_id,
                 ${legacyStatusSql()} as status,
                 last_login::text as last_login_at,
                 created_at::text`,
      [
        randomUUID(),
        input.organizationId ?? null,
        input.branchId ?? null,
        roleId,
        input.email,
        input.password ? hashPassword(input.password) : null,
        input.status ?? "active"
      ]
    );
    return toLegacyUserRow(rows[0]);
  }

  const roleId = await resolveRoleId(input.roleId, input.roleName);
  const rows = await queryDb<UserRow>(
    `insert into users (
       id,
       organization_id,
       branch_id,
       first_name,
       last_name,
       name,
       email,
       phone,
       password_hash,
       profile_image_url,
       status,
       email_verified,
       phone_verified,
       updated_at,
       role_id
     ) values (
       $1, $2, $3, $4, $5, $6, lower($7), $8, $9, $10, $11, $12, $13, now(), $14
     )
     returning id::text,
               organization_id::text,
               branch_id::text,
               first_name,
               last_name,
               name,
               email,
               phone,
               profile_image_url,
               status,
               email_verified,
               phone_verified,
               last_login_at::text,
               created_at::text,
               updated_at::text,
               role_id::text,
               null::text as role_name,
               null::text as role_description`,
    [
      randomUUID(),
      input.organizationId ?? null,
      input.branchId ?? null,
      input.firstName,
      input.lastName,
      `${input.firstName} ${input.lastName}`.trim(),
      input.email,
      input.phone ?? null,
      input.password ? hashPassword(input.password) : null,
      input.profileImageUrl ?? null,
      input.status ?? "active",
      input.emailVerified ?? false,
      input.phoneVerified ?? false,
      roleId
    ]
  );
  return rows[0];
}

export async function updateManagedUser(userId: string, input: UpsertUserInput) {
  if (await usesLegacyUserSchema()) {
    const roleId = await resolveRoleId(input.roleId, input.roleName);
    const rows = await queryDb<{
      id: string;
      organization_id: string | null;
      branch_id: string | null;
      email: string;
      role_id: string | null;
      status: string;
      last_login_at: string | null;
      created_at: string;
    }>(
      `update users
          set organization_id = $2,
              branch_id = $3,
              role = $4,
              email = lower($5),
              password_hash = coalesce($6, password_hash),
              locked_until = case when $7 = 'suspended' then now() + interval '3650 days' else null end
        where id = $1
        returning id::text,
                  organization_id::text,
                  branch_id::text,
                  email,
                  coalesce(role, 'unassigned') as role_id,
                  ${legacyStatusSql()} as status,
                  last_login::text as last_login_at,
                  created_at::text`,
      [
        userId,
        input.organizationId ?? null,
        input.branchId ?? null,
        roleId,
        input.email,
        input.password ? hashPassword(input.password) : null,
        input.status ?? "active"
      ]
    );
    return rows[0] ? toLegacyUserRow(rows[0]) : null;
  }

  const roleId = await resolveRoleId(input.roleId, input.roleName);
  const rows = await queryDb<UserRow>(
    `update users
        set organization_id = $2,
            branch_id = $3,
            first_name = $4,
            last_name = $5,
            name = $6,
            email = lower($7),
            phone = $8,
            profile_image_url = $9,
            status = $10,
            email_verified = $11,
            phone_verified = $12,
            updated_at = now(),
            role_id = $13
      where id = $1
      returning id::text,
                organization_id::text,
                branch_id::text,
                first_name,
                last_name,
                name,
                email,
                phone,
                profile_image_url,
                status,
                email_verified,
                phone_verified,
                last_login_at::text,
                created_at::text,
                updated_at::text,
                role_id::text,
                null::text as role_name,
                null::text as role_description`,
    [
      userId,
      input.organizationId ?? null,
      input.branchId ?? null,
      input.firstName,
      input.lastName,
      `${input.firstName} ${input.lastName}`.trim(),
      input.email,
      input.phone ?? null,
      input.profileImageUrl ?? null,
      input.status ?? "active",
      input.emailVerified ?? false,
      input.phoneVerified ?? false,
      roleId
    ]
  );
  return rows[0] ?? null;
}

export async function deleteManagedUser(userId: string) {
  const rows = await queryDb<{ id: string }>(
    `delete from users
      where id = $1
      returning id::text`,
    [userId]
  );
  return rows[0] ?? null;
}

export async function updateManagedUserStatus(userId: string, status: string) {
  if (await usesLegacyUserSchema()) {
    const rows = await queryDb<{ id: string; status: string }>(
      `update users
          set locked_until = case when $2 = 'suspended' then now() + interval '3650 days' else null end
        where id = $1
        returning id::text, ${legacyStatusSql()} as status`,
      [userId, status]
    );
    return rows[0] ?? null;
  }

  const rows = await queryDb<{ id: string; status: string }>(
    `update users
        set status = $2,
            updated_at = now()
      where id = $1
      returning id::text, status`,
    [userId, status]
  );
  return rows[0] ?? null;
}

export async function resetManagedUserPassword(userId: string, password: string) {
  if (await usesLegacyUserSchema()) {
    const rows = await queryDb<{ id: string }>(
      `update users
          set password_hash = $2
        where id = $1
        returning id::text`,
      [userId, hashPassword(password)]
    );
    return rows[0] ?? null;
  }

  const rows = await queryDb<{ id: string }>(
    `update users
        set password_hash = $2,
            updated_at = now()
      where id = $1
      returning id::text`,
    [userId, hashPassword(password)]
  );
  return rows[0] ?? null;
}

export async function bulkManageUsers(action: string, userIds: string[]) {
  if (userIds.length === 0) {
    return { affected: 0 };
  }

  if (await usesLegacyUserSchema()) {
    if (action === "delete") {
      const rows = await queryDb<{ id: string }>(
        `delete from users where id = any($1::uuid[]) returning id::text`,
        [userIds]
      );
      return { affected: rows.length };
    }

    if (action === "activate" || action === "suspend") {
      const nextStatus = action === "activate" ? "active" : "suspended";
      const rows = await queryDb<{ id: string }>(
        `update users
            set locked_until = case when $2 = 'suspended' then now() + interval '3650 days' else null end
          where id = any($1::uuid[])
          returning id::text`,
        [userIds, nextStatus]
      );
      return { affected: rows.length };
    }

    return { affected: 0 };
  }

  if (action === "delete") {
    const rows = await queryDb<{ count: string }>(
      `delete from users where id = any($1::uuid[]) returning id::text`,
      [userIds]
    );
    return { affected: rows.length };
  }

  if (action === "activate" || action === "suspend") {
    const nextStatus = action === "activate" ? "active" : "suspended";
    const rows = await queryDb<{ id: string }>(
      `update users
          set status = $2,
              updated_at = now()
        where id = any($1::uuid[])
        returning id::text`,
      [userIds, nextStatus]
    );
    return { affected: rows.length };
  }

  return { affected: 0 };
}

export async function listRoles() {
  if (await usesLegacyUserSchema()) {
    const assignments = await queryDb<{ role_name: string; count: string }>(
      `select coalesce(nullif(trim(role), ''), 'unassigned') as role_name,
              count(*)::text as count
         from users
        group by 1
        order by 1 asc`
    );

    const assignmentMap = new Map(assignments.map((row) => [row.role_name, Number(row.count)]));
    const roleNames = Array.from(new Set([...FALLBACK_ROLE_NAMES, ...assignments.map((row) => row.role_name)]));

    return roleNames.map((name) => ({
      id: name,
      organization_id: null,
      name,
      description: null,
      is_system: true,
      created_at: "",
      updated_at: "",
      user_count: assignmentMap.get(name) ?? 0,
      permissions: []
    }));
  }

  const [roles, permissions, assignments] = await Promise.all([
    queryDb<{
      id: string;
      organization_id: string | null;
      name: string;
      description: string | null;
      is_system: boolean;
      created_at: string;
      updated_at: string;
    }>(
      `select id::text, organization_id::text, name, description, is_system, created_at::text, updated_at::text
         from roles
        order by is_system desc, name asc`
    ),
    queryDb<{
      role_id: string;
      permission_id: string;
      permission_name: string;
      module: string;
      action: string;
    }>(
      `select rp.role_id::text,
              rp.permission_id::text,
              p.name as permission_name,
              p.module,
              p.action
         from role_permissions rp
         join permissions p on p.id = rp.permission_id`
    ),
    queryDb<{ role_id: string; count: string }>(
      `select role_id::text, count(*)::text as count
         from users
        where role_id is not null
        group by role_id`
    )
  ]);

  return roles.map((role) => ({
    ...role,
    user_count: Number(assignments.find((row) => row.role_id === role.id)?.count ?? 0),
    permissions: permissions.filter((row) => row.role_id === role.id)
  }));
}

export async function getRole(roleId: string) {
  const roles = await listRoles();
  const role = roles.find((item) => item.id === roleId);
  if (!role) {
    return null;
  }

  if (await usesLegacyUserSchema()) {
    const users = await queryDb<{ id: string; name: string | null; email: string }>(
      `select id::text, split_part(email, '@', 1) as name, email
         from users
        where coalesce(role, 'unassigned') = $1
        order by created_at desc`,
      [roleId]
    );

    return { ...role, users };
  }

  const users = await queryDb<{ id: string; name: string | null; email: string }>(
    `select id::text, name, email
       from users
      where role_id = $1
      order by created_at desc`,
    [roleId]
  );

  return { ...role, users };
}

export async function listPermissions() {
  return queryDb<{
    id: string;
    name: string;
    module: string;
    action: string;
  }>(
    `select id::text, name, module, action
       from permissions
      order by module asc, action asc`
  );
}

export async function createRole(input: UpsertRoleInput) {
  const rows = await queryDb<{ id: string; name: string; description: string | null; is_system: boolean }>(
    `insert into roles (id, organization_id, name, description, is_system, created_at, updated_at)
     values ($1, $2, $3, $4, false, now(), now())
     returning id::text, name, description, is_system`,
    [randomUUID(), input.organizationId ?? null, input.name, input.description ?? null]
  );
  const role = rows[0];

  if (input.permissionIds.length > 0) {
    await queryDb(
      `insert into role_permissions (role_id, permission_id)
       select $1, unnest($2::uuid[])
       on conflict do nothing`,
      [role.id, input.permissionIds]
    );
  }

  if (input.userIds?.length) {
    await queryDb(
      `update users set role_id = $2, updated_at = now() where id = any($1::uuid[])`,
      [input.userIds, role.id]
    );
  }

  return getRole(role.id);
}

export async function updateRole(roleId: string, input: UpsertRoleInput) {
  await queryDb(
    `update roles
        set name = $2,
            description = $3,
            updated_at = now()
      where id = $1`,
    [roleId, input.name, input.description ?? null]
  );
  await queryDb(`delete from role_permissions where role_id = $1`, [roleId]);
  if (input.permissionIds.length > 0) {
    await queryDb(
      `insert into role_permissions (role_id, permission_id)
       select $1, unnest($2::uuid[])
       on conflict do nothing`,
      [roleId, input.permissionIds]
    );
  }

  if (input.userIds) {
    await queryDb(`update users set role_id = null where role_id = $1`, [roleId]);
    if (input.userIds.length > 0) {
      await queryDb(
        `update users set role_id = $2, updated_at = now() where id = any($1::uuid[])`,
        [input.userIds, roleId]
      );
    }
  }

  return getRole(roleId);
}

export async function deleteRole(roleId: string) {
  const rows = await queryDb<{ id: string }>(
    `delete from roles where id = $1 and is_system = false returning id::text`,
    [roleId]
  );
  return rows[0] ?? null;
}

export async function listInvitations() {
  return queryDb<{
    id: string;
    organization_id: string;
    email: string;
    role_id: string | null;
    role_name: string | null;
    custom_message: string | null;
    status: string;
    invited_by: string | null;
    invited_at: string;
    accepted_at: string | null;
    updated_at: string;
  }>(
    `select ui.id::text,
            ui.organization_id::text,
            ui.email,
            ui.role_id::text,
            r.name as role_name,
            ui.custom_message,
            ui.status,
            ui.invited_by::text,
            ui.invited_at::text,
            ui.accepted_at::text,
            ui.updated_at::text
       from user_invitations ui
       left join roles r on r.id = ui.role_id
      order by ui.invited_at desc`
  );
}

export async function createInvitations(input: InvitationInput) {
  const created = [];
  for (const email of input.emails) {
    const rows = await queryDb<{
      id: string;
      email: string;
      status: string;
      invited_at: string;
    }>(
      `insert into user_invitations (id, organization_id, email, role_id, custom_message, invited_by, invited_at, updated_at)
       values ($1, $2, lower($3), $4, $5, $6, now(), now())
       returning id::text, email, status, invited_at::text`,
      [randomUUID(), input.organizationId ?? null, email, input.roleId ?? null, input.customMessage ?? null, input.invitedBy ?? null]
    );
    created.push(rows[0]);
  }
  return created;
}

export async function updateInvitationStatus(invitationId: string, status: "pending" | "cancelled") {
  const rows = await queryDb<{ id: string; status: string }>(
    `update user_invitations
        set status = $2,
            updated_at = now()
      where id = $1
      returning id::text, status`,
    [invitationId, status]
  );
  return rows[0] ?? null;
}
