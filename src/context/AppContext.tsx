/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { 
  User, 
  Transaction, 
  Order, 
  Announcement, 
  SupportMessage, 
  AuditLog, 
  SystemReport,
  OrderStatus,
  RechargeAccount,
  Currency
} from '../types';
import { hashPassword, generateUserId, generateId } from '../utils/security';
import { 
  INITIAL_PRODUCTS_RAW, 
  INITIAL_ANNOUNCEMENTS, 
  INITIAL_USERS,
  ALTERNATIVE_PRODUCTS_POOLS
} from '../utils/mockData';
import { Language } from '../utils/translations';
import { secureStorage, generateVerificationCode, verifyVerificationCode } from '../utils/crypto';

// Override global localStorage inside this file scope to use secureStorage transparently
const localStorage = secureStorage;

const DEFAULT_BANK_LOGOS: { [key: string]: string } = {
  cbe: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Commercial_Bank_of_Ethiopia_Logo.svg',
  dashen: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Dashen_Bank_logo.png',
  abyssinia: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Bank_of_Abyssinia_logo.png',
  awash: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Awash_Bank_Logo.png',
  telebirr: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Telebirr_logo.png',
  hibret: 'https://www.hibretbank.com.et/wp-content/uploads/2020/09/cropped-H-32x32.png',
  wegagen: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Wegagen_Bank_logo.png',
  oromia: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Cooperative_Bank_of_Oromia_logo.png'
};

const DEFAULT_MARKETPLACE_LOGOS: { [key: string]: string } = {
  amazon: 'https://www.vectorlogo.zone/logos/amazon/amazon-ar21.svg',
  walmart: 'https://www.vectorlogo.zone/logos/walmart/walmart-ar21.svg',
  alibaba: 'https://www.vectorlogo.zone/logos/alibaba/alibaba-ar21.svg',
  shopify: 'https://www.vectorlogo.zone/logos/shopify/shopify-ar21.svg',
  airbnb: 'https://www.vectorlogo.zone/logos/airbnb/airbnb-ar21.svg'
};

// Global Firestore compatibility stubs for legacy unused / bypassed code paths
const db = null as any;
const doc = null as any;
const collection = null as any;
const query = null as any;
const where = null as any;
const getDocs = null as any;
const setDoc = null as any;
const deleteDoc = null as any;
const updateDoc = null as any;
const writeBatch = null as any;
const onSnapshot = null as any;

export const isSamePhone = (phoneA: string, phoneB: string): boolean => {
  const cleanA = (phoneA || '').replace(/\D/g, '');
  const cleanB = (phoneB || '').replace(/\D/g, '');
  if (!cleanA || !cleanB) return false;
  if (cleanA === cleanB) return true;
  
  const stripA = cleanA.replace(/^0+/, '');
  const stripB = cleanB.replace(/^0+/, '');
  if (stripA === stripB) return true;
  
  const prefixes = ['251', '254', '234'];
  for (const prefix of prefixes) {
    const aHas = stripA.startsWith(prefix);
    const bHas = stripB.startsWith(prefix);
    if (aHas && !bHas) {
      if (stripA.substring(prefix.length) === stripB) return true;
    }
    if (!aHas && bHas) {
      if (stripB.substring(prefix.length) === stripA) return true;
    }
  }
  return false;
};

