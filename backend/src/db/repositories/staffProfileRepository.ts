import { queryDb } from "../client.js";

type StaffListRow = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  rating: string;
  is_active: boolean;
  specializations: string[] | null;
  created_at: string;
};

type StaffCreateRow = {
  id: string;
};

type StaffIdRow = {
  id: string;
};

type TodayScheduleRow = {
  appointment_id: string;
  start_time: string;
  end_time: string;
  status: string;
  room: string | null;
  client_id: string | null;
  client_name: string | null;
  client_phone: string | null;
  client_photo_url: string | null;
  client_preferences: Record<string, unknown> | null;
  service_name: string | null;
  duration_minutes: string | null;
  notes: string | null;
};

type PerformanceStatsRow = {
  bookings_completed: string;
  avg_session_rating: string;
  revenue_generated: string;
  no_show_contribution_count: string;
  client_retention_rate: string;
};

type AvailabilityRow = {
  availability: Record<string, unknown> | null;
};

type StaffProfileRow = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  specializations: string[] | null;
  availability: Record<string, unknown> | null;
  rating: string;
  photo_url: string | null;
};

type BookingCountRow = {
  total: string;
};

type ScheduleSnippetRow = {
  id: string;
  start_time: string;
  status: string;
};

type UpdateAvailabilityRow = {
  id: string;
  updated_at: string;
};

export async function listStaffProfiles(organizationId: string) {
  const rows = await queryDb<StaffListRow>(
    `select id::text, full_name, email, role, rating::text, is_active, specializations, created_at::text
       from staff_members
      where organization_id = $1
      order by full_name asc`,
    [organizationId]
  );

  return rows.map((row) => ({
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    role: row.role,
    rating: Number(row.rating),
    is_active: row.is_active,
    specializations: row.specializations ?? [],
    created_at: row.created_at
  }));
}

export async function createStaffProfile(
  organizationId: string,
  input: {
    clerk_user_id: string | null;
    user_id: string | null;
    email: string;
    full_name: string;
    role: string;
    specializations: string[];
    availability: Record<string, unknown>;
    photo_url: string | null;
  }
) {
  const rows = await queryDb<StaffCreateRow>(
    `insert into staff_members (
       id, organization_id, clerk_user_id, user_id, email, full_name, role, specializations, availability, photo_url
     ) values (
       gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7::text[], $8::jsonb, $9
     )
     returning id::text`,
    [
      organizationId,
      input.clerk_user_id,
      input.user_id,
      input.email,
      input.full_name,
      input.role,
      input.specializations,
      JSON.stringify(input.availability),
      input.photo_url
    ]
  );

  return rows[0] ?? null;
}

export async function findStaffProfileIdByClerkUserId(organizationId: string, clerkUserId: string) {
  const rows = await queryDb<StaffIdRow>(
    `select id::text
       from staff_members
      where organization_id = $1 and clerk_user_id = $2
      limit 1`,
    [organizationId, clerkUserId]
  );

  return rows[0]?.id ?? null;
}

export async function getTodayScheduleForStaffProfile(organizationId: string, staffId: string) {
  const rows = await queryDb<TodayScheduleRow>(
    `select b.id::text as appointment_id,
            b.start_time::text,
            b.end_time::text,
            b.status,
            b.room,
            c.id::text as client_id,
            c.full_name as client_name,
            c.phone as client_phone,
            c.photo_url as client_photo_url,
            c.preferences as client_preferences,
            s.name as service_name,
            s.duration_minutes::text,
            coalesce(b.notes, s.notes) as notes
       from bookings b
       left join clients c on c.id = b.client_id
       left join services s on s.id = b.service_id
      where b.organization_id = $1
        and b.staff_member_id = $2
        and b.start_time::date = current_date
      order by b.start_time asc`,
    [organizationId, staffId]
  );

  return rows.map((row) => ({
    appointment_id: row.appointment_id,
    start_time: row.start_time,
    end_time: row.end_time,
    client: {
      id: row.client_id,
      name: row.client_name,
      phone: row.client_phone,
      photo_url: row.client_photo_url,
      preferences: row.client_preferences ?? {}
    },
    service: {
      name: row.service_name ?? "Service TBD",
      duration_minutes: Number(row.duration_minutes ?? 0),
      notes: row.notes
    },
    room: row.room,
    status: row.status
  }));
}

