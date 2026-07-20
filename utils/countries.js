import Papa from 'papaparse';

// CSV file path
const COUNTRIES_CSV_PATH = '/csv/country.csv';

// Cache for countries data
let countriesCache = null;

export async function fetchCountries() {
  if (countriesCache) {
    return countriesCache;
  }

  try {
    const response = await fetch(COUNTRIES_CSV_PATH);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch countries CSV: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    
    const result = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });
    
    // Transform CSV data
    const countries = result.data
      .filter(row => row.name && row.dial_code)
      .map(row => ({
        name: row.name.trim(),
        code: row.iso3 || row.iso2 || '',
        dialCode: row.dial_code.trim(),
        flag: getFlagEmoji(row.iso2 || ''),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    countriesCache = countries;
    return countries;
  } catch (error) {
    console.error('Error loading countries:', error);
    return getDefaultCountries();
  }
}

// Get flag emoji from country code
function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) {
    return '🌐';
  }
  
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt());
  
  return String.fromCodePoint(...codePoints);
}

// Default countries in case CSV fails
function getDefaultCountries() {
  return [
    { name: 'Saudi Arabia', code: 'SAU', dialCode: '+966', flag: '🇸🇦' },
    { name: 'United Arab Emirates', code: 'ARE', dialCode: '+971', flag: '🇦🇪' },
    { name: 'Qatar', code: 'QAT', dialCode: '+974', flag: '🇶🇦' },
    { name: 'Kuwait', code: 'KWT', dialCode: '+965', flag: '🇰🇼' },
    { name: 'Oman', code: 'OMN', dialCode: '+968', flag: '🇴🇲' },
    { name: 'Bahrain', code: 'BHR', dialCode: '+973', flag: '🇧🇭' },
    { name: 'Egypt', code: 'EGY', dialCode: '+20', flag: '🇪🇬' },
    { name: 'Jordan', code: 'JOR', dialCode: '+962', flag: '🇯🇴' },
    { name: 'Lebanon', code: 'LBN', dialCode: '+961', flag: '🇱🇧' },
  ];
}

// Get country by name
export async function getCountryByName(name) {
  const countries = await fetchCountries();
  return countries.find(country => 
    country.name.toLowerCase() === name.toLowerCase()
  );
}

// Get country by dial code
export async function getCountryByDialCode(dialCode) {
  const countries = await fetchCountries();
  return countries.find(country => country.dialCode === dialCode);
}

// Search countries by name
export async function searchCountries(query, limit = 7) {
  const countries = await fetchCountries();
  
  if (!query || query.trim() === '') {
    return countries.slice(0, limit);
  }
  
  const searchTerm = query.toLowerCase().trim();
  
  return countries
    .filter(country => 
      country.name.toLowerCase().includes(searchTerm) ||
      country.dialCode.includes(searchTerm)
    )
    .slice(0, limit);
}