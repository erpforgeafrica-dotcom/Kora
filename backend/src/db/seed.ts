import "dotenv/config";
import { dbPool } from "./client.js";
import { hash } from "bcryptjs";

const ORG_ID = "00000000-0000-0000-0000-000000000001";
const USER_ID = "00000000-0000-0000-0000-000000000101";
const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000002";
const DEMO_USER_ID = "00000000-0000-0000-0000-000000000102";
const PHARMACY_ADMIN_USER_ID = "00000000-0000-0000-0000-000000000104";

/**
 * Core database seed script for KORA
 * - Development: Seeds demo organization, users, and test data
 * - Staging: Seeds demo organization for testing
 * - Production: No seed data (manual setup only)
 */
async function seedDemoOrganization() {
  console.log("Seeding KORA Demo Organization...");

  await dbPool.query(
    `insert into organizations (id, name)
     values ($1, 'KORA Demo Organization')
     on conflict (id) do nothing`,
    [ORG_ID]
  );

  await dbPool.query(
    `insert into businesses (id, name, slug, owner_user_id, status, address_line1, city, postcode)
     values ($1, 'KORA Demo Business', 'kora-demo', $2, 'active', '123 Demo Street', 'Demo City', '00001')
     on conflict (id) do nothing`,
    [ORG_ID, USER_ID]
  );

  console.log("✓ Demo organization and business created");
}

async function seedDemoAdminUser() {
  console.log("Seeding Demo Admin User...");

  // Hash a secure demo password for the admin user
  const demoPassword = "KoraDemo123!";
  const passwordHash = await hash(demoPassword, 12);

  await dbPool.query(
    `insert into users (id, organization_id, email, role, password_hash)
     values ($1, $2, 'admin@kora.local', 'admin', $3)
     on conflict (id) do update set password_hash = excluded.password_hash`,
    [USER_ID, ORG_ID, passwordHash]
  );

  console.log("✓ Demo admin user created (email: admin@kora.local, password: KoraDemo123!)");

  await dbPool.query(
    `insert into users (id, organization_id, email, role, password_hash)
     values ($1, $2, 'admin@pharmacy.com', 'business_admin', $3)
     on conflict (id) do update set
       organization_id = excluded.organization_id,
       email = excluded.email,
       role = excluded.role,
       password_hash = excluded.password_hash`,
    [PHARMACY_ADMIN_USER_ID, ORG_ID, passwordHash]
  );

  console.log("✓ Demo pharmacy admin created (email: admin@pharmacy.com, password: KoraDemo123!)");
}

async function seedTestUser() {
  console.log("Seeding Test User for Frontend Demos...");

  // Hash a demo password for the test user (matches frontend default)
  const testPassword = "password123";
  const passwordHash = await hash(testPassword, 12);
  const testUserId = "00000000-0000-0000-0000-000000000103";

  await dbPool.query(
    `insert into users (id, organization_id, email, role, password_hash)
     values ($1, $2, 'test@example.com', 'user', $3)
     on conflict (id) do update set password_hash = excluded.password_hash`,
    [testUserId, ORG_ID, passwordHash]
  );

  console.log("✓ Test user created (email: test@example.com, password: password123)");
}

async function seedDemoServices() {
  console.log("Seeding Demo Services...");

  const services = [
    {
      id: "00000000-0000-0000-0001-000000000001",
      name: "Haircut",
      description: "Professional haircut service",
      price: 25.0,
      duration: 30,
      category: "Beauty",
    },
    {
      id: "00000000-0000-0000-0001-000000000002",
      name: "Hair Coloring",
      description: "Hair coloring and treatment",
      price: 60.0,
      duration: 60,
      category: "Beauty",
    },
    {
      id: "00000000-0000-0000-0001-000000000003",
      name: "Massage",
      description: "Relaxation massage service",
      price: 50.0,
      duration: 45,
      category: "Wellness",
    },
    {
      id: "00000000-0000-0000-0001-000000000004",
      name: "Consultation",
      description: "Professional consultation",
      price: 30.0,
      duration: 30,
      category: "Professional",
    },
  ];

  for (const service of services) {
    await dbPool.query(
      `insert into services (id, organization_id, name, description, price_cents, duration_minutes, is_active)
       values ($1, $2, $3, $4, $5, $6, true)
       on conflict (id) do nothing`,
      [
        service.id,
        ORG_ID,
        service.name,
        service.description,
        service.price * 100,
        service.duration,
      ]
    );
  }

  console.log(`✓ ${services.length} demo services created`);
}

