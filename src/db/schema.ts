import { pgTable, text, timestamp, real, integer, jsonb } from 'drizzle-orm/pg-core';

// Define the 'users' table
export const users = pgTable('users', {
  id: text('id').primaryKey(), // GOM-XXXXX
  phoneNumber: text('phone_number').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  walletBalance: real('wallet_balance').default(0.0).notNull(),
  welcomeBonus: real('welcome_bonus').default(0.0).notNull(),
  totalEarnings: real('total_earnings').default(0.0).notNull(),
  role: text('role').default('user').notNull(), // 'user' or 'admin'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  currentOrderIndex: integer('current_order_index').default(0).notNull(),
  completedOrderIds: jsonb('completed_order_ids').default([]).notNull(), // array of numbers
  inviteCode: text('invite_code'),
  referredBy: text('referred_by'),
  referralCount: integer('referral_count').default(0).notNull(),
  referralEarnings: real('referral_earnings').default(0.0).notNull(),
  cycleProductOverrides: jsonb('cycle_product_overrides').default([]).notNull(), // list of custom overrides
  lastOrderCompletedAt: text('last_order_completed_at'),
  deviceId: text('device_id'),
  withdrawalBank: text('withdrawal_bank'),
  withdrawalAccNo: text('withdrawal_acc_no'),
  withdrawalAccName: text('withdrawal_acc_name'),
});

// Define the 'transactions' table
export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  userPhone: text('user_phone').notNull(),
  type: text('type').notNull(), // 'recharge', 'withdraw', etc.
  amount: real('amount').notNull(),
  bankName: text('bank_name'),
  accountNumberOrRef: text('account_number_or_ref'),
  accountHolderName: text('account_holder_name'),
  status: text('status').default('pending').notNull(), // 'pending', 'approved', etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
  description: text('description').notNull(),
  screenshot: text('screenshot'), // base64 or url
  taxRef: text('tax_ref'),
  taxScreenshot: text('tax_screenshot'),
});

// Define the 'announcements' table
export const announcements = pgTable('announcements', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Define the 'support_messages' table
export const supportMessages = pgTable('support_messages', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  userPhone: text('user_phone').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  reply: text('reply'),
  status: text('status').default('open').notNull(), // 'open', 'resolved'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Define the 'audit_logs' table
export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  userPhone: text('user_phone').notNull(),
  action: text('action').notNull(),
  details: text('details').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Define the 'recharge_accounts' table
export const rechargeAccounts = pgTable('recharge_accounts', {
  id: text('id').primaryKey(),
  bank: text('bank').notNull(),
  accName: text('acc_name').notNull(),
  accNo: text('acc_no').notNull(),
});

// Define the 'system_config' table
export const systemConfig = pgTable('system_config', {
  key: text('key').primaryKey(), // 'global'
  scalingMultiplier: real('scaling_multiplier').default(1.5).notNull(),
  productCosts: jsonb('product_costs').default([]).notNull(), // array of product costs
  bankLogos: jsonb('bank_logos').default({}).notNull(),
  marketplaceLogos: jsonb('marketplace_logos').default({}).notNull(),
});
