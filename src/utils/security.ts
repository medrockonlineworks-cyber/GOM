/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { sha256 } from 'js-sha256';

/**
 * Securely hashes a password using standard SHA-256 (independent of context)
 */
export async function hashPassword(password: string): Promise<string> {
  return sha256(password);
}

/**
 * Generates a unique user ID with a GOM prefix
 */
export function generateUserId(): string {
  const randomDigits = Math.floor(10000 + Math.random() * 90000); // 5 digits
  return `GOM-${randomDigits}`;
}

const USER_CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generates a unique 5-character alphanumeric uppercase user code.
 * Example: 83GA3
 */
export function generateUserCode(): string {
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += USER_CODE_CHARS.charAt(Math.floor(Math.random() * USER_CODE_CHARS.length));
  }
  return result;
}

/**
 * Retrieves or derives a unique, stable 5-character uppercase ID code for any user.
 * If user.userCode exists, returns it; otherwise derives a deterministic code from user ID or phone.
 * Example output: 83GA3
 */
export function getUserUniqueCode(user?: { id?: string; phoneNumber?: string; userCode?: string } | null): string {
  if (!user) return '83GA3';
  if (user.userCode && user.userCode.trim()) {
    return user.userCode.trim().toUpperCase();
  }
  const seed = `${user.id || ''}_${user.phoneNumber || ''}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  let abs = Math.abs(hash);
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += USER_CODE_CHARS.charAt((abs + i * 17) % USER_CODE_CHARS.length);
    abs = Math.floor(abs / USER_CODE_CHARS.length) + (i + 1) * 31;
  }
  return code;
}

/**
 * Generates a unique transaction reference or ID
 */
export function generateId(prefix: string = 'TX'): string {
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return `${prefix}-${randomStr}${timestamp}`;
}

/**
 * Masks an account number to hide sensitive banking details.
 * Example: 1000418563748 -> 1000 *********
 */
export function maskAccountNumber(acc: string | undefined | null): string {
  if (!acc) return '1000 *********';
  const str = String(acc).trim();
  if (!str) return '1000 *********';
  if (str.includes('***')) return str;
  if (str === 'SYSTEM_MANUAL' || str.toLowerCase().includes('system')) return '1000 *********';
  if (str.length >= 4) {
    const prefix = str.slice(0, 4);
    const restLength = Math.max(9, str.length - 4);
    return `${prefix} ${'*'.repeat(restLength)}`;
  }
  return `${str} *********`;
}

