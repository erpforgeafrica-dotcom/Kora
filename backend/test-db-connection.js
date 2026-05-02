/**
 * Test database connection and diagnose issues
 */
import "dotenv/config";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

console.log("🔍 Testing database connection...");
console.log("Connection string:", connectionString?.replace(/:[^:@]*@/, ":***@"));

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 10000,
  statement_timeout: 10000,
  query_timeout: 10000,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    console.log("Attempting connection...");
    const client = await pool.connect();
    console.log("✅ Connected successfully!");
    
    const result = await client.query("SELECT version()");
    console.log("✅ Query successful:", result.rows[0].version);
    
    client.release();
    await pool.end();
    console.log("✅ Connection test passed!");
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    console.error("Error code:", error.code);
    console.error("Error details:", error);
    await pool.end();
    process.exit(1);
  }
}

testConnection();