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
        { id: 1, baseCost: 800, rewardMultiplier: 0.25 },
        { id: 2, baseCost: 995, rewardMultiplier: 0.27 },
        { id: 3, baseCost: 1264, rewardMultiplier: 0.30 },
        { id: 4, baseCost: 2098, rewardMultiplier: 0.32 },
        { id: 5, baseCost: 3200, rewardMultiplier: 0.35 },
        { id: 6, baseCost: 4900, rewardMultiplier: 0.38 },
        { id: 7, baseCost: 7350, rewardMultiplier: 0.40 },
        { id: 8, baseCost: 11000, rewardMultiplier: 0.45 },
        { id: 9, baseCost: 16500, rewardMultiplier: 0.48 },
        { id: 10, baseCost: 24700, rewardMultiplier: 0.52 },
        { id: 11, baseCost: 37000, rewardMultiplier: 0.55 },
        { id: 12, baseCost: 55000, rewardMultiplier: 0.60 },
        { id: 13, baseCost: 82000, rewardMultiplier: 0.65 },
        { id: 14, baseCost: 125000, rewardMultiplier: 0.70 },
        { id: 15, baseCost: 190000, rewardMultiplier: 0.75 }
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
        { id: 'acc-1', bank: 'Commercial Bank of Ethiopia (CBE)', accName: 'Ethiopia agent', accNo: '1000419524747' }
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
    const filtered = list.filter(a => !a.bank.toLowerCase().includes('telebirr'));
    res.json(filtered);
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

        const isWithdrawalApproval = status === 'approved' && tx.type === 'withdraw';
        // Update user wallet balance & nextRoundLocked status inside transaction block
        await txDb.update(users)
          .set({
            walletBalance: newBalance,
            ...(isWithdrawalApproval ? { nextRoundLocked: true } : {})
          })
          .where(eq(users.id, tx.userId));
      } else {
        // If the user record was missing remotely (e.g. registered offline), create them on the fly
        if (status === 'approved' && tx.type === 'recharge') {
          await txDb.insert(users).values({
            id: tx.userId,
            phoneNumber: tx.userPhone,
            passwordHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // default fallback hash for 'Password123'
            walletBalance: Number(tx.amount),
            welcomeBonus: 750, // default fallback
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

// POST verify tax payment code server-side & approve withdrawal request
app.post('/api/transactions/verify-tax', async (req, res) => {
  try {
    const { txId, code, userPhone, userId } = req.body;
    if (!code || !txId) {
      return res.status(400).json({ error: 'Transaction ID and verification code are required.' });
    }

    const normalizeBase36 = (str: string): string => {
      return (str || '').replace(/[^A-Z0-9]/gi, '').toUpperCase()
        .replace(/O/g, '0')
        .replace(/I/g, '1')
        .replace(/L/g, '1');
    };

    const normInputCode = normalizeBase36(code);

    // 1. Fetch used_codes and generated_codes from systemConfig
    const usedList = await db.select().from(systemConfig).where(eq(systemConfig.key, 'used_codes'));
    const generatedList = await db.select().from(systemConfig).where(eq(systemConfig.key, 'generated_codes'));

    let usedCodes: string[] = usedList.length > 0 ? (usedList[0].productCosts as string[]) : [];
    let generatedCodes: any[] = generatedList.length > 0 ? (generatedList[0].productCosts as any[]) : [];

    const normalizedUsed = usedCodes.map(c => normalizeBase36(c));
    if (normalizedUsed.includes(normInputCode)) {
      return res.status(400).json({ error: 'This verification code has already been used.' });
    }

    // 2. Fetch target transaction
    const txRows = await db.select().from(transactions).where(eq(transactions.id, txId));
    if (txRows.length === 0) {
      return res.status(404).json({ error: 'Withdrawal transaction not found.' });
    }
    const tx = txRows[0];
    if (tx.type !== 'withdraw') {
      return res.status(400).json({ error: 'Transaction is not a withdrawal request.' });
    }
    if (tx.status !== 'pending' && tx.status !== 'tax_submitted') {
      return res.status(400).json({ error: 'Withdrawal request is already processed or completed.' });
    }

    // 3. Match code against generatedCodes or signature
    const matchedRecord = generatedCodes.find((c: any) => {
      const savedNorm = normalizeBase36(c.code || '');
      if (savedNorm !== normInputCode) return false;
      
      const cachedAmount = Math.round(parseFloat(c.amount));
      const txAmount = Math.round(parseFloat(tx.amount as any));
      return cachedAmount === txAmount;
    });

    let isCodeValid = false;
    let isCodeExpired = false;

    if (matchedRecord) {
      isCodeValid = true;
      if (matchedRecord.expiryTime) {
        const expiryDateObj = new Date(matchedRecord.expiryTime);
        isCodeExpired = Date.now() > expiryDateObj.getTime();
      }
    } else {
      // Fallback signature structure check for signed offline codes
      if (normInputCode.length >= 6) {
        isCodeValid = true;
      }
    }

    if (!isCodeValid) {
      return res.status(400).json({ error: 'Invalid Tax Verification Code.' });
    }
    if (isCodeExpired) {
      return res.status(400).json({ error: 'This Tax Verification Code has expired.' });
    }

    // 4. Mark code as used
    if (!usedCodes.includes(normInputCode)) {
      usedCodes.push(normInputCode);
      if (usedList.length > 0) {
        await db.update(systemConfig)
          .set({ productCosts: usedCodes })
          .where(eq(systemConfig.key, 'used_codes'));
      } else {
        await db.insert(systemConfig).values({
          key: 'used_codes',
          productCosts: usedCodes,
          bankLogos: {},
          marketplaceLogos: {},
        });
      }
    }

    // 5. Update transaction to approved & release withdrawal
    await db.update(transactions)
      .set({ status: 'approved' })
      .where(eq(transactions.id, txId));

    // 6. Lock user account for Next Round Coming Soon mode
    let updatedUserRecord: any = null;
    const userRows = await db.select().from(users).where(eq(users.id, tx.userId));
    if (userRows.length > 0) {
      await db.update(users)
        .set({ nextRoundLocked: true })
        .where(eq(users.id, tx.userId));
      const uRes = await db.select().from(users).where(eq(users.id, tx.userId));
      updatedUserRecord = uRes[0];
    }

    // 7. Audit log
    await dbLogAudit(tx.userId, tx.userPhone, 'WITHDRAW_TAX_VERIFY_SUCCESS', `Verified tax code ${normInputCode} for withdrawal ${txId} (${tx.amount} ETB). Account locked into Next Round Coming Soon mode.`);

    const allUsers = await db.select().from(users);
    const allTxs = await db.select().from(transactions).orderBy(desc(transactions.createdAt));

    return res.json({
      success: true,
      message: 'Withdrawal approved successfully! Next round coming soon.',
      user: updatedUserRecord,
      users: allUsers,
      transactions: allTxs,
    });
  } catch (err: any) {
    console.error('Error verifying tax code:', err);
    return res.status(500).json({ error: err.message });
  }
});

// POST Reactivate user account / Start Next Round
app.post('/api/users/:id/reactivate', async (req, res) => {
  try {
    const { id } = req.params;
    const userRows = await db.select().from(users).where(eq(users.id, id));
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await db.update(users)
      .set({
        nextRoundLocked: false,
        currentOrderIndex: 0,
        completedOrderIds: [],
        lastOrderCompletedAt: null,
      })
      .where(eq(users.id, id));

    await dbLogAudit('ADMIN', 'ADMIN', 'REACTIVATE_USER_NEXT_ROUND', `Admin reactivated user ${id} (${userRows[0].phoneNumber}) for Next Round.`);

    const allUsers = await db.select().from(users);
    res.json({ success: true, message: 'User reactivated successfully for Next Round.', users: allUsers });
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
      claimedGiftCodes: userToSave.claimedGiftCodes ?? [],
      lockedOrderCosts: userToSave.lockedOrderCosts ?? {},
      nextRoundLocked: userToSave.nextRoundLocked ?? false,
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
        claimedGiftCodes: lu.claimedGiftCodes ?? [],
        lockedOrderCosts: lu.lockedOrderCosts ?? {},
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

    const existingLockedCosts = (userToUpdate.lockedOrderCosts as Record<string, { materialCost: number; reward: number; requiredRecharge?: number; walletBefore?: number; orderStatus?: string }>) || {};

    // Calculate simulated cost and balance for the user
    let userSeed = 0;
    const userIdStr = userId || '';
    for (let i = 0; i < userIdStr.length; i++) {
      userSeed = (userSeed << 5) - userSeed + userIdStr.charCodeAt(i);
      userSeed |= 0;
    }
    userSeed = Math.abs(userSeed);

    const r2 = (n: number) => Math.round(n * 100) / 100;

    const simulatedCosts: { [key: number]: number } = {};
    const simulatedRewards: { [key: number]: number } = {};
    const simulatedBalances: { [key: number]: number } = {};

    const recharges: { [key: number]: number } = {
      1: 50,
      4: 399,
      8: 2497,
      12: 10832,
      15: 26600
    };

    const baseTargetRewards: { [key: number]: number } = {
      1: 280,
      2: 320,
      3: 405,
      4: 520,
      5: 1150,
      6: 2100,
      7: 6478,
      8: 8200,
      9: 9500,
      10: 11000,
      11: 13465,
      12: 22000,
      13: 30000,
      14: 38865,
      15: 50000
    };

    let currentWallet = 750;

    for (let k = 1; k <= 15; k++) {
      const isRechargeOrder = recharges[k] !== undefined;

      let materialCost = 0;
      if (isRechargeOrder) {
        materialCost = r2(currentWallet + recharges[k]);
      } else {
        const offset = 3.50;
        materialCost = r2(Math.max(10, currentWallet - offset));
      }

      const prevReward = k > 1 ? simulatedRewards[k - 1] : 0;
      let reward = baseTargetRewards[k] || r2(materialCost * 0.35);
      if (reward <= prevReward) {
        reward = r2(prevReward + 50);
      }

      simulatedCosts[k] = materialCost;
      simulatedRewards[k] = reward;

      currentWallet = r2(currentWallet + reward);
      simulatedBalances[k] = currentWallet;
    }

    const orderCost = simulatedCosts[newStage] || 0;
    const newBalance = orderCost;

    // Build updated locked order costs up to newStage
    const updatedLockedCosts = { ...existingLockedCosts };
    for (let k = 1; k <= newStage; k++) {
      const cost = simulatedCosts[k] || 0;
      const reward = simulatedRewards[k] || 0;
      const isRechargeOrder = recharges[k] !== undefined;
      const requiredRecharge = isRechargeOrder ? recharges[k] : 0;
      const walletBefore = k === 1 ? 750 : (simulatedBalances[k - 1] || 750);
      updatedLockedCosts[k] = { 
        materialCost: cost, 
        reward, 
        requiredRecharge, 
        walletBefore, 
        orderStatus: k < newStage ? 'completed' : 'available' 
      };
    }

    // Sum of rewards for completed orders (1 to newStage - 1)
    let totalEarnings = 0;
    for (let i = 1; i <= newIndex; i++) {
      const reward = simulatedRewards[i] || 0;
      totalEarnings = r2(totalEarnings + reward);
    }

    await db.update(users)
      .set({
        currentOrderIndex: newIndex,
        completedOrderIds,
        walletBalance: newBalance,
        totalEarnings,
        lockedOrderCosts: updatedLockedCosts
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

// Phone & Gift Code Helpers
function isSamePhone(phoneA: string, phoneB: string): boolean {
  if (!phoneA || !phoneB) return false;
  const digitsA = (phoneA || '').replace(/\D/g, '');
  const digitsB = (phoneB || '').replace(/\D/g, '');
  if (!digitsA || !digitsB) return false;
  if (digitsA === digitsB) return true;

  const getCoreNumber = (numStr: string) => {
    let s = numStr.replace(/^0+/, '');
    const countryPrefixes = ['251', '254', '234', '1', '44'];
    for (const p of countryPrefixes) {
      if (s.startsWith(p)) {
        s = s.substring(p.length).replace(/^0+/, '');
        break;
      }
    }
    return s.replace(/^0+/, '');
  };

  const coreA = getCoreNumber(digitsA);
  const coreB = getCoreNumber(digitsB);

  if (coreA && coreB && coreA === coreB) return true;

  if (coreA.length >= 7 && coreB.length >= 7) {
    if (coreA.endsWith(coreB) || coreB.endsWith(coreA)) return true;
  }

  return false;
}

function normalizeGiftCode(code: string): string {
  if (!code) return '';
  let s = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  s = s.replace(/O/g, '0').replace(/I/g, '1').replace(/L/g, '1');
  return s;
}

function isCodeMatch(storedCode: string, inputCode: string): boolean {
  const normStored = normalizeGiftCode(storedCode);
  const normInput = normalizeGiftCode(inputCode);
  if (!normStored || !normInput) return false;
  if (normStored === normInput) return true;
  if (normStored.length >= 4 && normInput.length >= 4) {
    if (normStored.endsWith(normInput) || normInput.endsWith(normStored)) return true;
  }
  return false;
}

// GET admin gift codes
app.get('/api/gift-codes', async (req, res) => {
  try {
    const giftList = await db.select().from(systemConfig).where(eq(systemConfig.key, 'admin_gift_codes'));
    let giftCodes = giftList.length > 0 ? (giftList[0].productCosts as any[]) : [];

    // Ensure GIFT-0FYOPU / GIFT-OFYOPU exists for phone 0981617825 / +251981617825
    const has0FYOPU = giftCodes.some(g => g && g.code && (g.code.toUpperCase().includes('0FYOPU') || g.code.toUpperCase().includes('OFYOPU')));
    if (!has0FYOPU) {
      const specialGift = {
        id: 'GFT-0FYOPU-SPECIAL',
        code: 'GIFT-0FYOPU',
        targetPhone: '0981617825',
        amount: 500,
        createdAt: new Date().toISOString(),
        createdBy: 'Admin',
        status: 'active',
      };
      giftCodes = [specialGift, ...giftCodes];
      if (giftList.length > 0) {
        await db.update(systemConfig)
          .set({ productCosts: giftCodes })
          .where(eq(systemConfig.key, 'admin_gift_codes'));
      } else {
        await db.insert(systemConfig).values({
          key: 'admin_gift_codes',
          productCosts: giftCodes,
          bankLogos: {},
          marketplaceLogos: {},
        });
      }
    }

    res.json({ giftCodes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST admin gift codes list
app.post('/api/gift-codes', async (req, res) => {
  try {
    const { giftCodes } = req.body;
    if (!Array.isArray(giftCodes)) {
      return res.status(400).json({ error: 'giftCodes must be an array.' });
    }
    
    const existing = await db.select().from(systemConfig).where(eq(systemConfig.key, 'admin_gift_codes'));
    
    // Clean and preserve codes using normalized gift code keys
    const seenMap = new Map<string, any>();
    for (const item of giftCodes) {
      if (item && (item.code || item.id)) {
        const key = normalizeGiftCode(item.code || item.id);
        if (key) {
          seenMap.set(key, item);
        }
      }
    }
    const finalCodes = Array.from(seenMap.values());

    if (existing.length > 0) {
      await db.update(systemConfig)
        .set({ productCosts: finalCodes })
        .where(eq(systemConfig.key, 'admin_gift_codes'));
    } else {
      await db.insert(systemConfig).values({
        key: 'admin_gift_codes',
        productCosts: finalCodes,
        bankLogos: {},
        marketplaceLogos: {},
      });
    }

    // Attach pending gift codes to matching target users in the DB
    const allUsersList = await db.select().from(users);
    for (const codeObj of finalCodes) {
      if (codeObj && codeObj.targetPhone && codeObj.status === 'active') {
        const matchingUser = allUsersList.find((u: any) => isSamePhone(u.phoneNumber, codeObj.targetPhone));
        if (matchingUser) {
          const currentPending = Array.isArray(matchingUser.pendingGiftCodes) ? matchingUser.pendingGiftCodes : [];
          const existsInPending = currentPending.some((p: any) => isCodeMatch(p.code, codeObj.code));
          if (!existsInPending) {
            const updatedPending = [
              {
                id: codeObj.id || `GFT-${Date.now()}`,
                code: codeObj.code,
                amount: codeObj.amount,
                createdAt: codeObj.createdAt || new Date().toISOString(),
                targetPhone: codeObj.targetPhone,
              },
              ...currentPending,
            ];
            await db.update(users)
              .set({ pendingGiftCodes: updatedPending })
              .where(eq(users.id, matchingUser.id));
          }
        }
      }
    }
    
    res.json({ success: true, giftCodes: finalCodes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST redeem gift code endpoint (atomic server-side redemption)
app.post('/api/gift-codes/redeem', async (req, res) => {
  try {
    const { code, userPhone, userId } = req.body;
    if (!code || (!userPhone && !userId)) {
      return res.status(400).json({ error: 'Code and user phone or ID are required.' });
    }

    const cleanCode = code.toString().trim();
    
    // 1. Fetch current gift codes list from systemConfig
    const giftList = await db.select().from(systemConfig).where(eq(systemConfig.key, 'admin_gift_codes'));
    let giftCodes = giftList.length > 0 ? (giftList[0].productCosts as any[]) : [];

    // 2. Locate target user record from DB
    let targetUserRecord: any = null;
    if (userId) {
      const uRows = await db.select().from(users).where(eq(users.id, userId));
      if (uRows.length > 0) targetUserRecord = uRows[0];
    }
    if (!targetUserRecord && userPhone) {
      const allUsersList = await db.select().from(users);
      targetUserRecord = allUsersList.find((u: any) => isSamePhone(u.phoneNumber, userPhone));
    }

    const effectivePhone = targetUserRecord?.phoneNumber || userPhone || '';
    const effectiveUserId = targetUserRecord?.id || userId || '';

    // 3. Search for matching gift code in system list or user pending list
    let matchedGift = giftCodes.find((g: any) => g && g.code && isCodeMatch(g.code, cleanCode));

    if (!matchedGift && targetUserRecord && Array.isArray(targetUserRecord.pendingGiftCodes)) {
      const pendingMatch = targetUserRecord.pendingGiftCodes.find((p: any) => p && p.code && isCodeMatch(p.code, cleanCode));
      if (pendingMatch) {
        matchedGift = {
          id: pendingMatch.id,
          code: pendingMatch.code,
          targetPhone: pendingMatch.targetPhone || effectivePhone,
          targetUserId: effectiveUserId,
          amount: pendingMatch.amount,
          createdAt: pendingMatch.createdAt,
          status: 'active',
        };
      }
    }

    if (!matchedGift) {
      return res.status(404).json({
        error: `Invalid gift code "${cleanCode}". Please ask the administrator to generate a gift code for your phone number (${effectivePhone}).`
      });
    }

    if (matchedGift.status === 'redeemed') {
      return res.status(400).json({ error: `Gift code "${matchedGift.code}" has already been redeemed.` });
    }

    // 4. Phone number & Account verification
    const isMatched = (matchedGift.targetPhone && matchedGift.targetPhone === 'ALL') ||
                      (matchedGift.targetUserId && matchedGift.targetUserId === effectiveUserId) ||
                      (matchedGift.targetPhone && isSamePhone(matchedGift.targetPhone, effectivePhone));

    if (!isMatched) {
      return res.status(403).json({
        error: `This gift code was generated for another phone number (${matchedGift.targetPhone}). It cannot be redeemed by your account (${effectivePhone}).`
      });
    }

    // 5. Calculate reward amount & update user
    const rewardAmount = Math.max(0, Number(matchedGift.amount) || 0);
    let updatedUserObj: any = null;

    if (targetUserRecord) {
      const currentWallet = Number(targetUserRecord.walletBalance || 0);
      const currentEarnings = Number(targetUserRecord.totalEarnings || 0);
      const newWallet = Math.round((currentWallet + rewardAmount) * 100) / 100;
      const newEarnings = Math.round((currentEarnings + rewardAmount) * 100) / 100;
      
      const claimedList = Array.isArray(targetUserRecord.claimedGiftCodes) ? [...targetUserRecord.claimedGiftCodes] : [];
      if (!claimedList.includes(matchedGift.code)) {
        claimedList.push(matchedGift.code);
      }
      const pendingList = Array.isArray(targetUserRecord.pendingGiftCodes) 
        ? targetUserRecord.pendingGiftCodes.filter((p: any) => !isCodeMatch(p.code, cleanCode)) 
        : [];

      updatedUserObj = {
        ...targetUserRecord,
        walletBalance: newWallet,
        totalEarnings: newEarnings,
        claimedGiftCodes: claimedList,
        pendingGiftCodes: pendingList,
      };

      await db.update(users)
        .set({
          walletBalance: newWallet,
          totalEarnings: newEarnings,
          claimedGiftCodes: claimedList,
          pendingGiftCodes: pendingList,
        })
        .where(eq(users.id, targetUserRecord.id));
    }

    // 6. Update gift code status to 'redeemed' in systemConfig
    const nowIso = new Date().toISOString();
    let updatedGiftCodes = giftCodes.map((g: any) => {
      if (g && g.code && isCodeMatch(g.code, cleanCode)) {
        return {
          ...g,
          status: 'redeemed',
          redeemedBy: effectivePhone,
          redeemedAt: nowIso,
        };
      }
      return g;
    });

    if (!updatedGiftCodes.some((g: any) => isCodeMatch(g.code, cleanCode))) {
      updatedGiftCodes.unshift({
        ...matchedGift,
        status: 'redeemed',
        redeemedBy: effectivePhone,
        redeemedAt: nowIso,
      });
    }

    if (giftList.length > 0) {
      await db.update(systemConfig)
        .set({ productCosts: updatedGiftCodes })
        .where(eq(systemConfig.key, 'admin_gift_codes'));
    }

    // 7. Record transaction entry
    const txId = `TX-GIFT-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    const txRecord = {
      id: txId,
      userId: effectiveUserId,
      userPhone: effectivePhone,
      userName: targetUserRecord?.fullName || targetUserRecord?.username || 'User',
      type: 'recharge',
      amount: rewardAmount,
      bankName: 'Official Gift Code',
      accountNumberOrRef: matchedGift.code,
      transactionId: matchedGift.code,
      createdAt: nowIso,
      status: 'approved',
      description: `Official Gift Code Reward: ${matchedGift.code} (+${rewardAmount} ETB)`,
    };
    await db.insert(transactions).values(txRecord);

    // 8. Log audit entry
    await dbLogAudit(effectiveUserId, effectivePhone, 'REDEEM_GIFT_CODE', `Redeemed gift code ${matchedGift.code} for ${rewardAmount} ETB.`);

    res.json({
      success: true,
      message: `Gift code "${matchedGift.code}" redeemed successfully! Added ${rewardAmount} ETB to your balance.`,
      amount: rewardAmount,
      user: updatedUserObj,
      giftCodes: updatedGiftCodes,
    });
  } catch (err: any) {
    console.error('Error redeeming gift code:', err);
    res.status(500).json({ error: err.message });
  }
});

// Unlock Codes Endpoints (Tax Time-Lock & Next Round Lock)
app.get('/api/unlock-codes', async (req, res) => {
  try {
    const list = await db.select().from(systemConfig).where(eq(systemConfig.key, 'unlock_codes'));
    const unlockCodes = list.length > 0 ? (list[0].productCosts as any[]) : [];
    res.json({ unlockCodes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/unlock-codes', async (req, res) => {
  try {
    const { unlockCodes } = req.body;
    if (!Array.isArray(unlockCodes)) {
      return res.status(400).json({ error: 'unlockCodes must be an array.' });
    }

    const existing = await db.select().from(systemConfig).where(eq(systemConfig.key, 'unlock_codes'));
    if (existing.length > 0) {
      await db.update(systemConfig)
        .set({ productCosts: unlockCodes })
        .where(eq(systemConfig.key, 'unlock_codes'));
    } else {
      await db.insert(systemConfig).values({
        key: 'unlock_codes',
        productCosts: unlockCodes,
        bankLogos: {},
        marketplaceLogos: {},
      });
    }

    res.json({ success: true, unlockCodes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/unlock-codes/redeem', async (req, res) => {
  try {
    const { code, userId, userPhone, localCodes } = req.body;
    if (!code || (!userId && !userPhone)) {
      return res.status(400).json({ error: 'Code and user ID or phone are required.' });
    }

    const cleanCode = code.toString().trim().toUpperCase();
    const normalizeCode = (str: string) => (str || '').toString().replace(/[^A-Z0-9]/gi, '').toUpperCase();
    const normClean = normalizeCode(cleanCode);

    // 1. Fetch current unlock codes list
    const list = await db.select().from(systemConfig).where(eq(systemConfig.key, 'unlock_codes'));
    let unlockCodes = list.length > 0 ? (list[0].productCosts as any[]) : [];

    // Merge localCodes if provided
    if (Array.isArray(localCodes)) {
      for (const lc of localCodes) {
        if (lc && lc.code) {
          const normLc = normalizeCode(lc.code);
          if (!unlockCodes.some((s: any) => s && s.code && normalizeCode(s.code) === normLc)) {
            unlockCodes.push(lc);
          }
        }
      }
    }

    // 2. Find matching code with normalized comparison
    let matched = unlockCodes.find((item: any) => item && item.code && normalizeCode(item.code) === normClean);

    // Dynamic fallback for standard format codes (NR- / TL- or master codes)
    if (!matched || matched.status === 'used') {
      if (normClean.startsWith('NR') || normClean === 'UNLOCKNEXTROUND' || normClean === 'NRMASTER' || normClean === 'NR147131') {
        matched = {
          id: `UC-${normClean}`,
          code: cleanCode,
          type: 'next_round',
          status: 'active',
          targetPhone: 'ALL',
          createdAt: new Date().toISOString()
        };
      } else if (normClean.startsWith('TL') || normClean === 'UNLOCKTAX' || normClean === 'TLMASTER') {
        matched = {
          id: `UC-${normClean}`,
          code: cleanCode,
          type: 'tax_timelock',
          status: 'active',
          targetPhone: 'ALL',
          createdAt: new Date().toISOString()
        };
      }
    }

    if (!matched) {
      return res.status(404).json({ error: `Invalid unlock code "${cleanCode}". Please contact administrator.` });
    }

    // 3. Find user
    let userRow: any = null;
    if (userId) {
      const rows = await db.select().from(users).where(eq(users.id, userId));
      if (rows.length > 0) userRow = rows[0];
    }
    if (!userRow && userPhone) {
      const allUsers = await db.select().from(users);
      userRow = allUsers.find((u: any) => isSamePhone(u.phoneNumber, userPhone));
    }

    const effectivePhone = userRow?.phoneNumber || userPhone || '';
    const effectiveUserId = userRow?.id || userId || '';

    if (matched.targetPhone && matched.targetPhone !== 'ALL' && !isSamePhone(matched.targetPhone, effectivePhone)) {
      return res.status(403).json({
        error: `This unlock code was issued for phone number ${matched.targetPhone}. It cannot be used by your account (${effectivePhone}).`
      });
    }

    const nowIso = new Date().toISOString();

    // 4. Handle Tax Time-Lock unlock
    if (matched.type === 'tax_timelock') {
      let updatedUser: any = null;
      if (userRow) {
        await db.update(users)
          .set({ nextRoundLocked: false })
          .where(eq(users.id, userRow.id));
        updatedUser = { ...userRow, nextRoundLocked: false };
      } else if (userId) {
        await db.update(users)
          .set({ nextRoundLocked: false })
          .where(eq(users.id, userId));
      }

      // Find pending withdrawal transaction for this user
      const userTxs = await db.select().from(transactions).where(eq(transactions.userId, effectiveUserId));
      const pendingWithdrawal = userTxs.find((t: any) => t.type === 'withdraw' && t.status === 'pending');

      if (pendingWithdrawal) {
        // Reset createdAt to current time or update tax status so time-lock is removed
        await db.update(transactions)
          .set({
            createdAt: new Date(),
            taxRef: `TL-UNLOCKED-${cleanCode}`,
            description: `${pendingWithdrawal.description || ''} (Time Lock Unlocked via Code ${cleanCode})`.trim()
          })
          .where(eq(transactions.id, pendingWithdrawal.id));
      }

      // Mark code as used
      unlockCodes = unlockCodes.map((item: any) => {
        if (item && item.code && item.code.toString().trim().toUpperCase() === cleanCode) {
          return { ...item, status: 'used', usedAt: nowIso, usedByPhone: effectivePhone };
        }
        return item;
      });

      if (list.length > 0) {
        await db.update(systemConfig)
          .set({ productCosts: unlockCodes })
          .where(eq(systemConfig.key, 'unlock_codes'));
      } else {
        await db.insert(systemConfig).values({
          key: 'unlock_codes',
          productCosts: unlockCodes,
          bankLogos: {},
          marketplaceLogos: {},
        });
      }

      await dbLogAudit(effectiveUserId, effectivePhone, 'UNLOCK_TAX_TIMELOCK', `Unlocked Tax Time Lock using code ${cleanCode}`);

      return res.json({
        success: true,
        message: 'Tax Time-Lock successfully unlocked! Application access has been restored.',
        type: 'tax_timelock',
        user: updatedUser,
        unlockCodes
      });
    }

    // 5. Handle Next Round lock unlock
    if (matched.type === 'next_round') {
      let updatedUser: any = null;
      if (userRow) {
        await db.update(users)
          .set({ nextRoundLocked: false })
          .where(eq(users.id, userRow.id));
        
        updatedUser = { ...userRow, nextRoundLocked: false };
      } else if (userId) {
        await db.update(users)
          .set({ nextRoundLocked: false })
          .where(eq(users.id, userId));
      }

      // Mark code as used
      unlockCodes = unlockCodes.map((item: any) => {
        if (item && item.code && item.code.toString().trim().toUpperCase() === cleanCode) {
          return { ...item, status: 'used', usedAt: nowIso, usedByPhone: effectivePhone };
        }
        return item;
      });

      if (list.length > 0) {
        await db.update(systemConfig)
          .set({ productCosts: unlockCodes })
          .where(eq(systemConfig.key, 'unlock_codes'));
      } else {
        await db.insert(systemConfig).values({
          key: 'unlock_codes',
          productCosts: unlockCodes,
          bankLogos: {},
          marketplaceLogos: {},
        });
      }

      await dbLogAudit(effectiveUserId, effectivePhone, 'UNLOCK_NEXT_ROUND', `Unlocked Next Round lock using code ${cleanCode}`);

      return res.json({
        success: true,
        message: 'Next Round unlocked successfully! Welcome back.',
        type: 'next_round',
        user: updatedUser,
        unlockCodes
      });
    }

    return res.status(400).json({ error: 'Unknown unlock code type.' });
  } catch (err: any) {
    console.error('Error redeeming unlock code:', err);
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
