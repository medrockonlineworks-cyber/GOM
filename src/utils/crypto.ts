/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { sha256 } from 'js-sha256';

// Modulus N and public exponent e for public-key cryptography
export const RSA_N = 21059805499482437701524374399524389n;
export const RSA_E = 65537n;

// Encrypted private key d (Hex) - locked using the SHA-256 hash of the admin password '852121'
const ENCRYPTED_RSA_D_HEX = "ead1bda7376990f82c67fa845593dcd75c08bd2e5a6572a2f6ae5390dbdc025d94bd";

/**
 * Standard modular exponentiation: (base^exp) % mod
 */
function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let res = 1n;
  base = base % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) {
      res = (res * base) % mod;
    }
    base = (base * base) % mod;
    exp = exp / 2n;
  }
  return res;
}

/**
 * Decrypts the private key d using the admin password
 */
function getPrivateKeyD(adminPasswordHash: string): bigint | null {
  try {
    const decryptedStr = decryptData(ENCRYPTED_RSA_D_HEX, adminPasswordHash);
    if (!decryptedStr || !/^\d+$/.test(decryptedStr)) {
      return null;
    }
    return BigInt(decryptedStr);
  } catch (e) {
    console.error("Failed to decrypt private key d:", e);
    return null;
  }
}

/**
 * Pure TypeScript symmetric cipher (RC4) for encrypted local storage and keys
 */
export function rc4(key: string, str: string): string {
  const s: number[] = [];
  for (let i = 0; i < 256; i++) {
    s[i] = i;
  }
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
    const temp = s[i];
    s[i] = s[j];
    s[j] = temp;
  }
  let i = 0;
  j = 0;
  let res = '';
  for (let y = 0; y < str.length; y++) {
    i = (i + 1) % 256;
    j = (j + s[i]) % 256;
    const temp = s[i];
    s[i] = s[j];
    s[j] = temp;
    const k = s[(s[i] + s[j]) % 256];
    res += String.fromCharCode(str.charCodeAt(y) ^ k);
  }
  return res;
}

/**
 * Encrypts data to a hexadecimal string
 */
export function encryptData(data: string, key: string = 'gom_secure_salt'): string {
  const cipherText = rc4(key, data);
  let hex = '';
  for (let i = 0; i < cipherText.length; i++) {
    const code = cipherText.charCodeAt(i).toString(16);
    hex += (code.length === 1 ? '0' : '') + code;
  }
  return hex;
}

/**
 * Decrypts data from a hexadecimal string
 */
export function decryptData(hex: string, key: string = 'gom_secure_salt'): string {
  try {
    if (!hex) return '';
    let cipherText = '';
    for (let i = 0; i < hex.length; i += 2) {
      cipherText += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
    }
    return rc4(key, cipherText);
  } catch (e) {
    console.error('Decryption failed:', e);
    return '';
  }
}

/**
 * Encrypted Local Storage wrapper for sensitive user data
 */
export const secureStorage = {
  getItem: (key: string): string | null => {
    try {
      const rawValue = localStorage.getItem(key);
      if (!rawValue) return null;
      // If the string is a valid hex and we can decrypt it successfully, return decrypted.
      // Otherwise, we gracefully fall back to the raw value (useful during migration of existing unencrypted keys).
      if (/^[0-9a-fA-F]+$/.test(rawValue)) {
        const decrypted = decryptData(rawValue, 'gom_secure_salt');
        if (decrypted && (decrypted.startsWith('{') || decrypted.startsWith('[') || decrypted.startsWith('"') || /^[GOMa-zA-Z0-9_-]+$/.test(decrypted))) {
          return decrypted;
        }
      }
      return rawValue;
    } catch (e) {
      return localStorage.getItem(key);
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      // Encrypt the value before writing to localStorage
      const encrypted = encryptData(value, 'gom_secure_salt');
      localStorage.setItem(key, encrypted);
    } catch (e) {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    localStorage.removeItem(key);
  }
};

/**
 * Helper to format raw codes to readable hyphenated sections
 * e.g., "ABCD1234EFGH5678" -> "ABCD-1234-EFGH-5678"
 */
export function formatCode(raw: string): string {
  const cleaned = raw.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const chunks: string[] = [];
  for (let i = 0; i < cleaned.length; i += 4) {
    chunks.push(cleaned.substring(i, i + 4));
  }
  return chunks.join('-');
}

/**
 * Custom BigInt Base36 encoder
 */
function toBase36(n: bigint): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (n === 0n) return "0";
  let result = "";
  let temp = n;
  while (temp > 0n) {
    const rem = temp % 36n;
    result = chars[Number(rem)] + result;
    temp = temp / 36n;
  }
  return result;
}

