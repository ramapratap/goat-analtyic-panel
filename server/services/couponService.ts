// server/services/couponService.ts - FIXED MongoDB Queries
import { getNewDb } from '../config/database';

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

export interface CouponData {
  _id: any;
  id: number;
  Category: string;
  Brand: string;
  Model: string;
  Coupon_Value_low: string;
  Coupon_Count_low: string;
  Coupon_Value_mid: string;
  Coupon_Count_mid: string;
  Coupon_Value_high: string;
  Coupon_Count_high: string;
  Coupon_Value_pro: string;
  Coupon_Count_pro: string;
  Coupon_Value_extreme: string;
  Coupon_Count_extreme: string;
}

export interface CouponLink {
  _id: any;
  id: number;
  Coupon_Link: string;
  Coupon_type: string;
  is_used: boolean;
  timestamp: string;
}

// CSV data from delete3.csv - used coupons
const usedCouponsCSV = `id,Coupon Link,Coupon type
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

// Cache for database queries
const dbCache = new Map();
const DB_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

const getCachedDbData = (key: string) => {
  const cached = dbCache.get(key);
  if (cached && Date.now() - cached.timestamp < DB_CACHE_DURATION) {
    return cached.data;
  }
  dbCache.delete(key);
  return null;
};

const setCachedDbData = (key: string, data: any) => {
  dbCache.set(key, { data, timestamp: Date.now() });
};

// Parse CSV data for used coupons
const parseUsedCouponsCSV = (): Array<{id: number, couponLink: string, couponType: string}> => {
  const lines = usedCouponsCSV.trim().split('\n');
  const data: Array<{id: number, couponLink: string, couponType: string}> = [];
  
  for (let i = 1; i < lines.length; i++) {
    const [id, couponLink, couponType] = lines[i].split(',');
    if (id && couponLink && couponType) {
      data.push({
        id: parseInt(id),
        couponLink: couponLink.trim(),
        couponType: couponType.trim()
      });
    }
  }
  
  return data;
};

// FIXED: Fetch coupon data from database with proper error handling
export const fetchCouponData = async (): Promise<CouponData[]> => {
  const cacheKey = 'coupon_data';
  const cached = getCachedDbData(cacheKey);
  if (cached) return cached;

  try {
    console.log('🔍 Fetching coupon data from database...');
    const db = getNewDb();
    
    // First, let's check what collections exist
    const collections = await db.listCollections().toArray();
    console.log('📋 Available collections:', collections.map(c => c.name));
    
    // Try different possible collection names
    const possibleNames = ['coupons', 'coupon', 'Coupons', 'COUPONS'];
    let coupons: any[] = [];
    let collectionFound = false;
    
    for (const collectionName of possibleNames) {
      try {
        console.log(`🔍 Trying collection: ${collectionName}`);
        const collection = db.collection(collectionName);
        
        // Check if collection exists and has data
        const count = await collection.countDocuments();
        console.log(`📊 Collection ${collectionName} has ${count} documents`);
        
        if (count > 0) {
          // Get a sample document to see the structure
          const sample = await collection.findOne();
          console.log(`📄 Sample document from ${collectionName}:`, JSON.stringify(sample, null, 2));
          
          coupons = await collection
            .find({})
            .limit(1000)
            .toArray();
          
          collectionFound = true;
          console.log(`✅ Successfully fetched ${coupons.length} records from ${collectionName}`);
          break;
        }
      } catch (error) {
        console.log(`❌ Collection ${collectionName} not found or error:`, error);
        continue;
      }
    }
    
    if (!collectionFound) {
      console.error('❌ No coupon collection found in database');
      return [];
    }

    // Process and validate the data
    const processedCoupons = coupons.map((coupon, index) => ({
      _id: coupon._id,
      id: coupon.id || index + 1,
      Category: coupon.Category || coupon.category || 'Unknown',
      Brand: coupon.Brand || coupon.brand || 'Unknown',
      Model: coupon.Model || coupon.model || `Model-${index + 1}`,
      Coupon_Value_low: coupon.Coupon_Value_low || coupon.coupon_value_low || '100',
      Coupon_Count_low: coupon.Coupon_Count_low || coupon.coupon_count_low || '10',
      Coupon_Value_mid: coupon.Coupon_Value_mid || coupon.coupon_value_mid || '250',
      Coupon_Count_mid: coupon.Coupon_Count_mid || coupon.coupon_count_mid || '5',
      Coupon_Value_high: coupon.Coupon_Value_high || coupon.coupon_value_high || '500',
      Coupon_Count_high: coupon.Coupon_Count_high || coupon.coupon_count_high || '3',
      Coupon_Value_pro: coupon.Coupon_Value_pro || coupon.coupon_value_pro || '1000',
      Coupon_Count_pro: coupon.Coupon_Count_pro || coupon.coupon_count_pro || '2',
      Coupon_Value_extreme: coupon.Coupon_Value_extreme || coupon.coupon_value_extreme || '2000',
      Coupon_Count_extreme: coupon.Coupon_Count_extreme || coupon.coupon_count_extreme || '1'
    }));

    console.log(`✅ Processed ${processedCoupons.length} coupon records`);
    setCachedDbData(cacheKey, processedCoupons);
    return processedCoupons;
  } catch (error) {
    console.error('❌ Error fetching coupon data:', error);
    return [];
  }
};

// FIXED: Fetch coupon links from database with proper error handling
export const fetchCouponLinks = async (): Promise<CouponLink[]> => {
  const cacheKey = 'coupon_links';
  const cached = getCachedDbData(cacheKey);
  if (cached) return cached;

  try {
    console.log('🔍 Fetching coupon links from database...');
    const db = getNewDb();
    
    // Try different possible collection names for coupon links
    const possibleNames = ['coupon_link', 'coupon_links', 'couponLinks', 'CouponLink', 'COUPON_LINK'];
    let couponLinks: any[] = [];
    let collectionFound = false;
    
    for (const collectionName of possibleNames) {
      try {
        console.log(`🔍 Trying collection: ${collectionName}`);
        const collection = db.collection(collectionName);
        
        const count = await collection.countDocuments();
        console.log(`📊 Collection ${collectionName} has ${count} documents`);
        
        if (count > 0) {
          // Get a sample document to see the structure
          const sample = await collection.findOne();
          console.log(`📄 Sample document from ${collectionName}:`, JSON.stringify(sample, null, 2));
          
          couponLinks = await collection
            .find({})
            .sort({ timestamp: -1 })
            .limit(2000)
            .toArray();
          
          collectionFound = true;
          console.log(`✅ Successfully fetched ${couponLinks.length} records from ${collectionName}`);
          break;
        }
      } catch (error) {
        console.log(`❌ Collection ${collectionName} not found or error:`, error);
        continue;
      }
    }
    
    if (!collectionFound) {
      console.log('⚠️ No coupon links collection found, using empty array');
      return [];
    }

    // Process and validate the data
    const processedLinks = couponLinks.map((link, index) => ({
      _id: link._id,
      id: link.id || index + 1,
      Coupon_Link: link.Coupon_Link || link.coupon_link || link.link || '',
      Coupon_type: link.Coupon_type || link.coupon_type || link.type || 'low',
      is_used: link.is_used || link.isUsed || false,
      timestamp: link.timestamp || new Date().toISOString()
    }));

    console.log(`✅ Processed ${processedLinks.length} coupon link records`);
    setCachedDbData(cacheKey, processedLinks);
    return processedLinks;
  } catch (error) {
    console.error('❌ Error fetching coupon links:', error);
    return [];
  }
};

// Generate comprehensive coupon analytics with CSV merge
export const generateOptimizedCouponAnalytics = async (): Promise<CouponAnalytics[]> => {
  const cacheKey = 'optimized_coupon_analytics';
  const cached = getCachedDbData(cacheKey);
  if (cached) return cached;

  try {
    console.log('🔄 Generating comprehensive coupon analytics...');
    
    const [coupons, couponLinks] = await Promise.all([
      fetchCouponData(),
      fetchCouponLinks()
    ]);

    console.log(`📊 Processing ${coupons.length} coupons and ${couponLinks.length} links`);

    // Parse CSV used coupons data
    const csvUsedCoupons = parseUsedCouponsCSV();
    console.log(`📄 Parsed ${csvUsedCoupons.length} used coupons from CSV`);

    // Create a map of coupon links by ID and type
    const linksByIdAndType = new Map<string, CouponLink[]>();
    
    couponLinks.forEach(link => {
      const key = `${link.id}`;
      if (!linksByIdAndType.has(key)) {
        linksByIdAndType.set(key, []);
      }
      linksByIdAndType.get(key)!.push(link);
    });

    // Create a map of CSV used coupons by ID and type
    const csvUsedByIdAndType = new Map<string, Array<{id: number, couponLink: string, couponType: string}>>();
    
    csvUsedCoupons.forEach(csvCoupon => {
      const key = `${csvCoupon.id}_${csvCoupon.couponType}`;
      if (!csvUsedByIdAndType.has(key)) {
        csvUsedByIdAndType.set(key, []);
      }
      csvUsedByIdAndType.get(key)!.push(csvCoupon);
    });

    const analytics: CouponAnalytics[] = [];
    const COUPON_TYPES = ['low', 'mid', 'high', 'pro', 'extreme'] as const;

    for (const coupon of coupons) {
      try {
        const relatedLinks = linksByIdAndType.get(`${coupon.id}`) || [];
        const usedLinksFromDB = relatedLinks.filter(link => link.is_used === true);

        const couponTypes: CouponAnalytics['couponTypes'] = {};
        let totalCoupons = 0;
        let usedCoupons = 0;
        let totalValue = 0;

        COUPON_TYPES.forEach(type => {
          const value = parseFloat(coupon[`Coupon_Value_${type}` as keyof CouponData] as string) || 0;
          const count = parseFloat(coupon[`Coupon_Count_${type}` as keyof CouponData] as string) || 0;
          
          // Count used from database
          const usedFromDB = usedLinksFromDB.filter(link => link.Coupon_type === type).length;
          
          // Count used from CSV
          const csvKey = `${coupon.id}_${type}`;
          const usedFromCSV = csvUsedByIdAndType.get(csvKey)?.length || 0;
          
          // Total used = DB + CSV (avoiding duplicates by using max)
          const totalUsed = Math.max(usedFromDB, usedFromCSV);

          if (count > 0) {
            couponTypes[type] = {
              value,
              count,
              used: totalUsed,
              usageRate: count > 0 ? (totalUsed / count) * 100 : 0
            };

            totalCoupons += count;
            usedCoupons += totalUsed;
            totalValue += value * totalUsed;
          }
        });

        if (totalCoupons > 0) {
          // Find last used timestamp
          const lastUsedLink = usedLinksFromDB
            .filter(link => link.timestamp)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

          const avgDiscount = usedCoupons > 0 ? totalValue / usedCoupons : 0;
          const usageRate = totalCoupons > 0 ? (usedCoupons / totalCoupons) * 100 : 0;

          analytics.push({
            id: coupon.id,
            category: coupon.Category || 'Unknown',
            brand: coupon.Brand || 'Unknown',
            model: coupon.Model || 'Unknown',
            totalCoupons,
            usedCoupons,
            usageRate: Math.round(usageRate * 100) / 100,
            totalValue: Math.round(totalValue),
            avgDiscount: Math.round(avgDiscount * 100) / 100,
            lastUsed: lastUsedLink?.timestamp,
            couponTypes
          });
        }
      } catch (error) {
        console.error(`❌ Error processing coupon ${coupon.id}:`, error);
        continue;
      }
    }

    // Sort by usage rate and total value
    analytics.sort((a, b) => {
      if (b.usageRate !== a.usageRate) {
        return b.usageRate - a.usageRate;
      }
      return b.totalValue - a.totalValue;
    });

    console.log(`✅ Generated analytics for ${analytics.length} coupons with CSV merge`);
    setCachedDbData(cacheKey, analytics);
    return analytics;
  } catch (error) {
    console.error('❌ Error generating optimized coupon analytics:', error);
    return [];
  }
};

// Get coupon summary statistics
export const getCouponSummaryStats = async () => {
  try {
    const analytics = await generateOptimizedCouponAnalytics();
    const csvUsedCoupons = parseUsedCouponsCSV();
    
    const totalCoupons = analytics.reduce((sum, c) => sum + c.totalCoupons, 0);
    const totalUsed = analytics.reduce((sum, c) => sum + c.usedCoupons, 0);
    const totalValue = analytics.reduce((sum, c) => sum + c.totalValue, 0);
    const averageUsageRate = analytics.length > 0 
      ? analytics.reduce((sum, c) => sum + c.usageRate, 0) / analytics.length 
      : 0;

    // Category distribution
    const categoryDistribution = analytics.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + c.usedCoupons;
      return acc;
    }, {} as Record<string, number>);

    // Type distribution
    const typeDistribution = analytics.reduce((acc, c) => {
      Object.entries(c.couponTypes).forEach(([type, data]) => {
        acc[type] = (acc[type] || 0) + data.used;
      });
      return acc;
    }, {} as Record<string, number>);

    // Most used category
    const mostUsedCategory = Object.entries(categoryDistribution)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';

    return {
      totalCoupons,
      totalUsed,
      totalValue: Math.round(totalValue),
      averageUsageRate: Math.round(averageUsageRate * 100) / 100,
      totalActiveCoupons: analytics.length,
      categoryDistribution,
      typeDistribution,
      mostUsedCategory,
      csvUsedCount: csvUsedCoupons.length,
      dbUsedCount: Math.max(0, totalUsed - csvUsedCoupons.length)
    };
  } catch (error) {
    console.error('❌ Error getting coupon summary stats:', error);
    return {
      totalCoupons: 0,
      totalUsed: 0,
      totalValue: 0,
      averageUsageRate: 0,
      totalActiveCoupons: 0,
      categoryDistribution: {},
      typeDistribution: {},
      mostUsedCategory: 'Unknown',
      csvUsedCount: 0,
      dbUsedCount: 0
    };
  }
};

// Clear cache
export const clearCouponServiceCache = (): void => {
  dbCache.clear();
  console.log('🧹 Coupon service cache cleared');
};

// Cleanup expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of dbCache.entries()) {
    if (now - value.timestamp > DB_CACHE_DURATION) {
      dbCache.delete(key);
    }
  }
}, DB_CACHE_DURATION);

export default {
  fetchCouponData,
  fetchCouponLinks,
  generateOptimizedCouponAnalytics,
  getCouponSummaryStats,
  clearCouponServiceCache
};