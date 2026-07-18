import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db, eq, desc, and } from './src/db/index.ts';
import { 
  users, 
  transactions, 
  announcements, 
  supportMessages, 
  auditLogs, 
  rechargeAccounts, 
  systemConfig 
} from './src/db/schema.ts';
import * as dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Enable JSON bodies with limit up to 10mb for payment screenshots
app.use(express.json({ limit: '10mb' }));

// Helper to log audit in database
async function dbLogAudit(userId: string, userPhone: string, action: string, details: string) {
  try {
    const id = `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await db.insert(auditLogs).values({
      id,
      userId,
      userPhone,
      action,
      details,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error('[dbLogAudit] Error logging audit:', err);
  }
}

// Check and Seed Database on boot
async function seedDatabaseIfEmpty() {
  try {
    console.log('[Seeder] Checking if database is empty...');
    
    // 1. Check system_config
    const existingConfig = await db.select().from(systemConfig).where(eq(systemConfig.key, 'global'));
    if (existingConfig.length === 0) {
      console.log('[Seeder] Seeding default system configuration...');
      const initialProducts = [
        { id: 1, baseCost: 699, rewardMultiplier: 0.25 },
        { id: 2, baseCost: 995, rewardMultiplier: 0.27 },
        { id: 3, baseCost: 1264, rewardMultiplier: 0.30 },
        { id: 4, baseCost: 2098, rewardMultiplier: 0.32 },
        { id: 5, baseCost: 3200, rewardMultiplier: 0.35 },
        { id: 6, baseCost: 4900, rewardMultiplier: 0.38 },
        { id: 7, baseCost: 7350, rewardMultiplier: 0.40 },
        { id: 8, baseCost: 11000, rewardMultiplier: 0.40 },
        { id: 9, baseCost: 16500, rewardMultiplier: 0.40 },
        { id: 10, baseCost: 24700, rewardMultiplier: 0.40 },
        { id: 11, baseCost: 37000, rewardMultiplier: 0.40 },
        { id: 12, baseCost: 55000, rewardMultiplier: 0.40 },
        { id: 13, baseCost: 82000, rewardMultiplier: 0.40 },
        { id: 14, baseCost: 125000, rewardMultiplier: 0.40 },
        { id: 15, baseCost: 190000, rewardMultiplier: 0.40 }
      ];
      const bankLogos = {
        cbe: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Commercial_Bank_of_Ethiopia_Logo.svg',
        dashen: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Dashen_Bank_logo.png',
        abyssinia: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Bank_of_Abyssinia_logo.png',
        awash: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Awash_Bank_Logo.png',
        telebirr: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Telebirr_logo.png'
      };
      const marketplaceLogos = {
        amazon: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
        ebay: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/EBay_logo.svg',
        walmart: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Walmart_logo.svg',
        shopify: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Shopify_logo_2018.svg',
        alibaba: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Alibaba_Group_logo.svg'
      };
      
      await db.insert(systemConfig).values({
        key: 'global',
        scalingMultiplier: 1.5,
        productCosts: initialProducts,
        bankLogos,
        marketplaceLogos
      });
    }

    // 2. Check users
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      console.log('[Seeder] Seeding default administrator account...');
      const DEFAULT_ADMIN_PASS_HASH = '2b03c89806148889482ecec643b5d0e5fcf3b7b7c87ae5d8b6bfa34e84e1768a'; // SHA-256 for '852121'
      
      // Auto-generated cycle overrides for 15 products
      const overrides = [];
      const alternativePools: { [key: number]: { productName: string; productImage: string }[] } = {
        1: [
          { productName: "Premium Leather Messenger Bag", productImage: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&auto=format&fit=crop&q=60" },
          { productName: "Handcrafted Canvas Utility Backpack", productImage: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&auto=format&fit=crop&q=60" },
          { productName: "Classic Suede Leather Portfolio Case", productImage: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=400&auto=format&fit=crop&q=60" }
        ],
        2: [
          { productName: "Pro Noise-Cancelling Wireless Headphones", productImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=60" },
          { productName: "Ergonomic Mechanical Wireless Keyboard", productImage: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&auto=format&fit=crop&q=60" },
          { productName: "Audiophile Studio Monitor Earbuds", productImage: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&auto=format&fit=crop&q=60" }
        ]
      };

      for (let i = 1; i <= 15; i++) {
        const pool = alternativePools[i] || [
          { productName: `Product Overrides Lvl ${i}`, productImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=60' }
        ];
        overrides.push({
          id: i,
          productName: pool[0].productName,
          productImage: pool[0].productImage
        });
      }

      await db.insert(users).values({
        id: 'GOM-ADMIN',
        phoneNumber: '0951560276',
        passwordHash: DEFAULT_ADMIN_PASS_HASH,
        walletBalance: 1000000,
        welcomeBonus: 0,
        totalEarnings: 0,
        role: 'admin',
        createdAt: new Date(),
        currentOrderIndex: 0,
        completedOrderIds: [],
        inviteCode: 'GOMADMIN',
        cycleProductOverrides: overrides
      });
    }

    // 3. Check announcements
    const existingAnnouncements = await db.select().from(announcements);
    if (existingAnnouncements.length === 0) {
      console.log('[Seeder] Seeding default announcements...');
      await db.insert(announcements).values([
        {
          id: 'ann-1',
          title: '✨ Welcome to GOM!',
          content: 'We are excited to introduce our global e-commerce optimization and smart marketing platform. Join GOM today and receive an instant Welcome Reward after successful registration.\n\nComplete available marketing tasks, support merchant product promotion, and earn rewards through our intelligent task system. Start your journey with GOM and participate in digital commerce opportunities across supported countries worldwide.',
          createdAt: new Date()
        },
        {
          id: 'ann-2',
          title: '🏦 Supported Payment Methods',
          content: 'GOM provides secure deposit and withdrawal options through trusted payment partners available in each supported country and region. Processing times and available payment methods may vary depending on local financial systems and regulations.\n\nUsers can complete transactions through supported local banks, digital payment services, and other approved payment channels available in their country. All payment records and transaction confirmations are handled through secure verification processes to ensure a reliable experience for the global GOM community.',
          createdAt: new Date(Date.now() - 86400000)
        }
      ]);
    }

    // 4. Check bank accounts
    const existingAccounts = await db.select().from(rechargeAccounts);
    if (existingAccounts.length === 0) {
      console.log('[Seeder] Seeding default recharge accounts...');
      await db.insert(rechargeAccounts).values([
        { id: 'acc-1', bank: 'Commercial Bank of Ethiopia (CBE)', accName: 'Ethiopia agent-Leykun jemaneh', accNo: '1000419524747' },
        { id: 'acc-2', bank: 'Telebirr', accName: 'Ethiopia agent-Leykun jemaneh', accNo: '0926193920' }
      ]);
    }

    console.log('[Seeder] Checking and seeding complete.');
  } catch (err) {
    console.error('[Seeder] Error checking or seeding DB:', err);
  }
}

// Trigger seeding
seedDatabaseIfEmpty();

// --- REST API Endpoints ---

// 1. SYSTEM CONFIG
app.get('/api/system-config', async (req, res) => {
  try {
    const list = await db.select().from(systemConfig).where(eq(systemConfig.key, 'global'));
    if (list.length > 0) {
      res.json(list[0]);
    } else {
      res.status(404).json({ error: 'System config not found' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/system-config', async (req, res) => {
  try {
    const { scalingMultiplier, productCosts, bankLogos, marketplaceLogos } = req.body;
    
    const existing = await db.select().from(systemConfig).where(eq(systemConfig.key, 'global'));
    
    if (existing.length > 0) {
      await db.update(systemConfig)
        .set({
          scalingMultiplier: scalingMultiplier ?? existing[0].scalingMultiplier,
          productCosts: productCosts ?? existing[0].productCosts,
          bankLogos: bankLogos ?? existing[0].bankLogos,
          marketplaceLogos: marketplaceLogos ?? existing[0].marketplaceLogos,
        })
        .where(eq(systemConfig.key, 'global'));
    } else {
      await db.insert(systemConfig).values({
        key: 'global',
        scalingMultiplier: scalingMultiplier ?? 1.5,
        productCosts: productCosts ?? [],
        bankLogos: bankLogos ?? {},
        marketplaceLogos: marketplaceLogos ?? {},
      });
    }
    
    const updated = await db.select().from(systemConfig).where(eq(systemConfig.key, 'global'));
    await dbLogAudit('ADMIN', 'ADMIN', 'SYSTEM_CONFIG_UPDATE', 'System configuration updated by Admin');
    res.json(updated[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. RECHARGE ACCOUNTS
app.get('/api/recharge-accounts', async (req, res) => {
  try {
    const list = await db.select().from(rechargeAccounts);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/recharge-accounts', async (req, res) => {
  try {
    const { id, bank, accName, accNo } = req.body;
    
    // Check if account already exists
    const existing = await db.select().from(rechargeAccounts).where(eq(rechargeAccounts.id, id));
    if (existing.length > 0) {
      await db.update(rechargeAccounts)
        .set({ bank, accName, accNo })
        .where(eq(rechargeAccounts.id, id));
    } else {
      await db.insert(rechargeAccounts).values({ id, bank, accName, accNo });
    }
    
    const list = await db.select().from(rechargeAccounts);
    await dbLogAudit('ADMIN', 'ADMIN', 'RECHARGE_ACCOUNT_UPDATE', `Updated/Created recharge account: ${bank} (${accNo})`);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/recharge-accounts/:id', async (req, res) => {
  try {
    await db.delete(rechargeAccounts).where(eq(rechargeAccounts.id, req.params.id));
    const list = await db.select().from(rechargeAccounts);
    await dbLogAudit('ADMIN', 'ADMIN', 'RECHARGE_ACCOUNT_DELETE', `Deleted recharge account ID: ${req.params.id}`);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. ANNOUNCEMENTS
app.get('/api/announcements', async (req, res) => {
  try {
    const list = await db.select().from(announcements).orderBy(desc(announcements.createdAt));
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/announcements', async (req, res) => {
  try {
    const { id, title, content } = req.body;
    await db.insert(announcements).values({
      id,
      title,
      content,
      createdAt: new Date(),
    });
    
    const list = await db.select().from(announcements).orderBy(desc(announcements.createdAt));
    await dbLogAudit('ADMIN', 'ADMIN', 'ANNOUNCEMENT_ADD', `Added announcement: "${title}"`);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/announcements/:id', async (req, res) => {
  try {
    await db.delete(announcements).where(eq(announcements.id, req.params.id));
    const list = await db.select().from(announcements).orderBy(desc(announcements.createdAt));
    await dbLogAudit('ADMIN', 'ADMIN', 'ANNOUNCEMENT_DELETE', `Deleted announcement ID: ${req.params.id}`);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. AUDIT LOGS
app.get('/api/audit-logs', async (req, res) => {
  try {
    const list = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/audit-logs', async (req, res) => {
  try {
    const { id, userId, userPhone, action, details } = req.body;
    await db.insert(auditLogs).values({
      id,
      userId,
      userPhone,
      action,
      details,
      createdAt: new Date(),
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. SUPPORT MESSAGES
app.get('/api/support', async (req, res) => {
  try {
    const list = await db.select().from(supportMessages).orderBy(desc(supportMessages.createdAt));
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/support', async (req, res) => {
  try {
    const { id, userId, userPhone, subject, message } = req.body;
    await db.insert(supportMessages).values({
      id,
      userId,
      userPhone,
      subject,
      message,
      status: 'open',
      createdAt: new Date(),
    });
    
    const list = await db.select().from(supportMessages).orderBy(desc(supportMessages.createdAt));
    await dbLogAudit(userId, userPhone, 'SUPPORT_TICKET_CREATE', `Created support ticket regarding "${subject}"`);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/support/:id', async (req, res) => {
  try {
    const { status, reply } = req.body;
    await db.update(supportMessages)
      .set({ status, reply })
      .where(eq(supportMessages.id, req.params.id));
      
    const list = await db.select().from(supportMessages).orderBy(desc(supportMessages.createdAt));
    await dbLogAudit('ADMIN', 'ADMIN', 'SUPPORT_TICKET_REPLY', `Admin replied/resolved support ticket ID: ${req.params.id}`);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. TRANSACTIONS
app.get('/api/transactions', async (req, res) => {
  try {
    const list = await db.select().from(transactions).orderBy(desc(transactions.createdAt));
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const { id, userId, userPhone, type, amount, bankName, accountNumberOrRef, accountHolderName, status, description, screenshot, taxRef, taxScreenshot } = req.body;
    
    await db.insert(transactions).values({
      id,
      userId,
      userPhone,
      type,
      amount,
      bankName,
      accountNumberOrRef,
      accountHolderName,
      status: status ?? 'pending',
      description,
      screenshot,
      taxRef,
      taxScreenshot,
      createdAt: new Date(),
    });

    const list = await db.select().from(transactions).orderBy(desc(transactions.createdAt));
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update transaction with tax payment info
app.put('/api/transactions/:id/tax-payment', async (req, res) => {
  try {
    const txId = req.params.id;
    const { taxRef, taxScreenshot } = req.body;

    await db.update(transactions)
      .set({
        taxRef,
        taxScreenshot,
        status: 'tax_submitted'
      })
      .where(eq(transactions.id, txId));

    const list = await db.select().from(transactions).orderBy(desc(transactions.createdAt));
    res.json({ success: true, transactions: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. TRANSACTION APPROVAL / REJECTION (ATOMIC)
app.put('/api/transactions/:id/status', async (req, res) => {
  try {
    const txId = req.params.id;
    const { status } = req.body; // 'approved' or 'rejected'
    
    if (status !== 'approved' && status !== 'rejected') {
      return res.status(400).json({ error: 'Invalid transaction status. Must be approved or rejected.' });
    }

    let updatedUsersList;
    let updatedTxsList;

    await db.transaction(async (txDb) => {
      // Retrieve transaction inside transaction block
      const txList = await txDb.select().from(transactions).where(eq(transactions.id, txId));
      if (txList.length === 0) {
        throw new Error('Transaction not found.');
      }
      const tx = txList[0];
      
      if (tx.status !== 'pending' && tx.status !== 'tax_submitted') {
        throw new Error('Transaction is already finalized.');
      }

      // Process user balance updates inside transaction block
      const userToUpdateList = await txDb.select().from(users).where(eq(users.id, tx.userId));
      if (userToUpdateList.length > 0) {
        const userToUpdate = userToUpdateList[0];
        let newBalance = Number(userToUpdate.walletBalance);

        if (status === 'approved' && tx.type === 'recharge') {
          newBalance = Number(userToUpdate.walletBalance) + Number(tx.amount);
        } else if (status === 'rejected' && tx.type === 'withdraw') {
          // Refund if withdrawal rejected
          newBalance = Number(userToUpdate.walletBalance) + Number(tx.amount);
        }

        // Update user wallet balance inside transaction block
        await txDb.update(users)
          .set({ walletBalance: newBalance })
          .where(eq(users.id, tx.userId));
      } else {
        // If the user record was missing remotely (e.g. registered offline), create them on the fly
        if (status === 'approved' && tx.type === 'recharge') {
          await txDb.insert(users).values({
            id: tx.userId,
            phoneNumber: tx.userPhone,
            passwordHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // default fallback hash for 'Password123'
            walletBalance: Number(tx.amount),
            welcomeBonus: 588, // default fallback
            totalEarnings: 0,
            role: 'user',
            createdAt: new Date(),
            currentOrderIndex: 0,
            completedOrderIds: []
          });
        }
      }

      // Update transaction status inside transaction block
      await txDb.update(transactions)
        .set({ status })
        .where(eq(transactions.id, txId));

      await dbLogAudit('ADMIN', 'ADMIN', `${status.toUpperCase()}_TRANSACTION`, `Admin ${status} transaction ${txId} (${tx.type}) of ${tx.amount} ETB for user ${tx.userPhone}`);

      // Fetch the updated lists inside the transaction block
      updatedUsersList = await txDb.select().from(users);
      updatedTxsList = await txDb.select().from(transactions).orderBy(desc(transactions.createdAt));
    });

    res.json({
      success: true,
      users: updatedUsersList,
      transactions: updatedTxsList,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. USERS
app.get('/api/users', async (req, res) => {
  try {
    const list = await db.select().from(users);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create/Update a single user
app.post('/api/users', async (req, res) => {
  try {
    const userToSave = req.body;
    
    const existing = await db.select().from(users).where(eq(users.id, userToSave.id));
    
    // Clean fields that can be null
    const cleaned = {
      id: userToSave.id,
      phoneNumber: userToSave.phoneNumber,
      passwordHash: userToSave.passwordHash,
      walletBalance: Number(userToSave.walletBalance ?? 0),
      welcomeBonus: Number(userToSave.welcomeBonus ?? 0),
      totalEarnings: Number(userToSave.totalEarnings ?? 0),
      role: userToSave.role ?? 'user',
      currentOrderIndex: Number(userToSave.currentOrderIndex ?? 0),
      completedOrderIds: userToSave.completedOrderIds ?? [],
      inviteCode: userToSave.inviteCode ?? null,
      referredBy: userToSave.referredBy ?? null,
      referralCount: Number(userToSave.referralCount ?? 0),
      referralEarnings: Number(userToSave.referralEarnings ?? 0),
      cycleProductOverrides: userToSave.cycleProductOverrides ?? [],
      lastOrderCompletedAt: userToSave.lastOrderCompletedAt ?? null,
      deviceId: userToSave.deviceId ?? null,
      withdrawalBank: userToSave.withdrawalBank ?? null,
      withdrawalAccNo: userToSave.withdrawalAccNo ?? null,
      withdrawalAccName: userToSave.withdrawalAccName ?? null,
    };

    if (existing.length > 0) {
      await db.update(users).set(cleaned).where(eq(users.id, userToSave.id));
    } else {
      await db.insert(users).values({
        ...cleaned,
        createdAt: new Date(),
      });
    }

    const updatedUsers = await db.select().from(users);
    res.json(updatedUsers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk sync users (client-side offline conflict resolution)
app.post('/api/users/sync-bulk', async (req, res) => {
  try {
    const { localUsers } = req.body; // Array of local users
    if (!Array.isArray(localUsers)) {
      return res.status(400).json({ error: 'localUsers must be an array' });
    }

    const dbUsers = await db.select().from(users);

    for (const lu of localUsers) {
      const match = dbUsers.find(ru => ru.id === lu.id);
      
      const cleaned = {
        id: lu.id,
        phoneNumber: lu.phoneNumber,
        passwordHash: lu.passwordHash,
        walletBalance: Number(lu.walletBalance ?? 0),
        welcomeBonus: Number(lu.welcomeBonus ?? 0),
        totalEarnings: Number(lu.totalEarnings ?? 0),
        role: lu.role ?? 'user',
        currentOrderIndex: Number(lu.currentOrderIndex ?? 0),
        completedOrderIds: lu.completedOrderIds ?? [],
        inviteCode: lu.inviteCode ?? null,
        referredBy: lu.referredBy ?? null,
        referralCount: Number(lu.referralCount ?? 0),
        referralEarnings: Number(lu.referralEarnings ?? 0),
        cycleProductOverrides: lu.cycleProductOverrides ?? [],
        lastOrderCompletedAt: lu.lastOrderCompletedAt ?? null,
        deviceId: lu.deviceId ?? null,
        withdrawalBank: lu.withdrawalBank ?? null,
        withdrawalAccNo: lu.withdrawalAccNo ?? null,
        withdrawalAccName: lu.withdrawalAccName ?? null,
      };

      if (!match) {
        // Register/create missing remote user
        await db.insert(users).values({
          ...cleaned,
          createdAt: new Date(),
        });
      } else {
        // Resolve conflict. Prefer the one with higher walletBalance or more completedOrderIds
        const localBal = lu.walletBalance ?? 0;
        const dbBal = match.walletBalance ?? 0;
        const localOrders = lu.completedOrderIds ? lu.completedOrderIds.length : 0;
        const dbOrders = (match.completedOrderIds as any)?.length || 0;

        const localIsPreferred = 
          (localBal > dbBal) || 
          (localOrders > dbOrders) ||
          (localBal === dbBal && localOrders === dbOrders && lu.currentOrderIndex > match.currentOrderIndex);

        if (localIsPreferred) {
          await db.update(users).set(cleaned).where(eq(users.id, lu.id));
        }
      }
    }

    const finalUsers = await db.select().from(users);
    res.json(finalUsers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update single user stage (admin)
app.post('/api/users/update-stage', async (req, res) => {
  try {
    const { userId, newStage } = req.body;
    
    const matchedUsers = await db.select().from(users).where(eq(users.id, userId));
    if (matchedUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userToUpdate = matchedUsers[0];
    const newIndex = Math.max(0, Math.min(14, newStage - 1));
    const completedOrderIds: number[] = [];
    for (let i = 1; i <= newIndex; i++) {
      completedOrderIds.push(i);
    }

    const configRow = await db.select().from(systemConfig).where(eq(systemConfig.key, 'global'));
    const productCosts = (configRow[0]?.productCosts as any[]) || [];

    // Calculate simulated cost and balance for the user
    let userSeed = 0;
    const userIdStr = userId || '';
    for (let i = 0; i < userIdStr.length; i++) {
      userSeed = (userSeed << 5) - userSeed + userIdStr.charCodeAt(i);
      userSeed |= 0;
    }
    userSeed = Math.abs(userSeed);

    const simulatedCosts: { [key: number]: number } = {};
    const simulatedBalances: { [key: number]: number } = {};
    const calculatedPcts: { [key: number]: number } = {};

    for (let i = 1; i <= 15; i++) {
      const prodConf = productCosts.find((p: any) => p.id === i);
      const defaultPct = i === 1 ? 0.25 : 
                         i === 2 ? 0.27 : 
                         i === 3 ? 0.30 : 
                         i === 4 ? 0.32 : 
                         i === 5 ? 0.35 : 
                         i === 6 ? 0.38 : 
                         i === 7 ? 0.40 : 0.40;
      calculatedPcts[i] = i > 7 ? 0.40 : (
        (typeof prodConf?.rewardMultiplier === 'number' && prodConf.rewardMultiplier > 0)
          ? prodConf.rewardMultiplier
          : defaultPct
      );
    }

    const r2 = (n: number) => Math.round(n * 100) / 100;

    const configuredLvl1Cost = productCosts.find((p: any) => p.id === 1)?.baseCost || 699;
    let userLevel1Base = 699;
    if (configuredLvl1Cost === 699) {
      userLevel1Base = 699 + (userSeed % 301); // 699 to 999
    } else {
      const offset = (userSeed % 41) - 20; // stable -20 to +20 offset around configured
      userLevel1Base = Math.max(699, Math.min(999, configuredLvl1Cost + offset));
    }
    const decimalsPool = [0.78, 0.45, 0.12, 0.89, 0.56, 0.23, 0.67, 0.34];
    const decimal1 = decimalsPool[userSeed % decimalsPool.length];
    simulatedCosts[1] = r2(userLevel1Base + decimal1);
    simulatedBalances[1] = r2(simulatedCosts[1] + (simulatedCosts[1] * calculatedPcts[1]));

    for (let k = 2; k <= 15; k++) {
      const decimalK = decimalsPool[(userSeed + k) % decimalsPool.length];
      if (k === 4) {
        simulatedCosts[k] = r2(simulatedBalances[3] + (simulatedBalances[3] * 0.30) + decimalK);
      } else if (k === 8) {
        simulatedCosts[k] = r2(simulatedBalances[7] + (simulatedBalances[7] * 0.38) + decimalK);
      } else if (k === 11) {
        simulatedCosts[k] = r2(simulatedBalances[10] + (simulatedBalances[10] * 0.30) + decimalK);
      } else if (k === 15) {
        simulatedCosts[k] = r2(simulatedBalances[14] + (simulatedBalances[14] * 0.13) + decimalK);
      } else {
        simulatedCosts[k] = r2(simulatedBalances[k - 1] - 5 + (decimalK - 0.5));
      }
      simulatedBalances[k] = r2(simulatedBalances[k - 1] + (simulatedCosts[k] * calculatedPcts[k]));
    }

    const orderCost = simulatedCosts[newStage] || 0;
    const newBalance = orderCost;

    // Sum of rewards for completed orders (1 to newStage - 1)
    let totalEarnings = 0;
    for (let i = 1; i <= newIndex; i++) {
      const prodConf = productCosts.find((p: any) => p.id === i);
      const defaultPct = i === 1 ? 0.25 : 
                         i === 2 ? 0.27 : 
                         i === 3 ? 0.30 : 
                         i === 4 ? 0.32 : 
                         i === 5 ? 0.35 : 
                         i === 6 ? 0.38 : 
                         i === 7 ? 0.40 : 0.40;
      const pct = i > 7 ? 0.40 : (
        (typeof prodConf?.rewardMultiplier === 'number' && prodConf.rewardMultiplier > 0)
          ? prodConf.rewardMultiplier
          : defaultPct
      );
      const cost = simulatedCosts[i] || 0;
      const reward = r2(cost * pct);
      totalEarnings = r2(totalEarnings + reward);
    }

    await db.update(users)
      .set({
        currentOrderIndex: newIndex,
        completedOrderIds,
        walletBalance: newBalance,
        totalEarnings
      })
      .where(eq(users.id, userId));

    await dbLogAudit('ADMIN', 'ADMIN', 'ADMIN_UPDATE_STAGE', `Admin updated task stage for User ID ${userId} to Level ${newStage}. Balance updated to ${newBalance} ETB and total earnings to ${totalEarnings} ETB.`);
    
    const finalUsers = await db.select().from(users);
    res.json({ success: true, users: finalUsers });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Adjust balance manual (admin)
app.post('/api/users/adjust-balance', async (req, res) => {
  try {
    const { userId, amount, transactionId, userPhone, description, type } = req.body;
    
    const matchedUsers = await db.select().from(users).where(eq(users.id, userId));
    if (matchedUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userToUpdate = matchedUsers[0];
    const newBalance = Number(userToUpdate.walletBalance) + Number(amount);
    
    // Update user balance
    await db.update(users)
      .set({ walletBalance: newBalance })
      .where(eq(users.id, userId));

    // Create the manual transaction
    await db.insert(transactions).values({
      id: transactionId,
      userId,
      userPhone,
      type: type ?? 'payment',
      amount: Math.abs(amount),
      status: 'approved',
      createdAt: new Date(),
      description,
    });

    await dbLogAudit('ADMIN', 'ADMIN', 'ADMIN_ADJUST_BALANCE', `Admin adjusted balance for ${userPhone} by ${amount} ETB. New Balance: ${newBalance} ETB`);
    
    const finalUsers = await db.select().from(users);
    const finalTxs = await db.select().from(transactions).orderBy(desc(transactions.createdAt));

    res.json({
      success: true,
      users: finalUsers,
      transactions: finalTxs
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin change password
app.post('/api/users/change-password', async (req, res) => {
  try {
    const { userId, newPasswordHash } = req.body;
    
    await db.update(users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(users.id, userId));

    await dbLogAudit('ADMIN', 'ADMIN', 'ADMIN_CHANGE_PASSWORD', `Admin updated password for User ID ${userId}`);
    
    const finalUsers = await db.select().from(users);
    res.json({ success: true, users: finalUsers });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    await db.delete(users).where(eq(users.id, userId));
    await dbLogAudit('ADMIN', 'ADMIN', 'ADMIN_DELETE_USER', `Admin deleted User ID ${userId}`);
    
    const finalUsers = await db.select().from(users);
    res.json({ success: true, users: finalUsers });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Developer / User Factory Reset Own Account
app.post('/api/factory-reset', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Reset user fields in PostgreSQL
    await db.update(users)
      .set({
        walletBalance: 0,
        welcomeBonus: 0,
        totalEarnings: 0,
        currentOrderIndex: 0,
        completedOrderIds: [],
        lastOrderCompletedAt: null
      })
      .where(eq(users.id, userId));

    // Delete related transactions
    await db.delete(transactions).where(eq(transactions.userId, userId));

    // Delete related support messages
    await db.delete(supportMessages).where(eq(supportMessages.userId, userId));

    // Delete related audit logs
    await db.delete(auditLogs).where(eq(auditLogs.userId, userId));

    // Log the action
    await dbLogAudit(userId, 'USER', 'FACTORY_RESET', `User ${userId} initiated self factory reset`);

    res.json({ success: true, message: 'Account factory reset completed successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET used and generated codes
app.get('/api/recharge-codes', async (req, res) => {
  try {
    const usedList = await db.select().from(systemConfig).where(eq(systemConfig.key, 'used_codes'));
    const generatedList = await db.select().from(systemConfig).where(eq(systemConfig.key, 'generated_codes'));
    
    const usedCodes = usedList.length > 0 ? (usedList[0].productCosts as string[]) : [];
    const generatedCodes = generatedList.length > 0 ? (generatedList[0].productCosts as any[]) : [];
    
    res.json({ usedCodes, generatedCodes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST used code
app.post('/api/recharge-codes/used', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Code is required.' });
    }
    const normalized = code.trim().toUpperCase();
    
    const existing = await db.select().from(systemConfig).where(eq(systemConfig.key, 'used_codes'));
    let currentUsed: string[] = [];
    if (existing.length > 0) {
      currentUsed = existing[0].productCosts as string[];
    }
    
    if (!currentUsed.includes(normalized)) {
      currentUsed.push(normalized);
    }
    
    if (existing.length > 0) {
      await db.update(systemConfig)
        .set({ productCosts: currentUsed })
        .where(eq(systemConfig.key, 'used_codes'));
    } else {
      await db.insert(systemConfig).values({
        key: 'used_codes',
        productCosts: currentUsed,
        bankLogos: {},
        marketplaceLogos: {},
      });
    }
    
    res.json({ success: true, usedCodes: currentUsed });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST generated codes list
app.post('/api/recharge-codes/generated', async (req, res) => {
  try {
    const { generatedCodes } = req.body;
    if (!Array.isArray(generatedCodes)) {
      return res.status(400).json({ error: 'generatedCodes must be an array.' });
    }
    
    const existing = await db.select().from(systemConfig).where(eq(systemConfig.key, 'generated_codes'));
    if (existing.length > 0) {
      await db.update(systemConfig)
        .set({ productCosts: generatedCodes })
        .where(eq(systemConfig.key, 'generated_codes'));
    } else {
      await db.insert(systemConfig).values({
        key: 'generated_codes',
        productCosts: generatedCodes,
        bankLogos: {},
        marketplaceLogos: {},
      });
    }
    
    res.json({ success: true, generatedCodes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// Serve the React frontend (Vite or Static Build)
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running and listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
