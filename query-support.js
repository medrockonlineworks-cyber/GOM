import pkg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

async function main() {
  console.log("=== SELECTING SUPPORT MESSAGES ===");
  const pool = new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
  });

  try {
    const client = await pool.connect();
    
    const supportRes = await client.query('SELECT * FROM support_messages ORDER BY created_at DESC');
    console.log("SUPPORT MESSAGES:");
    console.log(supportRes.rows);

    client.release();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();
