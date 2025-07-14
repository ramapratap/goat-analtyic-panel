// Direct frontend API integration for faster data loading
const GOAT_API_BASE = 'https://goatapi.web-dimension.com/api/v1';
const QR_SCAN_API = 'https://s-qc.in/fetchQrById/686b71212597a48fc4b9bc95';

export interface QRScanData {
  status: boolean;
  data: {
    qrData: {
      qr_scan_count: number;
      analytics: {
        deviceBreakdown: {
          mobile: number;
          tablet: number;
          desktop: number;
        };
        browserBreakdown: {
          chrome: number;
          firefox: number;
          safari: number;
          edge: number;
          other: number;
        };
        osBreakdown: {
          windows: number;
          macos: number;
          linux: number;
          ios: number;
          android: number;
          other: number;
        };
        timeStats: {
          hourlyScans: Record<string, number>;
          dailyScans: Record<string, number>;
          monthlyScans: Record<string, number>;
        };
        locationBreakdown: Record<string, number>;
        firstScan: string;
        lastScan: string;
      };
      qr_name: string;
      qr_url: string;
      first_created: string;
      last_updated: string;
    };
  };
  msg: string;
}

export interface ProductRecord {
  _id: string | { $oid: string };
  product_name: string;
  price: string; // Contains user's uploaded image URL
  image_path: string;
  timestamp: string;
  device_info: string;
  logo_detected: string;
  search_source: string; // Contains amazon_name, flipkart_name, concise_name, etc.
  amazon_price: string;
  flipkart_price: {
    name: string;
    price: string;
    wow_price: string;
    link: string;
  } | string;
  user_id: string;
  input_type: string;
  flipkart_product_name: string;
  Category: string;
  exclusive: string | null;
  hero_deal: string | null;
  coupon_code: string | null;
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

// Fetch QR scan data with analytics
export const fetchQRScanData = async (): Promise<QRScanData> => {
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
    console.error('Error fetching QR scan data:', error);
    // Return fallback data
    return {
      status: false,
      data: {
        qrData: {
          qr_scan_count: 0,
          analytics: {
            deviceBreakdown: { mobile: 0, tablet: 0, desktop: 0 },
            browserBreakdown: { chrome: 0, firefox: 0, safari: 0, edge: 0, other: 0 },
            osBreakdown: { windows: 0, macos: 0, linux: 0, ios: 0, android: 0, other: 0 },
            timeStats: { hourlyScans: {}, dailyScans: {}, monthlyScans: {} },
            locationBreakdown: {},
            firstScan: new Date().toISOString(),
            lastScan: new Date().toISOString()
          },
          qr_name: 'Unknown',
          qr_url: '',
          first_created: new Date().toISOString(),
          last_updated: new Date().toISOString()
        }
      },
      msg: 'Error fetching data'
    };
  }
};

// Fetch product records with date filter (from July 10, 2025)
export const fetchProductRecords = async (): Promise<ProductRecord[]> => {
  const cacheKey = 'product-records';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    console.log('Fetching product records from external API...');
    
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
    
    if (!Array.isArray(data)) {
      console.error('Invalid product data format received:', typeof data);
      return [];
    }

    // Filter data from July 10, 2025 onwards
    const filteredData = data.filter(record => {
      if (!record.timestamp) return false;
      
      const recordDate = new Date(record.timestamp);
      const filterDate = new Date('2025-07-10');
      
      return recordDate >= filterDate;
    });

    // Validate and clean data
    const validatedRecords = filteredData
      .filter(record => record && typeof record === 'object')
      .map(record => ({
        _id: record._id || Math.random().toString(36),
        product_name: record.product_name || 'Unknown Product',
        price: record.price || '',
        image_path: record.image_path || '',
        timestamp: record.timestamp || new Date().toISOString(),
        device_info: record.device_info || 'Unknown Device',
        logo_detected: record.logo_detected || 'No Logo Detected',
        search_source: record.search_source || 'Unknown Source',
        amazon_price: record.amazon_price || '',
        flipkart_price: record.flipkart_price || '',
        user_id: record.user_id || '',
        input_type: record.input_type || 'unknown',
        flipkart_product_name: record.flipkart_product_name || '',
        Category: record.Category || 'Unknown',
        exclusive: record.exclusive || null,
        hero_deal: record.hero_deal || null,
        coupon_code: record.coupon_code || null
      }));

    console.log(`Successfully fetched and validated ${validatedRecords.length} product records from July 10, 2025 onwards`);
    setCachedData(cacheKey, validatedRecords);
    return validatedRecords;
  } catch (error) {
    console.error('Error fetching product records:', error);
    return [];
  }
};

