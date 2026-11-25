/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FixedMaterialLevel, LockedOrderData, MaterialMode, User } from '../types';

export interface FixedMaterialLevelConfig {
  level: FixedMaterialLevel;
  title: string;
  rechargeAmount: number; // ETB
  orderCount: number;
  minTargetEarnings: number; // ETB ("above X")
  totalCommission: number; // ETB sum of orderRewards
  orderRewards: number[]; // ETB reward per sequential order (length === orderCount)
  minWithdrawBankETB: number; // Minimum bank withdrawal ETB once cycle finishes
}

export const FIXED_MATERIAL_LEVELS: FixedMaterialLevelConfig[] = [
  {
    level: 1,
    title: 'Level 1',
    rechargeAmount: 2000,
    orderCount: 5,
    minTargetEarnings: 60000,
    totalCommission: 61280,
    // Starts at 1,980 ETB on a 3,500 ETB Order 1 and compounds proportionally as wallet grows -> 61,280 ETB rewards (64,780 ETB final wallet)
    orderRewards: [1980, 4460, 9640, 17850, 27350],
    minWithdrawBankETB: 60000,
  },
  {
    level: 2,
    title: 'Level 2',
    rechargeAmount: 4500,
    orderCount: 7,
    minTargetEarnings: 100000,
    totalCommission: 103350,
    // Starts at 2,650 ETB on a 6,000 ETB Order 1 (~44%-58% compounding) -> 103,350 ETB rewards (109,350 ETB final wallet)
    orderRewards: [2650, 4480, 7350, 11840, 17960, 25620, 33450],
    minWithdrawBankETB: 100000,
  },
  {
    level: 3,
    title: 'Level 3',
    rechargeAmount: 9500,
    orderCount: 10,
    minTargetEarnings: 150000,
    totalCommission: 154080,
    // Starts at 3,120 ETB on an 11,000 ETB Order 1 (~28%-32% compounding) -> 154,080 ETB rewards (165,080 ETB final wallet)
    orderRewards: [3120, 4280, 5740, 7680, 10250, 13640, 17920, 23180, 29850, 38420],
    minWithdrawBankETB: 100000,
  },
  {
    level: 4,
    title: 'Level 4',
    rechargeAmount: 15000,
    orderCount: 12,
    minTargetEarnings: 200000,
    totalCommission: 203540,
    // Starts at 3,680 ETB on a 16,500 ETB Order 1 (~22%-25% compounding) -> 203,540 ETB rewards (220,040 ETB final wallet)
    orderRewards: [3680, 4620, 5840, 7350, 9240, 11620, 14580, 18240, 22760, 28150, 34620, 42840],
    minWithdrawBankETB: 100000,
  },
  {
    level: 5,
    title: 'Level 5',
    rechargeAmount: 25000,
    orderCount: 15,
    minTargetEarnings: 300000,
    totalCommission: 308110,
    // Starts at 4,450 ETB on a 26,500 ETB Order 1 (~17%-19% compounding) -> 308,110 ETB rewards (334,610 ETB final wallet)
    orderRewards: [4450, 5380, 6480, 7760, 9320, 11180, 13420, 16050, 19180, 22860, 27140, 32080, 37650, 43920, 51240],
    minWithdrawBankETB: 100000,
  },
];

export function getFixedLevelConfig(level?: number | null): FixedMaterialLevelConfig | undefined {
  if (!level) return undefined;
  return FIXED_MATERIAL_LEVELS.find((cfg) => cfg.level === level);
}

export function isFixedMaterialUser(user?: Pick<User, 'materialMode' | 'fixedLevel'> | null): boolean {
  return Boolean(user && user.materialMode === 'fixed' && getFixedLevelConfig(user.fixedLevel));
}

export function needsFixedLevelSelection(user?: Pick<User, 'materialMode' | 'fixedLevel'> | null): boolean {
  return Boolean(user && user.materialMode === 'fixed' && !getFixedLevelConfig(user.fixedLevel));
}

export function getUserMaterialMode(user?: Pick<User, 'materialMode' | 'fixedLevel'> | null): MaterialMode {
  return user?.materialMode === 'fixed' ? 'fixed' : 'random';
}

export function getUserRequiredOrderCount(user?: Pick<User, 'materialMode' | 'fixedLevel'> | null): number {
  if (isFixedMaterialUser(user)) {
    const cfg = getFixedLevelConfig(user?.fixedLevel);
    if (cfg) return cfg.orderCount;
  }
  return 15;
}

export function getUserMinWithdrawETB(
  user?: Pick<User, 'materialMode' | 'fixedLevel'> | null,
  isTelebirr: boolean = false
): number {
  if (isTelebirr) return 50000;
  if (isFixedMaterialUser(user)) {
    const cfg = getFixedLevelConfig(user?.fixedLevel);
    if (cfg) return cfg.minWithdrawBankETB;
  }
  return 100000;
}

export function getSimulatedFixedCostAndBalance(
  level: FixedMaterialLevel,
  startingBalance: number = 1500,
  userLockedCosts?: { [key: number]: LockedOrderData }
) {
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const cfg = getFixedLevelConfig(level) || FIXED_MATERIAL_LEVELS[0];

  const simulatedCosts: { [key: number]: number } = {};
  const simulatedRewards: { [key: number]: number } = {};
  const simulatedBalances: { [key: number]: number } = {};
  const simulatedRequiredRecharges: { [key: number]: number } = {};
  const simulatedWalletsBefore: { [key: number]: number } = {};

  let currentWallet = startingBalance;

  for (let k = 1; k <= cfg.orderCount; k++) {
    const existingLock = userLockedCosts ? userLockedCosts[k] : undefined;
    const isFirstOrder = k === 1;

    let materialCost = 0;
    let reward = cfg.orderRewards[k - 1] || 10000;
    let requiredRecharge = isFirstOrder ? cfg.rechargeAmount : 0;
    let walletBefore = currentWallet;

    if (existingLock && existingLock.materialCost !== undefined && existingLock.materialCost > 0) {
      materialCost = existingLock.materialCost;
      reward = existingLock.reward || reward;
      requiredRecharge = existingLock.requiredRecharge ?? (isFirstOrder ? cfg.rechargeAmount : 0);
      walletBefore = existingLock.walletBefore ?? currentWallet;
    } else {
      walletBefore = currentWallet;
      if (isFirstOrder) {
        materialCost = r2(walletBefore + cfg.rechargeAmount);
      } else {
        materialCost = r2(Math.max(10, walletBefore - 3.5));
      }
    }

    simulatedCosts[k] = materialCost;
    simulatedRewards[k] = reward;
    simulatedRequiredRecharges[k] = requiredRecharge;
    simulatedWalletsBefore[k] = walletBefore;

    if (isFirstOrder) {
      currentWallet = r2(walletBefore + requiredRecharge + reward);
    } else {
      currentWallet = r2(currentWallet + reward);
    }
    simulatedBalances[k] = currentWallet;
  }

  return {
    levelConfig: cfg,
    simulatedCosts,
    simulatedRewards,
    simulatedBalances,
    simulatedRequiredRecharges,
    simulatedWalletsBefore,
  };
}
