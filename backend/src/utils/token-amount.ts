import { logger } from './logger.js';

/**
 * Token decimal configurations
 */
const TOKEN_DECIMALS: Record<string, number> = {
  'USD': 2,
  'ZAR': 2,
  'HBAR': 8, // HBAR has 8 decimal places
};

/**
 * Convert a display amount to base units for minting/burning
 * @param amount - The display amount (e.g., 15 for R15)
 * @param currency - The currency code (USD, ZAR, HBAR)
 * @returns The amount in base units
 */
export function toBaseUnits(amount: number, currency: string): number {
  const decimals = TOKEN_DECIMALS[currency] || 2;
  const baseUnits = Math.round(amount * Math.pow(10, decimals));
  
  logger.debug('Converting amount to base units', {
    displayAmount: amount,
    currency,
    decimals,
    baseUnits
  });
  
  return baseUnits;
}

/**
 * Convert base units to display amount
 * @param baseUnits - The amount in base units
 * @param currency - The currency code (USD, ZAR, HBAR)
 * @returns The display amount
 */
export function fromBaseUnits(baseUnits: number, currency: string): number {
  const decimals = TOKEN_DECIMALS[currency] || 2;
  const displayAmount = baseUnits / Math.pow(10, decimals);
  
  logger.debug('Converting base units to display amount', {
    baseUnits,
    currency,
    decimals,
    displayAmount
  });
  
  return displayAmount;
}

/**
 * Get the decimal places for a currency
 * @param currency - The currency code
 * @returns The number of decimal places
 */
export function getTokenDecimals(currency: string): number {
  return TOKEN_DECIMALS[currency] || 2;
}
