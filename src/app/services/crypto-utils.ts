const PREFIX = 'enc:v1:';

function deriveKey(): string {
  const appSecret = 'kaistu-admin-ng-cipher-v1';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'ssr';
  let key = '';
  for (let i = 0; i < Math.max(appSecret.length, origin.length); i++) {
    const c1 = appSecret.charCodeAt(i % appSecret.length);
    const c2 = origin.charCodeAt(i % origin.length);
    key += String.fromCharCode(c1 ^ c2);
  }
  return key;
}

function xor(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

export function encrypt(plaintext: string): string {
  if (!plaintext) return '';
  try {
    return PREFIX + btoa(xor(plaintext, deriveKey()));
  } catch {
    return '';
  }
}

export function decrypt(ciphertext: string): string {
  if (!ciphertext) return '';
  if (ciphertext.startsWith(PREFIX)) {
    try {
      return xor(atob(ciphertext.slice(PREFIX.length)), deriveKey());
    } catch {
      return '';
    }
  }
  return ciphertext;
}

function isPrintable(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c < 32 && c !== 10 && c !== 13) return false;
    if (c > 126) return false;
  }
  return true;
}

/** Try old-format decryption (no prefix) for migration */
export function tryOldDecrypt(ciphertext: string): string | null {
  if (!ciphertext || ciphertext.startsWith(PREFIX)) return null;
  try {
    const result = xor(atob(ciphertext), deriveKey());
    if (result && isPrintable(result)) return result;
    return null;
  } catch {
    return null;
  }
}

export function maskApiKey(key: string): string {
  if (!key || key.length <= 8) return '*'.repeat(8);
  const mid = Math.min(key.length - 8, 16);
  return key.slice(0, 4) + '*'.repeat(mid) + key.slice(-4);
}
