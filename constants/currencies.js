// The application only supports two currencies: the UAE Dirham (Dubai) and the
// Pakistani Rupee. Course prices are chosen when an organization creates a
// course reference, so every price in the system uses one of these entries.
export const ALLOWED_CURRENCIES = [
  {
    country: "United Arab Emirates",
    currency: "UAE Dirham",
    symbol: "د.إ",
    code: "AED",
  },
  {
    country: "Pakistan",
    currency: "Pakistani Rupee",
    symbol: "₨",
    code: "PKR",
  },
];

export const ALLOWED_CURRENCY_CODES = ALLOWED_CURRENCIES.map((c) => c.code);

// Fallback used for legacy documents that were stored before the currency was
// restricted, and for API payloads that omit it.
export const DEFAULT_CURRENCY = ALLOWED_CURRENCIES.find(
  (c) => c.code === "PKR",
);

export function getCurrencyByCode(code) {
  if (!code) return null;
  const normalized = code.toString().trim().toUpperCase();
  return ALLOWED_CURRENCIES.find((c) => c.code === normalized) || null;
}

export function isAllowedCurrencyCode(code) {
  return Boolean(getCurrencyByCode(code));
}

// Resolve a stored currency (code, name or symbol) to a supported currency,
// falling back to the default when the value is missing or no longer supported.
export function resolveCurrency(value) {
  if (!value) return DEFAULT_CURRENCY;
  const normalized = value.toString().trim();
  return (
    getCurrencyByCode(normalized) ||
    ALLOWED_CURRENCIES.find(
      (c) =>
        c.currency.toLowerCase() === normalized.toLowerCase() ||
        c.symbol === normalized,
    ) ||
    DEFAULT_CURRENCY
  );
}

export function formatCurrencyAmount(amount, currencyValue) {
  const { symbol } = resolveCurrency(currencyValue);
  const value = parseFloat(amount || 0);
  return `${symbol} ${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
