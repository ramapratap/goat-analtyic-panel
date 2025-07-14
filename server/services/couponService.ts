// server/services/couponService.ts - Real Database Integration with CSV Merge
import { getNewDb } from '../config/database';
import usedCouponsCSV from '../data/usedCouponsCSV.json';

// Cache management
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

// Interfaces matching your database structure
export interface CouponData {
  _id: string;
  id: string;
  Category: string;
  Brand: string;
  Model: string;
  'FSN List': string[];
  'Min Range': string;
  'Max Range': string;
  'Coupon Value_low': string;
  'Coupon Value_mid': string;
  'Coupon Value_high': string;
  'Coupon Value_pro': string;
  'Coupon Value_extreme': string;
  'Coupon Count_low': string;
  'Coupon Count_mid': string;
  'Coupon Count_high': string;
  'Coupon Count_pro': string;
  'Coupon Count_extreme': string;
}

export interface CouponLink {
  _id: string;
  id: string;
  'Coupon Link': string;
  'Coupon type': string;
  is_used?: boolean;
  timestamp?: string;
}

export interface CouponAnalytics {
  id: string;
  category: string;
  brand: string;
  model: string;
  totalCoupons: number;
  usedCoupons: number;
  usageRate: number;
  totalValue: number;
  avgDiscount: number;
  couponTypes: {
    [key: string]: {
      value: number;
      count: number;
      used: number;
      usageRate: number;
    };
  };
}

// Fetch coupon data from database
export const fetchCouponData = async (): Promise<CouponData[]> => {
  const cacheKey = 'coupon_data';
  const cached = getCachedDbData(cacheKey);
  if (cached) return cached;

  try {
    console.log('🔍 Fetching coupon data from database...');
    const db = getNewDb();
    
    const coupons = await db.collection('coupons')
      .find({}, {
        projection: {
          id: 1,
          Category: 1,
          Brand: 1,
          Model: 1,
          'Coupon Value_low': 1,
          'Coupon Count_low': 1,
          'Coupon Value_mid': 1,
          'Coupon Count_mid': 1,
          'Coupon Value_high': 1,
          'Coupon Count_high': 1,
          'Coupon Value_pro': 1,
          'Coupon Count_pro': 1,
          'Coupon Value_extreme': 1,
          'Coupon Count_extreme': 1
        }
      })
      .limit(1000)
      .toArray();

    console.log(`✅ Fetched ${coupons.length} coupon records from database`);
    const typedCoupons = coupons as unknown as CouponData[];
    setCachedDbData(cacheKey, typedCoupons);
    return typedCoupons;
  } catch (error) {
    console.error('❌ Error fetching coupon data:', error);
    return [];
  }
};

// Fetch coupon links from database
export const fetchCouponLinks = async (): Promise<CouponLink[]> => {
  const cacheKey = 'coupon_links';
  const cached = getCachedDbData(cacheKey);
  if (cached) return cached;

  try {
    console.log('🔍 Fetching coupon links from database...');
    const db = getNewDb();
    
    const couponLinks = await db.collection('coupon_link')
      .find({}, {
        projection: {
          id: 1,
          'Coupon Link': 1,
          'Coupon type': 1,
          is_used: 1,
          timestamp: 1
        }
      })
      .sort({ timestamp: -1 })
      .limit(10000) // Limit for performance
      .toArray();

    console.log(`✅ Fetched ${couponLinks.length} coupon link records from database`);
    const typedLinks = couponLinks as unknown as CouponLink[];
    setCachedDbData(cacheKey, typedLinks);
    return typedLinks;
  } catch (error) {
    console.error('❌ Error fetching coupon links:', error);
    return [];
  }
};

// Get coupon value by type
const getCouponValue = (type: string): number => {
  const values = {
    'low': 200,
    'mid': 500,
    'high': 1000,
    'pro': 1500,
    'extreme': 2000
  };
  return values[type as keyof typeof values] || 100;
};

// Parse numeric value from string
const parseNumericValue = (value: string | undefined): number => {
  if (!value) return 0;
  const parsed = parseFloat(value.replace(/[^\d.]/g, ''));
  return isNaN(parsed) ? 0 : parsed;
};

