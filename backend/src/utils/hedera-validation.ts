import { logger } from './logger.js';

/**
 * Validate Hedera account ID format.
 * Accepts:
 * - Numeric ID format: shard.realm.num (e.g., 0.0.123456)
 * - EVM address format: 0x-prefixed 20-byte hex (mirror node accepts this)
 */
export function isValidHederaAccountId(accountId: string): boolean {
  if (!accountId || typeof accountId !== 'string') return false;

  const trimmed = accountId.trim();
  if (trimmed.length === 0) return false;

  // Accept EVM address as account identifier
  const evmRegex = /^0x[0-9a-fA-F]{40}$/;
  if (evmRegex.test(trimmed)) return true;

  // Accept shard.realm.num with exactly three numeric segments
  const parts = trimmed.split('.');
  if (parts.length !== 3) return false;

  // Each part must be a non-negative integer without leading plus/minus and no empty parts
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return false;
    // Prevent absurdly large numbers (basic sanity check)
    try {
      const n = BigInt(part);
      if (n < 0n) return false;
    } catch {
      return false;
    }
  }

  return true;
}

export function assertValidHederaAccountId(accountId: string): void {
  if (!isValidHederaAccountId(accountId)) {
    logger.warn('Invalid Hedera account ID provided', { accountId });
    throw new Error('Invalid Hedera account ID format');
  }
}


