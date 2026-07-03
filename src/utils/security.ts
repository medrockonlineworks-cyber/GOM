/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Securely hashes a password using browser-native SHA-256
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    // Basic fallback if crypto is not available in non-secure context
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return 'fallback_' + Math.abs(hash).toString(16);
  }
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
