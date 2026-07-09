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

/**
 * Generates a unique transaction reference or ID
 */
export function generateId(prefix: string = 'TX'): string {
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return `${prefix}-${randomStr}${timestamp}`;
}
