import { queryDb } from "../client.js";

type CustomerListRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  loyalty_points: string;
  membership_tier: string;
  risk_score: string | null;
  created_at: string;
};

type CustomerCreateRow = {
  id: string;
  created_at: string;
};

type CustomerProfileRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  loyalty_points: string;
  membership_tier: string;
  telehealth_consent: boolean;
  preferences: Record<string, unknown> | null;
  photo_url: string | null;
};

type CustomerBookingRow = {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  room: string | null;
  service_name: string | null;
  staff_id: string | null;
  staff_name: string | null;
  staff_photo_url: string | null;
};

type CustomerInvoiceRow = {
  id: string;
  amount_cents: string;
  status: string;
  due_date: string;
};

type CustomerUpdateRow = {
  id: string;
  full_name: string;
  phone: string | null;
  membership_tier: string;
  preferences: Record<string, unknown> | null;
  updated_at: string;
};

type CustomerLoyaltyRow = {
  loyalty_points: string;
  membership_tier: string;
};

type LoyaltyTxRow = {
  id: string;
  type: string;
  points: string;
  balance_after: string;
  description: string | null;
  created_at: string;
};

export async function listCustomers(
  organizationId: string,
  { limit, offset, search }: { limit: number; offset: number; search: string }
) {
  const rows = await queryDb<CustomerListRow>(
    `select id::text,
            full_name,
            email,
            phone,
            loyalty_points::text,
            membership_tier,
            risk_score::text,
            created_at::text
       from clients
      where organization_id = $1
        and ($2 = '' or full_name ilike '%' || $2 || '%' or email ilike '%' || $2 || '%')
      order by created_at desc
      limit $3 offset $4`,
    [organizationId, search, limit, offset]
  );

  return rows.map((row) => ({
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    loyalty_points: Number(row.loyalty_points),
    membership_tier: row.membership_tier,
    risk_score: row.risk_score ? Number(row.risk_score) : null,
    created_at: row.created_at
  }));
}

export async function createCustomer(
  organizationId: string,
  input: {
    email: string;
    full_name: string;
    phone: string | null;
    preferred_staff_id: string | null;
    telehealth_consent: boolean;
    preferences: Record<string, unknown>;
  }
) {
  const rows = await queryDb<CustomerCreateRow>(
    `insert into clients (
       id, organization_id, email, full_name, phone, preferred_staff_id, telehealth_consent, preferences
     ) values (
       gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7::jsonb
     )
     returning id::text, created_at::text`,
    [
      organizationId,
      input.email,
      input.full_name,
      input.phone,
      input.preferred_staff_id,
      input.telehealth_consent,
      JSON.stringify(input.preferences)
    ]
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    full_name: input.full_name,
    email: input.email,
    phone: input.phone,
    created_at: row.created_at
  };
}

export async function getCustomerProfile(organizationId: string, customerId: string) {
  const [customerRows, bookingRows, invoiceRows] = await Promise.all([
    queryDb<CustomerProfileRow>(
      `select id::text,
              full_name,
              email,
              phone,
              loyalty_points::text,
              membership_tier,
              telehealth_consent,
              preferences,
              photo_url
         from clients
        where organization_id = $1 and id = $2`,
      [organizationId, customerId]
    ),
    queryDb<CustomerBookingRow>(
      `select b.id::text,
              b.start_time::text,
              b.end_time::text,
              b.status,
              b.room,
              s.name as service_name,
              sm.id::text as staff_id,
              sm.full_name as staff_name,
              sm.photo_url as staff_photo_url
         from bookings b
         left join services s on s.id = b.service_id
         left join staff_members sm on sm.id = b.staff_member_id
        where b.organization_id = $1 and b.client_id = $2
        order by b.start_time desc`,
      [organizationId, customerId]
    ),
    queryDb<CustomerInvoiceRow>(
      `select id::text, amount_cents::text, status, due_date::text
         from invoices
        where organization_id = $1 and client_id = $2
        order by created_at desc`,
      [organizationId, customerId]
    )
  ]);

  const customer = customerRows[0];
  if (!customer) {
    return null;
  }

  const upcoming_bookings = bookingRows
    .filter((row) => new Date(row.start_time).getTime() >= Date.now())
    .map((row) => ({
      id: row.id,
      start_time: row.start_time,
      end_time: row.end_time,
      status: row.status,
      room: row.room,
      service: { name: row.service_name ?? "Service TBD" },
      staff: {
        id: row.staff_id,
        full_name: row.staff_name,
        photo_url: row.staff_photo_url
      }
    }));

  const invoices = invoiceRows.map((row) => ({
    id: row.id,
    amount_cents: Number(row.amount_cents),
    status: row.status,
    due_date: row.due_date
  }));

  return {
    id: customer.id,
    full_name: customer.full_name,
    email: customer.email,
    phone: customer.phone,
    loyalty_points: Number(customer.loyalty_points),
    membership_tier: customer.membership_tier,
    telehealth_consent: customer.telehealth_consent,
    preferences: customer.preferences ?? {},
    photo_url: customer.photo_url,
    balance_due: invoices.filter((row) => row.status !== "paid").reduce((total, row) => total + row.amount_cents, 0),
    upcoming_bookings,
    booking_history: bookingRows.map((row) => ({
      id: row.id,
      start_time: row.start_time,
      end_time: row.end_time,
      status: row.status,
      room: row.room,
      service_name: row.service_name,
      staff_name: row.staff_name
    })),
    invoices
  };
}