export async function getStaffProfilePerformance(organizationId: string, staffId: string) {
  const [statsRows, serviceRows, availabilityRows] = await Promise.all([
    queryDb<PerformanceStatsRow>(
      `select
          count(*) filter (where b.status = 'completed')::text as bookings_completed,
          coalesce(sm.rating, 0)::text as avg_session_rating,
          coalesce(sum(i.amount_cents) filter (where b.status = 'completed'), 0)::text as revenue_generated,
          sm.no_show_contribution_count::text as no_show_contribution_count,
          (
            case
              when count(distinct b.client_id) = 0 then 0
              else round(
                count(distinct b.client_id) filter (
                  where exists (
                    select 1 from bookings b2
                     where b2.organization_id = b.organization_id
                       and b2.client_id = b.client_id
                       and b2.staff_member_id = b.staff_member_id
                       and b2.start_time > b.start_time
                  )
                )::numeric / count(distinct b.client_id)::numeric * 100, 2
              )
            end
          )::text as client_retention_rate
         from staff_members sm
         left join bookings b on b.staff_member_id = sm.id and b.organization_id = sm.organization_id
         left join invoices i on i.client_id = b.client_id and i.organization_id = b.organization_id
        where sm.organization_id = $1 and sm.id = $2
        group by sm.id`,
      [organizationId, staffId]
    ),
    queryDb<{ name: string }>(
      `select coalesce(s.name, 'Service TBD') as name
         from bookings b
         left join services s on s.id = b.service_id
        where b.organization_id = $1 and b.staff_member_id = $2
        group by s.name
        order by count(*) desc
        limit 5`,
      [organizationId, staffId]
    ),
    queryDb<AvailabilityRow>(
      `select availability
         from staff_members
        where organization_id = $1 and id = $2`,
      [organizationId, staffId]
    )
  ]);

  const stats = statsRows[0];
  if (!stats) {
    return null;
  }

  return {
    bookings_completed: Number(stats.bookings_completed),
    avg_session_rating: Number(stats.avg_session_rating),
    revenue_generated: Number(stats.revenue_generated),
    no_show_contribution_pct: Number(stats.no_show_contribution_count),
    client_retention_rate: Number(stats.client_retention_rate),
    top_services: serviceRows.map((row) => row.name),
    availability_this_week: availabilityRows[0]?.availability ?? {}
  };
}

export async function getStaffProfileById(organizationId: string, staffId: string) {
  const [profileRows, performanceRows, scheduleRows] = await Promise.all([
    queryDb<StaffProfileRow>(
      `select id::text, full_name, email, role, specializations, availability, rating::text, photo_url
         from staff_members
        where organization_id = $1 and id = $2`,
      [organizationId, staffId]
    ),
    queryDb<BookingCountRow>(
      `select count(*)::text as total
         from bookings
        where organization_id = $1 and staff_member_id = $2 and start_time >= now()`,
      [organizationId, staffId]
    ),
    queryDb<ScheduleSnippetRow>(
      `select id::text, start_time::text, status
         from bookings
        where organization_id = $1 and staff_member_id = $2
        order by start_time asc
        limit 10`,
      [organizationId, staffId]
    )
  ]);

  const profile = profileRows[0];
  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    role: profile.role,
    specializations: profile.specializations ?? [],
    availability: profile.availability ?? {},
    rating: Number(profile.rating),
    photo_url: profile.photo_url,
    schedule: scheduleRows,
    performance: {
      upcoming_bookings: Number(performanceRows[0]?.total ?? 0)
    }
  };
}

export async function updateStaffProfileAvailability(
  organizationId: string,
  staffId: string,
  availability: Record<string, unknown>
) {
  const rows = await queryDb<UpdateAvailabilityRow>(
    `update staff_members
        set availability = $3::jsonb,
            updated_at = now()
      where organization_id = $1 and id = $2
      returning id::text, updated_at::text`,
    [organizationId, staffId, JSON.stringify(availability)]
  );

  return rows[0] ?? null;
}
