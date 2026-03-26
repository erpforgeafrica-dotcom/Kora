import { hash } from "bcryptjs";

async function generate() {
  const demoPassword = "KoraDemo123!";
  const testPassword = "password123";
  
  const demoHash = await hash(demoPassword, 12);
  const testHash = await hash(testPassword, 12);
  
  console.log("-- Generated password hashes for KORA users");
  console.log(`-- Admin password: ${demoPassword}`);
  console.log(`-- Admin hash: ${demoHash}`);
  console.log("");
  console.log(`-- Test password: ${testPassword}`);
  console.log(`-- Test hash: ${testHash}`);
  console.log("");
  console.log("-- SQL to update users:");
  console.log(`UPDATE users SET password_hash = '${demoHash}' WHERE email = 'admin@kora.local';`);
  console.log(`INSERT INTO users (id, organization_id, email, role, password_hash) VALUES ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'test@example.com', 'user', '${testHash}') ON CONFLICT (id) DO NOTHING;`);
}

generate().catch(console.error);
