import pkg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

async function main() {
  console.log("=== SELECTING RECENT USERS ===");
  const pool = new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
  });

  try {
    const client = await pool.connect();
    
    const usersRes = await client.query('SELECT id, phone_number, wallet_balance, role, created_at FROM users ORDER BY created_at DESC LIMIT 30');
    console.log("RECENT USERS:");
    console.log(usersRes.rows);

    client.release();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();
