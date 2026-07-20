import Papa from 'papaparse';

// CSV file path
const CURRENCY_CSV_PATH = '/csv/currency.csv';

// Cache for currency data
let currencyCache = null;

export async function fetchCurrencies() {
  if (currencyCache) {
    return currencyCache;
  }

  try {
    const response = await fetch(CURRENCY_CSV_PATH);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch currency CSV: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    
    const result = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });
    
    // Transform CSV data
    const currencies = result.data
      .filter(row => row.Country && row.Currency && row.Symbol)
      .map(row => ({
        country: row.Country.trim(),
        currency: row.Currency.trim(),
        symbol: row.Symbol.trim(),
        code: getCurrencyCode(row.Currency),
      }))
      .sort((a, b) => a.country.localeCompare(b.country));
    
    currencyCache = currencies;
    return currencies;
  } catch (error) {
    console.error('Error loading currencies:', error);
    return getDefaultCurrencies();
  }
}

// Extract currency code from currency name
function getCurrencyCode(currencyName) {
  // Common currency codes mapping
  const currencyMap = {
    'US Dollar': 'USD',
    'Euro': 'EUR',
    'British Pound': 'GBP',
    'Japanese Yen': 'JPY',
    'Saudi Riyal': 'SAR',
    'UAE Dirham': 'AED',
    'Qatari Riyal': 'QAR',
    'Kuwaiti Dinar': 'KWD',
    'Omani Rial': 'OMR',
    'Bahraini Dinar': 'BHD',
    'Indian Rupee': 'INR',
    'Pakistani Rupee': 'PKR',
    'Bangladeshi Taka': 'BDT',
    'Sri Lankan Rupee': 'LKR',
    'Nepalese Rupee': 'NPR',
    'Chinese Yuan': 'CNY',
    'Australian Dollar': 'AUD',
    'Canadian Dollar': 'CAD',
  };
  
  return currencyMap[currencyName] || currencyName.substring(0, 3).toUpperCase();
}

// Default currencies in case CSV fails
function getDefaultCurrencies() {
  return [
    { country: 'Saudi Arabia', currency: 'Saudi Riyal', symbol: 'ر.س', code: 'SAR' },
    { country: 'United Arab Emirates', currency: 'UAE Dirham', symbol: 'د.إ', code: 'AED' },
    { country: 'Qatar', currency: 'Qatari Riyal', symbol: 'ر.ق', code: 'QAR' },
    { country: 'Kuwait', currency: 'Kuwaiti Dinar', symbol: 'د.ك', code: 'KWD' },
    { country: 'Oman', currency: 'Omani Rial', symbol: 'ر.ع.', code: 'OMR' },
    { country: 'Bahrain', currency: 'Bahraini Dinar', symbol: '.د.ب', code: 'BHD' },
    { country: 'United States', currency: 'US Dollar', symbol: '$', code: 'USD' },
    { country: 'European Union', currency: 'Euro', symbol: '€', code: 'EUR' },
    { country: 'United Kingdom', currency: 'British Pound', symbol: '£', code: 'GBP' },
    { country: 'Japan', currency: 'Japanese Yen', symbol: '¥', code: 'JPY' },
  ];
}

// Search currencies by country name
export async function searchCurrencies(query, limit = 7) {
  const currencies = await fetchCurrencies();
  
  if (!query || query.trim() === '') {
    return currencies.slice(0, limit);
  }
  
  const searchTerm = query.toLowerCase().trim();
  
  return currencies
    .filter(currency => 
      currency.country.toLowerCase().includes(searchTerm) ||
      currency.currency.toLowerCase().includes(searchTerm) ||
      currency.code.toLowerCase().includes(searchTerm)
    )
    .slice(0, limit);
}

// Get currency by country name
export async function getCurrencyByCountry(countryName) {
  const currencies = await fetchCurrencies();
  return currencies.find(currency => 
    currency.country.toLowerCase() === countryName.toLowerCase()
  );
}

// Get all unique currency symbols
export async function getAllCurrencySymbols() {
  const currencies = await fetchCurrencies();
  return [...new Set(currencies.map(c => c.symbol))].sort();
}