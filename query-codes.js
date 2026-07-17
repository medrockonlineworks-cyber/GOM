import pkg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

async function main() {
  console.log("=== SELECTING RECHARGE CODES ===");
  const pool = new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
  });

  try {
    const client = await pool.connect();
    
    const codesRes = await client.query("SELECT * FROM system_config WHERE key IN ('used_codes', 'generated_codes')");
    console.log("RECHARGE CODES FROM SYSTEM_CONFIG:");
    console.log(JSON.stringify(codesRes.rows, null, 2));

    client.release();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();
