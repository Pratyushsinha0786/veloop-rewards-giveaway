import crypto from 'crypto';

/**
 * Helper to mask User ID: "VE10025" -> "VE****25"
 * (First 2 chars + **** + last 2 chars)
 */
export function maskUserId(customUserId: string): string {
  if (!customUserId || customUserId.length <= 4) {
    return 'VE****';
  }
  const prefix = customUserId.slice(0, 2);
  const suffix = customUserId.slice(-2);
  return `${prefix}****${suffix}`;
}

/**
 * Create a transaction ID like: TXN-<base36 timestamp>-<6 random hex chars>
 */
export function generateTransactionId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `TXN-${timestamp}-${randomHex}`;
}
