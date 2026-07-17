import pkg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// Custom function to generate random DEP ids
function generateId(prefix) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${result}`;
}

async function main() {
  console.log("=== EXECUTING CREDIT ALL RECHARGES ===");
  const pool = new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
  });

  try {
    const client = await pool.connect();
    
    // 1. Process user 0918297585 (GOM-59934) -> Add 3116 ETB
    const user1 = await client.query("SELECT * FROM users WHERE phone_number = '+251918297585'");
    if (user1.rows.length > 0) {
      const u = user1.rows[0];
      const newBal = Number(u.wallet_balance) + 3116;
      await client.query("UPDATE users SET wallet_balance = $1 WHERE id = $2", [newBal, u.id]);
      console.log(`Updated user ${u.phone_number} (${u.id}) balance from ${u.wallet_balance} to ${newBal} ETB.`);

      // Insert approved transaction
      const txId = generateId('DEP');
      await client.query(
        "INSERT INTO transactions (id, user_id, user_phone, type, amount, bank_name, account_number_or_ref, status, description, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())",
        [txId, u.id, u.phone_number, 'recharge', 3116, 'Commercial Bank of Ethiopia (CBE)', 'FT261966YGRW', 'approved', 'Approved recharge of 3116 ETB via CBE. Reference: FT261966YGRW']
      );
      console.log(`Created transaction record ${txId} for user ${u.phone_number}.`);

      // Log audit
      const auditId = `AUDIT-${Date.now()}-1`;
      await client.query(
        "INSERT INTO audit_logs (id, user_id, user_phone, action, details, created_at) VALUES ($1, $2, $3, $4, $5, NOW())",
        [auditId, 'ADMIN', 'ADMIN', 'MANUAL_CREDIT', `Admin manually credited 3116 ETB to user ${u.phone_number} (GOM-59934) for offline code verification fallback.`]
      );
    } else {
      console.log("User 0918297585 not found.");
    }

    // 2. Process user 0936550707 (GOM-95921) -> Add 200 ETB
    const user2 = await client.query("SELECT * FROM users WHERE phone_number = '+251936550707'");
    if (user2.rows.length > 0) {
      const u = user2.rows[0];
      const newBal = Number(u.wallet_balance) + 200;
      await client.query("UPDATE users SET wallet_balance = $1 WHERE id = $2", [newBal, u.id]);
      console.log(`Updated user ${u.phone_number} (${u.id}) balance from ${u.wallet_balance} to ${newBal} ETB.`);

      // Insert approved transaction
      const txId = generateId('DEP');
      await client.query(
        "INSERT INTO transactions (id, user_id, user_phone, type, amount, bank_name, account_number_or_ref, status, description, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())",
        [txId, u.id, u.phone_number, 'recharge', 200, 'Commercial Bank of Ethiopia (CBE)', 'FT2697HK0DY', 'approved', 'Approved recharge of 200 ETB via CBE. Reference: FT2697HK0DY']
      );
      console.log(`Created transaction record ${txId} for user ${u.phone_number}.`);

      // Log audit
      const auditId = `AUDIT-${Date.now()}-2`;
      await client.query(
        "INSERT INTO audit_logs (id, user_id, user_phone, action, details, created_at) VALUES ($1, $2, $3, $4, $5, NOW())",
        [auditId, 'ADMIN', 'ADMIN', 'MANUAL_CREDIT', `Admin manually credited 200 ETB to user ${u.phone_number} (GOM-95921) for offline code verification fallback.`]
      );
    } else {
      console.log("User 0936550707 not found.");
    }

    // 3. Pre-create user 0936550706 since they have generated codes from yesterday but are missing in PostgreSQL
    const user3 = await client.query("SELECT * FROM users WHERE phone_number = '+251936550706'");
    if (user3.rows.length === 0) {
      console.log("Pre-creating user +251936550706...");
      const uId = 'GOM-95920';
      const welcomeBonus = 588;
      const rechargeAmount = 200;
      const totalBalance = welcomeBonus + rechargeAmount;
      const dummyPassHash = '2b03c89806148889482ecec643b5d0e5fcf3b7b7c87ae5d8b6bfa34e84e1768a'; // SHA-256 for '852121'

      await client.query(
        "INSERT INTO users (id, phone_number, password_hash, wallet_balance, welcome_bonus, total_earnings, role, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())",
        [uId, '+251936550706', dummyPassHash, totalBalance, welcomeBonus, 0.0, 'user']
      );
      console.log(`Created user +251936550706 (GOM-95920) with balance ${totalBalance} ETB (Welcome bonus ${welcomeBonus} + Recharge ${rechargeAmount}).`);

      // Insert approved transaction
      const txId = generateId('DEP');
      await client.query(
        "INSERT INTO transactions (id, user_id, user_phone, type, amount, bank_name, account_number_or_ref, status, description, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())",
        [txId, uId, '+251936550706', 'recharge', 200, 'Commercial Bank of Ethiopia (CBE)', 'FT2697HK0DY', 'approved', 'Approved recharge of 200 ETB via CBE. Reference: FT2697HK0DY']
      );
      console.log(`Created transaction record ${txId} for user +251936550706.`);

      // Log audit
      const auditId = `AUDIT-${Date.now()}-3`;
      await client.query(
        "INSERT INTO audit_logs (id, user_id, user_phone, action, details, created_at) VALUES ($1, $2, $3, $4, $5, NOW())",
        [auditId, 'ADMIN', 'ADMIN', 'MANUAL_CREDIT', `Admin pre-created user +251936550706 with 588 welcome bonus and credited 200 ETB for offline code verification fallback.`]
      );
    } else {
      console.log("User +251936550706 already exists.");
    }

    // 4. Mark all those offline codes as used globally so they can't be reused
    const existing = await client.query("SELECT * FROM system_config WHERE key = 'used_codes'");
    let currentUsed = [];
    if (existing.rows.length > 0) {
      currentUsed = existing.rows[0].product_costs;
    }

    const codesToMark = ['063G9VHCKP', '063EQJE8DI', '063FYCWMDV', '063G87VQSZ', '063FOVFGLG', '063ESUZ654'];
    let addedCount = 0;
    for (const c of codesToMark) {
      if (!currentUsed.includes(c)) {
        currentUsed.push(c);
        addedCount++;
      }
    }

    if (existing.rows.length > 0) {
      await client.query(
        "UPDATE system_config SET product_costs = $1 WHERE key = 'used_codes'",
        [JSON.stringify(currentUsed)]
      );
    } else {
      await client.query(
        "INSERT INTO system_config (key, product_costs, bank_logos, marketplace_logos, scaling_multiplier) VALUES ($1, $2, $3, $4, $5)",
        ['used_codes', JSON.stringify(currentUsed), '{}', '{}', 1.5]
      );
    }
    console.log(`Marked ${addedCount} offline verification codes as used in system_config.`);

    client.release();
    console.log("=== CREDIT ALL RECHARGES SUCCESSFUL ===");
  } catch (err) {
    console.error('Error during credit operations:', err);
  } finally {
    await pool.end();
  }
}

main();
