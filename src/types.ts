/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'user' | 'admin';

export interface User {
  id: string; // Auto-generated unique User ID (e.g. GOM-XXXXX)
  phoneNumber: string;
  passwordHash: string;
  walletBalance: number; // in ETB
  welcomeBonus: number; // in ETB (typically 500)
  totalEarnings: number; // in ETB
  role: UserRole;
  createdAt: string;
  currentOrderIndex: number; // 0 to 9 (representing orders 1 to 10)
  completedOrderIds: number[]; // track which orders are fully done
  inviteCode?: string; // unique invite code (e.g. GOM12345)
  referredBy?: string; // phone number or user ID of the referrer
  referralCount?: number; // number of successful referrals
  referralEarnings?: number; // total earned from referrals
  cycleProductOverrides?: { id: number; productName: string; productImage: string }[];
  lastOrderCompletedAt?: string; // ISO string representing when the last order task was completed
  deviceId?: string; // unique device identifier to prevent multiple accounts per device
}

export type TransactionType = 'recharge' | 'withdraw' | 'payment' | 'reward' | 'welcome_bonus' | 'referral_bonus';
export type TransactionStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface Transaction {
  id: string;
  userId: string;
  userPhone: string;
  type: TransactionType;
  amount: number; // in ETB
  bankName?: string; // CBE, Dashen, Awash, Abyssinia, etc.
  accountNumberOrRef?: string; // Bank account number for withdrawal, Reference/TXID for recharge
  status: TransactionStatus;
  createdAt: string;
  description: string;
  screenshot?: string; // base64 or object URL representing the payment screenshot
}

export type OrderStatus = 'locked' | 'available' | 'in_cart' | 'completed';

export interface Order {
  id: number; // 1 to 5
  productName: string;
  productImage: string;
  materialCost: number; // ETB
  reward: number; // ETB
  minRechargeRequired: number; // Computed field: Cost - Current Balance (if cost > balance)
  status: OrderStatus;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface SupportMessage {
  id: string;
  userId: string;
  userPhone: string;
  subject: string;
  message: string;
  reply?: string;
  status: 'open' | 'resolved';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userPhone: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface SystemReport {
  totalUsers: number;
  totalRecharged: number;
  totalWithdrawn: number;
  totalRewardsDistributed: number;
  pendingRechargesCount: number;
  pendingWithdrawalsCount: number;
}

export interface RechargeAccount {
  id: string;
  bank: string;
  accName: string;
  accNo: string;
}