export async function updateCustomerProfile(
  organizationId: string,
  customerId: string,
  input: {
    full_name: string | null;
    phone: string | null;
    membership_tier: string | null;
    telehealth_consent: boolean | null;
    preferred_staff_id: string | null;
    preferences: Record<string, unknown> | null;
  }
) {
  const rows = await queryDb<CustomerUpdateRow>(
    `update clients
        set full_name = coalesce($3, full_name),
            phone = coalesce($4, phone),
            membership_tier = coalesce($5, membership_tier),
            telehealth_consent = coalesce($6, telehealth_consent),
            preferred_staff_id = coalesce($7, preferred_staff_id),
            preferences = coalesce($8::jsonb, preferences),
            updated_at = now()
      where organization_id = $1 and id = $2
      returning id::text, full_name, phone, membership_tier, preferences, updated_at::text`,
    [
      organizationId,
      customerId,
      input.full_name,
      input.phone,
      input.membership_tier,
      input.telehealth_consent,
      input.preferred_staff_id,
      input.preferences ? JSON.stringify(input.preferences) : null
    ]
  );

  return rows[0] ?? null;
}

export async function getCustomerLoyalty(organizationId: string, customerId: string) {
  const [customerRows, txRows] = await Promise.all([
    queryDb<CustomerLoyaltyRow>(
      `select loyalty_points::text, membership_tier
         from clients
        where organization_id = $1 and id = $2`,
      [organizationId, customerId]
    ),
    queryDb<LoyaltyTxRow>(
      `select id::text, type, points::text, balance_after::text, description, created_at::text
         from loyalty_transactions
        where organization_id = $1 and client_id = $2
        order by created_at desc
        limit 20`,
      [organizationId, customerId]
    )
  ]);

  const customer = customerRows[0];
  if (!customer) {
    return null;
  }

  return {
    points: Number(customer.loyalty_points),
    tier: customer.membership_tier,
    redemption_history: txRows.map((row) => ({
      id: row.id,
      type: row.type,
      points: Number(row.points),
      balance_after: Number(row.balance_after),
      description: row.description,
      created_at: row.created_at
    }))
  };
}

export async function redeemCustomerLoyalty(
  organizationId: string,
  customerId: string,
  input: { points: number; description: string; discount_amount_cents: number }
) {
  const customerRows = await queryDb<{ loyalty_points: string }>(
    `select loyalty_points::text from clients where organization_id = $1 and id = $2`,
    [organizationId, customerId]
  );

  const current = Number(customerRows[0]?.loyalty_points ?? -1);
  if (current < 0) {
    return { kind: "not_found" as const };
  }
  if (current < input.points) {
    return { kind: "insufficient_points" as const, balance: current };
  }

  const balanceAfter = current - input.points;
  await queryDb(
    `update clients
        set loyalty_points = $3,
            updated_at = now()
      where organization_id = $1 and id = $2`,
    [organizationId, customerId, balanceAfter]
  );
  await queryDb(
    `update loyalty_accounts
        set points_balance = $3,
            updated_at = now()
      where organization_id = $1 and client_id = $2`,
    [organizationId, customerId, balanceAfter]
  );
  await queryDb(
    `insert into loyalty_transactions (
       id, organization_id, client_id, type, points, balance_after, description, metadata
     ) values (
       gen_random_uuid(), $1, $2, 'redeem', $3, $4, $5, $6::jsonb
     )`,
    [
      organizationId,
      customerId,
      -input.points,
      balanceAfter,
      input.description,
      JSON.stringify({ discount_amount_cents: input.discount_amount_cents })
    ]
  );

  return {
    kind: "ok" as const,
    redeemed: true,
    points: input.points,
    balance_after: balanceAfter
  };
}
