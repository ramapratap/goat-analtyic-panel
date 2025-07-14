// Frontend Coupon Service for CSV Integration and Analytics
import { getCachedData, setCachedData } from './cacheService';

export interface CouponLink {
  id: number;
  couponLink: string;
  couponType: string;
  isUsed: boolean;
  timestamp: string;
}

export interface CouponAnalytics {
  id: number;
  category: string;
  brand: string;
  model: string;
  totalCoupons: number;
  usedCoupons: number;
  usageRate: number;
  totalValue: number;
  avgDiscount: number;
  lastUsed?: string;
  couponTypes: {
    [key: string]: {
      value: number;
      count: number;
      used: number;
      usageRate: number;
    };
  };
}

// Parse CSV data from the provided file
const csvCouponData = `id,Coupon Link,Coupon type
87,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=MW4zSK8WRSSB7,pro
87,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=MW4z7YHPVPDK8,pro
87,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=MW4z7XXCNCS4D,pro
112,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=GMF02zYM4EB,low
112,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=GMF02zWVXHV,low
112,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=GMF02zHWS9G,low
130,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=FNzPF3HSURWFTHVBYDVV59,low
131,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=FNzB7D5DXXAGKNURXXV7DT,low
149,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=FzTK6KJRURVMAF7JD9URC,low
158,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SEAS1zW6PDP,low
158,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SEAS1zWEXHB,low
158,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SEAS1zCKS4D,low
158,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SEAS2zSR8X8J3NY,mid
158,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SEAS2zP4WW7UYSX,mid
158,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SEAS3zTUAJTSE34,high
158,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SEAS3z4H67UUP57,high
158,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SEAS3zKBR5VANHH,high
158,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SEAS3zXRTPYX5J3,high
158,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SEAS3zAPBNTJMUM,high
158,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SEAS3zRU896G66F,high
158,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SEAS4z9S4C6WSGF,pro
158,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SEAS4zWD55D6CA6,pro
158,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SEAS4zH55W8YRH9,pro
158,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SEAS4zCGXNC5EGM,pro
158,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SEAS4zH66RSHH7R,pro
158,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SEAS4z9C53YYMR6,pro
158,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SEAS4z63BWYU3NR,pro
158,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SEAS4zJHTTWVCY4,pro
158,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SEAS4zC5SJFX3RV,pro
158,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SEAS4z4WGY3FV9G,pro
158,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SEAS4zR9UAWK83A,pro
159,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=PREM1zTN5KSBRNV,low
159,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=PREM1z8UTSBCTP9,low
159,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=PREM1z4JSG3EFEH,low
159,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=PREM1z7VR7P59AY,low
159,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=PREM2zT6BFV5UX7,mid
159,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=PREM2zKYWW6X9CC,mid
159,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=PREM3z898PRTT9A,high
159,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=PREM3z5TVRHJTSB,high
159,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=PREM3zGGYA7YAG8,high
159,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=PREM4zU7U5U3TAN,pro
159,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=PREM4zT4RB465AE,pro
159,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=PREM4zFCDPR3DHV,pro`;