async function seedDemoInventory() {
  console.log("Seeding Demo Inventory...");

  await dbPool.query(
    `insert into inventory_categories (id, organization_id, name)
     values (gen_random_uuid(), $1, 'Supplies')
     on conflict do nothing`,
    [ORG_ID]
  );

  await dbPool.query(
    `insert into warehouses (id, organization_id, name, location)
     values (gen_random_uuid(), $1, 'Main Warehouse', 'HQ'),
            (gen_random_uuid(), $1, 'Clinic Store', 'Clinic Floor')
     on conflict do nothing`,
    [ORG_ID]
  );

  await dbPool.query(
    `insert into inventory_items (id, organization_id, name, sku, unit, reorder_threshold, is_active)
     values
       (gen_random_uuid(), $1, 'Gloves', 'GLV-001', 'box', 10, true),
       (gen_random_uuid(), $1, 'Syringes', 'SYR-002', 'pack', 20, true),
       (gen_random_uuid(), $1, 'Massage Oil', 'MSG-003', 'bottle', 5, true)
     on conflict do nothing`,
    [ORG_ID]
  );
}

async function seedDemoCrm() {
  console.log("Seeding Demo CRM...");
  await dbPool.query(
    `insert into crm_leads (id, organization_id, full_name, email, phone, status, source)
     values
       (gen_random_uuid(), $1, 'Alice Demo', 'alice@example.com', '+155501', 'new', 'web'),
       (gen_random_uuid(), $1, 'Bob Demo', 'bob@example.com', '+155502', 'qualified', 'referral')
     on conflict do nothing`,
    [ORG_ID]
  );
}

async function seedDemoDelivery() {
  console.log("Seeding Demo Delivery...");
  await dbPool.query(
    `insert into delivery_agents (id, organization_id, full_name, phone, status)
     values
       (gen_random_uuid(), $1, 'Rider One', '+15551001', 'active'),
       (gen_random_uuid(), $1, 'Rider Two', '+15551002', 'active')
     on conflict do nothing`,
    [ORG_ID]
  );

  await dbPool.query(
    `insert into delivery_zones (id, organization_id, name, geo, status)
     values (gen_random_uuid(), $1, 'Zone A', '{"type":"Polygon","coordinates":[[[0,0],[0,1],[1,1],[1,0],[0,0]]]}'::jsonb, 'active')
     on conflict do nothing`,
    [ORG_ID]
  );

  await dbPool.query(
    `insert into delivery_bookings (id, organization_id, customer_name, pickup_address, dropoff_address, status)
     values (gen_random_uuid(), $1, 'Demo Customer', '123 Demo St', '500 Delivery Rd', 'pending')
     on conflict do nothing`,
    [ORG_ID]
  );
}

async function seedDemoStaff() {
  console.log("Seeding Demo Staff Members...");

  const staffMembers = [
    {
      id: "00000000-0000-0000-0002-000000000001",
      name: "Sarah Johnson",
      email: "sarah@kora.local",
      role: "staff",
    },
    {
      id: "00000000-0000-0000-0002-000000000002",
      name: "Mike Smith",
      email: "mike@kora.local",
      role: "staff",
    },
  ];

  for (const staff of staffMembers) {
    await dbPool.query(
      `insert into users (id, organization_id, email, role)
       values ($1, $2, $3, $4)
       on conflict (id) do nothing`,
      [staff.id, ORG_ID, staff.email, staff.role]
    );
  }

  console.log(`✓ ${staffMembers.length} demo staff members created`);
}

