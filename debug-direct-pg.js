import pkg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

async function main() {
  console.log('Connecting directly to PG...');
  console.log('SQL_HOST:', process.env.SQL_HOST);
  console.log('SQL_USER:', process.env.SQL_USER);
  console.log('SQL_DB_NAME:', process.env.SQL_DB_NAME);

  const pool = new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    connectionTimeoutMillis: 15000,
  });

  try {
    const client = await pool.connect();
    console.log('Connected successfully!');
    
    // Let's query the transactions table
    const res = await client.query('SELECT * FROM transactions ORDER BY created_at DESC LIMIT 50');
    console.log(`Found ${res.rows.length} transactions:`);
    for (const row of res.rows) {
      console.log(`- ID: ${row.id}, UserPhone: ${row.user_phone}, Amount: ${row.amount}, Ref: ${row.account_number_or_ref}, Status: ${row.status}`);
    }

    const specific = res.rows.find(row => (row.account_number_or_ref || '').toUpperCase().includes('FT26197'));
    if (specific) {
      console.log('FOUND MATCHING TRANSACTION IN PG:', specific);
    } else {
      console.log('No transaction matching FT26197 in PG.');
    }

    client.release();
  } catch (err) {
    console.error('PG Query Error:', err);
  } finally {
    await pool.end();
  }
}

main();
