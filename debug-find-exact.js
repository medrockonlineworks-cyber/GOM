import pkg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

async function main() {
  const pool = new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    connectionTimeoutMillis: 15000,
  });

  try {
    const client = await pool.connect();
    console.log('Querying for reference FT26197HK0DY...');
    const res = await client.query(
      `SELECT id, user_id, user_phone, type, amount, status, created_at, account_number_or_ref, bank_name 
       FROM transactions 
       WHERE UPPER(account_number_or_ref) = $1`, 
      ['FT26197HK0DY']
    );
    console.log(`Found ${res.rows.length} rows.`);
    if (res.rows.length > 0) {
      console.log('Row details:', JSON.stringify(res.rows[0], null, 2));
    } else {
      console.log('Checking for any transactions...');
      const res2 = await client.query(
        `SELECT id, user_id, user_phone, type, amount, status, created_at, account_number_or_ref, bank_name 
         FROM transactions 
         ORDER BY created_at DESC LIMIT 10`
      );
      console.log('Latest 10 transactions:', JSON.stringify(res2.rows, null, 2));
    }
    client.release();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();
