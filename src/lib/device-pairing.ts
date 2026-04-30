import 'server-only';

import crypto from 'crypto';

export const PAIRING_TOKEN_TTL_MINUTES = 10;

function randomToken(bytes: number) {
  return crypto.randomBytes(bytes).toString('base64url').toUpperCase();
}

export function hashDeviceSecret(secret: string) {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

export function createPairingCode() {
  const raw = randomToken(15).slice(0, 20);
  const plainText = raw.match(/.{1,4}/g)?.join('-') ?? raw;

  return {
    plainText,
    hashedValue: hashDeviceSecret(plainText),
    expiresAt: new Date(Date.now() + PAIRING_TOKEN_TTL_MINUTES * 60 * 1000),
  };
}

export function createDeviceSessionToken() {
  const plainText = `dsk_${randomToken(32)}`;

  return {
    plainText,
    hashedValue: hashDeviceSecret(plainText),
  };
}

export function getBearerToken(authHeader?: string | null) {
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token.trim();
}
