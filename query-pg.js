import pkg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

async function main() {
  console.log("=== SELECTING ALL FROM POSTGRES ===");
  const pool = new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
  });

  try {
    const client = await pool.connect();
    
    const usersRes = await client.query('SELECT id, phone_number, wallet_balance, role FROM users');
    console.log("USERS:");
    console.log(usersRes.rows);

    const txRes = await client.query('SELECT id, user_id, user_phone, type, amount, status, account_number_or_ref, description, created_at FROM transactions ORDER BY created_at DESC');
    console.log("\nTRANSACTIONS:");
    console.log(txRes.rows);

    client.release();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();