// Parse CSV data into structured format
const parseCsvCouponData = (): CouponLink[] => {
  const lines = csvCouponData.trim().split('\n');
  const data: CouponLink[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const [id, couponLink, couponType] = lines[i].split(',');
    if (id && couponLink && couponType) {
      data.push({
        id: parseInt(id),
        couponLink: couponLink.trim(),
        couponType: couponType.trim(),
        isUsed: Math.random() > 0.7, // Simulate 30% usage rate
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
  }
  
  return data;
};

// Generate coupon analytics from CSV data
export const generateCouponAnalytics = (): CouponAnalytics[] => {
  const cacheKey = 'coupon_analytics';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const couponLinks = parseCsvCouponData();
  const analyticsMap = new Map<number, CouponAnalytics>();

  // Group by ID and calculate analytics
  couponLinks.forEach(link => {
    if (!analyticsMap.has(link.id)) {
      analyticsMap.set(link.id, {
        id: link.id,
        category: getCategoryById(link.id),
        brand: getBrandById(link.id),
        model: getModelById(link.id),
        totalCoupons: 0,
        usedCoupons: 0,
        usageRate: 0,
        totalValue: 0,
        avgDiscount: 0,
        couponTypes: {}
      });
    }

    const analytics = analyticsMap.get(link.id)!;
    analytics.totalCoupons++;
    
    if (link.isUsed) {
      analytics.usedCoupons++;
      analytics.lastUsed = link.timestamp;
    }

    // Initialize coupon type if not exists
    if (!analytics.couponTypes[link.couponType]) {
      analytics.couponTypes[link.couponType] = {
        value: getCouponValue(link.couponType),
        count: 0,
        used: 0,
        usageRate: 0
      };
    }

    const typeData = analytics.couponTypes[link.couponType];
    typeData.count++;
    if (link.isUsed) {
      typeData.used++;
      analytics.totalValue += typeData.value;
    }
    typeData.usageRate = (typeData.used / typeData.count) * 100;
  });

  // Calculate final metrics
  const result = Array.from(analyticsMap.values()).map(analytics => {
    analytics.usageRate = (analytics.usedCoupons / analytics.totalCoupons) * 100;
    analytics.avgDiscount = analytics.usedCoupons > 0 ? analytics.totalValue / analytics.usedCoupons : 0;
    return analytics;
  });

  setCachedData(cacheKey, result);
  return result;
};

// Helper functions
const getCategoryById = (id: number): string => {
  const categories = {
    24: 'Fashion',
    25: 'Electronics',
    26: 'Home & Kitchen',
    27: 'Books',
    28: 'Sports',
    29: 'Beauty',
    30: 'Automotive',
    31: 'Audio',
    32: 'Audio',
    33: 'Audio',
    34: 'Audio',
    35: 'Audio',
    36: 'Audio',
    37: 'Audio',
    38: 'Audio',
    39: 'Audio',
    40: 'Audio',
    41: 'Audio',
    43: 'Tablets',
    65: 'Home',
    83: 'Air Conditioner',
    84: 'Refrigerator',
    85: 'Television',
    86: 'Washing Machine',
    87: 'Mobile',
    88: 'Laptop',
    89: 'Home Appliances',
    90: 'Home Appliances',
    93: 'Home Appliances',
    100: 'Music',
    101: 'Gaming',
    109: 'Gaming',
    110: 'Gaming',
    111: 'Gaming',
    112: 'Gaming',
    119: 'Gaming',
    128: 'Gaming',
    130: 'Fashion',
    131: 'Fashion',
    149: 'Fashion',
    151: 'Watches',
    152: 'Watches',
    158: 'Fashion',
    159: 'Fashion'
  };
  return categories[id as keyof typeof categories] || 'General';
};

const getBrandById = (id: number): string => {
  const brands = {
    24: 'Ashish',
    25: 'Subhash',
    26: 'Megha',
    27: 'Generic',
    28: 'Generic',
    29: 'Generic',
    30: 'Generic',
    31: 'Audio Brand',
    32: 'Audio Brand',
    33: 'Audio Brand',
    34: 'Audio Brand',
    35: 'Audio Brand',
    36: 'Audio Brand',
    37: 'Audio Brand',
    38: 'Audio Brand',
    39: 'Audio Brand',
    40: 'Audio Brand',
    41: 'Audio Brand',
    43: 'Tablet Brand',
    65: 'Home Brand',
    83: 'AC Brand',
    84: 'Refrigerator Brand',
    85: 'TV Brand',
    86: 'Washing Brand',
    87: 'Mobile Brand',
    88: 'Core Brand',
    89: 'Home Brand',
    90: 'Home Brand',
    93: 'Home Brand',
    100: 'Music Brand',
    101: 'Gaming Brand',
    109: 'Gaming Brand',
    110: 'Gaming Brand',
    111: 'Gaming Brand',
    112: 'Gaming Brand',
    119: 'Gaming Brand',
    128: 'Gaming Brand',
    130: 'Fashion Brand',
    131: 'Fashion Brand',
    149: 'Fashion Brand',
    151: 'Watch Brand',
    152: 'Watch Brand',
    158: 'Seasonal Brand',
    159: 'Premium Brand'
  };
  return brands[id as keyof typeof brands] || 'Unknown Brand';
};

const getModelById = (id: number): string => {
  return `Model-${id}`;
};

const getCouponValue = (type: string): number => {
  const values = {
    'low': 100,
    'mid': 250,
    'high': 500,
    'pro': 1000,
    'extreme': 2000
  };
  return values[type as keyof typeof values] || 50;
};

// Get coupon links data
export const getCouponLinks = (): CouponLink[] => {
  return parseCsvCouponData();
};

// Get coupon summary
export const getCouponSummary = () => {
  const analytics = generateCouponAnalytics();
  const links = getCouponLinks();
  
  return {
    totalCoupons: links.length,
    totalUsed: links.filter(l => l.isUsed).length,
    totalValue: analytics.reduce((sum, a) => sum + a.totalValue, 0),
    averageUsageRate: analytics.length > 0 
      ? analytics.reduce((sum, a) => sum + a.usageRate, 0) / analytics.length 
      : 0,
    totalActiveCoupons: analytics.length,
    typeDistribution: links.reduce((acc, link) => {
      acc[link.couponType] = (acc[link.couponType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };
};

export default {
  generateCouponAnalytics,
  getCouponLinks,
  getCouponSummary
};