/**
 * Custom BigInt Base36 decoder
 */
function parseBigInt36(str: string): bigint {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = 0n;
  for (let i = 0; i < str.length; i++) {
    const val = chars.indexOf(str[i].toUpperCase());
    if (val === -1) {
      throw new Error("Invalid base36 character");
    }
    result = result * 36n + BigInt(val);
  }
  return result;
}

/**
 * Generates a signed recharge verification code
 * Code format: [expiryBase36]-[signatureBase36]
 */
export function generateVerificationCode(
  phoneNumber: string,
  amount: number,
  reference: string,
  expiryMinutes: number,
  adminPasswordHash: string
): string | null {
  const d = getPrivateKeyD(adminPasswordHash);
  if (!d) {
    console.error("Invalid admin key hash or failed private key derivation");
    return null;
  }

  // Calculate expiration timestamp (in seconds, divided by 10 to make it extremely compact)
  const expiryTimeSec = Math.floor((Date.now() + expiryMinutes * 60 * 1000) / 1000);
  const expiryCompact = Math.floor(expiryTimeSec / 10); // 10-second resolution for brevity

  // Normalize inputs to prevent formatting discrepancies
  const normPhone = phoneNumber.trim();
  const normAmount = Math.round(amount).toString();
  const normRef = reference.trim().toUpperCase();

  // Create cryptographic payload
  const payload = `${normPhone}:${normAmount}:${normRef}:${expiryCompact}`;
  const hashHex = sha256(payload);
  
  // Convert SHA-256 hash to a BigInt and reduce modulo RSA_N
  const hashBigInt = BigInt('0x' + hashHex) % RSA_N;

  // Sign the hashBigInt using modular exponentiation
  const signatureBigInt = modPow(hashBigInt, d, RSA_N);

  // Encode expiry and signature to Base36
  const expiryBase36 = expiryCompact.toString(36).toUpperCase();
  const sigBase36 = toBase36(signatureBigInt);

  // Return formatted code
  return formatCode(`${expiryBase36}${sigBase36}`);
}

/**
 * Verifies a recharge verification code offline
 */
export function verifyVerificationCode(
  code: string,
  phoneNumber: string,
  amount: number,
  reference: string
): { valid: boolean; expired: boolean; expiryDate: Date | null; error?: string } {
  try {
    const cleaned = code.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (cleaned.length < 8) {
      return { valid: false, expired: false, expiryDate: null, error: "Code too short" };
    }

    // In Base36, a compact 10-second resolution epoch timestamp for any date between 
    // March 1989 and the year 2659 is mathematically guaranteed to be exactly 6 characters long.
    // Therefore, the first 6 characters are always the expiryBase36, and the remaining characters form the RSA signature.
    const expiryBase36 = cleaned.substring(0, 6);
    const sigBase36 = cleaned.substring(6);

    if (!expiryBase36 || !sigBase36) {
      return { valid: false, expired: false, expiryDate: null, error: "Invalid code format" };
    }

    const expiryCompact = parseInt(expiryBase36, 36);
    let signatureBigInt: bigint;
    try {
      signatureBigInt = parseBigInt36(sigBase36);
    } catch (e) {
      return { valid: false, expired: false, expiryDate: null, error: "Signature decoding failed" };
    }

    if (isNaN(expiryCompact) || !signatureBigInt) {
      return { valid: false, expired: false, expiryDate: null, error: "Decoding failed" };
    }

    const expiryTimeSec = expiryCompact * 10;
    const expiryDate = new Date(expiryTimeSec * 1000);
    const nowSec = Math.floor(Date.now() / 1000);

    const isExpired = nowSec > expiryTimeSec;

    // Verify signature against payload
    const normPhone = phoneNumber.trim();
    const normAmount = Math.round(amount).toString();
    const normRef = reference.trim().toUpperCase();

    const payload = `${normPhone}:${normAmount}:${normRef}:${expiryCompact}`;
    const hashHex = sha256(payload);
    const hashBigInt = BigInt('0x' + hashHex) % RSA_N;

    // Recover hash using public key verification: recoveredHash = (signature ^ E) % N
    const recoveredHash = modPow(signatureBigInt, RSA_E, RSA_N);

    const isSignatureValid = (recoveredHash === hashBigInt);

    return {
      valid: isSignatureValid,
      expired: isExpired,
      expiryDate,
      error: !isSignatureValid ? "Cryptographic signature mismatch" : undefined
    };
  } catch (e: any) {
    console.error("Verification error:", e);
    return { valid: false, expired: false, expiryDate: null, error: e.message || "Unknown verification error" };
  }
}
