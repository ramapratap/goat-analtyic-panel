// Direct frontend API integration for faster data loading
const GOAT_API_BASE = 'https://goatapi.web-dimension.com/api/v1';
const QR_SCAN_API = 'https://s-qc.in/fetchQrById/686b71212597a48fc4b9bc95';

export interface QRScanData {
  qr_scan_count: number;
}

export interface ProductRecord {
  _id: string;
  product_name: string;
  price: string;
  image_path: string;
  timestamp: string;
  device_info: string;
  logo_detected: string;
  search_source: string;
  amazon_price: string;
  flipkart_price: string;
  user_id?: string;
}

export interface ProductFeedback {
  _id: string;
  user_id: string;
  product_name: string;
  feedback: string;
  rating: number;
  timestamp: string;
  category?: string;
}

// Cache management
const cache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for frontend cache

const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Fetch QR scan count directly
export const fetchQRScanCount = async (): Promise<QRScanData> => {
  const cacheKey = 'qr-scans';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(QR_SCAN_API, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`QR API error: ${response.status}`);
    }
    
    const data = await response.json() as QRScanData;
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching QR scan count:', error);
    // Return fallback data
    return { qr_scan_count: 1247 };
  }
};

// Fetch product records directly
export const fetchProductRecords = async (): Promise<ProductRecord[]> => {
  const cacheKey = 'product-records';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${GOAT_API_BASE}/get-records`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Product records API error: ${response.status}`);
    }
    
    const data = await response.json() as ProductRecord[];
    const validData = Array.isArray(data) ? data : [];
    setCachedData(cacheKey, validData);
    return validData;
  } catch (error) {
    console.error('Error fetching product records:', error);
    return [];
  }
};

// Fetch product feedback directly
export const fetchProductFeedback = async (): Promise<ProductFeedback[]> => {
  const cacheKey = 'product-feedback';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${GOAT_API_BASE}/get-records-feedback`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Product feedback API error: ${response.status}`);
    }
    
    const data = await response.json() as ProductFeedback[];
    const validData = Array.isArray(data) ? data : [];
    setCachedData(cacheKey, validData);
    return validData;
  } catch (error) {
    console.error('Error fetching product feedback:', error);
    return [];
  }
};

// Utility functions
export const maskPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return 'XXXXXXXXXX';
  }
  
  const digits = phoneNumber.replace(/\D/g, '');
  
  if (digits.length >= 10) {
    const first = digits.substring(0, 2);
    const last = digits.substring(digits.length - 2);
    const middle = 'X'.repeat(digits.length - 4);
    return `${first}${middle}${last}`;
  }
  
  if (digits.length > 2) {
    const first = digits.substring(0, 1);
    const last = digits.substring(digits.length - 1);
    const middle = 'X'.repeat(digits.length - 2);
    return `${first}${middle}${last}`;
  }
  
  return 'X'.repeat(digits.length);
};

export const isRealUser = (userId: string): boolean => {
  if (!userId || typeof userId !== 'string') {
    return false;
  }
  
  const cleaned = userId.replace(/[^a-zA-Z0-9]/g, '');
  return /^\d+$/.test(cleaned);
};

export const extractBrand = (logoDetected: string): string => {
  if (!logoDetected) return 'Unknown';
  
  const match = logoDetected.match(/'([^']+)_logo'/);
  if (match) {
    return match[1].charAt(0).toUpperCase() + match[1].slice(1);
  }
  
  return 'Unknown';
};

export const categorizeProduct = (productName: string): string => {
  if (!productName) return 'Unknown';
  
  const name = productName.toLowerCase();
  
  if (name.includes('mobile') || name.includes('phone') || name.includes('iphone') || name.includes('samsung')) {
    return 'Mobile';
  }
  if (name.includes('laptop') || name.includes('computer') || name.includes('pc')) {
    return 'Laptop';
  }
  if (name.includes('tv') || name.includes('television')) {
    return 'Television';
  }
  if (name.includes('headphone') || name.includes('earphone') || name.includes('audio')) {
    return 'Audio';
  }
  if (name.includes('camera')) {
    return 'Camera';
  }
  if (name.includes('watch')) {
    return 'Watch';
  }
  
  return 'Electronics';
};