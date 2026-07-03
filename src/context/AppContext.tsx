/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
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
  
  // Auth actions
  register: (phoneNumber: string, passwordPlain: string, referralCode?: string) => Promise<{ success: boolean; message: string }>;
  login: (phoneNumber: string, passwordPlain: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  resetPassword: (phoneNumber: string, passwordPlain: string) => Promise<{ success: boolean; message: string }>;

  // Wallet actions
  deposit: (amount: number, bankName: string, refCode: string) => void;
  withdraw: (amount: number, bankName: string, accNo: string) => { success: boolean; message: string };
  
  // Admin approvals
  approveTransaction: (id: string) => void;
  rejectTransaction: (id: string) => void;

  // Order logic
  addToCart: (id: number) => void;
  submitOrder: (id: number) => { success: boolean; message: string };
  resetOrderCycle: () => { success: boolean; message: string }; // Reset all 10 tasks for testing

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
        for (let id = 1; id <= 10; id++) {
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

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
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
        for (let id = 1; id <= 10; id++) {
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
        details: "Global Online Market system initialized successfully.",
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
      { id: 'acc-1', bank: 'Commercial Bank of Ethiopia (CBE)', accName: 'Global Online Market PLC', accNo: '1000552233445' },
      { id: 'acc-2', bank: 'Dashen Bank', accName: 'Global Online Market PLC', accNo: '001244558832' },
      { id: 'acc-3', bank: 'Bank of Abyssinia (BoA)', accName: 'Global Online Market PLC', accNo: '55887744331' },
      { id: 'acc-4', bank: 'Awash Bank', accName: 'Global Online Market PLC', accNo: '013204938200' }
    ];
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

    // Always map over all 10 initial products to guarantee all 10 exist
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

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('gom_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('gom_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('gom_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('gom_announcements', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem('gom_support', JSON.stringify(supportMessages));
  }, [supportMessages]);

  useEffect(() => {
    localStorage.setItem('gom_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('gom_scaling_multiplier', scalingMultiplier.toString());
  }, [scalingMultiplier]);

  useEffect(() => {
    localStorage.setItem('gom_product_costs', JSON.stringify(productCosts));
  }, [productCosts]);

  useEffect(() => {
    localStorage.setItem('gom_recharge_accounts', JSON.stringify(rechargeAccounts));
  }, [rechargeAccounts]);

  // Recalculate dynamic orders list whenever user changes, productCosts scale, or balance shifts
  useEffect(() => {
    if (!currentUser) {
      setOrders([]);
      return;
    }

    const calculated: Order[] = productCosts.map((rawProd, idx) => {
      // Order status logic:
      // Index 0 represents Order 1, index 9 represents Order 10.
      // All 10 orders are visible, but sequentially locked until the first uncompleted one is finished.
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

      // Cost calculation
      // Use the actual configured base cost directly so the material prices are real.
      const cost = rawProd.baseCost;

      // Ensure the reward commission percentage is valid (never 0, fallback to default if corrupt or undefined)
      const pct = (typeof rawProd.rewardMultiplier === 'number' && rawProd.rewardMultiplier > 0)
        ? rawProd.rewardMultiplier
        : (INITIAL_PRODUCTS_RAW.find(p => p.id === rawProd.id)?.rewardMultiplier || 0.15);

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
  const logAudit = (userId: string, userPhone: string, action: string, details: string) => {
    const log: AuditLog = {
      id: generateId('LOG'),
      userId,
      userPhone,
      action,
      details,
      createdAt: new Date().toISOString()
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  // AUTH ACTIONS
  const register = async (phoneNumber: string, passwordPlain: string, referralCode?: string) => {
    // Phone validation
    const trimmedPhone = phoneNumber.trim();
    if (!trimmedPhone.match(/^09\d{8}$/) && !trimmedPhone.match(/^\+2519\d{8}$/)) {
      return { success: false, message: 'Invalid phone format. Please use standard Ethiopian format (09xxxxxxxx).' };
    }

    const exists = users.some(u => u.phoneNumber === trimmedPhone);
    if (exists) {
      return { success: false, message: 'Phone number already registered.' };
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
        amount: 200,
        status: 'completed',
        createdAt: new Date().toISOString(),
        description: `Referral Reward of 200 ETB credited for inviting ${trimmedPhone}.`
      });

      // Update referrer user in the list
      setUsers(prev => prev.map(u => {
        if (u.id === referrer.id) {
          const updatedReferrer = {
            ...u,
            walletBalance: u.walletBalance + 200,
            referralEarnings: (u.referralEarnings || 0) + 200,
            referralCount: (u.referralCount || 0) + 1
          };
          // Sync active session if the admin/referrer is logged in
          if (currentUser && currentUser.id === u.id) {
            setCurrentUser(updatedReferrer);
          }
          return updatedReferrer;
        }
        return u;
      }));
      logAudit(referrer.id, referrer.phoneNumber, 'REFERRAL_BONUS', `Referred ${trimmedPhone}. Credited +200 ETB.`);
    }

    const overrides: { id: number; productName: string; productImage: string }[] = [];
    for (let id = 1; id <= 10; id++) {
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
      referredBy,
      referralCount: 0,
      referralEarnings: 0,
      cycleProductOverrides: overrides
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

    setUsers(prev => [...prev, newUser]);
    setTransactions(prev => [welcomeBonusTransaction, ...additionalTxs, ...prev]);
    setCurrentUser(newUser);

    logAudit(userId, trimmedPhone, 'REGISTER', `Successfully registered. Automatically credited 500 Welcome Bonus.${referredBy ? ' Plus 100 referral bonus.' : ''}`);

    return { success: true, message: `Registration successful! Welcome bonus of 500 ETB credited.${referredBy ? ' Additional 100 ETB referral bonus credited!' : ''}` };
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

    setCurrentUser(matchedUser);
    logAudit(matchedUser.id, matchedUser.phoneNumber, 'LOGIN', 'Successful login.');

    return { success: true, message: 'Login successful!' };
  };

  const logout = () => {
    if (currentUser) {
      logAudit(currentUser.id, currentUser.phoneNumber, 'LOGOUT', 'User logged out.');
      setCurrentUser(null);
    }
  };

  const resetPassword = async (phoneNumber: string, passwordPlain: string) => {
    const trimmedPhone = phoneNumber.trim();
    const userIdx = users.findIndex(u => u.phoneNumber === trimmedPhone);
    if (userIdx === -1) {
      return { success: false, message: 'Phone number not found.' };
    }

    const hashed = await hashPassword(passwordPlain);
    const updatedUsers = [...users];
    updatedUsers[userIdx] = {
      ...updatedUsers[userIdx],
      passwordHash: hashed
    };

    setUsers(updatedUsers);
    
    // Update currentUser if applicable
    if (currentUser && currentUser.phoneNumber === trimmedPhone) {
      setCurrentUser(updatedUsers[userIdx]);
    }

    logAudit(updatedUsers[userIdx].id, trimmedPhone, 'RESET_PASSWORD', 'Password reset successfully.');
    return { success: true, message: 'Password reset successfully.' };
  };

  // WALLET ACTIONS
  const deposit = (amount: number, bankName: string, refCode: string) => {
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
      description: `Pending recharge of ${amount} ETB via ${bankName}. Reference: ${refCode}`
    };

    setTransactions(prev => [depositTx, ...prev]);
    logAudit(currentUser.id, currentUser.phoneNumber, 'DEPOSIT_REQUEST', `Requested deposit of ${amount} ETB via ${bankName}`);
  };

  const withdraw = (amount: number, bankName: string, accNo: string) => {
    if (!currentUser) return { success: false, message: 'Not logged in.' };

    const completedCount = currentUser.completedOrderIds ? currentUser.completedOrderIds.length : 0;
    if (completedCount < 10) {
      return { 
        success: false, 
        message: `You must complete all 10 order tasks in your active cycle before you can withdraw your balance. Currently completed: ${completedCount}/10 tasks.` 
      };
    }

    if (currentUser.walletBalance < amount) {
      return { success: false, message: 'Insufficient wallet balance.' };
    }

    // Standard security checks: lock withdrawal amount immediately by deducting it from the balance,
    // so they can't double spend while it is pending approval.
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

    // Update state
    setTransactions(prev => [withdrawTx, ...prev]);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);

    logAudit(currentUser.id, currentUser.phoneNumber, 'WITHDRAW_REQUEST', `Requested withdrawal of ${amount} ETB to ${bankName}. Account: ${accNo}`);

    return { success: true, message: 'Withdrawal request submitted! Pending admin approval.' };
  };

  // ADMIN ACTIONS
  const approveTransaction = (txId: string) => {
    const txIdx = transactions.findIndex(t => t.id === txId);
    if (txIdx === -1) return;

    const tx = transactions[txIdx];
    if (tx.status !== 'pending') return;

    const updatedTransactions = [...transactions];
    updatedTransactions[txIdx] = { ...tx, status: 'approved' };
    setTransactions(updatedTransactions);

    // If it's a deposit, credit the user's wallet now
    if (tx.type === 'recharge') {
      setUsers(prev => prev.map(u => {
        if (u.id === tx.userId) {
          const updatedUser = {
            ...u,
            walletBalance: u.walletBalance + tx.amount
          };
          // Sync active user session
          if (currentUser && currentUser.id === u.id) {
            setCurrentUser(updatedUser);
          }
          return updatedUser;
        }
        return u;
      }));
      logAudit('ADMIN', 'ADMIN', 'APPROVE_RECHARGE', `Approved recharge of ${tx.amount} ETB for User ${tx.userId}`);
    } else if (tx.type === 'withdraw') {
      // Withdrawal was already deducted on request, so just approve the receipt
      logAudit('ADMIN', 'ADMIN', 'APPROVE_WITHDRAWAL', `Approved withdrawal of ${tx.amount} ETB for User ${tx.userId}`);
    }
  };

  const rejectTransaction = (txId: string) => {
    const txIdx = transactions.findIndex(t => t.id === txId);
    if (txIdx === -1) return;

    const tx = transactions[txIdx];
    if (tx.status !== 'pending') return;

    const updatedTransactions = [...transactions];
    updatedTransactions[txIdx] = { ...tx, status: 'rejected' };
    setTransactions(updatedTransactions);

    // If it's a withdrawal rejection, refund the user!
    if (tx.type === 'withdraw') {
      setUsers(prev => prev.map(u => {
        if (u.id === tx.userId) {
          const updatedUser = {
            ...u,
            walletBalance: u.walletBalance + tx.amount
          };
          // Sync session
          if (currentUser && currentUser.id === u.id) {
            setCurrentUser(updatedUser);
          }
          return updatedUser;
        }
        return u;
      }));
      logAudit('ADMIN', 'ADMIN', 'REJECT_WITHDRAWAL', `Rejected withdrawal of ${tx.amount} ETB for User ${tx.userId}. Funds refunded.`);
    } else {
      logAudit('ADMIN', 'ADMIN', 'REJECT_RECHARGE', `Rejected recharge of ${tx.amount} ETB for User ${tx.userId}`);
    }
  };

  // USER MARKETPLACE & ORDER CYCLE
  const addToCart = (orderId: number) => {
    if (!currentUser) return;
    localStorage.setItem(`gom_cart_${currentUser.id}_${orderId}`, 'true');
    
    // Force order list recalculation
    setUsers([...users]);
    setCartTrigger(prev => prev + 1);
    logAudit(currentUser.id, currentUser.phoneNumber, 'ADD_TO_CART', `Added Order ${orderId} product to cart.`);
  };

  const submitOrder = (orderId: number) => {
    if (!currentUser) return { success: false, message: 'Not logged in.' };

    const order = orders.find(o => o.id === orderId);
    if (!order) return { success: false, message: 'Order not found.' };

    if (currentUser.walletBalance < order.materialCost) {
      return { success: false, message: `Insufficient balance. Minimum recharge of ${order.minRechargeRequired} ETB required.` };
    }

    // Deduct material cost, credit reward commission, unlock next sequential level
    const cost = order.materialCost;
    const reward = order.reward;
    const netGains = reward; // Balance delta: - cost + (cost + reward) = + reward! 
    // Wait, let's understand the flow:
    // "8. Credit wallet with reward amount.
    //  9. Automatically unlock next order."
    // Wait! Is the material cost deducted, or does the user just pay and get refunded + commission?
    // Usually, order matching tasks on digital marketing platforms involve locking/submitting material cost and receiving the material cost back PLUS the commission.
    // Yes! "Credit wallet with reward amount" usually means the total returned is Cost + Reward, so their net balance increases by the Reward commission.
    // If we deduct Material Cost now, and then credit the Reward, their wallet balance increases by `reward` (if they got their material cost back) OR they spent material cost and received reward?
    // Actually, "Credit wallet with reward amount" means the net commission is rewarded. Let's make it so their wallet receives the Reward commission as net profit (they pay the material cost, and the platform credits them the material cost + reward commission!).
    // That means their final wallet balance increases by `reward` ETB, and their `totalEarnings` increases by `reward` ETB.
    // This is the cleanest, most rewarding, and logical way that ensures they don't lose money on orders (they pay Cost, and get Cost + Reward back, so Net Change = +Reward).
    const newBalance = currentUser.walletBalance + reward;
    const newTotalEarnings = currentUser.totalEarnings + reward;

    const nextOrderIndex = currentUser.currentOrderIndex + 1;

    const updatedUser: User = {
      ...currentUser,
      walletBalance: newBalance,
      totalEarnings: newTotalEarnings,
      currentOrderIndex: nextOrderIndex,
      completedOrderIds: [...currentUser.completedOrderIds, orderId]
    };

    // Add reward transaction
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

    // Clear cart key
    localStorage.removeItem(`gom_cart_${currentUser.id}_${orderId}`);

    setTransactions(prev => [orderTx, ...prev]);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);

    logAudit(currentUser.id, currentUser.phoneNumber, 'COMPLETE_ORDER', `Completed Order ${orderId}. Commission: ${reward} ETB.`);

    return { success: true, message: `Order ${orderId} successfully completed! ${reward} ETB commission added to your wallet.` };
  };

  const resetOrderCycle = () => {
    if (!currentUser) return { success: false, message: 'No user is currently logged in.' };
    
    // Check if they completed all 10 orders
    if (currentUser.completedOrderIds.length < 10) {
      return { 
        success: false, 
        message: 'You can only reset the cycle after completing all 10 tasks successfully!' 
      };
    }

    // Pick brand new materials/equipment overrides from ALTERNATIVE_PRODUCTS_POOLS
    const overrides: { id: number; productName: string; productImage: string }[] = [];
    for (let id = 1; id <= 10; id++) {
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

    // Dynamically adjust/arrange all 10 product level costs based on this starting cost
    const rawScaledCosts = productCosts.map((p, idx) => {
      const calculatedCost = Math.round(newLevel1Base * Math.pow(scalingMultiplier, idx));
      return {
        ...p,
        baseCost: calculatedCost
      };
    });
    const updatedCosts = sanitizeProductCosts(rawScaledCosts);
    setProductCosts(updatedCosts);
    localStorage.setItem('gom_product_costs', JSON.stringify(updatedCosts));

    const updatedUser: User = {
      ...currentUser,
      currentOrderIndex: 0,
      completedOrderIds: [],
      cycleProductOverrides: overrides
    };
    
    // Clear any cart state
    productCosts.forEach(p => {
      localStorage.removeItem(`gom_cart_${currentUser.id}_${p.id}`);
    });

    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    logAudit(currentUser.id, currentUser.phoneNumber, 'RESET_CYCLE', `Reset task cycle. Loaded brand new materials & equipment. Configured dynamic Level 1 cost: ${newLevel1Base} ETB.`);

    return { 
      success: true, 
      message: `Task cycle reset successfully! Brand new materials have been loaded and arranged dynamically. First order balance is configured at ${newLevel1Base} ETB.` 
    };
  };

  // ADMIN SETTINGS & MANAGEMENT
  const updateScalingMultiplier = (multiplier: number) => {
    setScalingMultiplier(multiplier);
    logAudit('ADMIN', 'ADMIN', 'CONFIG_SCALE', `Updated progressive order scaling multiplier to ${multiplier}`);
  };

  const updateProductCost = (id: number, cost: number, rewardPercent: number) => {
    const rawCosts = productCosts.map(p => {
      if (p.id === id) {
        return { ...p, baseCost: cost, rewardMultiplier: rewardPercent / 100 };
      }
      return p;
    });
    const updatedCosts = sanitizeProductCosts(rawCosts);
    setProductCosts(updatedCosts);
    logAudit('ADMIN', 'ADMIN', 'CONFIG_PRODUCT', `Updated Order ${id} base material cost to ${cost} ETB, reward commission to ${rewardPercent}% (Subsequent levels sanitized if necessary)`);
  };

  const updateAllProductCosts = (newCosts: { id: number; baseCost: number; rewardMultiplier: number }[]) => {
    const sanitized = sanitizeProductCosts(newCosts);
    setProductCosts(sanitized);
    logAudit('ADMIN', 'ADMIN', 'CONFIG_ALL_PRODUCTS', `Updated and progressively auto-scaled all 10 product levels according to progressive greater-than cost constraints.`);
  };

  const addAnnouncement = (title: string, content: string) => {
    const newAnn: Announcement = {
      id: generateId('ANN'),
      title,
      content,
      createdAt: new Date().toISOString()
    };
    setAnnouncements(prev => [newAnn, ...prev]);
    logAudit('ADMIN', 'ADMIN', 'ADD_ANNOUNCEMENT', `Created announcement: "${title}"`);
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    logAudit('ADMIN', 'ADMIN', 'DELETE_ANNOUNCEMENT', `Deleted announcement with ID ${id}`);
  };

  const addSupportTicket = (subject: string, message: string) => {
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
    setSupportMessages(prev => [newMsg, ...prev]);
    logAudit(currentUser.id, currentUser.phoneNumber, 'SUPPORT_CREATE', `Opened support ticket: "${subject}"`);
  };

  const replyToSupport = (id: string, reply: string) => {
    setSupportMessages(prev => prev.map(m => {
      if (m.id === id) {
        return {
          ...m,
          reply,
          status: 'resolved'
        };
      }
      return m;
    }));
    logAudit('ADMIN', 'ADMIN', 'SUPPORT_REPLY', `Resolved and replied to support ticket ${id}`);
  };

  const adjustUserBalance = (userId: string, amount: number) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const newBalance = Math.max(0, u.walletBalance + amount);
        const updatedUser = {
          ...u,
          walletBalance: newBalance
        };
        if (currentUser && currentUser.id === u.id) {
          setCurrentUser(updatedUser);
        }
        return updatedUser;
      }
      return u;
    }));

    const logMsg = amount >= 0 
      ? `Admin manually added ${amount} ETB to User ID ${userId} balance.` 
      : `Admin manually deducted ${Math.abs(amount)} ETB from User ID ${userId} balance.`;
      
    logAudit('ADMIN', 'ADMIN', 'ADJUST_BALANCE', logMsg);

    // Create an approved transaction in history so the user is informed
    const targetPhone = users.find(u => u.id === userId)?.phoneNumber || 'UNKNOWN';
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
    setTransactions(prev => [manualTx, ...prev]);
  };

  const addRechargeAccount = (bank: string, accName: string, accNo: string) => {
    const newAcc: RechargeAccount = {
      id: generateId('ACC'),
      bank,
      accName,
      accNo: accNo.trim()
    };
    setRechargeAccounts(prev => [...prev, newAcc]);
    logAudit('ADMIN', 'ADMIN', 'ADD_RECHARGE_ACCOUNT', `Added recharge bank account: ${bank} - ${accNo}`);
  };

  const updateRechargeAccount = (id: string, bank: string, accName: string, accNo: string) => {
    setRechargeAccounts(prev => prev.map(acc => {
      if (acc.id === id) {
        return { ...acc, bank, accName, accNo: accNo.trim() };
      }
      return acc;
    }));
    logAudit('ADMIN', 'ADMIN', 'UPDATE_RECHARGE_ACCOUNT', `Updated recharge bank account: ${bank} - ${accNo}`);
  };

  const deleteRechargeAccount = (id: string) => {
    const acc = rechargeAccounts.find(a => a.id === id);
    setRechargeAccounts(prev => prev.filter(acc => acc.id !== id));
    if (acc) {
      logAudit('ADMIN', 'ADMIN', 'DELETE_RECHARGE_ACCOUNT', `Deleted recharge bank account: ${acc.bank} - ${acc.accNo}`);
    }
  };

  const factoryReset = () => {
    localStorage.removeItem('gom_users');
    localStorage.removeItem('gom_current_user');
    localStorage.removeItem('gom_transactions');
    localStorage.removeItem('gom_announcements');
    localStorage.removeItem('gom_support');
    localStorage.removeItem('gom_audit_logs');
    localStorage.removeItem('gom_scaling_multiplier');
    localStorage.removeItem('gom_product_costs');
    localStorage.removeItem('gom_recharge_accounts');
    
    // Clear carts
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('gom_cart_')) {
        localStorage.removeItem(key);
      }
    }

    setUsers(INITIAL_USERS);
    setCurrentUser(null);
    setTransactions([]);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    setRechargeAccounts([
      { id: 'acc-1', bank: 'Commercial Bank of Ethiopia (CBE)', accName: 'Global Online Market PLC', accNo: '1000552233445' },
      { id: 'acc-2', bank: 'Dashen Bank', accName: 'Global Online Market PLC', accNo: '001244558832' },
      { id: 'acc-3', bank: 'Bank of Abyssinia (BoA)', accName: 'Global Online Market PLC', accNo: '55887744331' },
      { id: 'acc-4', bank: 'Awash Bank', accName: 'Global Online Market PLC', accNo: '013204938200' }
    ]);
    setSupportMessages([]);
    setAuditLogs([
      {
        id: "log-reset",
        userId: "SYSTEM",
        userPhone: "SYSTEM",
        action: "FACTORY_RESET",
        details: "System underwent a factory reset. All default data restored.",
        createdAt: new Date().toISOString()
      }
    ]);
    setScalingMultiplier(1.5);
    setProductCosts(INITIAL_PRODUCTS_RAW.map(p => ({
      id: p.id,
      baseCost: p.baseCost,
      rewardMultiplier: p.rewardMultiplier
    })));

    window.location.reload();
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
      rechargeAccounts
    }}>
      {children}
    </AppContext.Provider>
  );
};
