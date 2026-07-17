import pkg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

async function main() {
  console.log("=== CHECKING POTENTIAL RECHARGE TARGET USERS ===");
  const pool = new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
  });

  try {
    const client = await pool.connect();
    
    const phones = ['0918297585', '0936550707', '0936550706'];
    for (const phone of phones) {
      const res = await client.query(
        "SELECT id, phone_number, wallet_balance, role FROM users WHERE phone_number LIKE $1 OR phone_number LIKE $2",
        [`%${phone}`, `%${phone.substring(1)}`]
      );
      console.log(`Searching for phone: ${phone}`);
      console.log(res.rows);
    }

    client.release();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();
