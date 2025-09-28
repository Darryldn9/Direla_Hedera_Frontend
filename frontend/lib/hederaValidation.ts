export function isValidHederaAccountId(accountId: string | undefined | null): boolean {
  if (!accountId || typeof accountId !== 'string') return false;
  const trimmed = accountId.trim();
  if (trimmed.length === 0) return false;
  // EVM address allowed
  if (/^0x[0-9a-fA-F]{40}$/.test(trimmed)) return true;
  const parts = trimmed.split('.');
  if (parts.length !== 3) return false;
  return parts.every((p) => /^\d+$/.test(p));
}