async function seedDemoBookings() {
  console.log("Seeding Demo Bookings...");

  const now = new Date();
  
  // Create prerequisite clients
  await dbPool.query(
    `insert into clients (id, organization_id, email, full_name, loyalty_points, membership_tier, telehealth_consent, preferences)
     values 
       ($1, $2, 'customer1@demo.local', 'Demo Customer One', 0, 'none', false, '{}'::jsonb),
       ($3, $2, 'customer2@demo.local', 'Demo Customer Two', 0, 'none', false, '{}'::jsonb)
     on conflict do nothing`,
    [
      "00000000-0000-0000-0004-000000000001",
      ORG_ID,
      "00000000-0000-0000-0004-000000000002"
    ]
  );
  const bookings = [
    {
      id: "00000000-0000-0000-0003-000000000001",
      service_id: "00000000-0000-0000-0001-000000000001",
      customer_id: "00000000-0000-0000-0004-000000000001",
      scheduled_at: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
      status: "confirmed",
    },
    {
      id: "00000000-0000-0000-0003-000000000002",
      service_id: "00000000-0000-0000-0001-000000000002",
      customer_id: "00000000-0000-0000-0004-000000000002",
      scheduled_at: new Date(now.getTime() + 48 * 60 * 60 * 1000), // Day after tomorrow
      status: "pending",
    },
  ];

  for (const booking of bookings) {
    await dbPool.query(
      `insert into bookings (id, organization_id, service_id, client_id, start_time, end_time, status)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (id) do nothing`,
      [
        booking.id,
        ORG_ID,
        booking.service_id,
        booking.customer_id,
        booking.scheduled_at,
        new Date(booking.scheduled_at.getTime() + 60 * 60 * 1000),
        booking.status,
      ]
    );
  }

  console.log(`✓ ${bookings.length} demo bookings created`);
}

async function seedAIBudget() {
  console.log("Seeding AI Budget Configuration...");

  const monthStart = new Date();
  monthStart.setDate(1);
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);

  await dbPool.query(
    `insert into ai_budgets (id, organization_id, monthly_limit_usd, current_month_spend_usd, reset_date)
     values (gen_random_uuid(), $1, $2, 0, $3)
     on conflict (organization_id) do nothing`,
    [ORG_ID, process.env.NODE_ENV === "production" ? 5000 : 500, monthEnd]
  );

  console.log("✓ AI budget configuration created");
}

async function seedAnomalyBaselines() {
  console.log("Seeding Anomaly Detection Baselines...");

  await dbPool.query(
    `insert into anomaly_baselines (id, organization_id, metric_name, baseline_value, std_dev, z_score_threshold)
     values
       (gen_random_uuid(), $1, 'avg_response_ms', 180, 30, 2.5),
       (gen_random_uuid(), $1, 'daily_bookings', 40, 10, 2.5),
       (gen_random_uuid(), $1, 'overdue_invoices', 5, 2, 2.5)
     on conflict (organization_id, metric_name)
     do update set baseline_value = excluded.baseline_value,
                   std_dev = excluded.std_dev,
                   z_score_threshold = excluded.z_score_threshold,
                   last_updated = now()`,
    [ORG_ID]
  );

  console.log("✓ Anomaly detection baselines created");
}

async function checkTableExists(tableName: string): Promise<boolean> {
  const result = await dbPool.query(
    `select exists(
       select 1 from information_schema.tables 
       where table_schema = 'public' and table_name = $1
     )`,
    [tableName]
  );
  return result.rows[0].exists;
}

async function main() {
  const environment = process.env.NODE_ENV || "development";
  const skipProduction = environment === "production";

  if (skipProduction) {
    console.log("⚠️  Skipping seed in production environment");
    return;
  }

  console.log(`\n📦 Starting database seed for ${environment} environment\n`);

  await dbPool.query("begin");
  try {
    // Check if tables exist before seeding
    const hasBusinessTable = await checkTableExists("businesses");
    const hasUsersTable = await checkTableExists("users");

    if (!hasBusinessTable || !hasUsersTable) {
      console.log("⚠️  Required tables not found. Run migrations first: npm run db:migrate");
      return;
    }

    // Seed core demo data
    await seedDemoOrganization();
    await seedDemoAdminUser();
    await seedTestUser();

    // Check if other tables exist before seeding advanced features
    if (await checkTableExists("services")) {
      await seedDemoServices();
    }

    if (await checkTableExists("bookings")) {
      await seedDemoBookings();
    }

    if (await checkTableExists("inventory_items")) {
      await seedDemoInventory();
    }

    if (await checkTableExists("crm_leads")) {
      await seedDemoCrm();
    }

    if (await checkTableExists("delivery_bookings")) {
      await seedDemoDelivery();
    }

    if (await checkTableExists("ai_budgets")) {
      await seedAIBudget();
    }

    if (await checkTableExists("anomaly_baselines")) {
      await seedAnomalyBaselines();
    }

    await dbPool.query("commit");
    console.log("\n✅ Seed completed successfully\n");
  } catch (error) {
    await dbPool.query("rollback");
    console.error("\n❌ Seed failed:", error);
    throw error;
  }
}

main()
  .then(async () => {
    await dbPool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Fatal error during seed:", error);
    await dbPool.end();
    process.exit(1);
  });