// Enhanced search source parsing
export const parseSearchSource = (searchSource: string) => {
  const info = {
    amazonName: '',
    flipkartName: '',
    conciseName: '',
    inputType: '',
    category: '',
    platform: '',
    savings: '',
    savingsAmount: 0,
    status: '',
    bestPlatform: '',
    isHardline: false,
    isSoftline: false,
    isFlipkartCheaper: false,
    isAmazonCheaper: false
  };

  if (!searchSource) return info;

  try {
    // Extract amazon_name
    const amazonMatch = searchSource.match(/amazon_name-->([^,]+)/);
    if (amazonMatch) info.amazonName = amazonMatch[1].trim();

    // Extract flipkart_name
    const flipkartMatch = searchSource.match(/flipkart_name-->([^,]+)/);
    if (flipkartMatch) info.flipkartName = flipkartMatch[1].trim();

    // Extract concise_name
    const conciseMatch = searchSource.match(/concise_name-->([^A-Z]+)/);
    if (conciseMatch) info.conciseName = conciseMatch[1].trim();

    // Extract input type
    if (searchSource.includes('image_url')) info.inputType = 'Image';
    else if (searchSource.includes('Text')) info.inputType = 'Text';
    else if (searchSource.includes('amazon_url')) info.inputType = 'Amazon URL';
    else if (searchSource.includes('flipkart_url')) info.inputType = 'Flipkart URL';

    // Extract category (Hardline/Softline)
    if (searchSource.includes('Hardline')) {
      info.category = 'Hardline';
      info.isHardline = true;
    } else if (searchSource.includes('Softline')) {
      info.category = 'Softline';
      info.isSoftline = true;
    }

    // Extract platform preference
    if (searchSource.includes('Flipkart Cheaper')) {
      info.isFlipkartCheaper = true;
    } else if (searchSource.includes('Amazon Cheaper')) {
      info.isAmazonCheaper = true;
    }

    // Extract best platform and savings
    const bestMatch = searchSource.match(/Best:\s*([^-]+)\s*-\s*Savings:\s*(₹[\d,]+)/);
    if (bestMatch) {
      info.bestPlatform = bestMatch[1].trim().toLowerCase();
      info.savings = bestMatch[2].trim();
      
      // Extract numeric savings amount
      const savingsNumMatch = bestMatch[2].match(/₹([\d,]+)/);
      if (savingsNumMatch) {
        info.savingsAmount = parseInt(savingsNumMatch[1].replace(/,/g, ''));
      }
    }

    // Extract status
    if (searchSource.includes('SUCCESS')) {
      info.status = 'Success';
    } else if (searchSource.includes('ERROR')) {
      info.status = 'Error';
    } else if (searchSource.includes('FAILED')) {
      info.status = 'Failed';
    }

  } catch (error) {
    console.error('Error parsing search source:', error);
  }

  return info;
};

// Get price from flipkart_price field
export const getFlipkartPrice = (flipkartPrice: any): string => {
  if (typeof flipkartPrice === 'string') {
    return flipkartPrice;
  }
  
  if (typeof flipkartPrice === 'object' && flipkartPrice?.price) {
    return flipkartPrice.price;
  }
  
  return '₹0';
};

