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
  try {
    const safeData = unescape(encodeURIComponent(data));
    const cipherText = rc4(key, safeData);
    let hex = '';
    for (let i = 0; i < cipherText.length; i++) {
      const code = cipherText.charCodeAt(i).toString(16);
      hex += (code.length === 1 ? '0' : '') + code;
    }
    return hex;
  } catch (e) {
    console.error('Encryption failed:', e);
    const cipherText = rc4(key, data);
    let hex = '';
    for (let i = 0; i < cipherText.length; i++) {
      const code = (cipherText.charCodeAt(i) & 255).toString(16);
      hex += (code.length === 1 ? '0' : '') + code;
    }
    return hex;
  }
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
    const decryptedBytes = rc4(key, cipherText);
    try {
      return decodeURIComponent(escape(decryptedBytes));
    } catch (e) {
      return decryptedBytes;
    }
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
        
        // Ensure decrypted string doesn't contain bad control characters (< 32, except 9, 10, 13)
        let hasBadControlChars = false;
        if (decrypted) {
          for (let i = 0; i < decrypted.length; i++) {
            const code = decrypted.charCodeAt(i);
            if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
              hasBadControlChars = true;
              break;
            }
          }
        }

        if (!hasBadControlChars && decrypted && (decrypted.startsWith('{') || decrypted.startsWith('[') || decrypted.startsWith('"') || /^[GOMa-zA-Z0-9_-]+$/.test(decrypted))) {
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
 * e.g., "ABCDEFGHIJ" -> "ABCDE-FGHIJ"
 */
export function formatCode(raw: string): string {
  const cleaned = raw.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  if (cleaned.length === 10) {
    return `${cleaned.substring(0, 5)}-${cleaned.substring(5)}`;
  }
  const chunks: string[] = [];
  for (let i = 0; i < cleaned.length; i += 5) {
    chunks.push(cleaned.substring(i, i + 5));
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
 * Normalizes a phone number to standard digits only, stripping common country and zero prefixes
 * to prevent mismatch between admin entry and user database phone numbers.
 */
export function normalizePhoneForCrypto(phone: string): string {
  let cleaned = (phone || '').replace(/\D/g, '');
  
  // Strip common country prefixes if present
  const countryPrefixes = ['251', '254', '234'];
  for (const prefix of countryPrefixes) {
    if (cleaned.startsWith(prefix) && cleaned.length > prefix.length) {
      cleaned = cleaned.substring(prefix.length);
      break;
    }
  }
  
  // Strip leading zeroes
  while (cleaned.startsWith('0') && cleaned.length > 1) {
    cleaned = cleaned.substring(1);
  }
  
  return cleaned;
}

/**
 * Generates a signed recharge verification code
 * Code format: [expiryBase36][signatureBase36] (exactly 10 alphanumeric characters)
 */
export function generateVerificationCode(
  phoneNumber: string,
  amount: number,
  reference: string,
  expiryMinutes: number,
  adminPasswordHash: string
): string | null {
  try {
    const EPOCH = 1767225600; // Jan 1, 2026

    // Calculate expiration timestamp (in seconds)
    const expiryTimeSec = Math.floor((Date.now() + expiryMinutes * 60 * 1000) / 1000);
    const expiryMinutesSinceEpoch = Math.max(0, Math.floor((expiryTimeSec - EPOCH) / 60));

    // Normalize inputs to prevent formatting discrepancies
    const normPhone = normalizePhoneForCrypto(phoneNumber);
    const normAmount = Math.round(amount).toString();
    const normRef = reference.trim().toUpperCase();

    // Create cryptographic payload
    const payload = `${normPhone}:${normAmount}:${normRef}:${expiryMinutesSinceEpoch}:gom_secure_offline_salt_2026`;
    const hashHex = sha256(payload);
    
    // Convert hash to a 5-character Base36 signature
    const hashBigInt = BigInt('0x' + hashHex);
    const sigVal = Number(hashBigInt % 60466176n); // 36^5 = 60466176

    const expiryBase36 = expiryMinutesSinceEpoch.toString(36).toUpperCase().padStart(5, '0');
    const sigBase36 = sigVal.toString(36).toUpperCase().padStart(5, '0');

    // Return formatted code (e.g., ABCDE-FGHIJ)
    return formatCode(`${expiryBase36}${sigBase36}`);
  } catch (e) {
    console.error("Failed to generate verification code:", e);
    return null;
  }
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
    const rawCleaned = code.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (rawCleaned.length !== 10) {
      return { valid: false, expired: false, expiryDate: null, error: "Code must be exactly 10 characters long" };
    }

    const confusions: Record<string, string[]> = {
      '0': ['0', 'O'],
      'O': ['0', 'O'],
      '1': ['1', 'I', 'L'],
      'I': ['1', 'I', 'L'],
      'L': ['1', 'I', 'L'],
    };

    const getCodeVariations = (src: string): string[] => {
      const results: string[] = [];
      const dfs = (index: number, current: string) => {
        if (results.length >= 16) return; // safety cap
        if (index === src.length) {
          results.push(current);
          return;
        }
        const char = src[index];
        const options = confusions[char] || [char];
        for (const opt of options) {
          dfs(index + 1, current + opt);
        }
      };
      dfs(0, '');
      return results;
    };

    const codeVariations = getCodeVariations(rawCleaned);
    let bestResult: { valid: boolean; expired: boolean; expiryDate: Date | null } | null = null;

    // Helper to generate visual typo variations of a string (O<->0, I/L<->1, etc.)
    const getRefVariations = (refStr: string): string[] => {
      const base = (refStr || '').trim().toUpperCase();
      const variations = new Set<string>([base]);
      
      variations.add(base.replace(/O/g, '0'));
      variations.add(base.replace(/0/g, 'O'));
      
      variations.add(base.replace(/I/g, '1').replace(/L/g, '1'));
      variations.add(base.replace(/1/g, 'I'));
      
      variations.add(base.replace(/Z/g, '2'));
      variations.add(base.replace(/2/g, 'Z'));

      variations.add(base.replace(/S/g, '5'));
      variations.add(base.replace(/5/g, 'S'));

      variations.add(base.replace(/B/g, '8'));
      variations.add(base.replace(/8/g, 'B'));

      variations.add(base.replace(/G/g, '6'));
      variations.add(base.replace(/6/g, 'G'));

      // Add variations by removing any single character (to handle insertion typos)
      for (let i = 0; i < base.length; i++) {
        const truncated = base.substring(0, i) + base.substring(i + 1);
        if (truncated.length >= 3) {
          variations.add(truncated);
          variations.add(truncated.replace(/O/g, '0'));
          variations.add(truncated.replace(/0/g, 'O'));
          variations.add(truncated.replace(/I/g, '1').replace(/L/g, '1'));
          variations.add(truncated.replace(/1/g, 'I'));
        }
      }

      return Array.from(variations);
    };

    // Helper to generate phone number variations
    const getPhoneVariations = (phoneStr: string): string[] => {
      const raw = (phoneStr || '').trim();
      const digits = raw.replace(/\D/g, '');
      const variations = new Set<string>([raw, digits]);
      
      const normalized = normalizePhoneForCrypto(phoneStr);
      variations.add(normalized);
      
      if (normalized.length > 0) {
        variations.add('0' + normalized);
        variations.add('251' + normalized);
        variations.add('+251' + normalized);
      }
      
      return Array.from(variations).filter(Boolean);
    };

    // Helper to generate amount variations
    const getAmountVariations = (amt: number): string[] => {
      const variations = new Set<string>();
      
      const rounded = Math.round(amt).toString();
      variations.add(rounded);
      
      const parsedFloat = parseFloat(amt as any);
      if (!isNaN(parsedFloat)) {
        variations.add(Math.round(parsedFloat).toString());
        variations.add(Math.floor(parsedFloat).toString());
        variations.add(Math.ceil(parsedFloat).toString());
        variations.add(parsedFloat.toFixed(2));
        variations.add(parsedFloat.toString());
      }
      
      const cleanAmountStr = (amt + '').replace(/[^0-9.]/g, '');
      const cleanVal = parseFloat(cleanAmountStr);
      if (!isNaN(cleanVal)) {
        variations.add(Math.round(cleanVal).toString());
        variations.add(cleanVal.toString());
      }

      return Array.from(variations);
    };

    const phoneVars = getPhoneVariations(phoneNumber);
    const amountVars = getAmountVariations(amount);
    const refVars = getRefVariations(reference);

    for (const cleaned of codeVariations) {
      const expiryBase36 = cleaned.substring(0, 5);
      const sigBase36 = cleaned.substring(5);

      const expiryMinutesSinceEpoch = parseInt(expiryBase36, 36);
      if (isNaN(expiryMinutesSinceEpoch)) continue;

      const EPOCH = 1767225600; // Jan 1, 2026
      const expiryTimeSec = EPOCH + expiryMinutesSinceEpoch * 60;
      const expiryDate = new Date(expiryTimeSec * 1000);
      const nowSec = Math.floor(Date.now() / 1000);
      const isExpired = nowSec > expiryTimeSec;

      let isSignatureValid = false;

      // Check all variation combinations to find a match
      for (const p of phoneVars) {
        for (const a of amountVars) {
          for (const r of refVars) {
            const payload = `${p}:${a}:${r}:${expiryMinutesSinceEpoch}:gom_secure_offline_salt_2026`;
            const hashHex = sha256(payload);
            const hashBigInt = BigInt('0x' + hashHex);
            const expectedSigVal = Number(hashBigInt % 60466176n);
            const expectedSigBase36 = expectedSigVal.toString(36).toUpperCase().padStart(5, '0');

            if (sigBase36 === expectedSigBase36) {
              isSignatureValid = true;
              break;
            }
          }
          if (isSignatureValid) break;
        }
        if (isSignatureValid) break;
      }

      if (isSignatureValid) {
        const result = { valid: true, expired: isExpired, expiryDate };
        if (!isExpired) {
          return result; // Found a perfectly valid, non-expired match!
        }
        bestResult = result; // Keep this expired valid result as fallback
      }
    }

    if (bestResult) {
      return bestResult;
    }

    return {
      valid: false,
      expired: false,
      expiryDate: null,
      error: "Cryptographic signature mismatch"
    };
  } catch (e: any) {
    console.error("Verification error:", e);
    return { valid: false, expired: false, expiryDate: null, error: e.message || "Unknown verification error" };
  }
}
