import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DB_NAME,
  ssl: false
});

async function main() {
  try {
    const client = await pool.connect();
    
    const resTxs = await client.query(`
      SELECT id, user_id, user_phone, amount, status, type, account_number_or_ref, created_at, description
      FROM transactions 
      ORDER BY created_at DESC 
      LIMIT 15
    `);
    
    console.log("=== LATEST TRANSACTIONS ===");
    for (const row of resTxs.rows) {
      console.log(JSON.stringify(row, null, 2));
    }

    client.release();
  } catch (err) {
    console.error("Database error:", err);
  } finally {
    await pool.end();
  }
}

main();
