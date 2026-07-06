/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  User, 
  Transaction, 
  Order, 
  Announcement, 
  SupportMessage, 
  AuditLog, 
  SystemReport,
  OrderStatus,
  RechargeAccount
} from '../types';
import { hashPassword, generateUserId, generateId } from '../utils/security';
import { 
  INITIAL_PRODUCTS_RAW, 
  INITIAL_ANNOUNCEMENTS, 
  INITIAL_USERS,
  ALTERNATIVE_PRODUCTS_POOLS
} from '../utils/mockData';
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  deleteDoc, 
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';

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
    const currentMult = (typeof p.rewardMultiplier === 'number' && p.rewardMultiplier > 0) ? p.rewardMultiplier : 0.15;
    
    if (idx > 0) {
      const prev = result[idx - 1];
      const prevMult = (typeof prev.rewardMultiplier === 'number' && prev.rewardMultiplier > 0) ? prev.rewardMultiplier : 0.15;
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
  language: 'en' | 'am';
  setLanguage: (lang: 'en' | 'am') => void;
  
  // Auth actions
  register: (phoneNumber: string, passwordPlain: string, referralCode?: string) => Promise<{ success: boolean; message: string }>;
  login: (phoneNumber: string, passwordPlain: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  resetPassword: (phoneNumber: string, passwordPlain: string) => Promise<{ success: boolean; message: string }>;
  updateAccountDetails: (phoneNumber: string, passwordPlain?: string) => Promise<{ success: boolean; message: string }>;

  // Wallet actions
  deposit: (amount: number, bankName: string, refCode: string, screenshot?: string) => void;
  withdraw: (amount: number, bankName: string, accNo: string) => { success: boolean; message: string };
  
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
  
  // System reset
  factoryReset: () => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load or initialize state from localStorage with migration check
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('gom_users');
    let loadedUsers: User[] = [];
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as User[];
        const hasNewAdmin = parsed.some(u => u.phoneNumber === '0926193920' && u.role === 'admin');
        if (!hasNewAdmin) {
          // Stale local storage detected. Clean reset to apply new credentials.
          localStorage.clear();
          loadedUsers = INITIAL_USERS;
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
    return loadedUsers.map(u => {
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
    const calculatedReferralEarnings = referredCount * 100;
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

  const [language, setLanguageState] = useState<'en' | 'am'>(() => {
    const saved = localStorage.getItem('gom_lang');
    return (saved === 'am' || saved === 'en') ? saved : 'en';
  });

  const setLanguage = (lang: 'en' | 'am') => {
    setLanguageState(lang);
    localStorage.setItem('gom_lang', lang);
  };

  const [cartTrigger, setCartTrigger] = useState(0);

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('gom_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('gom_announcements');
    return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
  });

  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>(() => {
    const saved = localStorage.getItem('gom_support');
    return saved ? JSON.parse(saved) : [];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
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
  });

  const [scalingMultiplier, setScalingMultiplier] = useState<number>(() => {
    const saved = localStorage.getItem('gom_scaling_multiplier');
    return saved ? Number(saved) : 1.5; // 50% increase progressively by default
  });

  const [rechargeAccounts, setRechargeAccounts] = useState<RechargeAccount[]>(() => {
    const saved = localStorage.getItem('gom_recharge_accounts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [
      { id: 'acc-1', bank: 'Commercial Bank of Ethiopia (CBE)', accName: 'GOM', accNo: '1000552233445' },
      { id: 'acc-2', bank: 'Dashen Bank', accName: 'GOM', accNo: '001244558832' },
      { id: 'acc-3', bank: 'Bank of Abyssinia (BoA)', accName: 'GOM', accNo: '55887744331' },
      { id: 'acc-4', bank: 'Awash Bank', accName: 'GOM', accNo: '013204938200' }
    ];
  });

  const [bankLogos, setBankLogos] = useState<{ [key: string]: string }>(() => {
    const saved = localStorage.getItem('gom_bank_logos');
    return saved ? JSON.parse(saved) : DEFAULT_BANK_LOGOS;
  });

  const [marketplaceLogos, setMarketplaceLogos] = useState<{ [key: string]: string }>(() => {
    const saved = localStorage.getItem('gom_marketplace_logos');
    return saved ? JSON.parse(saved) : DEFAULT_MARKETPLACE_LOGOS;
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

    // Generate dynamic starting cost for Level 1 between 750 and 1000 ETB
    const dynamicLevel1Base = Math.floor(Math.random() * (1000 - 750 + 1)) + 750;

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

  // Seeding helper for empty Firestore database
  const seedInitialData = async () => {
    try {
      const batch = writeBatch(db);
      
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
        { id: 'acc-1', bank: 'Commercial Bank of Ethiopia (CBE)', accName: 'GOM', accNo: '1000552233445' },
        { id: 'acc-2', bank: 'Dashen Bank', accName: 'GOM', accNo: '001244558832' },
        { id: 'acc-3', bank: 'Bank of Abyssinia (BoA)', accName: 'GOM', accNo: '55887744331' },
        { id: 'acc-4', bank: 'Awash Bank', accName: 'GOM', accNo: '013204938200' }
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
    // 1. Users sync
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const list: User[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as User);
      });
      
      if (list.length > 0) {
        setUsers(list);
        localStorage.setItem('gom_users', JSON.stringify(list));
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
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTransactions(list);
      localStorage.setItem('gom_transactions', JSON.stringify(list));
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
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSupportMessages(list);
      localStorage.setItem('gom_support', JSON.stringify(list));
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
      unsubUsers();
      unsubTx();
      unsubAnn();
      unsubSup();
      unsubLogs();
      unsubAcc();
      unsubConfig();
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

  // Recalculate dynamic orders list whenever user changes, productCosts scale, or balance shifts
  useEffect(() => {
    if (!currentUser) {
      setOrders([]);
      return;
    }

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
      const pct = (typeof rawProd.rewardMultiplier === 'number' && rawProd.rewardMultiplier > 0)
        ? rawProd.rewardMultiplier
        : (INITIAL_PRODUCTS_RAW.find(p => p.id === rawProd.id)?.rewardMultiplier || 0.15);

      // Cost calculation
      // Implement specific rule requested by the user:
      // - Order 1: material cost between 701 and 1000 ETB (starts from base welcome bonus 500)
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
                           i === 7 ? 0.40 : 
                           i === 8 ? 0.42 : 
                           i === 9 ? 0.45 : 
                           i === 10 ? 0.48 : 
                           i === 11 ? 0.50 : 
                           i === 12 ? 0.55 : 
                           i === 13 ? 0.58 : 
                           i === 14 ? 0.60 : 0.65;
        calculatedPcts[i] = (typeof prodConf?.rewardMultiplier === 'number' && prodConf.rewardMultiplier > 0)
          ? prodConf.rewardMultiplier
          : defaultPct;
      }

      // Order 1: cost is between 701 and 1000 ETB (e.g. 800)
      simulatedCosts[1] = 800;
      simulatedBalances[1] = simulatedCosts[1] + Math.round(simulatedCosts[1] * calculatedPcts[1]);

      // Order 2: less than balance by 5 ETB
      simulatedCosts[2] = simulatedBalances[1] - 5;
      simulatedBalances[2] = simulatedBalances[1] + Math.round(simulatedCosts[2] * calculatedPcts[2]);

      // Order 3: less than balance by 5 ETB
      simulatedCosts[3] = simulatedBalances[2] - 5;
      simulatedBalances[3] = simulatedBalances[2] + Math.round(simulatedCosts[3] * calculatedPcts[3]);

      // Order 4: greater than balance (requires recharge), recharge required is exactly 30% of previous balance
      simulatedCosts[4] = simulatedBalances[3] + Math.round(simulatedBalances[3] * 0.30);
      simulatedBalances[4] = simulatedCosts[4] + Math.round(simulatedCosts[4] * calculatedPcts[4]);

      // Order 5: less than balance by 5 ETB
      simulatedCosts[5] = simulatedBalances[4] - 5;
      simulatedBalances[5] = simulatedBalances[4] + Math.round(simulatedCosts[5] * calculatedPcts[5]);

      // Order 6: less than balance by 5 ETB
      simulatedCosts[6] = simulatedBalances[5] - 5;
      simulatedBalances[6] = simulatedBalances[5] + Math.round(simulatedCosts[6] * calculatedPcts[6]);

      // Order 7: less than balance by 5 ETB
      simulatedCosts[7] = simulatedBalances[6] - 5;
      simulatedBalances[7] = simulatedBalances[6] + Math.round(simulatedCosts[7] * calculatedPcts[7]);

      // Order 8: greater than balance (requires recharge), recharge required is exactly 38% of previous balance
      simulatedCosts[8] = simulatedBalances[7] + Math.round(simulatedBalances[7] * 0.38);
      simulatedBalances[8] = simulatedCosts[8] + Math.round(simulatedCosts[8] * calculatedPcts[8]);

      // Order 9: less than balance by 5 ETB
      simulatedCosts[9] = simulatedBalances[8] - 5;
      simulatedBalances[9] = simulatedBalances[8] + Math.round(simulatedCosts[9] * calculatedPcts[9]);

      // Order 10: less than balance by 5 ETB
      simulatedCosts[10] = simulatedBalances[9] - 5;
      simulatedBalances[10] = simulatedBalances[9] + Math.round(simulatedCosts[10] * calculatedPcts[10]);

      // Order 11: greater than balance (requires recharge), recharge required is exactly 30% of previous balance
      simulatedCosts[11] = simulatedBalances[10] + Math.round(simulatedBalances[10] * 0.30);
      simulatedBalances[11] = simulatedCosts[11] + Math.round(simulatedCosts[11] * calculatedPcts[11]);

      // Order 12: less than balance by 5 ETB
      simulatedCosts[12] = simulatedBalances[11] - 5;
      simulatedBalances[12] = simulatedBalances[11] + Math.round(simulatedCosts[12] * calculatedPcts[12]);

      // Order 13: less than balance by 5 ETB
      simulatedCosts[13] = simulatedBalances[12] - 5;
      simulatedBalances[13] = simulatedBalances[12] + Math.round(simulatedCosts[13] * calculatedPcts[13]);

      // Order 14: less than balance by 5 ETB
      simulatedCosts[14] = simulatedBalances[13] - 5;
      simulatedBalances[14] = simulatedBalances[13] + Math.round(simulatedCosts[14] * calculatedPcts[14]);

      // Order 15: greater than balance (requires recharge), recharge required is exactly 13% of previous balance
      simulatedCosts[15] = simulatedBalances[14] + Math.round(simulatedBalances[14] * 0.13);
      simulatedBalances[15] = simulatedCosts[15] + Math.round(simulatedCosts[15] * calculatedPcts[15]);

      const cost = simulatedCosts[rawProd.id] || rawProd.baseCost;

      const reward = Math.round(cost * pct);

      // Minimum Recharge calculation: (Material Cost - wallet balance)
      // Display 0 if they have enough balance
      const minRechargeRequired = Math.max(0, cost - currentUser.walletBalance);

      const override = currentUser.cycleProductOverrides?.find(o => o.id === rawProd.id);
      const productName = override ? override.productName : (INITIAL_PRODUCTS_RAW.find(p => p.id === rawProd.id)?.productName || `Premium Order Product ${rawProd.id}`);
      const productImage = override ? override.productImage : (INITIAL_PRODUCTS_RAW.find(p => p.id === rawProd.id)?.productImage || "");

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
      await setDoc(doc(db, 'auditLogs', log.id), log);
    } catch (e) {
      console.error("Error writing audit log to Firestore:", e);
    }
  };

  // AUTH ACTIONS
  const register = async (phoneNumber: string, passwordPlain: string, referralCode?: string) => {
    // Phone validation
    const trimmedPhone = phoneNumber.trim();
    if (!trimmedPhone.match(/^(09|07)\d{8}$/) && !trimmedPhone.match(/^\+251(9|7)\d{8}$/)) {
      return { success: false, message: 'Invalid phone format. Please use standard Ethiopian format (09xxxxxxxx or 07xxxxxxxx).' };
    }

    const exists = users.some(u => u.phoneNumber === trimmedPhone);
    if (exists) {
      return { success: false, message: 'Phone number already registered.' };
    }

    const currentDeviceId = getOrCreateDeviceId();
    const isAdminDevice = localStorage.getItem('gom_admin_device') === 'true' || 
                          users.some(u => u.deviceId === currentDeviceId && u.role === 'admin');

    if (!isAdminDevice) {
      const deviceAssociatedUser = users.find(u => u.deviceId === currentDeviceId && u.role !== 'admin');
      if (deviceAssociatedUser) {
        return { 
          success: false, 
          message: 'Registration blocked. This device is already associated with an existing account.' 
        };
      }
    }

    const hashed = await hashPassword(passwordPlain);
    const userId = generateUserId();
    const phoneDigits = trimmedPhone.replace(/[^0-9]/g, '');
    const suffix = phoneDigits.slice(-5) || userId.slice(-5);
    const userInviteCode = `GOM${suffix}`;

    let baseWelcomeBonus = 500;
    let initialBalance = 500;
    let referredBy: string | undefined = undefined;
    const additionalTxs: Transaction[] = [];

    if (referralCode && referralCode.trim() !== '') {
      const cleanRef = referralCode.trim().toUpperCase();
      const referrer = users.find(u => 
        u.phoneNumber === referralCode.trim() || 
        u.inviteCode?.toUpperCase() === cleanRef || 
        u.id === referralCode.trim()
      );

      if (!referrer) {
        return { success: false, message: 'Invalid invite/referral code. Please check or leave empty.' };
      }

      referredBy = referrer.id;
      initialBalance = 600; // 500 welcome + 100 bonus

      // Referral bonus transaction for new user
      additionalTxs.push({
        id: generateId('TX'),
        userId: userId,
        userPhone: trimmedPhone,
        type: 'referral_bonus',
        amount: 100,
        status: 'completed',
        createdAt: new Date().toISOString(),
        description: `Registration referral bonus of 100 ETB credited (Invited by ${referrer.phoneNumber}).`
      });

      // Referral bonus transaction for referrer
      additionalTxs.push({
        id: generateId('TX'),
        userId: referrer.id,
        userPhone: referrer.phoneNumber,
        type: 'referral_bonus',
        amount: 100,
        status: 'completed',
        createdAt: new Date().toISOString(),
        description: `Referral Reward of 100 ETB credited for inviting ${trimmedPhone}.`
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
      amount: 500,
      status: 'completed',
      createdAt: new Date().toISOString(),
      description: 'Registration 500 ETB Welcome Bonus credited.'
    };

    try {
      const batch = writeBatch(db);

      // Write user and welcome bonus
      batch.set(doc(db, 'users', userId), cleanFirestoreData(newUser));
      batch.set(doc(db, 'transactions', welcomeBonusTransaction.id), cleanFirestoreData(welcomeBonusTransaction));

      // Add referral transactions
      additionalTxs.forEach((tx) => {
        batch.set(doc(db, 'transactions', tx.id), cleanFirestoreData(tx));
      });

      // Update referrer user in Firestore
      if (referredBy) {
        const referrerToUpdate = users.find(u => u.id === referredBy);
        if (referrerToUpdate) {
          const updatedReferrer = {
            ...referrerToUpdate,
            walletBalance: referrerToUpdate.walletBalance + 100,
            referralEarnings: (referrerToUpdate.referralEarnings || 0) + 100,
            referralCount: (referrerToUpdate.referralCount || 0) + 1
          };
          batch.set(doc(db, 'users', referredBy), cleanFirestoreData(updatedReferrer));
        }
      }

      await batch.commit();

      // Sync active session
      setCurrentUser(newUser);

      await logAudit(userId, trimmedPhone, 'REGISTER', `Successfully registered. Automatically credited 500 Welcome Bonus.${referredBy ? ' Plus 100 referral bonus.' : ''}`);
      if (referredBy) {
        const referrerToUpdate = users.find(u => u.id === referredBy);
        if (referrerToUpdate) {
          await logAudit(referrerToUpdate.id, referrerToUpdate.phoneNumber, 'REFERRAL_BONUS', `Referred ${trimmedPhone}. Credited +100 ETB.`);
        }
      }

      return { success: true, message: `Registration successful! Welcome bonus of 500 ETB credited.${referredBy ? ' Additional 100 ETB referral bonus credited!' : ''}` };
    } catch (e) {
      console.error("Error committing registration batch to Firestore:", e);
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  };

  const login = async (phoneNumber: string, passwordPlain: string) => {
    const trimmedPhone = phoneNumber.trim();
    const hashed = await hashPassword(passwordPlain);

    const matchedUser = users.find(u => u.phoneNumber === trimmedPhone);
    if (!matchedUser) {
      return { success: false, message: 'Invalid phone number or password.' };
    }

    if (matchedUser.passwordHash !== hashed) {
      return { success: false, message: 'Invalid phone number or password.' };
    }

    const currentDeviceId = getOrCreateDeviceId();
    const isAdminDevice = localStorage.getItem('gom_admin_device') === 'true' || 
                          users.some(u => u.deviceId === currentDeviceId && u.role === 'admin');

    if (matchedUser.role !== 'admin') {
      if (!isAdminDevice) {
        const deviceBoundToOtherUser = users.find(
          u => u.deviceId === currentDeviceId && u.id !== matchedUser.id && u.role !== 'admin'
        );
        if (deviceBoundToOtherUser) {
          return { 
            success: false, 
            message: 'Login blocked. This device is already associated with another account.' 
          };
        }
      }

      if (!matchedUser.deviceId) {
        try {
          const updatedUser = { ...matchedUser, deviceId: currentDeviceId };
          await setDoc(doc(db, 'users', matchedUser.id), cleanFirestoreData(updatedUser));
        } catch (e) {
          console.error("Error binding deviceId to user on login:", e);
        }
      }
    } else {
      // Admin login - flag this device as an admin device and record the deviceId
      localStorage.setItem('gom_admin_device', 'true');
      if (matchedUser.deviceId !== currentDeviceId) {
        try {
          const updatedUser = { ...matchedUser, deviceId: currentDeviceId };
          await setDoc(doc(db, 'users', matchedUser.id), cleanFirestoreData(updatedUser));
        } catch (e) {
          console.error("Error binding deviceId to admin on login:", e);
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
    const matchedUser = users.find(u => u.phoneNumber === trimmedPhone);
    if (!matchedUser) {
      return { success: false, message: 'Phone number not found.' };
    }

    const hashed = await hashPassword(passwordPlain);
    const updatedUser = {
      ...matchedUser,
      passwordHash: hashed
    };

    try {
      await setDoc(doc(db, 'users', matchedUser.id), cleanFirestoreData(updatedUser));
      await logAudit(matchedUser.id, trimmedPhone, 'RESET_PASSWORD', 'Password reset successfully.');
      return { success: true, message: 'Password reset successfully.' };
    } catch (e) {
      console.error("Error resetting password:", e);
      return { success: false, message: 'Failed to reset password. Please try again.' };
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
    if (trimmedPhone !== currentUser.phoneNumber) {
      const isTaken = users.some(u => u.phoneNumber === trimmedPhone && u.id !== currentUser.id);
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
      await setDoc(doc(db, 'users', currentUser.id), cleanFirestoreData(updatedUser));
      setCurrentUser(updatedUser);
      await logAudit(currentUser.id, trimmedPhone, 'UPDATE_ACCOUNT_DETAILS', 'Updated account login details.');
      return { success: true, message: 'Account details updated successfully.' };
    } catch (e) {
      console.error("Error updating account details:", e);
      return { success: false, message: 'Failed to update account details. Please try again.' };
    }
  };

  // WALLET ACTIONS
  const deposit = async (amount: number, bankName: string, refCode: string, screenshot?: string) => {
    if (!currentUser) return;

    const depositTx: Transaction = {
      id: generateId('DEP'),
      userId: currentUser.id,
      userPhone: currentUser.phoneNumber,
      type: 'recharge',
      amount,
      bankName,
      accountNumberOrRef: refCode.trim().toUpperCase(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      description: `Pending recharge of ${amount} ETB via ${bankName}. Reference: ${refCode}`,
      screenshot: screenshot || undefined
    };

    try {
      await setDoc(doc(db, 'transactions', depositTx.id), cleanFirestoreData(depositTx));
      await logAudit(currentUser.id, currentUser.phoneNumber, 'DEPOSIT_REQUEST', `Requested deposit of ${amount} ETB via ${bankName}`);
    } catch (e) {
      console.error("Error requesting deposit:", e);
    }
  };

  const withdraw = async (amount: number, bankName: string, accNo: string) => {
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

    const withdrawTx: Transaction = {
      id: generateId('WTH'),
      userId: currentUser.id,
      userPhone: currentUser.phoneNumber,
      type: 'withdraw',
      amount,
      bankName,
      accountNumberOrRef: accNo.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      description: `Pending withdrawal of ${amount} ETB to ${bankName} (${accNo}).`
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', currentUser.id), cleanFirestoreData(updatedUser));
      batch.set(doc(db, 'transactions', withdrawTx.id), cleanFirestoreData(withdrawTx));
      await batch.commit();

      await logAudit(currentUser.id, currentUser.phoneNumber, 'WITHDRAW_REQUEST', `Requested withdrawal of ${amount} ETB to ${bankName}. Account: ${accNo}`);
      return { success: true, message: 'Withdrawal request submitted! Pending admin approval.' };
    } catch (e) {
      console.error("Error requesting withdrawal:", e);
      return { success: false, message: 'Failed to submit withdrawal request. Please try again.' };
    }
  };

  // ADMIN ACTIONS
  const approveTransaction = async (txId: string) => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx || tx.status !== 'pending') return;

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'transactions', txId), cleanFirestoreData({ ...tx, status: 'approved' }));

      if (tx.type === 'recharge') {
        const userDocRef = doc(db, 'users', tx.userId);
        const userToUpdate = users.find(u => u.id === tx.userId);
        if (userToUpdate) {
          const updatedUser = {
            ...userToUpdate,
            walletBalance: userToUpdate.walletBalance + tx.amount
          };
          batch.set(userDocRef, cleanFirestoreData(updatedUser));
        }
      }

      await batch.commit();
      await logAudit('ADMIN', 'ADMIN', 'APPROVE_RECHARGE', `Approved recharge of ${tx.amount} ETB for User ${tx.userId}`);
    } catch (e) {
      console.error("Error approving transaction:", e);
    }
  };

  const rejectTransaction = async (txId: string) => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx || tx.status !== 'pending') return;

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'transactions', txId), cleanFirestoreData({ ...tx, status: 'rejected' }));

      if (tx.type === 'withdraw') {
        const userDocRef = doc(db, 'users', tx.userId);
        const userToUpdate = users.find(u => u.id === tx.userId);
        if (userToUpdate) {
          const updatedUser = {
            ...userToUpdate,
            walletBalance: userToUpdate.walletBalance + tx.amount
          };
          batch.set(userDocRef, cleanFirestoreData(updatedUser));
        }
      }

      await batch.commit();
      await logAudit('ADMIN', 'ADMIN', 'REJECT_WITHDRAWAL', `Rejected withdrawal of ${tx.amount} ETB for User ${tx.userId}. Funds refunded.`);
    } catch (e) {
      console.error("Error rejecting transaction:", e);
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
    const newBalance = currentUser.walletBalance + reward;
    const newTotalEarnings = currentUser.totalEarnings + reward;

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
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', currentUser.id), cleanFirestoreData(updatedUser));
      batch.set(doc(db, 'transactions', orderTx.id), cleanFirestoreData(orderTx));
      await batch.commit();

      await logAudit(currentUser.id, currentUser.phoneNumber, 'COMPLETE_ORDER', `Completed Order ${orderId}. Commission: ${reward} ETB.`);
      return { success: true, message: `Order ${orderId} successfully completed! ${reward} ETB commission added to your wallet.` };
    } catch (e) {
      console.error("Error submitting order:", e);
      return { success: false, message: 'Failed to complete order. Please try again.' };
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

    // Generate a new dynamic Level 1 base cost between 750 and 1000 ETB
    const newLevel1Base = Math.floor(Math.random() * (1000 - 750 + 1)) + 750;

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
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', currentUser.id), cleanFirestoreData(updatedUser));
      batch.set(doc(db, 'systemConfig', 'global'), {
        scalingMultiplier,
        productCosts: updatedCosts
      });
      await batch.commit();

      await logAudit(currentUser.id, currentUser.phoneNumber, 'RESET_CYCLE', `Reset task cycle. Loaded brand new materials & equipment. Configured dynamic Level 1 cost: ${newLevel1Base} ETB.`);
      return { 
        success: true, 
        message: `Task cycle reset successfully! Brand new materials have been loaded and arranged dynamically. First order balance is configured at ${newLevel1Base} ETB.` 
      };
    } catch (e) {
      console.error("Error resetting cycle:", e);
      return { success: false, message: 'Failed to reset cycle in database. Please try again.' };
    }
  };

  // ADMIN SETTINGS & MANAGEMENT
  const updateScalingMultiplier = async (multiplier: number) => {
    try {
      await setDoc(doc(db, 'systemConfig', 'global'), {
        scalingMultiplier: multiplier,
        productCosts
      });
      await logAudit('ADMIN', 'ADMIN', 'CONFIG_SCALE', `Updated progressive order scaling multiplier to ${multiplier}`);
    } catch (e) {
      console.error("Error updating scaling multiplier:", e);
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
      await setDoc(doc(db, 'systemConfig', 'global'), {
        scalingMultiplier,
        productCosts: updatedCosts
      });
      await logAudit('ADMIN', 'ADMIN', 'CONFIG_PRODUCT', `Updated Order ${id} base material cost to ${cost} ETB, reward commission to ${rewardPercent}% (Subsequent levels sanitized if necessary)`);
    } catch (e) {
      console.error("Error updating product cost:", e);
    }
  };

  const updateAllProductCosts = async (newCosts: { id: number; baseCost: number; rewardMultiplier: number }[]) => {
    const sanitized = sanitizeProductCosts(newCosts);
    try {
      await setDoc(doc(db, 'systemConfig', 'global'), {
        scalingMultiplier,
        productCosts: sanitized
      });
      await logAudit('ADMIN', 'ADMIN', 'CONFIG_ALL_PRODUCTS', `Updated and progressively auto-scaled all 15 product levels according to progressive greater-than cost constraints.`);
    } catch (e) {
      console.error("Error updating all product costs:", e);
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
      await setDoc(doc(db, 'announcements', newAnn.id), newAnn);
      await logAudit('ADMIN', 'ADMIN', 'ADD_ANNOUNCEMENT', `Created announcement: "${title}"`);
    } catch (e) {
      console.error("Error adding announcement:", e);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'announcements', id));
      await logAudit('ADMIN', 'ADMIN', 'DELETE_ANNOUNCEMENT', `Deleted announcement with ID ${id}`);
    } catch (e) {
      console.error("Error deleting announcement:", e);
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
      await setDoc(doc(db, 'support', newMsg.id), newMsg);
      await logAudit(currentUser.id, currentUser.phoneNumber, 'SUPPORT_CREATE', `Opened support ticket: "${subject}"`);
    } catch (e) {
      console.error("Error opening support ticket:", e);
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
      await setDoc(doc(db, 'support', id), updatedTicket);
      await logAudit('ADMIN', 'ADMIN', 'SUPPORT_REPLY', `Resolved and replied to support ticket ${id}`);
    } catch (e) {
      console.error("Error replying to support:", e);
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
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', userId), cleanFirestoreData(updatedUser));
      batch.set(doc(db, 'transactions', manualTx.id), cleanFirestoreData(manualTx));
      await batch.commit();

      const logMsg = amount >= 0 
        ? `Admin manually added ${amount} ETB to User ID ${userId} balance.` 
        : `Admin manually deducted ${Math.abs(amount)} ETB from User ID ${userId} balance.`;
      await logAudit('ADMIN', 'ADMIN', 'ADJUST_BALANCE', logMsg);
    } catch (e) {
      console.error("Error adjusting user balance:", e);
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
      await setDoc(doc(db, 'rechargeAccounts', newAcc.id), newAcc);
      await logAudit('ADMIN', 'ADMIN', 'ADD_RECHARGE_ACCOUNT', `Added recharge bank account: ${bank} - ${accNo}`);
    } catch (e) {
      console.error("Error adding recharge account:", e);
    }
  };

  const updateRechargeAccount = async (id: string, bank: string, accName: string, accNo: string) => {
    const acc = rechargeAccounts.find(a => a.id === id);
    if (!acc) return;
    const updatedAcc = { ...acc, bank, accName, accNo: accNo.trim() };
    try {
      await setDoc(doc(db, 'rechargeAccounts', id), updatedAcc);
      await logAudit('ADMIN', 'ADMIN', 'UPDATE_RECHARGE_ACCOUNT', `Updated recharge bank account: ${bank} - ${accNo}`);
    } catch (e) {
      console.error("Error updating recharge account:", e);
    }
  };

  const deleteRechargeAccount = async (id: string) => {
    const acc = rechargeAccounts.find(a => a.id === id);
    if (!acc) return;
    try {
      await deleteDoc(doc(db, 'rechargeAccounts', id));
      await logAudit('ADMIN', 'ADMIN', 'DELETE_RECHARGE_ACCOUNT', `Deleted recharge bank account: ${acc.bank} - ${acc.accNo}`);
    } catch (e) {
      console.error("Error deleting recharge account:", e);
    }
  };

  const updateBankLogo = async (bankKey: string, logoUrl: string) => {
    try {
      const updatedLogos = { ...bankLogos, [bankKey]: logoUrl };
      setBankLogos(updatedLogos);
      localStorage.setItem('gom_bank_logos', JSON.stringify(updatedLogos));
      
      const configRef = doc(db, 'systemConfig', 'global');
      await setDoc(configRef, { bankLogos: updatedLogos }, { merge: true });
      await logAudit('ADMIN', 'ADMIN', 'UPDATE_BANK_LOGO', `Updated bank logo for key ${bankKey}`);
    } catch (e) {
      console.error("Error updating bank logo in Firestore:", e);
    }
  };

  const updateMarketplaceLogo = async (marketKey: string, logoUrl: string) => {
    try {
      const updatedLogos = { ...marketplaceLogos, [marketKey]: logoUrl };
      setMarketplaceLogos(updatedLogos);
      localStorage.setItem('gom_marketplace_logos', JSON.stringify(updatedLogos));
      
      const configRef = doc(db, 'systemConfig', 'global');
      await setDoc(configRef, { marketplaceLogos: updatedLogos }, { merge: true });
      await logAudit('ADMIN', 'ADMIN', 'UPDATE_MARKET_LOGO', `Updated marketplace logo for key ${marketKey}`);
    } catch (e) {
      console.error("Error updating marketplace logo in Firestore:", e);
    }
  };

  const deleteBankLogo = async (bankKey: string) => {
    try {
      const defaultUrl = DEFAULT_BANK_LOGOS[bankKey] || '';
      const updatedLogos = { ...bankLogos, [bankKey]: defaultUrl };
      setBankLogos(updatedLogos);
      localStorage.setItem('gom_bank_logos', JSON.stringify(updatedLogos));
      
      const configRef = doc(db, 'systemConfig', 'global');
      await setDoc(configRef, { bankLogos: updatedLogos }, { merge: true });
      await logAudit('ADMIN', 'ADMIN', 'DELETE_BANK_LOGO', `Reset bank logo for key ${bankKey} to default`);
    } catch (e) {
      console.error("Error resetting bank logo in Firestore:", e);
    }
  };

  const deleteMarketplaceLogo = async (marketKey: string) => {
    try {
      const defaultUrl = DEFAULT_MARKETPLACE_LOGOS[marketKey] || '';
      const updatedLogos = { ...marketplaceLogos, [marketKey]: defaultUrl };
      setMarketplaceLogos(updatedLogos);
      localStorage.setItem('gom_marketplace_logos', JSON.stringify(updatedLogos));
      
      const configRef = doc(db, 'systemConfig', 'global');
      await setDoc(configRef, { marketplaceLogos: updatedLogos }, { merge: true });
      await logAudit('ADMIN', 'ADMIN', 'DELETE_MARKET_LOGO', `Reset marketplace logo for key ${marketKey} to default`);
    } catch (e) {
      console.error("Error resetting marketplace logo in Firestore:", e);
    }
  };

  const factoryReset = async () => {
    try {
      if (currentUser) {
        const batch = writeBatch(db);
        
        // Delete current user's user document
        batch.delete(doc(db, 'users', currentUser.id));
        
        // Delete current user's transactions
        const userTxs = transactions.filter(tx => tx.userId === currentUser.id);
        userTxs.forEach(tx => {
          batch.delete(doc(db, 'transactions', tx.id));
        });
        
        // Delete current user's support messages
        const userSupport = supportMessages.filter(msg => msg.userId === currentUser.id);
        userSupport.forEach(msg => {
          batch.delete(doc(db, 'support', msg.id));
        });
        
        // Delete current user's audit logs
        const userLogs = auditLogs.filter(log => log.userId === currentUser.id);
        userLogs.forEach(log => {
          batch.delete(doc(db, 'auditLogs', log.id));
        });
        
        await batch.commit();
      }
      
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      console.error("Error resetting own account:", e);
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
      factoryReset,
      rechargeAccounts,
      language,
      setLanguage,
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
