// Currency utility functions

export type SupportedCurrency = 'HBAR' | 'USD' | 'EUR' | 'GBP' | 'ZAR' | 'BTC' | 'XRP';

export interface CurrencyInfo {
  symbol: string;
  name: string;
  decimals: number;
  position: 'before' | 'after'; // Whether symbol goes before or after amount
  type: 'stablecoin' | 'cryptocurrency';
}

export const CURRENCY_MAP: Record<SupportedCurrency, CurrencyInfo> = {
  'USD': {
    symbol: '$',
    name: 'USD Stablecoin',
    decimals: 2,
    position: 'before',
    type: 'stablecoin'
  },
  'EUR': {
    symbol: '€',
    name: 'EUR Stablecoin',
    decimals: 2,
    position: 'before',
    type: 'stablecoin'
  },
  'GBP': {
    symbol: '£',
    name: 'GBP Stablecoin',
    decimals: 2,
    position: 'before',
    type: 'stablecoin'
  },
  'ZAR': {
    symbol: 'R',
    name: 'ZAR Stablecoin',
    decimals: 2,
    position: 'before',
    type: 'stablecoin'
  },
  'HBAR': {
    symbol: 'HBAR',
    name: 'Hedera Hashgraph',
    decimals: 2,
    position: 'after',
    type: 'cryptocurrency'
  },
  'BTC': {
    symbol: '₿',
    name: 'Bitcoin',
    decimals: 8,
    position: 'before',
    type: 'cryptocurrency'
  },
  'XRP': {
    symbol: 'XRP',
    name: 'XRP Stablecoin',
    decimals: 6,
    position: 'after',
    type: 'stablecoin'
  }
};

/**
 * Format currency amount with proper symbol positioning
 */
export function formatCurrency(
  amount: number,
  currency: string,
  showSymbol: boolean = true
): string {
  const currencyKey = currency.toUpperCase() as SupportedCurrency;
  const currencyInfo = CURRENCY_MAP[currencyKey] || CURRENCY_MAP['HBAR']; // Default to HBAR

  const formattedAmount = amount.toFixed(currencyInfo.decimals);

  if (!showSymbol) {
    return formattedAmount;
  }

  if (currencyInfo.position === 'before') {
    return `${currencyInfo.symbol}${formattedAmount}`;
  } else {
    return `${formattedAmount} ${currencyInfo.symbol}`;
  }
}

/**
 * Format currency for display with hidden amounts
 */
export function formatCurrencyWithHide(
  amount: number,
  currency: string,
  showAmount: boolean = true
): string {
  if (!showAmount) {
    const currencyKey = currency.toUpperCase() as SupportedCurrency;
    const currencyInfo = CURRENCY_MAP[currencyKey] || CURRENCY_MAP['HBAR'];

    if (currencyInfo.position === 'before') {
      return `${currencyInfo.symbol}••••••`;
    } else {
      return '••••••';
    }
  }

  return formatCurrency(amount, currency, true);
}

/**
 * Get currency symbol only
 */
export function getCurrencySymbol(currency: string): string {
  const currencyKey = currency.toUpperCase() as SupportedCurrency;
  const currencyInfo = CURRENCY_MAP[currencyKey] || CURRENCY_MAP['HBAR'];
  return currencyInfo.symbol;
}

/**
 * Get currency info
 */
export function getCurrencyInfo(currency: string): CurrencyInfo {
  const currencyKey = currency.toUpperCase() as SupportedCurrency;
  return CURRENCY_MAP[currencyKey] || CURRENCY_MAP['HBAR'];
}

/**
 * Get all supported currencies
 */
export function getSupportedCurrencies(): SupportedCurrency[] {
  return Object.keys(CURRENCY_MAP) as SupportedCurrency[];
}

/**
 * Get all stablecoins
 */
export function getStablecoins(): SupportedCurrency[] {
  return getSupportedCurrencies().filter(
    currency => CURRENCY_MAP[currency].type === 'stablecoin'
  );
}

/**
 * Get all cryptocurrencies
 */
export function getCryptocurrencies(): SupportedCurrency[] {
  return getSupportedCurrencies().filter(
    currency => CURRENCY_MAP[currency].type === 'cryptocurrency'
  );
}

/**
 * Check if currency is a stablecoin
 */
export function isStablecoin(currency: string): boolean {
  const currencyKey = currency.toUpperCase() as SupportedCurrency;
  const currencyInfo = CURRENCY_MAP[currencyKey];
  return currencyInfo?.type === 'stablecoin' || false;
}

/**
 * Auto-detect currency from account balance data
 * Falls back to HBAR if not determinable
 */
export function detectCurrency(accountData?: any): SupportedCurrency {
  // For Hedera accounts, we're always dealing with HBAR
  // In the future, you could add logic to detect other currencies
  // based on token associations or account metadata
  return 'HBAR';
}

/**
 * Get the current default currency for the app
 * Currently HBAR since we're on Hedera network
 */
export function getDefaultCurrency(): SupportedCurrency {
  return 'HBAR';
}