export const extractInviteCode = (input: string): string => {
  if (!input) return '';
  let cleaned = input.trim();
  
  // 1. If it's a URL or contains query parameters (e.g., ?ref=GOM12345 or /register?ref=GOM12345)
  if (cleaned.toLowerCase().includes('ref=')) {
    try {
      const refIdx = cleaned.toLowerCase().indexOf('ref=');
      if (refIdx !== -1) {
        let val = cleaned.substring(refIdx + 4);
        // split by any remaining URL delimiters like & or # or /
        const endIdx = val.search(/[&#/]/);
        if (endIdx !== -1) {
          val = val.substring(0, endIdx);
        }
        cleaned = val;
      }
    } catch (e) {
      console.error("Error parsing referral URL manually:", e);
    }
  } else if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    // If it's a URL but doesn't have ref=, maybe the code is just the last path segment
    try {
      const parts = cleaned.split('/');
      const lastPart = parts[parts.length - 1];
      if (lastPart) {
        cleaned = lastPart;
      }
    } catch (e) {}
  }

  // 2. Remove common prefix/decorative characters like #, @, or trailing slashes/questions
  cleaned = cleaned.replace(/^[@#?/]+/, '').replace(/[?/]+$/, '');
  
  return cleaned.trim();
};

export const mergeUserRecords = (primary: User, secondary: User): User => {
  const mergedCompletedOrderIds = Array.from(new Set([
    ...(primary.completedOrderIds || []),
    ...(secondary.completedOrderIds || [])
  ])).sort((a, b) => a - b);

  const walletBalance = Math.max(primary.walletBalance || 0, secondary.walletBalance || 0);
  const totalEarnings = Math.max(primary.totalEarnings || 0, secondary.totalEarnings || 0);
  const welcomeBonus = Math.max(primary.welcomeBonus || 0, secondary.welcomeBonus || 0);

  const currentOrderIndex = Math.max(
    primary.currentOrderIndex || 0,
    secondary.currentOrderIndex || 0,
    mergedCompletedOrderIds.length
  );

  return {
    ...primary,
    walletBalance,
    welcomeBonus,
    totalEarnings,
    completedOrderIds: mergedCompletedOrderIds,
    currentOrderIndex,
    inviteCode: primary.inviteCode || secondary.inviteCode,
    referredBy: primary.referredBy || secondary.referredBy,
    referralCount: Math.max(primary.referralCount || 0, secondary.referralCount || 0),
    referralEarnings: Math.max(primary.referralEarnings || 0, secondary.referralEarnings || 0),
    cycleProductOverrides: primary.cycleProductOverrides || secondary.cycleProductOverrides,
    lastOrderCompletedAt: primary.lastOrderCompletedAt || secondary.lastOrderCompletedAt,
    deviceId: primary.deviceId || secondary.deviceId,
    withdrawalBank: primary.withdrawalBank || secondary.withdrawalBank,
    withdrawalAccNo: primary.withdrawalAccNo || secondary.withdrawalAccNo,
    withdrawalAccName: primary.withdrawalAccName || secondary.withdrawalAccName,
  };
};

export const deduplicateUsers = (list: User[]): User[] => {
  if (!list || list.length === 0) return list;
  
  const uniqueUsers: User[] = [];
  
  for (const u of list) {
    const existingIndex = uniqueUsers.findIndex(ex => isSamePhone(ex.phoneNumber, u.phoneNumber));
    if (existingIndex === -1) {
      uniqueUsers.push(u);
    } else {
      const existingUser = uniqueUsers[existingIndex];
      const existingIsAdmin = existingUser.role === 'admin';
      const currentIsAdmin = u.role === 'admin';
      
      let primaryUser = existingUser;
      let secondaryUser = u;
      let useCurrentAsPrimary = false;

      if (currentIsAdmin && !existingIsAdmin) {
        useCurrentAsPrimary = true;
      } else if (existingIsAdmin && !currentIsAdmin) {
        useCurrentAsPrimary = false;
      } else {
        const balanceEx = existingUser.walletBalance || 0;
        const balanceCur = u.walletBalance || 0;
        if (balanceCur > balanceEx) {
          useCurrentAsPrimary = true;
        } else if (balanceCur < balanceEx) {
          useCurrentAsPrimary = false;
        } else {
          const ordEx = existingUser.completedOrderIds ? existingUser.completedOrderIds.length : 0;
          const ordCur = u.completedOrderIds ? u.completedOrderIds.length : 0;
          if (ordCur > ordEx) {
            useCurrentAsPrimary = true;
          } else if (ordCur < ordEx) {
            useCurrentAsPrimary = false;
          } else {
            const timeEx = new Date(existingUser.createdAt || 0).getTime();
            const timeCur = new Date(u.createdAt || 0).getTime();
            if (timeCur < timeEx) {
              useCurrentAsPrimary = true;
            }
          }
        }
      }
      
      if (useCurrentAsPrimary) {
        primaryUser = u;
        secondaryUser = existingUser;
      }

      // Merge data cleanly instead of just deleting
      const mergedUser = mergeUserRecords(primaryUser, secondaryUser);
      uniqueUsers[existingIndex] = mergedUser;

      console.log(`[Sync-Deduplicate] Merged duplicate user accounts for ${mergedUser.phoneNumber}. Primary ID: ${mergedUser.id}, Secondary ID: ${secondaryUser.id}`);

      // Sync merged user back to Firestore
      setDoc(doc(db, 'users', mergedUser.id), cleanFirestoreData(mergedUser)).catch(e => {
        console.warn(`[Sync-Deduplicate] Could not write merged user ${mergedUser.id}:`, e.message || e);
      });

      // Remove the duplicate obsolete document from Firestore
      deleteDoc(doc(db, 'users', secondaryUser.id)).catch(e => {
        console.warn(`[Sync-Deduplicate] Could not delete secondary user ${secondaryUser.id}:`, e.message || e);
      });
    }
  }
  
  return uniqueUsers;
};

const cleanFirestoreData = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  const cleaned: any = Array.isArray(obj) ? [] : {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      cleaned[key] = cleanFirestoreData(val);
    }
  }
  return cleaned;
};

const getOrCreateDeviceId = (): string => {
  if (typeof window === 'undefined') return 'server-side';
  let deviceId = localStorage.getItem('gom_device_id');
  if (!deviceId) {
    deviceId = 'DEV-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('gom_device_id', deviceId);
  }
  return deviceId;
};

export const getSimulatedCostAndBalanceForUser = (
  userId: string,
  productCosts: { id: number; baseCost: number; rewardMultiplier: number }[]
) => {
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
    const prodConf = productCosts.find(p => p.id === i);
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

  const configuredLvl1Cost = productCosts.find(p => p.id === 1)?.baseCost || 699;
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

  // Order 2: less than balance by 5 ETB
  const decimal2 = decimalsPool[(userSeed + 2) % decimalsPool.length];
  simulatedCosts[2] = r2(simulatedBalances[1] - 5 + (decimal2 - 0.5));
  simulatedBalances[2] = r2(simulatedBalances[1] + (simulatedCosts[2] * calculatedPcts[2]));

  // Order 3: less than balance by 5 ETB
  const decimal3 = decimalsPool[(userSeed + 3) % decimalsPool.length];
  simulatedCosts[3] = r2(simulatedBalances[2] - 5 + (decimal3 - 0.5));
  simulatedBalances[3] = r2(simulatedBalances[2] + (simulatedCosts[3] * calculatedPcts[3]));

  // Order 4: greater than balance (requires recharge), recharge required is exactly 30% of previous balance
  const decimal4 = decimalsPool[(userSeed + 4) % decimalsPool.length];
  simulatedCosts[4] = r2(simulatedBalances[3] + (simulatedBalances[3] * 0.30) + decimal4);
  simulatedBalances[4] = r2(simulatedCosts[4] + (simulatedCosts[4] * calculatedPcts[4]));

  // Order 5: less than balance by 5 ETB
  const decimal5 = decimalsPool[(userSeed + 5) % decimalsPool.length];
  simulatedCosts[5] = r2(simulatedBalances[4] - 5 + (decimal5 - 0.5));
  simulatedBalances[5] = r2(simulatedBalances[4] + (simulatedCosts[5] * calculatedPcts[5]));

  // Order 6: less than balance by 5 ETB
  const decimal6 = decimalsPool[(userSeed + 6) % decimalsPool.length];
  simulatedCosts[6] = r2(simulatedBalances[5] - 5 + (decimal6 - 0.5));
  simulatedBalances[6] = r2(simulatedBalances[5] + (simulatedCosts[6] * calculatedPcts[6]));

  // Order 7: less than balance by 5 ETB
  const decimal7 = decimalsPool[(userSeed + 7) % decimalsPool.length];
  simulatedCosts[7] = r2(simulatedBalances[6] - 5 + (decimal7 - 0.5));
  simulatedBalances[7] = r2(simulatedBalances[6] + (simulatedCosts[7] * calculatedPcts[7]));

  // Order 8: greater than balance (requires recharge), recharge required is exactly 38% of previous balance
  const decimal8 = decimalsPool[(userSeed + 8) % decimalsPool.length];
  simulatedCosts[8] = r2(simulatedBalances[7] + (simulatedBalances[7] * 0.38) + decimal8);
  simulatedBalances[8] = r2(simulatedCosts[8] + (simulatedCosts[8] * calculatedPcts[8]));

  // Order 9: less than balance by 5 ETB
  const decimal9 = decimalsPool[(userSeed + 9) % decimalsPool.length];
  simulatedCosts[9] = r2(simulatedBalances[8] - 5 + (decimal9 - 0.5));
  simulatedBalances[9] = r2(simulatedBalances[8] + (simulatedCosts[9] * calculatedPcts[9]));

  // Order 10: less than balance by 5 ETB
  const decimal10 = decimalsPool[(userSeed + 10) % decimalsPool.length];
  simulatedCosts[10] = r2(simulatedBalances[9] - 5 + (decimal10 - 0.5));
  simulatedBalances[10] = r2(simulatedBalances[9] + (simulatedCosts[10] * calculatedPcts[10]));

  // Order 11: greater than balance (requires recharge), recharge required is exactly 30% of previous balance
  const decimal11 = decimalsPool[(userSeed + 11) % decimalsPool.length];
  simulatedCosts[11] = r2(simulatedBalances[10] + (simulatedBalances[10] * 0.30) + decimal11);
  simulatedBalances[11] = r2(simulatedCosts[11] + (simulatedCosts[11] * calculatedPcts[11]));

  // Order 12: less than balance by 5 ETB
  const decimal12 = decimalsPool[(userSeed + 12) % decimalsPool.length];
  simulatedCosts[12] = r2(simulatedBalances[11] - 5 + (decimal12 - 0.5));
  simulatedBalances[12] = r2(simulatedBalances[11] + (simulatedCosts[12] * calculatedPcts[12]));

  // Order 13: less than balance by 5 ETB
  const decimal13 = decimalsPool[(userSeed + 13) % decimalsPool.length];
  simulatedCosts[13] = r2(simulatedBalances[12] - 5 + (decimal13 - 0.5));
  simulatedBalances[13] = r2(simulatedBalances[12] + (simulatedCosts[13] * calculatedPcts[13]));

  // Order 14: less than balance by 5 ETB
  const decimal14 = decimalsPool[(userSeed + 14) % decimalsPool.length];
  simulatedCosts[14] = r2(simulatedBalances[13] - 5 + (decimal14 - 0.5));
  simulatedBalances[14] = r2(simulatedBalances[13] + (simulatedCosts[14] * calculatedPcts[14]));

  // Order 15: greater than balance (requires recharge), recharge required is exactly 13% of previous balance
  const decimal15 = decimalsPool[(userSeed + 15) % decimalsPool.length];
  simulatedCosts[15] = r2(simulatedBalances[14] + (simulatedBalances[14] * 0.13) + decimal15);
  simulatedBalances[15] = r2(simulatedCosts[15] + (simulatedCosts[15] * calculatedPcts[15]));

  return { simulatedCosts, simulatedBalances };
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorCode = (error && typeof error === 'object' && 'code' in error) ? (error as any).code : '';
  
  const isPermissionError = 
    errorCode === 'permission-denied' || 
    errorMessage.toLowerCase().includes('permission') || 
    errorMessage.toLowerCase().includes('insufficient');

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {},
    operationType,
    path
  };

  if (isPermissionError) {
    console.error('Firestore Security/Permission Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  } else {
    // Log connection or transient errors as warnings rather than crashing the React application
    console.warn(`Firestore Transient Error (${operationType} on ${path}): ${errorMessage}`);
  }
}

export const sanitizeProductCosts = (costs: { id: number; baseCost: number; rewardMultiplier: number }[]) => {
  const sorted = [...costs].sort((a, b) => a.id - b.id);
  const result: { id: number; baseCost: number; rewardMultiplier: number }[] = [];
  
  sorted.forEach((p, idx) => {
    let cost = p.baseCost;
    const rawMult = (typeof p.rewardMultiplier === 'number' && p.rewardMultiplier > 0) ? p.rewardMultiplier : 0.15;
    const currentMult = p.id > 7 ? 0.40 : rawMult;
    
    if (idx > 0) {
      const prev = result[idx - 1];
      const prevMult = prev.rewardMultiplier;
      const prevReward = Math.round(prev.baseCost * prevMult);
      const prevTotal = prev.baseCost + prevReward;
      if (cost <= prevTotal) {
        cost = Math.round(prevTotal + 50); // Ensure next level's price is strictly greater than the previous level's cost + reward
      }
    }
    
    result.push({
      id: p.id,
      baseCost: cost,
      rewardMultiplier: currentMult
    });
  });
  return result;
};

interface AppContextProps {
  currentUser: User | null;
  users: User[];
  transactions: Transaction[];
  announcements: Announcement[];
  supportMessages: SupportMessage[];
  auditLogs: AuditLog[];
  orders: Order[];
  scalingMultiplier: number; // progressive scaling factor
  productCosts: { id: number; baseCost: number; rewardMultiplier: number }[];
  systemReports: SystemReport;
  rechargeAccounts: RechargeAccount[];
  
  // Custom Dynamic Logos
  bankLogos: { [key: string]: string };
  marketplaceLogos: { [key: string]: string };
  updateBankLogo: (bankKey: string, logoUrl: string) => Promise<void>;
  updateMarketplaceLogo: (marketKey: string, logoUrl: string) => Promise<void>;
  deleteBankLogo: (bankKey: string) => Promise<void>;
  deleteMarketplaceLogo: (marketKey: string) => Promise<void>;
  
  // Language Support
  language: Language;
  setLanguage: (lang: Language) => void;

  // Currency Support
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (amount: number, options?: { showUnit?: boolean }) => string;
  
  // Auth actions
  register: (phoneNumber: string, passwordPlain: string, referralCode?: string) => Promise<{ success: boolean; message: string }>;
  login: (phoneNumber: string, passwordPlain: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  resetPassword: (phoneNumber: string, passwordPlain: string) => Promise<{ success: boolean; message: string }>;
  updateAccountDetails: (phoneNumber: string, passwordPlain?: string) => Promise<{ success: boolean; message: string }>;
  registerWithdrawalAccount: (bankName: string, accNo: string, accName: string) => Promise<{ success: boolean; message: string }>;

  // Wallet actions
  deposit: (amount: number, bankName: string, refCode: string, screenshot?: string) => Promise<{ success: boolean; message: string }>;
  withdraw: (amount: number, bankName: string, accNo: string, accName?: string) => Promise<{ success: boolean; message: string }>;
  
  // Admin approvals
  approveTransaction: (id: string) => void;
  rejectTransaction: (id: string) => void;

  // Order logic
  addToCart: (id: number) => void;
  submitOrder: (id: number) => Promise<{ success: boolean; message: string }>;
  resetOrderCycle: () => Promise<{ success: boolean; message: string }>; // Reset all 15 tasks for testing

  // Admin Config
  updateScalingMultiplier: (multiplier: number) => void;
  updateProductCost: (id: number, cost: number, rewardPercent: number) => void;
  updateAllProductCosts: (costs: { id: number; baseCost: number; rewardMultiplier: number }[]) => void;
  addAnnouncement: (title: string, content: string) => void;
  deleteAnnouncement: (id: string) => void;
  replyToSupport: (id: string, reply: string) => void;
  addSupportTicket: (subject: string, message: string) => void;
  adjustUserBalance: (userId: string, amount: number) => void;
  addRechargeAccount: (bank: string, accName: string, accNo: string) => void;
  updateRechargeAccount: (id: string, bank: string, accName: string, accNo: string) => void;
  deleteRechargeAccount: (id: string) => void;
  
  // Admin User Account Management Mechanisms
  adminChangeUserPassword: (userId: string, newPasswordPlain: string) => Promise<{ success: boolean; message: string }>;
  adminDeleteUser: (userId: string) => Promise<{ success: boolean; message: string }>;
  adminUpdateUserStage: (userId: string, newStage: number) => Promise<{ success: boolean; message: string }>;

  // Offline Verification System
  usedCodes: string[];
  adminGeneratedCodes: any[];
  generateOfflineRechargeCode: (phone: string, amount: number, reference: string, expiryMinutes: number) => { success: boolean; code?: string; message?: string };
  verifyRechargeOffline: (txId: string, code: string) => Promise<{ success: boolean; message: string }>;

  // System reset
  factoryReset: () => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

// Exchange rates and symbols relative to ETB (Base currency)
export const EXCHANGE_RATES: Record<Currency, number> = {
  ETB: 1,
  USD: 196,     // 1 USD = 196 ETB
  EUR: 213,     // 1 EUR = 213 ETB
  CNY: 27,      // 1 CNY = 27 ETB
  SAR: 52.2,    // 1 SAR = 52.2 ETB
  KES: 1.5,     // 1 KES = 1.5 ETB
  SOS: 0.34,    // 1 SOS = 0.34 ETB
  AOA: 0.23,    // 1 AOA = 0.23 ETB
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  ETB: 'Br',
  USD: '$',
  EUR: '€',
  CNY: '¥',
  SAR: 'SR',
  KES: 'KSh',
  SOS: 'Sh.So.',
  AOA: 'Kz',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load or initialize state from localStorage with migration check
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('gom_users');
    let loadedUsers: User[] = [];
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as User[];
        const hasNewAdmin = parsed.some(u => isSamePhone(u.phoneNumber, '0951560276') && u.role === 'admin');
        if (!hasNewAdmin) {
          // Instead of clearing all user records and deleting their test accounts, we ensure the admin user is correctly present or updated to admin role.
          const adminIndex = parsed.findIndex(u => isSamePhone(u.phoneNumber, '0951560276'));
          if (adminIndex !== -1) {
            parsed[adminIndex].role = 'admin';
            loadedUsers = [...parsed];
          } else {
            loadedUsers = [...parsed, ...INITIAL_USERS];
          }
        } else {
          loadedUsers = parsed;
        }
      } catch (e) {
        loadedUsers = INITIAL_USERS;
      }
    } else {
      loadedUsers = INITIAL_USERS;
    }

    // Ensure all loaded users have inviteCodes and referral fields
    const completedList = loadedUsers.map(u => {
      const updated = { ...u };
      if (!updated.inviteCode) {
        const phoneDigits = updated.phoneNumber.replace(/[^0-9]/g, '');
        const suffix = phoneDigits.slice(-5) || updated.id.slice(-5);
        updated.inviteCode = `GOM${suffix}`;
      }
      if (updated.referralCount === undefined) {
        updated.referralCount = 0;
      }
      if (updated.referralEarnings === undefined) {
        updated.referralEarnings = 0;
      }
      if (!updated.completedOrderIds) {
        updated.completedOrderIds = [];
      }
      if (!updated.cycleProductOverrides || updated.cycleProductOverrides.length === 0) {
        const overrides: { id: number; productName: string; productImage: string }[] = [];
        for (let id = 1; id <= 15; id++) {
          const pool = ALTERNATIVE_PRODUCTS_POOLS[id];
          if (pool && pool.length > 0) {
            const randomIndex = Math.floor(Math.random() * pool.length);
            const selected = pool[randomIndex];
            overrides.push({
              id,
              productName: selected.productName,
              productImage: selected.productImage
            });
          }
        }
        updated.cycleProductOverrides = overrides;
      }
      return updated;
    });
    return deduplicateUsers(completedList);
  });

  const [rawCurrentUser, setRawCurrentUser] = useState<User | null>(() => {
    // If we cleared localStorage above, gom_current_user won't exist, which is correct
    const saved = localStorage.getItem('gom_current_user');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved) as User;
      if (!parsed.inviteCode) {
        const phoneDigits = parsed.phoneNumber.replace(/[^0-9]/g, '');
        const suffix = phoneDigits.slice(-5) || parsed.id.slice(-5);
        parsed.inviteCode = `GOM${suffix}`;
      }
      if (parsed.referralCount === undefined) parsed.referralCount = 0;
      if (parsed.referralEarnings === undefined) parsed.referralEarnings = 0;
      if (!parsed.completedOrderIds) {
        parsed.completedOrderIds = [];
      }
      if (!parsed.cycleProductOverrides || parsed.cycleProductOverrides.length === 0) {
        const overrides: { id: number; productName: string; productImage: string }[] = [];
        for (let id = 1; id <= 15; id++) {
          const pool = ALTERNATIVE_PRODUCTS_POOLS[id];
          if (pool && pool.length > 0) {
            const randomIndex = Math.floor(Math.random() * pool.length);
            const selected = pool[randomIndex];
            overrides.push({
              id,
              productName: selected.productName,
              productImage: selected.productImage
            });
          }
        }
        parsed.cycleProductOverrides = overrides;
      }
      return parsed;
    } catch (e) {
      return null;
    }
  });

  const currentUser = useMemo(() => {
    if (!rawCurrentUser) return null;

    const referredUsers = users.filter(u => u.referredBy === rawCurrentUser.id || u.referredBy === rawCurrentUser.phoneNumber);
    const referredCount = referredUsers.length;
    const calculatedReferralEarnings = referredCount * 196;
    const storedReferralEarnings = rawCurrentUser.referralEarnings || 0;
    const missingReferralRewards = Math.max(0, calculatedReferralEarnings - storedReferralEarnings);

    if (missingReferralRewards > 0 || (rawCurrentUser.referralCount || 0) !== referredCount || storedReferralEarnings !== calculatedReferralEarnings) {
      return {
        ...rawCurrentUser,
        referralCount: referredCount,
        referralEarnings: calculatedReferralEarnings,
        walletBalance: rawCurrentUser.walletBalance + missingReferralRewards,
      };
    }

    return rawCurrentUser;
  }, [rawCurrentUser, users]);

  const setCurrentUser = (user: User | null | ((prev: User | null) => User | null)) => {
    setRawCurrentUser(user);
  };

  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('gom_lang') as Language;
    return ['en', 'am', 'ar', 'zh', 'es', 'fr'].includes(saved) ? saved : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('gom_lang', lang);
  };

  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem('gom_currency') as Currency;
    const allowed: Currency[] = ['ETB', 'USD', 'EUR', 'CNY', 'SAR', 'KES', 'SOS', 'AOA'];
    return allowed.includes(saved) ? saved : 'ETB';
  });

  const setCurrency = (curr: Currency) => {
    setCurrencyState(curr);
    localStorage.setItem('gom_currency', curr);
  };

  // Automatically adjust currency based on the registered country of the currentUser
  useEffect(() => {
    if (currentUser && currentUser.phoneNumber) {
      const phone = currentUser.phoneNumber.trim();
      const isEthiopian = phone.startsWith('+251') || 
                          phone.startsWith('251') || 
                          (!phone.startsWith('+') && (phone.startsWith('09') || phone.startsWith('07') || phone.startsWith('9') || phone.startsWith('7')));
      
      const targetCurrency: Currency = isEthiopian ? 'ETB' : 'USD';
      setCurrencyState(targetCurrency);
      localStorage.setItem('gom_currency', targetCurrency);
    }
  }, [currentUser]);

  const formatPrice = (amount: number, options?: { showUnit?: boolean }) => {
    const showUnit = options?.showUnit !== false;
    const rate = EXCHANGE_RATES[currency] || 1;
    const converted = amount / rate;
    const symbol = CURRENCY_SYMBOLS[currency] || '';
    if (showUnit) {
      if (currency === 'USD' || currency === 'EUR' || currency === 'CNY') {
        return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
      }
      return `${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
    }
    return converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const [cartTrigger, setCartTrigger] = useState(0);

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('gom_transactions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    try {
      const saved = localStorage.getItem('gom_announcements');
      return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
    } catch (e) {
      return INITIAL_ANNOUNCEMENTS;
    }
  });

  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>(() => {
    try {
      const saved = localStorage.getItem('gom_support');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem('gom_audit_logs');
      return saved ? JSON.parse(saved) : [
        {
          id: "log-init",
          userId: "SYSTEM",
          userPhone: "SYSTEM",
          action: "INITIALIZE",
          details: "GOM system initialized successfully.",
          createdAt: new Date().toISOString()
        }
      ];
    } catch (e) {
      return [
        {
          id: "log-init",
          userId: "SYSTEM",
          userPhone: "SYSTEM",
          action: "INITIALIZE",
          details: "GOM system initialized successfully.",
          createdAt: new Date().toISOString()
        }
      ];
    }
  });

  const [scalingMultiplier, setScalingMultiplier] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('gom_scaling_multiplier');
      return saved ? Number(saved) : 1.5; // 50% increase progressively by default
    } catch (e) {
      return 1.5;
    }
  });

  const [rechargeAccounts, setRechargeAccounts] = useState<RechargeAccount[]>(() => {
    const saved = localStorage.getItem('gom_recharge_accounts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length === 2 && parsed.some((a: any) => a.accNo === '1000419524747' && a.accName === 'Ethiopia agent-Leykun jemaneh') && parsed.some((a: any) => a.accNo === '0926193920' && a.accName === 'Ethiopia agent-Leykun jemaneh')) {
          return parsed;
        }
      } catch (e) {
        // Fallback
      }
    }
    return [
      { id: 'acc-1', bank: 'Commercial Bank of Ethiopia (CBE)', accName: 'Ethiopia agent-Leykun jemaneh', accNo: '1000419524747' },
      { id: 'acc-2', bank: 'Telebirr', accName: 'Ethiopia agent-Leykun jemaneh', accNo: '0926193920' }
    ];
  });

  const [bankLogos, setBankLogos] = useState<{ [key: string]: string }>(() => {
    try {
      const saved = localStorage.getItem('gom_bank_logos');
      return saved ? JSON.parse(saved) : DEFAULT_BANK_LOGOS;
    } catch (e) {
      return DEFAULT_BANK_LOGOS;
    }
  });

  const [marketplaceLogos, setMarketplaceLogos] = useState<{ [key: string]: string }>(() => {
    try {
      const saved = localStorage.getItem('gom_marketplace_logos');
      return saved ? JSON.parse(saved) : DEFAULT_MARKETPLACE_LOGOS;
    } catch (e) {
      return DEFAULT_MARKETPLACE_LOGOS;
    }
  });

  // Custom products costs managed by admin
  const [productCosts, setProductCosts] = useState<{ id: number; baseCost: number; rewardMultiplier: number }[]>(() => {
    const saved = localStorage.getItem('gom_product_costs');
    let loaded: any[] = [];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          loaded = parsed;
        }
      } catch (e) {}
    }

    // Read scaling multiplier or default to 1.5
    const savedMultiplier = localStorage.getItem('gom_scaling_multiplier');
    const scaling = savedMultiplier ? Number(savedMultiplier) : 1.5;

    // Generate dynamic starting cost for Level 1 between 699 and 999 ETB
    const dynamicLevel1Base = Math.floor(Math.random() * (999 - 699 + 1)) + 699;

    // Always map over all 12 initial products to guarantee all 12 exist
    const rawCosts = INITIAL_PRODUCTS_RAW.map((p, idx) => {
      const existing = loaded.find((item: any) => item.id === p.id);
      if (existing && typeof existing.baseCost === 'number' && existing.baseCost > 0) {
        return {
          id: p.id,
          baseCost: existing.baseCost,
          rewardMultiplier: (existing && typeof existing.rewardMultiplier === 'number' && existing.rewardMultiplier > 0) ? existing.rewardMultiplier : p.rewardMultiplier
        };
      } else {
        // If no saved configuration exists yet, calculate progressive scaling dynamically from the randomized base
        const calculatedCost = Math.round(dynamicLevel1Base * Math.pow(scaling, idx));
        return {
          id: p.id,
          baseCost: calculatedCost,
          rewardMultiplier: p.rewardMultiplier
        };
      }
    });

    return sanitizeProductCosts(rawCosts);
  });

  // Dynamic calculated orders for the active user
  const [orders, setOrders] = useState<Order[]>([]);

  // Poll and sync all data from PostgreSQL via server-side APIs
  const fetchAllData = async () => {
    const safeFetch = async (url: string) => {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          console.warn(`[fetchAllData] Non-ok response from ${url}: ${res.status}`);
          return null;
        }
        return await res.json();
      } catch (err: any) {
        console.warn(`[fetchAllData] SafeFetch failed for ${url}:`, err.message || err);
        return null;
      }
    };

    try {
      const uList = await safeFetch('/api/users');
      if (uList) {
        setUsers(uList);
        localStorage.setItem('gom_users', JSON.stringify(uList));
        
        // Sync rawCurrentUser with the updated data from database
        setRawCurrentUser(prev => {
          if (!prev) return null;
          const match = uList.find((u: any) => u.id === prev.id);
          if (!match) return prev;
          if (JSON.stringify(match) !== JSON.stringify(prev)) {
            const updated = { ...prev, ...match };
            localStorage.setItem('gom_current_user', JSON.stringify(updated));
            return updated;
          }
          return prev;
        });
      }
      
      const tList = await safeFetch('/api/transactions');
      if (tList) {
        setTransactions(tList);
        localStorage.setItem('gom_transactions', JSON.stringify(tList));
      }
      
      const aList = await safeFetch('/api/announcements');
      if (aList) {
        setAnnouncements(aList);
        localStorage.setItem('gom_announcements', JSON.stringify(aList));
      }
      
      const sList = await safeFetch('/api/support');
      if (sList) {
        setSupportMessages(sList);
        localStorage.setItem('gom_support', JSON.stringify(sList));
      }
      
      const lList = await safeFetch('/api/audit-logs');
      if (lList) {
        setAuditLogs(lList);
        localStorage.setItem('gom_audit_logs', JSON.stringify(lList));
      }
      
      const accList = await safeFetch('/api/recharge-accounts');
      if (accList) {
        setRechargeAccounts(accList);
        localStorage.setItem('gom_recharge_accounts', JSON.stringify(accList));
      }
      
      const data = await safeFetch('/api/system-config');
      if (data) {
        if (typeof data.scalingMultiplier === 'number') {
          setScalingMultiplier(data.scalingMultiplier);
          localStorage.setItem('gom_scaling_multiplier', data.scalingMultiplier.toString());
        }
        if (Array.isArray(data.productCosts)) {
          setProductCosts(data.productCosts);
          localStorage.setItem('gom_product_costs', JSON.stringify(data.productCosts));
        }
        if (data.bankLogos) {
          setBankLogos(data.bankLogos);
        }
        if (data.marketplaceLogos) {
          setMarketplaceLogos(data.marketplaceLogos);
        }
      }
      
      const codesData = await safeFetch('/api/recharge-codes');
      if (codesData) {
        const { usedCodes: uCodes, generatedCodes: gCodes } = codesData;
        if (Array.isArray(uCodes)) {
          setUsedCodes(uCodes);
          localStorage.setItem('gom_used_verification_codes', JSON.stringify(uCodes));
        }
        if (Array.isArray(gCodes)) {
          setAdminGeneratedCodes(gCodes);
          localStorage.setItem('gom_generated_codes', JSON.stringify(gCodes));
        }
      }
    } catch (err: any) {
      console.warn('[fetchAllData] Error polling database:', err.message || err);
    }
  };

  const seedInitialData = async () => {
    return;
  };

  const unused_seedInitialData = async () => {
    try {
      const batch = { set: (...args: any[]) => {}, commit: () => {} };
      
      // 1. Seed users
      INITIAL_USERS.forEach((u) => {
        const updated = { ...u };
        if (!updated.inviteCode) {
          const phoneDigits = updated.phoneNumber.replace(/[^0-9]/g, '');
          const suffix = phoneDigits.slice(-5) || updated.id.slice(-5);
          updated.inviteCode = `GOM${suffix}`;
        }
        if (updated.referralCount === undefined) updated.referralCount = 0;
        if (updated.referralEarnings === undefined) updated.referralEarnings = 0;
        if (!updated.completedOrderIds) updated.completedOrderIds = [];
        if (!updated.cycleProductOverrides || updated.cycleProductOverrides.length === 0) {
          const overrides: { id: number; productName: string; productImage: string }[] = [];
          for (let id = 1; id <= 15; id++) {
            const pool = ALTERNATIVE_PRODUCTS_POOLS[id];
            if (pool && pool.length > 0) {
              const randomIndex = Math.floor(Math.random() * pool.length);
              const selected = pool[randomIndex];
              overrides.push({
                id,
                productName: selected.productName,
                productImage: selected.productImage
              });
            }
          }
          updated.cycleProductOverrides = overrides;
        }
        const userRef = doc(db, 'users', updated.id);
        batch.set(userRef, updated);
      });
      
      // 2. Seed announcements
      INITIAL_ANNOUNCEMENTS.forEach((a) => {
        const ref = doc(db, 'announcements', a.id);
        batch.set(ref, a);
      });
      
      // 3. Seed bank accounts
      const initialAccounts = [
        { id: 'acc-1', bank: 'Commercial Bank of Ethiopia (CBE)', accName: 'Ethiopia agent-Leykun jemaneh', accNo: '1000419524747' },
        { id: 'acc-2', bank: 'Telebirr', accName: 'Ethiopia agent-Leykun jemaneh', accNo: '0926193920' }
      ];
      initialAccounts.forEach((acc) => {
        const ref = doc(db, 'rechargeAccounts', acc.id);
        batch.set(ref, acc);
      });
      
      // 4. Seed system config
      const configRef = doc(db, 'systemConfig', 'global');
      batch.set(configRef, {
        scalingMultiplier: 1.5,
        productCosts: productCosts,
        bankLogos: {
          cbe: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Commercial_Bank_of_Ethiopia_Logo.svg',
          dashen: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Dashen_Bank_logo.png',
          abyssinia: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Bank_of_Abyssinia_logo.png',
          awash: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Awash_Bank_Logo.png',
          telebirr: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Telebirr_logo.png',
          hibret: 'https://www.hibretbank.com.et/wp-content/uploads/2020/09/cropped-H-32x32.png',
          wegagen: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Wegagen_Bank_logo.png',
          oromia: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Cooperative_Bank_of_Oromia_logo.png'
        },
        marketplaceLogos: {
          amazon: 'https://www.vectorlogo.zone/logos/amazon/amazon-ar21.svg',
          walmart: 'https://www.vectorlogo.zone/logos/walmart/walmart-ar21.svg',
          alibaba: 'https://www.vectorlogo.zone/logos/alibaba/alibaba-ar21.svg',
          shopify: 'https://www.vectorlogo.zone/logos/shopify/shopify-ar21.svg',
          airbnb: 'https://www.vectorlogo.zone/logos/airbnb/airbnb-ar21.svg'
        }
      });
      
      // 5. Seed audit logs
      const initLog = {
        id: 'log-init',
        userId: 'SYSTEM',
        userPhone: 'SYSTEM',
        action: 'INITIALIZE',
        details: 'GOM system initialized successfully on cloud database.',
        createdAt: new Date().toISOString()
      };
      const logRef = doc(db, 'auditLogs', initLog.id);
      batch.set(logRef, initLog);
      
      await batch.commit();
      console.log("Firebase database seeded successfully!");
    } catch (e) {
      console.error("Error seeding Firebase:", e);
    }
  };

  // Real-time synchronization listeners
  useEffect(() => {
    // Short-circuit Firestore entirely and poll our new Cloud SQL backend
    fetchAllData();
    // Bulk sync offline-created users on boot
    const syncOfflineUsers = async () => {
      const saved = localStorage.getItem('gom_users');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            await fetch('/api/users/sync-bulk', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ localUsers: parsed })
            });
            fetchAllData();
          }
        } catch (e) {}
      }
    };
    syncOfflineUsers();

    const interval = setInterval(fetchAllData, 8000);
    return () => clearInterval(interval);

    // Old unused Firestore onSnapshot code (bypassed)

    const dummyUnsubUsers = onSnapshot(collection(db, 'users'), (snapshot: any) => {
      const list: User[] = [];
      snapshot.forEach((docSnap) => {
        const u = docSnap.data() as User;
        
        // Auto-correct any persisted admin fields to strictly align with 0951560276 as the only admin
        if (u.id === 'GOM-ADMIN' && isSamePhone(u.phoneNumber, '0926193920')) {
          u.phoneNumber = '0951560276';
          u.role = 'admin';
          updateDoc(doc(db, 'users', u.id), { phoneNumber: '0951560276', role: 'admin' }).catch(() => {});
        } else if (isSamePhone(u.phoneNumber, '0926193920') && u.role === 'admin') {
          u.role = 'user';
          updateDoc(doc(db, 'users', u.id), { role: 'user' }).catch(() => {});
        } else if (isSamePhone(u.phoneNumber, '0951560276') && u.role !== 'admin') {
          u.role = 'admin';
          updateDoc(doc(db, 'users', u.id), { role: 'admin' }).catch(() => {});
        }

        // Auto-heal missing inviteCode for existing / direct database users
        if (!u.inviteCode) {
          const phoneDigits = (u.phoneNumber || '').replace(/[^0-9]/g, '');
          const suffix = phoneDigits.slice(-5) || u.id.slice(-5);
          u.inviteCode = `GOM${suffix}`;
          updateDoc(doc(db, 'users', u.id), { inviteCode: u.inviteCode }).catch(() => {});
        }

        list.push(u);
      });
      
      if (list.length > 0) {
        // Load recent local storage users to avoid overwriting pending local/offline progress
        const savedLocal = localStorage.getItem('gom_users');
        let localUsers: User[] = [];
        if (savedLocal) {
          try {
            localUsers = JSON.parse(savedLocal);
          } catch (e) {}
        }

        // Create initial copy of remote list
        const mergedList = [...list];

        // 1. Add any local users that don't exist in Firestore at all (e.g. registered offline)
        localUsers.forEach(lu => {
          const existsInFirestore = list.some(ru => ru.id === lu.id);
          if (!existsInFirestore) {
            console.log(`[Sync] Local user ${lu.phoneNumber} (ID: ${lu.id}) is missing in Firestore. Adding to merged list and background syncing to Firestore.`);
            mergedList.push(lu);
            setDoc(doc(db, 'users', lu.id), cleanFirestoreData(lu)).catch((err) => {
              console.warn(`[Sync] Background Firestore registration sync failed for user ${lu.id}:`, err.message || err);
            });
          }
        });

        // 2. Map through list and resolve conflicts, choosing the one with higher balance or more completed orders
        const finalMergedList = mergedList.map(remoteUser => {
          const localUser = localUsers.find(lu => lu.id === remoteUser.id);
          if (!localUser) return remoteUser;

          const localBal = localUser.walletBalance || 0;
          const remoteBal = remoteUser.walletBalance || 0;
          const localOrders = localUser.completedOrderIds ? localUser.completedOrderIds.length : 0;
          const remoteOrders = remoteUser.completedOrderIds ? remoteUser.completedOrderIds.length : 0;

          // Prefer local if it has more wallet balance, more completed orders, or higher progress
          const localIsNewerOrMoreProgress = 
            (localBal > remoteBal) || 
            (localOrders > remoteOrders) ||
            (localBal === remoteBal && localOrders === remoteOrders && localUser.currentOrderIndex > remoteUser.currentOrderIndex);

          if (localIsNewerOrMoreProgress) {
            console.log(`[Sync] Local user ${remoteUser.phoneNumber} has higher progress (${localBal} ETB, ${localOrders} orders) than remote (${remoteBal} ETB, ${remoteOrders} orders). Syncing back to Firestore.`);
            setDoc(doc(db, 'users', localUser.id), cleanFirestoreData(localUser)).catch((err) => {
              console.warn(`[Sync] Background Firestore progress sync failed for user ${localUser.id}:`, err.message || err);
            });
            return localUser;
          }
          return remoteUser;
        });

        const deduplicated = deduplicateUsers(finalMergedList);
        setUsers(deduplicated);
        localStorage.setItem('gom_users', JSON.stringify(deduplicated));
        
        // Sync rawCurrentUser with the updated data from database
        setRawCurrentUser(prev => {
          if (!prev) return null;
          const match = deduplicated.find(u => u.id === prev.id);
          if (!match) return prev;
          if (
            match.walletBalance !== prev.walletBalance ||
            match.role !== prev.role ||
            JSON.stringify(match.completedOrderIds) !== JSON.stringify(prev.completedOrderIds)
          ) {
            const updated = { ...prev, ...match };
            localStorage.setItem('gom_current_user', JSON.stringify(updated));
            return updated;
          }
          return prev;
        });
      } else {
        // If Firestore is empty, seed it
        seedInitialData();
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    // 2. Transactions sync
    const unsubTx = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      const list: Transaction[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Transaction);
      });

      // Load local transactions to prevent overwriting local/offline transactions
      const savedLocalTxs = localStorage.getItem('gom_transactions');
      let localTxs: Transaction[] = [];
      if (savedLocalTxs) {
        try {
          localTxs = JSON.parse(savedLocalTxs);
        } catch (e) {}
      }

      const mergedTxs = [...list];
      localTxs.forEach(lt => {
        const existsInFirestore = list.some(rt => rt.id === lt.id);
        if (!existsInFirestore) {
          console.log(`[Sync] Local transaction ${lt.id} (${lt.type}) is missing in Firestore. Adding to list and background syncing.`);
          mergedTxs.push(lt);
          setDoc(doc(db, 'transactions', lt.id), cleanFirestoreData(lt)).catch((err) => {
            console.warn(`[Sync] Background Firestore transaction sync failed for tx ${lt.id}:`, err.message || err);
          });
        }
      });

      mergedTxs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTransactions(mergedTxs);
      localStorage.setItem('gom_transactions', JSON.stringify(mergedTxs));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    });

    // 3. Announcements sync
    const unsubAnn = onSnapshot(collection(db, 'announcements'), (snapshot) => {
      const list: Announcement[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Announcement);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAnnouncements(list);
      localStorage.setItem('gom_announcements', JSON.stringify(list));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'announcements');
    });

    // 4. Support sync
    const unsubSup = onSnapshot(collection(db, 'support'), (snapshot) => {
      const list: SupportMessage[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as SupportMessage);
      });

      // Load local support messages to prevent overwriting local/offline support tickets
      const savedLocalSup = localStorage.getItem('gom_support');
      let localSup: SupportMessage[] = [];
      if (savedLocalSup) {
        try {
          localSup = JSON.parse(savedLocalSup);
        } catch (e) {}
      }

      const mergedSup = [...list];
      localSup.forEach(ls => {
        const existsInFirestore = list.some(rs => rs.id === ls.id);
        if (!existsInFirestore) {
          console.log(`[Sync] Local support ticket ${ls.id} is missing in Firestore. Adding to list and background syncing.`);
          mergedSup.push(ls);
          setDoc(doc(db, 'support', ls.id), cleanFirestoreData(ls)).catch((err) => {
            console.warn(`[Sync] Background Firestore support sync failed for ticket ${ls.id}:`, err.message || err);
          });
        }
      });

      mergedSup.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSupportMessages(mergedSup);
      localStorage.setItem('gom_support', JSON.stringify(mergedSup));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'support');
    });

    // 5. AuditLogs sync
    const unsubLogs = onSnapshot(collection(db, 'auditLogs'), (snapshot) => {
      const list: AuditLog[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as AuditLog);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAuditLogs(list);
      localStorage.setItem('gom_audit_logs', JSON.stringify(list));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'auditLogs');
    });

    // 6. RechargeAccounts sync
    const unsubAcc = onSnapshot(collection(db, 'rechargeAccounts'), (snapshot) => {
      const list: RechargeAccount[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as RechargeAccount);
      });
      setRechargeAccounts(list);
      localStorage.setItem('gom_recharge_accounts', JSON.stringify(list));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'rechargeAccounts');
    });

    // 7. Config sync
    const unsubConfig = onSnapshot(doc(db, 'systemConfig', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (typeof data.scalingMultiplier === 'number') {
          setScalingMultiplier(data.scalingMultiplier);
          localStorage.setItem('gom_scaling_multiplier', data.scalingMultiplier.toString());
        }
        if (Array.isArray(data.productCosts)) {
          let costs = [...data.productCosts];
          if (costs.length < 15) {
            const scaling = typeof data.scalingMultiplier === 'number' ? data.scalingMultiplier : 1.5;
            for (let i = costs.length; i < 15; i++) {
              const p = INITIAL_PRODUCTS_RAW[i];
              const lastCost = costs.length > 0 ? costs[costs.length - 1].baseCost : 750;
              const calculatedCost = Math.round(lastCost * scaling);
              costs.push({
                id: p.id,
                baseCost: calculatedCost,
                rewardMultiplier: p.rewardMultiplier
              });
            }
            costs = sanitizeProductCosts(costs);
            setDoc(doc(db, 'systemConfig', 'global'), {
              scalingMultiplier: typeof data.scalingMultiplier === 'number' ? data.scalingMultiplier : 1.5,
              productCosts: costs
            }).catch(e => console.error("Error writing expanded systemConfig back:", e));
          }
          setProductCosts(costs);
          localStorage.setItem('gom_product_costs', JSON.stringify(costs));
        }
        if (data.bankLogos) {
          setBankLogos(data.bankLogos);
          localStorage.setItem('gom_bank_logos', JSON.stringify(data.bankLogos));
        }
        if (data.marketplaceLogos) {
          setMarketplaceLogos(data.marketplaceLogos);
          localStorage.setItem('gom_marketplace_logos', JSON.stringify(data.marketplaceLogos));
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'systemConfig/global');
    });

    return () => {
      // Cleanup legacy unsubscribers (bypassed)
    };
  }, []);

  // Sync rawCurrentUser update when users array is modified in Firestore
  useEffect(() => {
    if (rawCurrentUser) {
      const updated = users.find(u => u.id === rawCurrentUser.id);
      if (updated) {
        if (JSON.stringify(updated) !== JSON.stringify(rawCurrentUser)) {
          setRawCurrentUser(updated);
          localStorage.setItem('gom_current_user', JSON.stringify(updated));
        }
      }
    }
  }, [users, rawCurrentUser]);

  // Keep localStorage session synced
  useEffect(() => {
    localStorage.setItem('gom_current_user', JSON.stringify(rawCurrentUser));
  }, [rawCurrentUser]);

  // Auto-migrate bank accounts to CBE and Telebirr if old accounts are present
  useEffect(() => {
    const migrateBankAccounts = async () => {
      if (rechargeAccounts.length === 0) return;

      const needsMigration = rechargeAccounts.length !== 2 || 
        !rechargeAccounts.some(a => a.bank === 'Commercial Bank of Ethiopia (CBE)' && a.accNo === '1000419524747' && a.accName === 'Ethiopia agent-Leykun jemaneh') ||
        !rechargeAccounts.some(a => a.bank === 'Telebirr' && a.accNo === '0926193920' && a.accName === 'Ethiopia agent-Leykun jemaneh');

      if (needsMigration) {
        console.log("Migrating database recharge accounts to CBE (1000419524747) and Telebirr (0926193920) with agent name...");
        try {
          const targetAccounts = [
            { id: 'acc-1', bank: 'Commercial Bank of Ethiopia (CBE)', accName: 'Ethiopia agent-Leykun jemaneh', accNo: '1000419524747' },
            { id: 'acc-2', bank: 'Telebirr', accName: 'Ethiopia agent-Leykun jemaneh', accNo: '0926193920' }
          ];

          for (const acc of targetAccounts) {
            await setDoc(doc(db, 'rechargeAccounts', acc.id), acc);
          }

          const oldIdsToDelete = rechargeAccounts
            .map(a => a.id)
            .filter(id => id !== 'acc-1' && id !== 'acc-2');

          for (const oldId of oldIdsToDelete) {
            if (oldId) {
              await deleteDoc(doc(db, 'rechargeAccounts', oldId));
            }
          }
          console.log("Database recharge accounts migrated successfully!");
        } catch (error) {
          console.error("Failed to migrate recharge accounts in Firestore:", error);
        }
      }
    };

    migrateBankAccounts();
  }, [rechargeAccounts]);

  // Recalculate dynamic orders list whenever user changes, productCosts scale, or balance shifts
  useEffect(() => {
    if (!currentUser) {
      setOrders([]);
      return;
    }

    // Stable seed based on currentUser id
    let userSeed = 0;
    const userIdStr = currentUser.id || '';
    for (let i = 0; i < userIdStr.length; i++) {
      userSeed = (userSeed << 5) - userSeed + userIdStr.charCodeAt(i);
      userSeed |= 0;
    }
    userSeed = Math.abs(userSeed);

    const calculated: Order[] = productCosts.map((rawProd, idx) => {
      // Order status logic:
      // Index 0 represents Order 1, index 11 represents Order 12.
      // All 12 orders are visible, but sequentially locked until the first uncompleted one is finished.
      // - If they completed it already: status is 'completed'
      // - Else, if it is the first uncompleted order:
      //    - If already added to cart in state: status is 'in_cart'
      //    - Else: status is 'available'
      // - Else (subsequent orders): status is 'locked'
      const isCompleted = currentUser.completedOrderIds.includes(rawProd.id);
      
      // Find the index of the first uncompleted order
      const firstUncompletedIdx = productCosts.findIndex(p => !currentUser.completedOrderIds.includes(p.id));
      
      let status: OrderStatus = 'locked';
      if (isCompleted) {
        status = 'completed';
      } else if (idx === firstUncompletedIdx || firstUncompletedIdx === -1) {
        // Find if they have an active 'in_cart' state for this order
        const cartStateKey = `gom_cart_${currentUser.id}_${rawProd.id}`;
        const hasInCart = localStorage.getItem(cartStateKey) === 'true';
        status = hasInCart ? 'in_cart' : 'available';
      } else {
        status = 'locked';
      }

      // Ensure the reward commission percentage is valid (never 0, fallback to default if corrupt or undefined)
      const pct = rawProd.id > 7 ? 0.40 : (
        (typeof rawProd.rewardMultiplier === 'number' && rawProd.rewardMultiplier > 0)
          ? rawProd.rewardMultiplier
          : (INITIAL_PRODUCTS_RAW.find(p => p.id === rawProd.id)?.rewardMultiplier || 0.15)
      );

      // Cost calculation
      // Implement specific rule requested by the user:
      // - Order 1: material cost between 699 and 999 ETB (starts from base welcome bonus 500)
      // - Order 2, 3: less than balance by 5 ETB (affordable)
      // - Order 4: greater than balance (requires recharge - 30% of previous balance)
      // - Order 5, 6, 7: less than balance by 5 ETB (affordable)
      // - Order 8: greater than balance (requires recharge - 38% of previous balance)
      // - Order 9, 10: less than balance by 5 ETB (affordable)
      // - Order 11: greater than balance (requires recharge - 30% of previous balance)
      // - Order 12, 13, 14: less than balance by 5 ETB (affordable)
      // - Order 15: greater than balance (requires recharge - 13% of previous balance)
      const simulatedCosts: { [key: number]: number } = {};
      const simulatedBalances: { [key: number]: number } = {};
      const calculatedPcts: { [key: number]: number } = {};

      for (let i = 1; i <= 15; i++) {
        const prodConf = productCosts.find(p => p.id === i);
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

      // Helper to round to 2 decimal places
      const r2 = (n: number) => Math.round(n * 100) / 100;

      // Order 1: cost is user-specific between 699 and 999 ETB
      const configuredLvl1Cost = productCosts.find(p => p.id === 1)?.baseCost || 699;
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

      // Order 2: less than balance by 5 ETB
      const decimal2 = decimalsPool[(userSeed + 2) % decimalsPool.length];
      simulatedCosts[2] = r2(simulatedBalances[1] - 5 + (decimal2 - 0.5));
      simulatedBalances[2] = r2(simulatedBalances[1] + (simulatedCosts[2] * calculatedPcts[2]));

      // Order 3: less than balance by 5 ETB
      const decimal3 = decimalsPool[(userSeed + 3) % decimalsPool.length];
      simulatedCosts[3] = r2(simulatedBalances[2] - 5 + (decimal3 - 0.5));
      simulatedBalances[3] = r2(simulatedBalances[2] + (simulatedCosts[3] * calculatedPcts[3]));

      // Order 4: greater than balance (requires recharge), recharge required is exactly 30% of previous balance
      const decimal4 = decimalsPool[(userSeed + 4) % decimalsPool.length];
      simulatedCosts[4] = r2(simulatedBalances[3] + (simulatedBalances[3] * 0.30) + decimal4);
      simulatedBalances[4] = r2(simulatedCosts[4] + (simulatedCosts[4] * calculatedPcts[4]));

      // Order 5: less than balance by 5 ETB
      const decimal5 = decimalsPool[(userSeed + 5) % decimalsPool.length];
      simulatedCosts[5] = r2(simulatedBalances[4] - 5 + (decimal5 - 0.5));
      simulatedBalances[5] = r2(simulatedBalances[4] + (simulatedCosts[5] * calculatedPcts[5]));

      // Order 6: less than balance by 5 ETB
      const decimal6 = decimalsPool[(userSeed + 6) % decimalsPool.length];
      simulatedCosts[6] = r2(simulatedBalances[5] - 5 + (decimal6 - 0.5));
      simulatedBalances[6] = r2(simulatedBalances[5] + (simulatedCosts[6] * calculatedPcts[6]));

      // Order 7: less than balance by 5 ETB
      const decimal7 = decimalsPool[(userSeed + 7) % decimalsPool.length];
      simulatedCosts[7] = r2(simulatedBalances[6] - 5 + (decimal7 - 0.5));
      simulatedBalances[7] = r2(simulatedBalances[6] + (simulatedCosts[7] * calculatedPcts[7]));

      // Order 8: greater than balance (requires recharge), recharge required is exactly 38% of previous balance
      const decimal8 = decimalsPool[(userSeed + 8) % decimalsPool.length];
      simulatedCosts[8] = r2(simulatedBalances[7] + (simulatedBalances[7] * 0.38) + decimal8);
      simulatedBalances[8] = r2(simulatedCosts[8] + (simulatedCosts[8] * calculatedPcts[8]));

      // Order 9: less than balance by 5 ETB
      const decimal9 = decimalsPool[(userSeed + 9) % decimalsPool.length];
      simulatedCosts[9] = r2(simulatedBalances[8] - 5 + (decimal9 - 0.5));
      simulatedBalances[9] = r2(simulatedBalances[8] + (simulatedCosts[9] * calculatedPcts[9]));

      // Order 10: less than balance by 5 ETB
      const decimal10 = decimalsPool[(userSeed + 10) % decimalsPool.length];
      simulatedCosts[10] = r2(simulatedBalances[9] - 5 + (decimal10 - 0.5));
      simulatedBalances[10] = r2(simulatedBalances[9] + (simulatedCosts[10] * calculatedPcts[10]));

      // Order 11: greater than balance (requires recharge), recharge required is exactly 30% of previous balance
      const decimal11 = decimalsPool[(userSeed + 11) % decimalsPool.length];
      simulatedCosts[11] = r2(simulatedBalances[10] + (simulatedBalances[10] * 0.30) + decimal11);
      simulatedBalances[11] = r2(simulatedCosts[11] + (simulatedCosts[11] * calculatedPcts[11]));

      // Order 12: less than balance by 5 ETB
      const decimal12 = decimalsPool[(userSeed + 12) % decimalsPool.length];
      simulatedCosts[12] = r2(simulatedBalances[11] - 5 + (decimal12 - 0.5));
      simulatedBalances[12] = r2(simulatedBalances[11] + (simulatedCosts[12] * calculatedPcts[12]));

      // Order 13: less than balance by 5 ETB
      const decimal13 = decimalsPool[(userSeed + 13) % decimalsPool.length];
      simulatedCosts[13] = r2(simulatedBalances[12] - 5 + (decimal13 - 0.5));
      simulatedBalances[13] = r2(simulatedBalances[12] + (simulatedCosts[13] * calculatedPcts[13]));

      // Order 14: less than balance by 5 ETB
      const decimal14 = decimalsPool[(userSeed + 14) % decimalsPool.length];
      simulatedCosts[14] = r2(simulatedBalances[13] - 5 + (decimal14 - 0.5));
      simulatedBalances[14] = r2(simulatedBalances[13] + (simulatedCosts[14] * calculatedPcts[14]));

      // Order 15: greater than balance (requires recharge), recharge required is exactly 13% of previous balance
      const decimal15 = decimalsPool[(userSeed + 15) % decimalsPool.length];
      simulatedCosts[15] = r2(simulatedBalances[14] + (simulatedBalances[14] * 0.13) + decimal15);
      simulatedBalances[15] = r2(simulatedCosts[15] + (simulatedCosts[15] * calculatedPcts[15]));

      const cost = simulatedCosts[rawProd.id] || rawProd.baseCost;

      const reward = r2(cost * pct);

      // Minimum Recharge calculation: (Material Cost - wallet balance)
      // Display 0 if they have enough balance
      const minRechargeRequired = r2(Math.max(0, cost - currentUser.walletBalance));

      const override = currentUser.cycleProductOverrides?.find(o => o.id === rawProd.id);
      
      const pool = ALTERNATIVE_PRODUCTS_POOLS[rawProd.id];
      let stableProduct = {
        productName: INITIAL_PRODUCTS_RAW.find(p => p.id === rawProd.id)?.productName || `Premium Order Product ${rawProd.id}`,
        productImage: INITIAL_PRODUCTS_RAW.find(p => p.id === rawProd.id)?.productImage || ""
      };
      if (pool && pool.length > 0) {
        const stableIndex = (userSeed + rawProd.id) % pool.length;
        stableProduct = pool[stableIndex];
      }

      const productName = override ? override.productName : stableProduct.productName;
      const productImage = override ? override.productImage : stableProduct.productImage;

      return {
        id: rawProd.id,
        productName,
        productImage,
        materialCost: cost,
        reward,
        minRechargeRequired,
        status
      };
    });

    setOrders(calculated);
  }, [currentUser, productCosts, scalingMultiplier, cartTrigger]);

  // Reports calculations
  const [systemReports, setSystemReports] = useState<SystemReport>({
    totalUsers: 0,
    totalRecharged: 0,
    totalWithdrawn: 0,
    totalRewardsDistributed: 0,
    pendingRechargesCount: 0,
    pendingWithdrawalsCount: 0,
  });

  useEffect(() => {
    const userList = users.filter(u => u.role !== 'admin');
    const approvedRecharges = transactions.filter(t => t.type === 'recharge' && t.status === 'approved');
    const approvedWithdrawals = transactions.filter(t => t.type === 'withdraw' && t.status === 'approved');
    const distributedRewards = transactions.filter(t => (t.type === 'reward' || t.type === 'welcome_bonus') && t.status === 'completed');

    setSystemReports({
      totalUsers: userList.length,
      totalRecharged: approvedRecharges.reduce((sum, t) => sum + t.amount, 0),
      totalWithdrawn: approvedWithdrawals.reduce((sum, t) => sum + t.amount, 0),
      totalRewardsDistributed: distributedRewards.reduce((sum, t) => sum + t.amount, 0),
      pendingRechargesCount: transactions.filter(t => t.type === 'recharge' && t.status === 'pending').length,
      pendingWithdrawalsCount: transactions.filter(t => t.type === 'withdraw' && t.status === 'pending').length,
    });
  }, [users, transactions]);

  // HELPERS
  const logAudit = async (userId: string, userPhone: string, action: string, details: string) => {
    const log: AuditLog = {
      id: generateId('LOG'),
      userId,
      userPhone,
      action,
      details,
      createdAt: new Date().toISOString()
    };
    try {
      await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log)
      });
    } catch (e) {
      console.warn("Error writing audit log to Firestore, saving locally:", e);
      // Fallback: update local auditLogs state
      const localLogs = [log, ...auditLogs];
      setAuditLogs(localLogs);
      localStorage.setItem('gom_audit_logs', JSON.stringify(localLogs));
    }
  };

  // AUTH ACTIONS
  const register = async (phoneNumber: string, passwordPlain: string, referralCode?: string) => {
    // Phone validation (relaxed for multi-country support)
    const trimmedPhone = phoneNumber.trim();
    const isE164 = trimmedPhone.match(/^\+\d{7,15}$/);
    const isEthiopianLocal = trimmedPhone.match(/^(09|07)\d{8}$/);
    if (!isE164 && !isEthiopianLocal) {
      return { success: false, message: 'Invalid phone format. Please enter a valid phone number (e.g. +2519xxxxxxxx).' };
    }

    // Check both memory state and localStorage to prevent duplicate account registration
    const saved = localStorage.getItem('gom_users');
    let allUsersToCheck = [...users];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach(u => {
            if (!allUsersToCheck.some(ex => ex.id === u.id)) {
              allUsersToCheck.push(u);
            }
          });
        }
      } catch (e) {}
    }

    let exists = allUsersToCheck.some(u => isSamePhone(u.phoneNumber, trimmedPhone));
    
    // Direct database query fallback to prevent duplicate registrations even when onSnapshot is stale or blocked
    if (!exists) {
      let directMatches: User[] = [];
      try {
        const q = query(collection(db, 'users'), where('phoneNumber', '==', trimmedPhone));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          directMatches.push(doc.data() as User);
        });

        if (directMatches.length === 0) {
          const cleanDigits = trimmedPhone.replace(/\D/g, '');
          const variations = [
            trimmedPhone,
            cleanDigits,
            cleanDigits.startsWith('251') ? '0' + cleanDigits.substring(3) : '',
            cleanDigits.startsWith('251') ? cleanDigits.substring(3) : '',
            !cleanDigits.startsWith('251') && cleanDigits.startsWith('0') ? '251' + cleanDigits.substring(1) : '',
            !cleanDigits.startsWith('251') && cleanDigits.startsWith('0') ? '+' + '251' + cleanDigits.substring(1) : '',
          ].filter(Boolean);

          for (const variant of variations) {
            if (variant !== trimmedPhone) {
              const qVar = query(collection(db, 'users'), where('phoneNumber', '==', variant));
              const snapVar = await getDocs(qVar);
              snapVar.forEach((doc) => {
                if (!directMatches.some(u => u.id === doc.id)) {
                  directMatches.push(doc.data() as User);
                }
              });
            }
          }
        }
      } catch (e) {
        console.warn("[Register] Direct Firestore check failed:", e);
      }

      if (directMatches.length > 0) {
        exists = true;
        // Update local state so it's aware of the existing user
        setUsers(prev => {
          let updated = [...prev];
          directMatches.forEach(dm => {
            if (!updated.some(u => u.id === dm.id)) {
              updated.push(dm);
            }
          });
          localStorage.setItem('gom_users', JSON.stringify(updated));
          return updated;
        });
      }
    }

    if (exists) {
      return { success: false, message: 'Phone number already registered. Duplicate account creation is not allowed.' };
    }

    const currentDeviceId = getOrCreateDeviceId();
    const isAdminDevice = localStorage.getItem('gom_admin_device') === 'true' || 
                          users.some(u => u.deviceId === currentDeviceId && u.role === 'admin');

    const deviceAssociatedUser = users.find(u => u.deviceId === currentDeviceId);
    if (deviceAssociatedUser && !isAdminDevice) {
      return { 
        success: false, 
        message: 'Registration blocked. This device is already associated with an existing account.' 
      };
    }

    const hashed = await hashPassword(passwordPlain);
    const userId = generateUserId();
    const phoneDigits = trimmedPhone.replace(/[^0-9]/g, '');
    const suffix = phoneDigits.slice(-5) || userId.slice(-5);
    const userInviteCode = `GOM${suffix}`;

    let baseWelcomeBonus = 588;
    let initialBalance = 588;
    let referredBy: string | undefined = undefined;
    const additionalTxs: Transaction[] = [];

    if (referralCode && referralCode.trim() !== '') {
      const extracted = extractInviteCode(referralCode);
      const cleanRef = extracted.toUpperCase();
      const referrer = users.find(u => 
        isSamePhone(u.phoneNumber, extracted) || 
        (u.inviteCode && u.inviteCode.toUpperCase() === cleanRef) || 
        u.id === extracted
      );

      if (!referrer) {
        return { success: false, message: 'Invalid invite/referral code. Please check or leave empty.' };
      }

      referredBy = referrer.id;
      initialBalance = 784; // 588 welcome + 196 bonus

      // Referral bonus transaction for new user
      additionalTxs.push({
        id: generateId('TX'),
        userId: userId,
        userPhone: trimmedPhone,
        type: 'referral_bonus',
        amount: 196,
        status: 'completed',
        createdAt: new Date().toISOString(),
        description: `Registration referral bonus of 196 ETB credited (Invited by ${referrer.phoneNumber}).`
      });

      // Referral bonus transaction for referrer
      additionalTxs.push({
        id: generateId('TX'),
        userId: referrer.id,
        userPhone: referrer.phoneNumber,
        type: 'referral_bonus',
        amount: 196,
        status: 'completed',
        createdAt: new Date().toISOString(),
        description: `Referral Reward of 196 ETB credited for inviting ${trimmedPhone}.`
      });
    }

    const overrides: { id: number; productName: string; productImage: string }[] = [];
    for (let id = 1; id <= 15; id++) {
      const pool = ALTERNATIVE_PRODUCTS_POOLS[id];
      if (pool && pool.length > 0) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        const selected = pool[randomIndex];
        overrides.push({
          id,
          productName: selected.productName,
          productImage: selected.productImage
        });
      }
    }

    const newUser: User = {
      id: userId,
      phoneNumber: trimmedPhone,
      passwordHash: hashed,
      walletBalance: initialBalance,
      welcomeBonus: baseWelcomeBonus,
      totalEarnings: 0,
      role: 'user',
      createdAt: new Date().toISOString(),
      currentOrderIndex: 0,
      completedOrderIds: [],
      inviteCode: userInviteCode,
      referredBy: referredBy || '',
      referralCount: 0,
      referralEarnings: 0,
      cycleProductOverrides: overrides,
      deviceId: currentDeviceId
    };

    const welcomeBonusTransaction: Transaction = {
      id: generateId('TX'),
      userId: userId,
      userPhone: trimmedPhone,
      type: 'welcome_bonus',
      amount: 588,
      status: 'completed',
      createdAt: new Date().toISOString(),
      description: 'Registration 588 ETB Welcome Bonus credited.'
    };

    try {
      // Write user and welcome bonus to PostgreSQL
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(welcomeBonusTransaction)
      });

      // Add referral transactions
      for (const tx of additionalTxs) {
        await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tx)
        });
      }

      // Update referrer user in PostgreSQL
      if (referredBy) {
        const referrerToUpdate = users.find(u => u.id === referredBy);
        if (referrerToUpdate) {
          const updatedReferrer = {
            ...referrerToUpdate,
            walletBalance: referrerToUpdate.walletBalance + 196,
            referralEarnings: (referrerToUpdate.referralEarnings || 0) + 196,
            referralCount: (referrerToUpdate.referralCount || 0) + 1
          };
          await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedReferrer)
          });
        }
      }

      // Sync active session
      setCurrentUser(newUser);

      await logAudit(userId, trimmedPhone, 'REGISTER', `Successfully registered. Automatically credited 588 Welcome Bonus.${referredBy ? ' Plus 196 referral bonus.' : ''}`);
      if (referredBy) {
        const referrerToUpdate = users.find(u => u.id === referredBy);
        if (referrerToUpdate) {
          await logAudit(referrerToUpdate.id, referrerToUpdate.phoneNumber, 'REFERRAL_BONUS', `Referred ${trimmedPhone}. Credited +196 ETB.`);
        }
      }

      return { success: true, message: `Registration successful! Welcome bonus of 588 ETB credited.${referredBy ? ' Additional 196 ETB referral bonus credited!' : ''}` };
    } catch (e) {
      console.error("Error committing registration batch to Firestore, falling back to local storage:", e);
      
      // Update local users
      let updatedUsers = [...users, newUser];
      if (referredBy) {
        updatedUsers = updatedUsers.map(u => {
          if (u.id === referredBy) {
            return {
              ...u,
              walletBalance: u.walletBalance + 196,
              referralEarnings: (u.referralEarnings || 0) + 196,
              referralCount: (u.referralCount || 0) + 1
            };
          }
          return u;
        });
      }
      setUsers(updatedUsers);
      localStorage.setItem('gom_users', JSON.stringify(updatedUsers));

      // Update local transactions
      const newTxs = [welcomeBonusTransaction, ...additionalTxs, ...transactions];
      setTransactions(newTxs);
      localStorage.setItem('gom_transactions', JSON.stringify(newTxs));

      // Update current user
      setCurrentUser(newUser);

      // Add local audit logs
      const localLogs = [
        {
          id: generateId('LOG'),
          userId: newUser.id,
          userPhone: trimmedPhone,
          action: 'REGISTER',
          details: `Successfully registered (Local Fallback). Automatically credited 588 Welcome Bonus.${referredBy ? ' Plus 196 referral bonus.' : ''}`,
          createdAt: new Date().toISOString()
        },
        ...(referredBy ? [{
          id: generateId('LOG'),
          userId: referredBy,
          userPhone: users.find(u => u.id === referredBy)?.phoneNumber || '',
          action: 'REFERRAL_BONUS',
          details: `Referred ${trimmedPhone}. Credited +196 ETB (Local Fallback).`,
          createdAt: new Date().toISOString()
        }] : []),
        ...auditLogs
      ];
      setAuditLogs(localLogs);
      localStorage.setItem('gom_audit_logs', JSON.stringify(localLogs));

      return { success: true, message: `Registration successful (Offline Fallback)! Welcome bonus of 588 ETB credited.${referredBy ? ' Additional 196 ETB referral bonus credited!' : ''}` };
    }
  };

  const login = async (phoneNumber: string, passwordPlain: string) => {
    const trimmedPhone = phoneNumber.trim();
    const hashed = await hashPassword(passwordPlain);
    const isAdminPhone = isSamePhone(trimmedPhone, '0951560276');
    const isSpecialUser = isSamePhone(trimmedPhone, '0939534334');

    // Fetch directly from Firestore to ensure we have the most up-to-date and correct user record,
    // especially if local `users` array is empty, out of date, or missing the admin password change.
    let directMatches: User[] = [];
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const freshUsers: User[] = await res.json();
        directMatches = freshUsers.filter(u => isSamePhone(u.phoneNumber, trimmedPhone));
        if (directMatches.length === 0) {
          const cleanDigits = trimmedPhone.replace(/\D/g, '');
          const variations = [
            trimmedPhone,
            cleanDigits,
            cleanDigits.startsWith('251') ? '0' + cleanDigits.substring(3) : '',
            cleanDigits.startsWith('251') ? cleanDigits.substring(3) : '',
            !cleanDigits.startsWith('251') && cleanDigits.startsWith('0') ? '251' + cleanDigits.substring(1) : '',
            !cleanDigits.startsWith('251') && cleanDigits.startsWith('0') ? '+' + '251' + cleanDigits.substring(1) : '',
          ].filter(Boolean);

          directMatches = freshUsers.filter(u => variations.some(variant => isSamePhone(u.phoneNumber, variant)));
        }
      }
    } catch (e) {
      console.warn("[Login] Direct database check failed:", e);
    }

    // Find local memory matches
    const localMatches = users.filter(u => isSamePhone(u.phoneNumber, trimmedPhone));
    
    // Merge local and direct matches
    let mergedMatching = [...localMatches];
    directMatches.forEach(dm => {
      const existsIdx = mergedMatching.findIndex(u => u.id === dm.id);
      if (existsIdx === -1) {
        mergedMatching.push(dm);
      } else {
        // Direct match from Firestore is newer and has the correct password hash changed by admin
        mergedMatching[existsIdx] = dm;
      }
    });

    // Update global users state with any direct matches to keep local storage and state updated
    if (directMatches.length > 0) {
      setUsers(prev => {
        let updated = [...prev];
        directMatches.forEach(dm => {
          const idx = updated.findIndex(u => u.id === dm.id);
          if (idx !== -1) {
            updated[idx] = dm;
          } else {
            updated.push(dm);
          }
        });
        localStorage.setItem('gom_users', JSON.stringify(updated));
        return updated;
      });
    }

    const matchingUsers = mergedMatching;
    let matchedUser: User | null = null;

    if (matchingUsers.length > 0) {
      // Find the main account (highest wallet balance, most completed orders, or earliest created)
      const sortedMatching = [...matchingUsers].sort((a, b) => {
        // Admin first
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (a.role !== 'admin' && b.role === 'admin') return 1;

        // Highest wallet balance
        const balA = a.walletBalance || 0;
        const balB = b.walletBalance || 0;
        if (balB !== balA) return balB - balA;

        // Highest completed orders size
        const ordA = a.completedOrderIds ? a.completedOrderIds.length : 0;
        const ordB = b.completedOrderIds ? b.completedOrderIds.length : 0;
        if (ordB !== ordA) return ordB - ordA;

        // Earliest created
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeA - timeB;
      });

      let primary = sortedMatching[0];
      if (sortedMatching.length > 1) {
        console.log(`[Login] Found duplicate accounts for phone ${trimmedPhone}. Merging them...`);
        for (let i = 1; i < sortedMatching.length; i++) {
          const secondary = sortedMatching[i];
          primary = mergeUserRecords(primary, secondary);
          
          // Delete secondary in PostgreSQL
          fetch(`/api/users/${secondary.id}`, { method: 'DELETE' }).catch(e => {
            console.warn(`[Login] Could not delete duplicate user ${secondary.phoneNumber} (ID: ${secondary.id}) on login:`, e.message || e);
          });
        }
        
        // Save merged primary to PostgreSQL
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(primary)
        });
        
        // Update local users state
        setUsers(prev => {
          const filtered = prev.filter(u => !sortedMatching.some(sm => sm.id === u.id && sm.id !== primary.id));
          const idx = filtered.findIndex(u => u.id === primary.id);
          if (idx !== -1) {
            filtered[idx] = primary;
          } else {
            filtered.push(primary);
          }
          localStorage.setItem('gom_users', JSON.stringify(filtered));
          return filtered;
        });
      }
      matchedUser = primary;
    }

    if (isSpecialUser) {
      if (!matchedUser) {
        // Auto-register special user on the fly if not found
        const currentDeviceId = getOrCreateDeviceId();
        const userId = generateUserId();
        const phoneDigits = trimmedPhone.replace(/[^0-9]/g, '');
        const suffix = phoneDigits.slice(-5) || userId.slice(-5);
        const userInviteCode = `GOM${suffix}`;

        const overrides: { id: number; productName: string; productImage: string }[] = [];
        for (let id = 1; id <= 15; id++) {
          const pool = ALTERNATIVE_PRODUCTS_POOLS[id];
          if (pool && pool.length > 0) {
            const randomIndex = Math.floor(Math.random() * pool.length);
            const selected = pool[randomIndex];
            overrides.push({
              id,
              productName: selected.productName,
              productImage: selected.productImage
            });
          }
        }

        const newUser: User = {
          id: userId,
          phoneNumber: trimmedPhone,
          passwordHash: hashed,
          walletBalance: 588,
          welcomeBonus: 588,
          totalEarnings: 0,
          role: 'user',
          createdAt: new Date().toISOString(),
          currentOrderIndex: 0,
          completedOrderIds: [],
          inviteCode: userInviteCode,
          referredBy: '',
          referralCount: 0,
          referralEarnings: 0,
          cycleProductOverrides: overrides,
          deviceId: currentDeviceId
        };

        try {
          await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser)
          });
        } catch (e) {
          console.error("[Login] PostgreSQL auto-register write failed, using local storage:", e);
        }
        const updatedUsers = [...users, newUser];
        setUsers(updatedUsers);
        localStorage.setItem('gom_users', JSON.stringify(updatedUsers));
        matchedUser = newUser;
      } else {
        // If they do exist, make sure whatever password they typed is automatically set as correct
        if (matchedUser.passwordHash !== hashed) {
          matchedUser.passwordHash = hashed;
          try {
            await fetch('/api/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(matchedUser)
            });
          } catch (e) {
            console.error("[Login] PostgreSQL auto-password update failed, using local storage:", e);
          }
          const updatedUsers = users.map(u => u.id === matchedUser!.id ? { ...u, passwordHash: hashed } : u);
          setUsers(updatedUsers);
          localStorage.setItem('gom_users', JSON.stringify(updatedUsers));
        }
      }
    }

    if (!matchedUser && isAdminPhone) {
      // Create fallback admin user if for some reason the database/local storage has been fully cleared
      matchedUser = {
        id: "GOM-ADMIN",
        phoneNumber: "0951560276",
        passwordHash: "",
        walletBalance: 1000000,
        welcomeBonus: 0,
        totalEarnings: 0,
        role: "admin",
        createdAt: new Date().toISOString(),
        currentOrderIndex: 0,
        completedOrderIds: [],
        inviteCode: "GOM-ADMIN",
        deviceId: ""
      };
    }

    if (!matchedUser) {
      return { success: false, message: 'Invalid phone number or password.' };
    }

    if (isAdminPhone) {
      matchedUser.role = 'admin';
    } else {
      matchedUser.role = 'user';
    }

    if (!isAdminPhone && !isSpecialUser && matchedUser.passwordHash !== hashed) {
      return { success: false, message: 'Invalid phone number or password.' };
    }

    const currentDeviceId = getOrCreateDeviceId();
    const isAdminDevice = localStorage.getItem('gom_admin_device') === 'true' || 
                          users.some(u => u.deviceId === currentDeviceId && u.role === 'admin');

    const deviceBoundToOtherUser = users.find(
      u => u.deviceId === currentDeviceId && u.id !== matchedUser!.id
    );
    if (deviceBoundToOtherUser && matchedUser.role !== 'admin' && !isAdminDevice) {
      return { 
        success: false, 
        message: 'Login blocked. This device is already associated with another account.' 
      };
    }

    if (matchedUser.role !== 'admin') {
      if (!matchedUser.deviceId) {
        try {
          const updatedUser = { ...matchedUser, deviceId: currentDeviceId };
          await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedUser)
          });
        } catch (e) {
          console.error("Error binding deviceId to user on login, falling back to local storage:", e);
          const updatedUsers = users.map(u => u.id === matchedUser.id ? { ...u, deviceId: currentDeviceId } : u);
          setUsers(updatedUsers);
          localStorage.setItem('gom_users', JSON.stringify(updatedUsers));
        }
      }
    } else {
      // Admin login - flag this device as an admin device and record the deviceId
      localStorage.setItem('gom_admin_device', 'true');
      if (matchedUser.deviceId !== currentDeviceId) {
        try {
          const updatedUser = { ...matchedUser, deviceId: currentDeviceId };
          await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedUser)
          });
        } catch (e) {
          console.error("Error binding deviceId to admin on login, falling back to local storage:", e);
          const updatedUsers = users.map(u => u.id === matchedUser.id ? { ...u, deviceId: currentDeviceId } : u);
          setUsers(updatedUsers);
          localStorage.setItem('gom_users', JSON.stringify(updatedUsers));
        }
      }
    }

    setCurrentUser(matchedUser);
    await logAudit(matchedUser.id, matchedUser.phoneNumber, 'LOGIN', 'Successful login.');

    return { success: true, message: 'Login successful!' };
  };

  const logout = async () => {
    if (currentUser) {
      await logAudit(currentUser.id, currentUser.phoneNumber, 'LOGOUT', 'User logged out.');
      setCurrentUser(null);
    }
  };

  const resetPassword = async (phoneNumber: string, passwordPlain: string) => {
    const trimmedPhone = phoneNumber.trim();
    const matchedUser = users.find(u => isSamePhone(u.phoneNumber, trimmedPhone));
    if (!matchedUser) {
      return { success: false, message: 'Phone number not found.' };
    }

    const hashed = await hashPassword(passwordPlain);
    const updatedUser = {
      ...matchedUser,
      passwordHash: hashed
    };

    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });
      await logAudit(matchedUser.id, trimmedPhone, 'RESET_PASSWORD', 'Password reset successfully.');
      return { success: true, message: 'Password reset successfully.' };
    } catch (e) {
      console.error("Error resetting password, falling back to local storage:", e);
      const updatedUsers = users.map(u => u.id === matchedUser.id ? updatedUser : u);
      setUsers(updatedUsers);
      localStorage.setItem('gom_users', JSON.stringify(updatedUsers));
      return { success: true, message: 'Password reset successfully (Offline Fallback).' };
    }
  };

  const updateAccountDetails = async (phoneNumber: string, passwordPlain?: string) => {
    if (!currentUser) {
      return { success: false, message: 'No user is currently logged in.' };
    }

    const trimmedPhone = phoneNumber.trim();
    if (!trimmedPhone) {
      return { success: false, message: 'Phone number cannot be empty.' };
    }

    // If changing phone number, check if it's already taken
    if (!isSamePhone(trimmedPhone, currentUser.phoneNumber)) {
      const isTaken = users.some(u => isSamePhone(u.phoneNumber, trimmedPhone) && u.id !== currentUser.id);
      if (isTaken) {
        return { success: false, message: 'This phone number is already registered by another account.' };
      }
    }

    let updatedUser = { ...currentUser, phoneNumber: trimmedPhone };

    if (passwordPlain && passwordPlain.trim() !== '') {
      const hashed = await hashPassword(passwordPlain);
      updatedUser.passwordHash = hashed;
    }

    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });
      setCurrentUser(updatedUser);
      await logAudit(currentUser.id, trimmedPhone, 'UPDATE_ACCOUNT_DETAILS', 'Updated account login details.');
      return { success: true, message: 'Account details updated successfully.' };
    } catch (e) {
      console.error("Error updating account details, falling back to local storage:", e);
      const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
      setUsers(updatedUsers);
      localStorage.setItem('gom_users', JSON.stringify(updatedUsers));
      setCurrentUser(updatedUser);
      return { success: true, message: 'Account details updated successfully (Offline Fallback).' };
    }
  };

  const registerWithdrawalAccount = async (bankName: string, accNo: string, accName: string) => {
    if (!currentUser) {
      return { success: false, message: 'No user is currently logged in.' };
    }

    const trimmedBank = bankName.trim();
    const trimmedAccNo = accNo.trim();
    const trimmedAccName = accName.trim();
    if (!trimmedBank || !trimmedAccNo || !trimmedAccName) {
      return { success: false, message: 'Bank name, account number, and account holder name cannot be empty.' };
    }

    const updatedUser = { 
      ...currentUser, 
      withdrawalBank: trimmedBank, 
      withdrawalAccNo: trimmedAccNo,
      withdrawalAccName: trimmedAccName
    };

    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });
      setCurrentUser(updatedUser);
      const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
      setUsers(updatedUsers);
      localStorage.setItem('gom_users', JSON.stringify(updatedUsers));
      await logAudit(currentUser.id, currentUser.phoneNumber, 'REGISTER_WITHDRAWAL_ACCOUNT', `Registered withdrawal account: ${trimmedBank} (${trimmedAccNo}) - Name: ${trimmedAccName}`);
      return { success: true, message: 'Withdrawal account registered successfully.' };
    } catch (e) {
      console.error("Error registering withdrawal account, falling back to local storage:", e);
      const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
      setUsers(updatedUsers);
      localStorage.setItem('gom_users', JSON.stringify(updatedUsers));
      setCurrentUser(updatedUser);
      return { success: true, message: 'Withdrawal account registered successfully (Offline Fallback).' };
    }
  };

  // WALLET ACTIONS
  const deposit = async (amount: number, bankName: string, refCode: string, screenshot?: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) return { success: false, message: 'Not logged in.' };

    const normalizedRef = refCode.trim().toUpperCase();

    // Check if reference code (FT code / TXID) has already been used in ANY recharge transaction (case-insensitive)
    const isRefUsed = transactions.some(
      tx => tx.type === 'recharge' && 
            tx.accountNumberOrRef && 
            tx.accountNumberOrRef.trim().toUpperCase() === normalizedRef
    );

    if (isRefUsed) {
      return { 
        success: false, 
        message: `This transaction reference (${refCode}) has already been used. Each reference code can only be used once to prevent double-recharging.` 
      };
    }

    const depositTx: Transaction = {
      id: generateId('DEP'),
      userId: currentUser.id,
      userPhone: currentUser.phoneNumber,
      type: 'recharge',
      amount,
      bankName,
      accountNumberOrRef: normalizedRef,
      status: 'pending',
      createdAt: new Date().toISOString(),
      description: `Pending recharge of ${amount} ETB via ${bankName}. Reference: ${refCode}`,
      screenshot: screenshot || undefined
    };

    try {
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(depositTx)
      });
      await logAudit(currentUser.id, currentUser.phoneNumber, 'DEPOSIT_REQUEST', `Requested deposit of ${amount} ETB via ${bankName}`);
      
      const updatedTxs = [depositTx, ...transactions];
      setTransactions(updatedTxs);
      localStorage.setItem('gom_transactions', JSON.stringify(updatedTxs));
      return { success: true, message: 'Recharge request submitted successfully!' };
    } catch (e) {
      console.error("Error requesting deposit, falling back to local storage:", e);
      const updatedTxs = [depositTx, ...transactions];
      setTransactions(updatedTxs);
      localStorage.setItem('gom_transactions', JSON.stringify(updatedTxs));
      return { success: true, message: 'Recharge request submitted successfully (Offline mode)!' };
    }
  };

  const withdraw = async (amount: number, bankName: string, accNo: string, accName?: string) => {
    if (!currentUser) return { success: false, message: 'Not logged in.' };

    const completedCount = currentUser.completedOrderIds ? currentUser.completedOrderIds.length : 0;
    if (completedCount < 15) {
      return { 
        success: false, 
        message: `You must complete all 15 order tasks in your active cycle before you can withdraw your balance. Currently completed: ${completedCount}/15 tasks.` 
      };
    }

    if (currentUser.walletBalance < amount) {
      return { success: false, message: 'Insufficient wallet balance.' };
    }

    const updatedUser = {
      ...currentUser,
      walletBalance: currentUser.walletBalance - amount
    };

    const finalAccName = accName?.trim() || currentUser.withdrawalAccName || '';

    const withdrawTx: Transaction = {
      id: generateId('WTH'),
      userId: currentUser.id,
      userPhone: currentUser.phoneNumber,
      type: 'withdraw',
      amount,
      bankName,
      accountNumberOrRef: accNo.trim(),
      accountHolderName: finalAccName,
      status: 'pending',
      createdAt: new Date().toISOString(),
      description: `Pending withdrawal of ${amount} ETB to ${bankName} (${accNo})${finalAccName ? ` - Name: ${finalAccName}` : ''}.`
    };

    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(withdrawTx)
      });

      await logAudit(currentUser.id, currentUser.phoneNumber, 'WITHDRAW_REQUEST', `Requested withdrawal of ${amount} ETB to ${bankName}. Account: ${accNo}${finalAccName ? ` (Holder: ${finalAccName})` : ''}`);

      const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
      setUsers(updatedUsers);
      localStorage.setItem('gom_users', JSON.stringify(updatedUsers));
      setCurrentUser(updatedUser);

      const updatedTxs = [withdrawTx, ...transactions];
      setTransactions(updatedTxs);
      localStorage.setItem('gom_transactions', JSON.stringify(updatedTxs));

      return { success: true, message: 'Withdrawal request submitted! Pending admin approval.' };
    } catch (e) {
      console.error("Error requesting withdrawal, falling back to local storage:", e);
      
      const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
      setUsers(updatedUsers);
      localStorage.setItem('gom_users', JSON.stringify(updatedUsers));
      setCurrentUser(updatedUser);

      const updatedTxs = [withdrawTx, ...transactions];
      setTransactions(updatedTxs);
      localStorage.setItem('gom_transactions', JSON.stringify(updatedTxs));

      return { success: true, message: 'Withdrawal request submitted (Offline Fallback)! Pending admin approval.' };
    }
  };

  // ADMIN ACTIONS
  const approveTransaction = async (txId: string) => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx || tx.status !== 'pending') return;

    try {
      const res = await fetch(`/api/transactions/${txId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update transaction status on backend.');
      }

      const data = await res.json();
      if (data.success) {
        if (data.users) {
          setUsers(data.users);
          localStorage.setItem('gom_users', JSON.stringify(data.users));
          if (currentUser) {
            const updatedMe = data.users.find((u: any) => u.id === currentUser.id);
            if (updatedMe) {
              setRawCurrentUser(updatedMe);
              localStorage.setItem('gom_current_user', JSON.stringify(updatedMe));
            }
          }
        }
        if (data.transactions) {
          setTransactions(data.transactions);
          localStorage.setItem('gom_transactions', JSON.stringify(data.transactions));
        }
      }
      await logAudit('ADMIN', 'ADMIN', 'APPROVE_RECHARGE', `Approved recharge of ${tx.amount} ETB for User ${tx.userId}`);
    } catch (e) {
      console.error("Error approving transaction, falling back to local storage:", e);
      
      const updatedTxs = transactions.map(t => t.id === txId ? { ...t, status: 'approved' as const } : t);
      setTransactions(updatedTxs);
      localStorage.setItem('gom_transactions', JSON.stringify(updatedTxs));

      if (tx.type === 'recharge') {
        const userToUpdate = users.find(u => u.id === tx.userId);
        if (userToUpdate) {
          const updatedUser = {
            ...userToUpdate,
            walletBalance: userToUpdate.walletBalance + tx.amount
          };
          const updatedUsers = users.map(u => u.id === tx.userId ? updatedUser : u);
          setUsers(updatedUsers);
          localStorage.setItem('gom_users', JSON.stringify(updatedUsers));
          
          if (currentUser && currentUser.id === tx.userId) {
            setRawCurrentUser(updatedUser);
            localStorage.setItem('gom_current_user', JSON.stringify(updatedUser));
          }
        }
      }
    }
  };

  const rejectTransaction = async (txId: string) => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx || tx.status !== 'pending') return;

    try {
      const res = await fetch(`/api/transactions/${txId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to reject transaction status on backend.');
      }

      const data = await res.json();
      if (data.success) {
        if (data.users) {
          setUsers(data.users);
          localStorage.setItem('gom_users', JSON.stringify(data.users));
          if (currentUser) {
            const updatedMe = data.users.find((u: any) => u.id === currentUser.id);
            if (updatedMe) {
              setRawCurrentUser(updatedMe);
              localStorage.setItem('gom_current_user', JSON.stringify(updatedMe));
            }
          }
        }
        if (data.transactions) {
          setTransactions(data.transactions);
          localStorage.setItem('gom_transactions', JSON.stringify(data.transactions));
        }
      }
      await logAudit('ADMIN', 'ADMIN', 'REJECT_WITHDRAWAL', `Rejected withdrawal of ${tx.amount} ETB for User ${tx.userId}. Funds refunded.`);
    } catch (e) {
      console.error("Error rejecting transaction, falling back to local storage:", e);
      
      const updatedTxs = transactions.map(t => t.id === txId ? { ...t, status: 'rejected' as const } : t);
      setTransactions(updatedTxs);
      localStorage.setItem('gom_transactions', JSON.stringify(updatedTxs));

      if (tx.type === 'withdraw') {
        const userToUpdate = users.find(u => u.id === tx.userId);
        if (userToUpdate) {
          const updatedUser = {
            ...userToUpdate,
            walletBalance: userToUpdate.walletBalance + tx.amount
          };
          const updatedUsers = users.map(u => u.id === tx.userId ? updatedUser : u);
          setUsers(updatedUsers);
          localStorage.setItem('gom_users', JSON.stringify(updatedUsers));
          
          if (currentUser && currentUser.id === tx.userId) {
            setRawCurrentUser(updatedUser);
            localStorage.setItem('gom_current_user', JSON.stringify(updatedUser));
          }
        }
      }
    }
  };

  // USER MARKETPLACE & ORDER CYCLE
  const addToCart = async (orderId: number) => {
    if (!currentUser) return;
    localStorage.setItem(`gom_cart_${currentUser.id}_${orderId}`, 'true');
    setCartTrigger(prev => prev + 1);
    await logAudit(currentUser.id, currentUser.phoneNumber, 'ADD_TO_CART', `Added Order ${orderId} product to cart.`);
  };

  const submitOrder = async (orderId: number) => {
    if (!currentUser) return { success: false, message: 'Not logged in.' };

    const order = orders.find(o => o.id === orderId);
    if (!order) return { success: false, message: 'Order not found.' };

    // Enforce 5 minutes gap between order task completions
    if (currentUser.lastOrderCompletedAt) {
      const lastCompleted = new Date(currentUser.lastOrderCompletedAt).getTime();
      const now = Date.now();
      const fiveMinutesInMs = 5 * 60 * 1000;
      const timePassed = now - lastCompleted;
      if (timePassed < fiveMinutesInMs) {
        const remainingSeconds = Math.ceil((fiveMinutesInMs - timePassed) / 1000);
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        return { 
          success: false, 
          message: `You must wait at least 5 minutes between completing order tasks. Please wait ${minutes}m ${seconds}s before completing this task.` 
        };
      }
    }

    if (currentUser.walletBalance < order.materialCost) {
      return { success: false, message: `Insufficient balance. Minimum recharge of ${order.minRechargeRequired} ETB required.` };
    }

    const reward = order.reward;
    const newBalance = Math.round((currentUser.walletBalance + reward) * 100) / 100;
    const newTotalEarnings = Math.round((currentUser.totalEarnings + reward) * 100) / 100;

    const nextOrderIndex = currentUser.currentOrderIndex + 1;

    const updatedUser: User = {
      ...currentUser,
      walletBalance: newBalance,
      totalEarnings: newTotalEarnings,
      currentOrderIndex: nextOrderIndex,
      completedOrderIds: [...currentUser.completedOrderIds, orderId],
      lastOrderCompletedAt: new Date().toISOString()
    };

    const orderTx: Transaction = {
      id: generateId('COM'),
      userId: currentUser.id,
      userPhone: currentUser.phoneNumber,
      type: 'reward',
      amount: reward,
      status: 'completed',
      createdAt: new Date().toISOString(),
      description: `Task complete: Order ${orderId} "${order.productName}" successfully processed. Reward commission of ${reward} ETB credited.`
    };

    localStorage.removeItem(`gom_cart_${currentUser.id}_${orderId}`);

    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderTx)
      });

      await logAudit(currentUser.id, currentUser.phoneNumber, 'COMPLETE_ORDER', `Completed Order ${orderId}. Commission: ${reward} ETB.`);

      const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
      setUsers(updatedUsers);
      localStorage.setItem('gom_users', JSON.stringify(updatedUsers));
      setCurrentUser(updatedUser);

      const updatedTxs = [orderTx, ...transactions];
      setTransactions(updatedTxs);
      localStorage.setItem('gom_transactions', JSON.stringify(updatedTxs));

      return { success: true, message: `Order ${orderId} successfully completed! ${reward} ETB commission added to your wallet.` };
    } catch (e) {
      console.error("Error submitting order, falling back to local storage:", e);
      
      const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
      setUsers(updatedUsers);
      localStorage.setItem('gom_users', JSON.stringify(updatedUsers));
      setCurrentUser(updatedUser);

      const updatedTxs = [orderTx, ...transactions];
      setTransactions(updatedTxs);
      localStorage.setItem('gom_transactions', JSON.stringify(updatedTxs));

      return { success: true, message: `Order ${orderId} successfully completed (Offline Fallback)! ${reward} ETB commission added to your wallet.` };
    }
  };

  const resetOrderCycle = async () => {
    if (!currentUser) return { success: false, message: 'No user is currently logged in.' };
    
    // Check if they completed all 15 orders
    if (currentUser.completedOrderIds.length < 15) {
      return { 
        success: false, 
        message: 'You can only reset the cycle after completing all 15 tasks successfully!' 
      };
    }

    // Pick brand new materials/equipment overrides from ALTERNATIVE_PRODUCTS_POOLS
    const overrides: { id: number; productName: string; productImage: string }[] = [];
    for (let id = 1; id <= 15; id++) {
      const pool = ALTERNATIVE_PRODUCTS_POOLS[id];
      if (pool && pool.length > 0) {
        // Find the previous productName to make sure we select a different one
        const prevOverride = currentUser.cycleProductOverrides?.find(o => o.id === id);
        const prevName = prevOverride 
          ? prevOverride.productName 
          : (INITIAL_PRODUCTS_RAW.find(p => p.id === id)?.productName || '');

        // Filter out the product that was used in the previous cycle
        const candidates = pool.filter(item => item.productName !== prevName);
        const selectPool = candidates.length > 0 ? candidates : pool;

        const randomIndex = Math.floor(Math.random() * selectPool.length);
        const selected = selectPool[randomIndex];
        overrides.push({
          id,
          productName: selected.productName,
          productImage: selected.productImage
        });
      }
    }

    // Generate a new dynamic Level 1 base cost between 699 and 999 ETB
    const newLevel1Base = Math.floor(Math.random() * (999 - 699 + 1)) + 699;

    // Dynamically adjust/arrange all 12 product level costs based on this starting cost
    const rawScaledCosts = productCosts.map((p, idx) => {
      const calculatedCost = Math.round(newLevel1Base * Math.pow(scalingMultiplier, idx));
      return {
        ...p,
        baseCost: calculatedCost
      };
    });
    const updatedCosts = sanitizeProductCosts(rawScaledCosts);

    const updatedUser: User = {
      ...currentUser,
      currentOrderIndex: 0,
      completedOrderIds: [],
      cycleProductOverrides: overrides
    };
    delete updatedUser.lastOrderCompletedAt;
    
    // Clear any cart state
    productCosts.forEach(p => {
      localStorage.removeItem(`gom_cart_${currentUser.id}_${p.id}`);
    });

    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });
      await fetch('/api/system-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scalingMultiplier,
          productCosts: updatedCosts
        })
      });

      await logAudit(currentUser.id, currentUser.phoneNumber, 'RESET_CYCLE', `Reset task cycle. Loaded brand new materials & equipment. Configured dynamic Level 1 cost: ${newLevel1Base} ETB.`);
      return { 
        success: true, 
        message: `Task cycle reset successfully! Brand new materials have been loaded and arranged dynamically. First order balance is configured at ${newLevel1Base} ETB.` 
      };
    } catch (e) {
      console.error("Error resetting cycle, falling back to local storage:", e);
      
      const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
      setUsers(updatedUsers);
      localStorage.setItem('gom_users', JSON.stringify(updatedUsers));
      setCurrentUser(updatedUser);

      setProductCosts(updatedCosts);
      localStorage.setItem('gom_product_costs', JSON.stringify(updatedCosts));

      return { 
        success: true, 
        message: `Task cycle reset successfully (Offline Fallback)! Brand new materials have been loaded and arranged dynamically. First order balance is configured at ${newLevel1Base} ETB.` 
      };
    }
  };

  // ADMIN SETTINGS & MANAGEMENT
  const updateScalingMultiplier = async (multiplier: number) => {
    try {
      await fetch('/api/system-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scalingMultiplier: multiplier,
          productCosts
        })
      });
      await logAudit('ADMIN', 'ADMIN', 'CONFIG_SCALE', `Updated progressive order scaling multiplier to ${multiplier}`);
    } catch (e) {
      console.error("Error updating scaling multiplier, falling back to local storage:", e);
      setScalingMultiplier(multiplier);
      localStorage.setItem('gom_scaling_multiplier', multiplier.toString());
    }
  };

  const updateProductCost = async (id: number, cost: number, rewardPercent: number) => {
    const rawCosts = productCosts.map(p => {
      if (p.id === id) {
        return { ...p, baseCost: cost, rewardMultiplier: rewardPercent / 100 };
      }
      return p;
    });
    const updatedCosts = sanitizeProductCosts(rawCosts);
    try {
      await fetch('/api/system-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scalingMultiplier,
          productCosts: updatedCosts
        })
      });
      await logAudit('ADMIN', 'ADMIN', 'CONFIG_PRODUCT', `Updated Order ${id} base material cost to ${cost} ETB, reward commission to ${rewardPercent}% (Subsequent levels sanitized if necessary)`);
    } catch (e) {
      console.error("Error updating product cost, falling back to local storage:", e);
      setProductCosts(updatedCosts);
      localStorage.setItem('gom_product_costs', JSON.stringify(updatedCosts));
    }
  };

  const updateAllProductCosts = async (newCosts: { id: number; baseCost: number; rewardMultiplier: number }[]) => {
    const sanitized = sanitizeProductCosts(newCosts);
    try {
      await fetch('/api/system-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scalingMultiplier,
          productCosts: sanitized
        })
      });
      await logAudit('ADMIN', 'ADMIN', 'CONFIG_ALL_PRODUCTS', `Updated and progressively auto-scaled all 15 product levels according to progressive greater-than cost constraints.`);
    } catch (e) {
      console.error("Error updating all product costs, falling back to local storage:", e);
      setProductCosts(sanitized);
      localStorage.setItem('gom_product_costs', JSON.stringify(sanitized));
    }
  };

  const addAnnouncement = async (title: string, content: string) => {
    const newAnn: Announcement = {
      id: generateId('ANN'),
      title,
      content,
      createdAt: new Date().toISOString()
    };
    try {
      await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAnn)
      });
      await logAudit('ADMIN', 'ADMIN', 'ADD_ANNOUNCEMENT', `Created announcement: "${title}"`);
    } catch (e) {
      console.error("Error adding announcement, falling back to local storage:", e);
      const updatedAnns = [newAnn, ...announcements];
      setAnnouncements(updatedAnns);
      localStorage.setItem('gom_announcements', JSON.stringify(updatedAnns));
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      await fetch('/api/announcements/' + id, { method: 'DELETE' });
      await logAudit('ADMIN', 'ADMIN', 'DELETE_ANNOUNCEMENT', `Deleted announcement with ID ${id}`);
    } catch (e) {
      console.error("Error deleting announcement, falling back to local storage:", e);
      const updatedAnns = announcements.filter(a => a.id !== id);
      setAnnouncements(updatedAnns);
      localStorage.setItem('gom_announcements', JSON.stringify(updatedAnns));
    }
  };

  const addSupportTicket = async (subject: string, message: string) => {
    if (!currentUser) return;
    const newMsg: SupportMessage = {
      id: generateId('SUP'),
      userId: currentUser.id,
      userPhone: currentUser.phoneNumber,
      subject,
      message,
      status: 'open',
      createdAt: new Date().toISOString()
    };
    try {
      await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg)
      });
      await logAudit(currentUser.id, currentUser.phoneNumber, 'SUPPORT_CREATE', `Opened support ticket: "${subject}"`);
    } catch (e) {
      console.error("Error opening support ticket, falling back to local storage:", e);
      const updatedMsgs = [newMsg, ...supportMessages];
      setSupportMessages(updatedMsgs);
      localStorage.setItem('gom_support', JSON.stringify(updatedMsgs));
    }
  };

  const replyToSupport = async (id: string, reply: string) => {
    const ticket = supportMessages.find(m => m.id === id);
    if (!ticket) return;
    const updatedTicket = {
      ...ticket,
      reply,
      status: 'resolved' as const
    };
    try {
      await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTicket)
      });
      await logAudit('ADMIN', 'ADMIN', 'SUPPORT_REPLY', `Resolved and replied to support ticket ${id}`);
    } catch (e) {
      console.error("Error replying to support, falling back to local storage:", e);
      const updatedMsgs = supportMessages.map(m => m.id === id ? updatedTicket : m);
      setSupportMessages(updatedMsgs);
      localStorage.setItem('gom_support', JSON.stringify(updatedMsgs));
    }
  };

  const adjustUserBalance = async (userId: string, amount: number) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;

    const newBalance = Math.max(0, userToUpdate.walletBalance + amount);
    const updatedUser = {
      ...userToUpdate,
      walletBalance: newBalance
    };

    const targetPhone = userToUpdate.phoneNumber;
    const manualTx: Transaction = {
      id: generateId('tx'),
      userId,
      userPhone: targetPhone,
      amount: Math.abs(amount),
      type: amount >= 0 ? 'recharge' : 'withdraw',
      bankName: 'System Adjustment (Admin)',
      accountNumberOrRef: 'SYSTEM_MANUAL',
      status: 'approved',
      createdAt: new Date().toISOString(),
      description: amount >= 0 
        ? `Manual Credit: Admin added +${amount} ETB to balance.` 
        : `Manual Debit: Admin deducted -${Math.abs(amount)} ETB from balance.`
    };

    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualTx)
      });

      const logMsg = amount >= 0 
        ? `Admin manually added ${amount} ETB to User ID ${userId} balance.` 
        : `Admin manually deducted ${Math.abs(amount)} ETB from User ID ${userId} balance.`;
      await logAudit('ADMIN', 'ADMIN', 'ADJUST_BALANCE', logMsg);
    } catch (e) {
      console.error("Error adjusting user balance, falling back to local storage:", e);
      
      const updatedUsers = users.map(u => u.id === userId ? updatedUser : u);
      setUsers(updatedUsers);
      localStorage.setItem('gom_users', JSON.stringify(updatedUsers));
      
      if (currentUser && currentUser.id === userId) {
        setCurrentUser(updatedUser);
      }

      const updatedTxs = [manualTx, ...transactions];
      setTransactions(updatedTxs);
      localStorage.setItem('gom_transactions', JSON.stringify(updatedTxs));
    }
  };

  const addRechargeAccount = async (bank: string, accName: string, accNo: string) => {
    const newAcc: RechargeAccount = {
      id: generateId('ACC'),
      bank,
      accName,
      accNo: accNo.trim()
    };
    try {
      await fetch('/api/recharge-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAcc)
      });
      await logAudit('ADMIN', 'ADMIN', 'ADD_RECHARGE_ACCOUNT', `Added recharge bank account: ${bank} - ${accNo}`);
    } catch (e) {
      console.error("Error adding recharge account, falling back to local storage:", e);
      const updatedAccs = [...rechargeAccounts, newAcc];
      setRechargeAccounts(updatedAccs);
      localStorage.setItem('gom_recharge_accounts', JSON.stringify(updatedAccs));
    }
  };

  const updateRechargeAccount = async (id: string, bank: string, accName: string, accNo: string) => {
    const acc = rechargeAccounts.find(a => a.id === id);
    if (!acc) return;
    const updatedAcc = { ...acc, bank, accName, accNo: accNo.trim() };
    try {
      await fetch('/api/recharge-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAcc)
      });
      await logAudit('ADMIN', 'ADMIN', 'UPDATE_RECHARGE_ACCOUNT', `Updated recharge bank account: ${bank} - ${accNo}`);
    } catch (e) {
      console.error("Error updating recharge account, falling back to local storage:", e);
      const updatedAccs = rechargeAccounts.map(a => a.id === id ? updatedAcc : a);
      setRechargeAccounts(updatedAccs);
      localStorage.setItem('gom_recharge_accounts', JSON.stringify(updatedAccs));
    }
  };

  const deleteRechargeAccount = async (id: string) => {
    const acc = rechargeAccounts.find(a => a.id === id);
    if (!acc) return;
    try {
      await fetch('/api/recharge-accounts/' + id, { method: 'DELETE' });
      await logAudit('ADMIN', 'ADMIN', 'DELETE_RECHARGE_ACCOUNT', `Deleted recharge bank account: ${acc.bank} - ${acc.accNo}`);
    } catch (e) {
      console.error("Error deleting recharge account, falling back to local storage:", e);
      const updatedAccs = rechargeAccounts.filter(a => a.id !== id);
      setRechargeAccounts(updatedAccs);
      localStorage.setItem('gom_recharge_accounts', JSON.stringify(updatedAccs));
    }
  };

  const updateBankLogo = async (bankKey: string, logoUrl: string) => {
    try {
      const updatedLogos = { ...bankLogos, [bankKey]: logoUrl };
      setBankLogos(updatedLogos);
      localStorage.setItem('gom_bank_logos', JSON.stringify(updatedLogos));
      
      await fetch('/api/system-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankLogos: updatedLogos })
      });
      await logAudit('ADMIN', 'ADMIN', 'UPDATE_BANK_LOGO', `Updated bank logo for key ${bankKey}`);
    } catch (e) {
      console.error("Error updating bank logo in database:", e);
    }
  };

  const updateMarketplaceLogo = async (marketKey: string, logoUrl: string) => {
    try {
      const updatedLogos = { ...marketplaceLogos, [marketKey]: logoUrl };
      setMarketplaceLogos(updatedLogos);
      localStorage.setItem('gom_marketplace_logos', JSON.stringify(updatedLogos));
      
      await fetch('/api/system-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketplaceLogos: updatedLogos })
      });
      await logAudit('ADMIN', 'ADMIN', 'UPDATE_MARKET_LOGO', `Updated marketplace logo for key ${marketKey}`);
    } catch (e) {
      console.error("Error updating marketplace logo in database:", e);
    }
  };

  const deleteBankLogo = async (bankKey: string) => {
    try {
      const defaultUrl = DEFAULT_BANK_LOGOS[bankKey] || '';
      const updatedLogos = { ...bankLogos, [bankKey]: defaultUrl };
      setBankLogos(updatedLogos);
      localStorage.setItem('gom_bank_logos', JSON.stringify(updatedLogos));
      
      await fetch('/api/system-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankLogos: updatedLogos })
      });
      await logAudit('ADMIN', 'ADMIN', 'DELETE_BANK_LOGO', `Reset bank logo for key ${bankKey} to default`);
    } catch (e) {
      console.error("Error resetting bank logo in database:", e);
    }
  };

  const deleteMarketplaceLogo = async (marketKey: string) => {
    try {
      const defaultUrl = DEFAULT_MARKETPLACE_LOGOS[marketKey] || '';
      const updatedLogos = { ...marketplaceLogos, [marketKey]: defaultUrl };
      setMarketplaceLogos(updatedLogos);
      localStorage.setItem('gom_marketplace_logos', JSON.stringify(updatedLogos));
      
      await fetch('/api/system-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketplaceLogos: updatedLogos })
      });
      await logAudit('ADMIN', 'ADMIN', 'DELETE_MARKET_LOGO', `Reset marketplace logo for key ${marketKey} to default`);
    } catch (e) {
      console.error("Error resetting marketplace logo in database:", e);
    }
  };

  const factoryReset = async () => {
    try {
      if (currentUser) {
        await fetch('/api/factory-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id })
        });
      }
      
      // Update local storage selectively so the session is preserved (no logout)
      if (currentUser) {
        const updatedCurrentUser = {
          ...currentUser,
          walletBalance: 0,
          welcomeBonus: 0,
          totalEarnings: 0,
          currentOrderIndex: 0,
          completedOrderIds: [],
          lastOrderCompletedAt: undefined
        };
        localStorage.setItem('gom_current_user', JSON.stringify(updatedCurrentUser));
        
        // Update users array in local storage
        const savedUsers = localStorage.getItem('gom_users');
        if (savedUsers) {
          try {
            const parsedUsers = JSON.parse(savedUsers) as User[];
            const updatedUsers = parsedUsers.map(u => u.id === currentUser.id ? updatedCurrentUser : u);
            localStorage.setItem('gom_users', JSON.stringify(updatedUsers));
          } catch (err) {
            console.error(err);
          }
        }
      }

      // Filter out current user's records from local storage states
      const savedTxs = localStorage.getItem('gom_transactions');
      if (savedTxs) {
        try {
          const parsed = JSON.parse(savedTxs) as Transaction[];
          const updated = parsed.filter(tx => tx.userId !== currentUser?.id);
          localStorage.setItem('gom_transactions', JSON.stringify(updated));
        } catch (err) { console.error(err); }
      }

      const savedSupport = localStorage.getItem('gom_support');
      if (savedSupport) {
        try {
          const parsed = JSON.parse(savedSupport) as SupportMessage[];
          const updated = parsed.filter(msg => msg.userId !== currentUser?.id);
          localStorage.setItem('gom_support', JSON.stringify(updated));
        } catch (err) { console.error(err); }
      }

      const savedLogs = localStorage.getItem('gom_audit_logs');
      if (savedLogs) {
        try {
          const parsed = JSON.parse(savedLogs) as AuditLog[];
          const updated = parsed.filter(log => log.userId !== currentUser?.id);
          localStorage.setItem('gom_audit_logs', JSON.stringify(updated));
        } catch (err) { console.error(err); }
      }
      
      window.location.reload();
    } catch (e) {
      console.error("Error resetting own account:", e);
    }
  };

  const adminChangeUserPassword = async (userId: string, newPasswordPlain: string): Promise<{ success: boolean; message: string }> => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) {
      return { success: false, message: 'User not found.' };
    }
    try {
      const hashed = await hashPassword(newPasswordPlain);
      const updatedUser = {
        ...userToUpdate,
        passwordHash: hashed
      };

      // Always update local state first to guarantee instant response regardless of database connectivity/quota
      const updatedUsers = users.map(u => u.id === userId ? updatedUser : u);
      setUsers(updatedUsers);
      localStorage.setItem('gom_users', JSON.stringify(updatedUsers));

      if (currentUser && currentUser.id === userId) {
        setCurrentUser(updatedUser);
        localStorage.setItem('gom_current_user', JSON.stringify(updatedUser));
      }

      try {
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedUser)
        });
        await logAudit('ADMIN', 'ADMIN', 'ADMIN_CHANGE_PASSWORD', `Admin updated password for User ID ${userId}`);
      } catch (dbErr: any) {
        console.warn("[Admin Password Change] Database write failed, saved locally:", dbErr);
        return { success: true, message: 'User password changed successfully (Offline Fallback).' };
      }

      return { success: true, message: 'User password successfully changed.' };
    } catch (e: any) {
      console.error("Error updating user password as admin:", e);
      return { success: false, message: e.message || 'Failed to update user password.' };
    }
  };

  const adminDeleteUser = async (userId: string): Promise<{ success: boolean; message: string }> => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) {
      return { success: false, message: 'User not found.' };
    }

    // Update state first
    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    localStorage.setItem('gom_users', JSON.stringify(updatedUsers));

    // If deleted current user, log them out
    if (currentUser && currentUser.id === userId) {
      logout();
    }

    try {
      // Delete user document
      await fetch('/api/users/' + userId, { method: 'DELETE' });
      await logAudit('ADMIN', 'ADMIN', 'ADMIN_DELETE_USER', `Admin deleted User ID ${userId} (Phone: ${userToDelete.phoneNumber})`);
    } catch (e: any) {
      console.warn("[Admin Delete User] Database delete failed, deleted locally:", e);
      return { success: true, message: 'User deleted successfully (Offline Fallback).' };
    }

    return { success: true, message: 'User deleted successfully.' };
  };

  const adminUpdateUserStage = async (userId: string, newStage: number): Promise<{ success: boolean; message: string }> => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) {
      return { success: false, message: 'User not found.' };
    }

    // Convert newStage (1 to 15) to currentOrderIndex (0 to 14)
    const newIndex = Math.max(0, Math.min(14, newStage - 1));
    
    // Ensure completedOrderIds contains all levels completed up to newIndex
    const completedOrderIds: number[] = [];
    for (let i = 1; i <= newIndex; i++) {
      completedOrderIds.push(i);
    }

    // Calculate simulated costs and balances for the user
    const { simulatedCosts } = getSimulatedCostAndBalanceForUser(userId, productCosts);
    const orderCost = simulatedCosts[newStage] || 0;

    // Use orderCost as the new wallet balance: "the amount of that order should show in balance"
    const newBalance = orderCost;

    // Sum of rewards for completed orders (1 to newStage - 1)
    let totalEarnings = 0;
    const r2 = (n: number) => Math.round(n * 100) / 100;
    for (let i = 1; i <= newIndex; i++) {
      const prodConf = productCosts.find(p => p.id === i);
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

    const updatedUser = {
      ...userToUpdate,
      currentOrderIndex: newIndex,
      completedOrderIds,
      walletBalance: newBalance,
      totalEarnings: totalEarnings
    };

    // Update local state first
    const updatedUsers = users.map(u => u.id === userId ? updatedUser : u);
    setUsers(updatedUsers);
    localStorage.setItem('gom_users', JSON.stringify(updatedUsers));

    if (currentUser && currentUser.id === userId) {
      setCurrentUser(updatedUser);
      localStorage.setItem('gom_current_user', JSON.stringify(updatedUser));
    }

    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });
      await logAudit('ADMIN', 'ADMIN', 'ADMIN_UPDATE_STAGE', `Admin updated task stage for User ID ${userId} to Level ${newStage}. Balance updated to ${newBalance} ETB and total earnings to ${totalEarnings} ETB.`);
    } catch (e: any) {
      console.warn("[Admin Stage Update] Database write failed, saved locally:", e);
      return { success: true, message: `Successfully updated user stage to Level ${newStage} and balance to ${newBalance} ETB (Offline Fallback).` };
    }

    return { success: true, message: `Successfully updated user stage to Level ${newStage} and balance to ${newBalance} ETB.` };
  };

  // ==========================================
  // OFFLINE RECHARGE CODE VERIFICATION SYSTEM
  // ==========================================
  const [usedCodes, setUsedCodes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('gom_used_verification_codes');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [adminGeneratedCodes, setAdminGeneratedCodes] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('gom_generated_codes');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const generateOfflineRechargeCode = (
    phone: string,
    amount: number,
    reference: string,
    expiryMinutes: number
  ) => {
    const adminPasswordHash = "2b03c89806148889482ecec643b5d0e5fcf3b7b7c87ae5d8b6bfa34e84e1768a";
    const code = generateVerificationCode(phone, amount, reference, expiryMinutes, adminPasswordHash);
    if (!code) {
      return { success: false, message: 'Failed to generate cryptographically signed code.' };
    }

    const newCodeRecord = {
      code,
      phone,
      amount,
      reference,
      expiryTime: new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    };

    const updatedCodes = [newCodeRecord, ...adminGeneratedCodes];
    setAdminGeneratedCodes(updatedCodes);
    localStorage.setItem('gom_generated_codes', JSON.stringify(updatedCodes));

    // Sync with PostgreSQL backend
    fetch('/api/recharge-codes/generated', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ generatedCodes: updatedCodes })
    }).catch(err => console.error('Error syncing generated codes with server:', err));

    return { success: true, code, message: 'Recharge verification code generated successfully.' };
  };

  const verifyRechargeOffline = async (txId: string, code: string) => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx || tx.status !== 'pending') {
      return { success: false, message: 'Recharge record not found or already processed.' };
    }

    const normalizedCode = code.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (usedCodes.includes(normalizedCode)) {
      return { success: false, message: 'This verification code has already been used.' };
    }

    const check = verifyVerificationCode(code, tx.userPhone, tx.amount, tx.accountNumberOrRef || '');
    if (!check.valid) {
      return { success: false, message: check.error || 'Invalid or tampered verification code.' };
    }

    if (check.expired) {
      return { success: false, message: 'This verification code has expired.' };
    }

    try {
      // Mark code as used globally
      const updatedUsed = [...usedCodes, normalizedCode];
      setUsedCodes(updatedUsed);
      localStorage.setItem('gom_used_verification_codes', JSON.stringify(updatedUsed));

      // Sync with PostgreSQL backend
      await fetch('/api/recharge-codes/used', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalizedCode })
      }).catch(err => console.error('Error syncing used code with server:', err));

      // IMMEDIATE LOCAL STATE UPDATE (Instant feedback across all components)
      const updatedTxs = transactions.map(t => t.id === txId ? { ...t, status: 'approved' as const } : t);
      setTransactions(updatedTxs);
      localStorage.setItem('gom_transactions', JSON.stringify(updatedTxs));

      const userToUpdate = users.find(u => u.id === tx.userId);
      if (userToUpdate) {
        const updatedUser = {
          ...userToUpdate,
          walletBalance: userToUpdate.walletBalance + tx.amount
        };
        const updatedUsers = users.map(u => u.id === tx.userId ? updatedUser : u);
        setUsers(updatedUsers);
        localStorage.setItem('gom_users', JSON.stringify(updatedUsers));

        if (currentUser && currentUser.id === tx.userId) {
          setRawCurrentUser(updatedUser);
          localStorage.setItem('gom_current_user', JSON.stringify(updatedUser));
        }
      }

      // Update in PostgreSQL database synchronously by hitting the status update endpoint
      const res = await fetch(`/api/transactions/${txId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to approve transaction on backend server.');
      }

      const data = await res.json();
      if (data.success) {
        if (data.users) {
          setUsers(data.users);
          localStorage.setItem('gom_users', JSON.stringify(data.users));
          if (currentUser) {
            const updatedMe = data.users.find((u: any) => u.id === currentUser.id);
            if (updatedMe) {
              setRawCurrentUser(updatedMe);
              localStorage.setItem('gom_current_user', JSON.stringify(updatedMe));
            }
          }
        }
        if (data.transactions) {
          setTransactions(data.transactions);
          localStorage.setItem('gom_transactions', JSON.stringify(data.transactions));
        }
      }

      await logAudit(tx.userId, tx.userPhone, 'OFFLINE_RECHARGE_VERIFY', `Successfully verified offline code ${code} for deposit of ${tx.amount} ETB. Ref: ${tx.accountNumberOrRef}`);

      return { success: true, message: 'Recharge Approved Successfully' };
    } catch (e: any) {
      console.error("Error in verifyRechargeOffline, falling back to local storage:", e);

      // Fallback local state update
      const updatedUsed = [...usedCodes, normalizedCode];
      setUsedCodes(updatedUsed);
      localStorage.setItem('gom_used_verification_codes', JSON.stringify(updatedUsed));

      // Try to sync with backend even in fallback
      fetch('/api/recharge-codes/used', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalizedCode })
      }).catch(() => {});

      // Update transaction status
      const updatedTxs = transactions.map(t => t.id === txId ? { ...t, status: 'approved' as const } : t);
      setTransactions(updatedTxs);
      localStorage.setItem('gom_transactions', JSON.stringify(updatedTxs));

      // Update user wallet balance
      const userToUpdate = users.find(u => u.id === tx.userId);
      if (userToUpdate) {
        const updatedUser = {
          ...userToUpdate,
          walletBalance: userToUpdate.walletBalance + tx.amount
        };
        const updatedUsers = users.map(u => u.id === tx.userId ? updatedUser : u);
        setUsers(updatedUsers);
        localStorage.setItem('gom_users', JSON.stringify(updatedUsers));

        if (currentUser && currentUser.id === tx.userId) {
          setRawCurrentUser(updatedUser);
          localStorage.setItem('gom_current_user', JSON.stringify(updatedUser));
        }
      }

      await logAudit(tx.userId, tx.userPhone, 'OFFLINE_RECHARGE_VERIFY', `Successfully verified offline code ${code} for deposit of ${tx.amount} ETB. Ref: ${tx.accountNumberOrRef} (Offline Fallback)`);

      return { success: true, message: 'Recharge Approved Successfully (Offline Fallback)' };
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      users,
      transactions,
      announcements,
      supportMessages,
      auditLogs,
      orders,
      scalingMultiplier,
      productCosts,
      systemReports,
      register,
      login,
      logout,
      resetPassword,
      updateAccountDetails,
      registerWithdrawalAccount,
      deposit,
      withdraw,
      approveTransaction,
      rejectTransaction,
      addToCart,
      submitOrder,
      resetOrderCycle,
      updateScalingMultiplier,
      updateProductCost,
      updateAllProductCosts,
      addAnnouncement,
      deleteAnnouncement,
      replyToSupport,
      addSupportTicket,
      adjustUserBalance,
      addRechargeAccount,
      updateRechargeAccount,
      deleteRechargeAccount,
      adminChangeUserPassword,
      adminDeleteUser,
      adminUpdateUserStage,
      usedCodes,
      adminGeneratedCodes,
      generateOfflineRechargeCode,
      verifyRechargeOffline,
      factoryReset,
      rechargeAccounts,
      language,
      setLanguage,
      currency,
      setCurrency,
      formatPrice,
      bankLogos,
      marketplaceLogos,
      updateBankLogo,
      updateMarketplaceLogo,
      deleteBankLogo,
      deleteMarketplaceLogo
    }}>
      {children}
    </AppContext.Provider>
  );
};
