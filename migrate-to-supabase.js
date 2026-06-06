#!/usr/bin/env node

/**
 * KORA Supabase Migration Script
 * Executes all 10 migrations to Supabase PostgreSQL database
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import readline from 'readline';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n🚀 KORA Supabase Migration Tool\n');
  console.log('This script will execute all 10 migrations to your Supabase database.\n');

  // Get connection details
  console.log('📋 Please enter your Supabase connection details:\n');
  
  const host = await question('Supabase Host (db.zihocnhvtgodnawnvoyj.supabase.co): ');
  const port = await question('Port (5432): ');
  const database = await question('Database (postgres): ');
  const user = await question('User (postgres): ');
  const password = await question('Password: ');

  const dbConfig = {
    host: host || 'db.zihocnhvtgodnawnvoyj.supabase.co',
    port: parseInt(port || '5432'),
    database: database || 'postgres',
    user: user || 'postgres',
    password: password,
    ssl: { rejectUnauthorized: false }
  };

  console.log('\n📡 Connecting to Supabase...');
  
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ Connected to Supabase successfully!\n');

    // Get migration files
    const migrationsDir = path.join(__dirname, 'db');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`📂 Found ${migrationFiles.length} migration files:\n`);
    migrationFiles.forEach((f, i) => console.log(`   ${i + 1}. ${f}`));
    console.log('\n');

    // Execute migrations
    let successCount = 0;
    let failureCount = 0;

    for (const migrationFile of migrationFiles) {
      const filePath = path.join(migrationsDir, migrationFile);
      const sqlContent = fs.readFileSync(filePath, 'utf8');

      try {
        console.log(`⏳ Executing: ${migrationFile}...`);
        
        // Split by semicolons and execute each statement
        const statements = sqlContent
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0);

        for (const statement of statements) {
          await client.query(statement);
        }

        console.log(`   ✅ Success\n`);
        successCount++;
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
        failureCount++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successful: ${successCount}/${migrationFiles.length}`);
    console.log(`❌ Failed: ${failureCount}/${migrationFiles.length}`);
    console.log('='.repeat(50) + '\n');

    if (failureCount === 0) {
      console.log('🎉 All migrations executed successfully!\n');
      console.log('📋 Next steps:');
      console.log('   1. Verify tables in Supabase dashboard');
      console.log('   2. Check RLS policies are enabled');
      console.log('   3. Test tenant isolation with sample data\n');
    } else {
      console.log('⚠️  Some migrations failed. Review errors above.\n');
    }

    await client.end();
    rl.close();
    process.exit(failureCount > 0 ? 1 : 0);

  } catch (error) {
    console.error('❌ Connection Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  rl.close();
  process.exit(1);
});
