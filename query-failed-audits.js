import pkg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

async function main() {
  console.log("=== SELECTING FAILED AUDIT LOGS ===");
  const pool = new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
  });

  try {
    const client = await pool.connect();
    
    const auditRes = await client.query("SELECT * FROM audit_logs WHERE details ILIKE '%fail%' OR details ILIKE '%error%' OR details ILIKE '%mismatch%' OR details ILIKE '%invalid%' ORDER BY created_at DESC");
    console.log("FAILED AUDIT LOGS:");
    console.log(auditRes.rows);

    client.release();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();