// Generate comprehensive coupon analytics
export const generateOptimizedCouponAnalytics = async (): Promise<CouponAnalytics[]> => {
  try {
    console.log('📊 Generating coupon analytics...');
    
    const [coupons, couponLinks] = await Promise.all([
      fetchCouponData(),
      fetchCouponLinks()
    ]);
    if (coupons.length === 0) {
      console.warn('⚠️ No coupon data found');
      return [];
    }

    console.log(`📈 Processing ${coupons.length} coupons and ${couponLinks.length} links`);

    // Create usage map from database
    const dbUsageMap = new Map<string, Map<string, number>>();
    couponLinks.forEach(link => {
      if (link.is_used && link.id && link['Coupon type']) {
        if (!dbUsageMap.has(link.id)) {
          dbUsageMap.set(link.id, new Map());
        }
        const typeMap = dbUsageMap.get(link.id)!;
        const currentCount = typeMap.get(link['Coupon type']) || 0;
        typeMap.set(link['Coupon type'], currentCount + 1);
      }
    });

    // Create usage map from CSV
    const csvUsageMap = new Map<string, Map<string, number>>();
    usedCouponsCSV.forEach(csvCoupon => {
      const id = csvCoupon.id.toString();
      const type = csvCoupon['Coupon type'] as string;
      
      if (!csvUsageMap.has(id)) {
        csvUsageMap.set(id, new Map());
      }
      const typeMap = csvUsageMap.get(id)!;
      const currentCount = typeMap.get(type) || 0;
      typeMap.set(type, currentCount + 1);
    });

    console.log(`📊 DB Usage: ${dbUsageMap.size} IDs, CSV Usage: ${csvUsageMap.size} IDs`);

    // Process each coupon
    const analytics: CouponAnalytics[] = coupons.map(coupon => {
      const id = coupon.id || coupon._id;
      const dbUsage = dbUsageMap.get(id) || new Map();
      const csvUsage = csvUsageMap.get(id) || new Map();

      // Merge usage data (take maximum to avoid double counting)
      const mergedUsage = new Map<string, number>();
      const allTypes = new Set([...dbUsage.keys(), ...csvUsage.keys()]);
      
      allTypes.forEach(type => {
        const dbCount = dbUsage.get(type) || 0;
        const csvCount = csvUsage.get(type) || 0;
        mergedUsage.set(type, Math.max(dbCount, csvCount));
      });

      // Calculate coupon type statistics
      const couponTypes: { [key: string]: { value: number; count: number; used: number; usageRate: number } } = {};
      let totalCoupons = 0;
      let totalUsed = 0;
      let totalValue = 0;

      ['low', 'mid', 'high', 'pro', 'extreme'].forEach(type => {
        const countField = `Coupon Count_${type}` as keyof CouponData;
        const valueField = `Coupon Value_${type}` as keyof CouponData;
        
        const count = parseNumericValue(coupon[countField] as string);
        const value = parseNumericValue(coupon[valueField] as string) || getCouponValue(type);
        const used = mergedUsage.get(type) || 0;
        const usageRate = count > 0 ? (used / count) * 100 : 0;

        if (count > 0) {
          couponTypes[type] = {
            value,
            count,
            used,
            usageRate
          };
          
          totalCoupons += count;
          totalUsed += used;
          totalValue += used * value;
        }
      });

      const overallUsageRate = totalCoupons > 0 ? (totalUsed / totalCoupons) * 100 : 0;
      const avgDiscount = totalUsed > 0 ? totalValue / totalUsed : 0;

      return {
        id,
        category: coupon.Category || 'Unknown',
        brand: coupon.Brand || 'Unknown',
        model: coupon.Model || 'Unknown',
        totalCoupons,
        usedCoupons: totalUsed,
        usageRate: overallUsageRate,
        totalValue,
        avgDiscount,
        couponTypes
      };
    }).filter(analytics => analytics.totalCoupons > 0);

    console.log(`✅ Generated analytics for ${analytics.length} coupons`);
    return analytics.sort((a, b) => b.usageRate - a.usageRate);

  } catch (error) {
    console.error('❌ Error generating coupon analytics:', error);
    return [];
  }
};

// Get coupon summary statistics
export const getCouponSummaryStats = async () => {
  try {
    const analytics = await generateOptimizedCouponAnalytics();
    
    const summary = {
      totalCoupons: analytics.reduce((sum, a) => sum + a.totalCoupons, 0),
      totalUsed: analytics.reduce((sum, a) => sum + a.usedCoupons, 0),
      totalValue: analytics.reduce((sum, a) => sum + a.totalValue, 0),
      avgUsageRate: analytics.length > 0 
        ? analytics.reduce((sum, a) => sum + a.usageRate, 0) / analytics.length 
        : 0,
      totalActiveCoupons: analytics.length,
      typeDistribution: {} as Record<string, number>
    };

    // Calculate type distribution
    analytics.forEach(coupon => {
      Object.keys(coupon.couponTypes).forEach(type => {
        summary.typeDistribution[type] = (summary.typeDistribution[type] || 0) + coupon.couponTypes[type].count;
      });
    });

    console.log('📊 Summary Stats:', {
      totalCoupons: summary.totalCoupons,
      totalUsed: summary.totalUsed,
      totalValue: summary.totalValue,
      avgUsageRate: summary.avgUsageRate.toFixed(2) + '%'
    });

    return summary;
  } catch (error) {
    console.error('❌ Error generating summary stats:', error);
    return {
      totalCoupons: 0,
      totalUsed: 0,
      totalValue: 0,
      avgUsageRate: 0,
      totalActiveCoupons: 0,
      typeDistribution: {}
    };
  }
};

export default {
  generateOptimizedCouponAnalytics,
  getCouponSummaryStats,
  fetchCouponData,
  fetchCouponLinks
};