// Get numeric price value
export const getFlipkartPriceNumeric = (flipkartPrice: any): number => {
  const priceStr = getFlipkartPrice(flipkartPrice);
  const numMatch = priceStr.match(/₹?([\d,]+)/);
  if (numMatch) {
    return parseInt(numMatch[1].replace(/,/g, ''));
  }
  return 0;
};

// Get product link
export const getProductLink = (flipkartPrice: any): string => {
  if (typeof flipkartPrice === 'object' && flipkartPrice?.link) {
    return flipkartPrice.link;
  }
  return '';
};

// Check if record is an initial request
export const isInitialRequest = (searchSource: string): boolean => {
  if (!searchSource) return false;
  return searchSource.toLowerCase().includes('intial request') || 
         searchSource.toLowerCase().includes('initial request');
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
  return /^\d+$/.test(cleaned) && cleaned.length >= 10;
};

export const categorizeProduct = (category: string, productName: string): string => {
  if (category && category !== 'Unknown') {
    return category;
  }
  
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
  if (name.includes('shoes') || name.includes('slides') || name.includes('footwear')) {
    return 'Footwear';
  }
  if (name.includes('backpack') || name.includes('bag')) {
    return 'Bags';
  }
  if (name.includes('shirt') || name.includes('tshirt') || name.includes('clothing')) {
    return 'Clothing';
  }
  
  return 'Electronics';
};

// Get device analytics from QR data
export const getDeviceAnalytics = (qrData: QRScanData) => {
  if (!qrData.data?.qrData?.analytics) return [];
  
  const { deviceBreakdown } = qrData.data.qrData.analytics;
  
  return [
    { name: 'Mobile', value: deviceBreakdown.mobile, color: '#3B82F6' },
    { name: 'Desktop', value: deviceBreakdown.desktop, color: '#10B981' },
    { name: 'Tablet', value: deviceBreakdown.tablet, color: '#F59E0B' }
  ];
};

// Get daily scan trends
export const getDailyScanTrends = (qrData: QRScanData) => {
  if (!qrData.data?.qrData?.analytics?.timeStats?.dailyScans) return [];
  
  const { dailyScans } = qrData.data.qrData.analytics.timeStats;
  
  return Object.entries(dailyScans).map(([date, scans]) => ({
    date,
    scans: scans as number
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

// Calculate platform savings
export const calculatePlatformSavings = (records: ProductRecord[]) => {
  let flipkartSavings = 0;
  let amazonSavings = 0;
  let flipkartWins = 0;
  let amazonWins = 0;

  records.forEach(record => {
    const sourceInfo = parseSearchSource(record.search_source);
    
    if (sourceInfo.bestPlatform === 'flipkart' && sourceInfo.savingsAmount > 0) {
      flipkartSavings += sourceInfo.savingsAmount;
      flipkartWins++;
    } else if (sourceInfo.bestPlatform === 'amazon' && sourceInfo.savingsAmount > 0) {
      amazonSavings += sourceInfo.savingsAmount;
      amazonWins++;
    }
  });

  return {
    flipkartSavings,
    amazonSavings,
    flipkartWins,
    amazonWins,
    totalSavings: flipkartSavings + amazonSavings
  };
};

// Get platform distribution
export const getPlatformDistribution = (records: ProductRecord[]) => {
  const distribution = {
    flipkart: 0,
    amazon: 0,
    unknown: 0
  };

  records.forEach(record => {
    const sourceInfo = parseSearchSource(record.search_source);
    
    if (sourceInfo.bestPlatform === 'flipkart') {
      distribution.flipkart++;
    } else if (sourceInfo.bestPlatform === 'amazon') {
      distribution.amazon++;
    } else {
      distribution.unknown++;
    }
  });

  return distribution;
};

export default {
  fetchQRScanData,
  fetchProductRecords,
  parseSearchSource,
  getFlipkartPrice,
  getFlipkartPriceNumeric,
  getProductLink,
  isInitialRequest,
  maskPhoneNumber,
  isRealUser,
  categorizeProduct,
  getDeviceAnalytics,
  getDailyScanTrends,
  calculatePlatformSavings,
  getPlatformDistribution
};