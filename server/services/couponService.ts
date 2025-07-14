// server/services/couponService.ts - FIXED VERSION (NEW_DB Only)
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
  _id: string;
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
  _id: string;
  id: number;
  Coupon_Link: string;
  Coupon_type: string;
  is_used: boolean;
  timestamp: string;
}

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

// FIXED: Fetch coupon data with proper type casting
export const fetchCouponData = async (): Promise<CouponData[]> => {
  const cacheKey = 'coupon_data';
  const cached = getCachedDbData(cacheKey);
  if (cached) return cached;

  try {
    console.log('Fetching coupon data from NEW database...');
    const db = getNewDb();
    
    const coupons = await db.collection('coupons')
      .find({}, {
        projection: {
          id: 1,
          Category: 1,
          Brand: 1,
          Model: 1,
          Coupon_Value_low: 1,
          Coupon_Count_low: 1,
          Coupon_Value_mid: 1,
          Coupon_Count_mid: 1,
          Coupon_Value_high: 1,
          Coupon_Count_high: 1,
          Coupon_Value_pro: 1,
          Coupon_Count_pro: 1,
          Coupon_Value_extreme: 1,
          Coupon_Count_extreme: 1
        }
      })
      .limit(1000)
      .toArray();

    console.log(`Fetched ${coupons.length} coupon records`);
    const typedCoupons = coupons as unknown as CouponData[];
    setCachedDbData(cacheKey, typedCoupons);
    return typedCoupons;
  } catch (error) {
    console.error('Error fetching coupon data:', error);
    return [];
  }
};

// FIXED: Fetch coupon links with proper type casting
export const fetchCouponLinks = async (): Promise<CouponLink[]> => {
  const cacheKey = 'coupon_links';
  const cached = getCachedDbData(cacheKey);
  if (cached) return cached;

  try {
    console.log('Fetching coupon links from NEW database...');
    const db = getNewDb();
    
    const couponLinks = await db.collection('coupon_links')
      .find({}, {
        projection: {
          id: 1,
          Coupon_Link: 1,
          Coupon_type: 1,
          is_used: 1,
          timestamp: 1
        }
      })
      .sort({ timestamp: -1 })
      .limit(2000)
      .toArray();

    console.log(`Fetched ${couponLinks.length} coupon link records`);
    const typedLinks = couponLinks as unknown as CouponLink[];
    setCachedDbData(cacheKey, typedLinks);
    return typedLinks;
  } catch (error) {
    console.error('Error fetching coupon links:', error);
    return [];
  }
};

// FIXED: Generate coupon analytics with proper error handling
export const generateOptimizedCouponAnalytics = async (): Promise<CouponAnalytics[]> => {
  const cacheKey = 'optimized_coupon_analytics';
  const cached = getCachedDbData(cacheKey);
  if (cached) return cached;

  try {
    console.log('Generating optimized coupon analytics...');
    
    const [coupons, couponLinks] = await Promise.all([
      fetchCouponData(),
      fetchCouponLinks()
    ]);

    console.log(`Processing ${coupons.length} coupons and ${couponLinks.length} coupon links`);

    const linksByIdAndType = new Map<string, CouponLink[]>();
    
    couponLinks.forEach(link => {
      const key = `${link.id}`;
      if (!linksByIdAndType.has(key)) {
        linksByIdAndType.set(key, []);
      }
      linksByIdAndType.get(key)!.push(link);
    });

    const analytics: CouponAnalytics[] = [];
    const COUPON_TYPES = ['low', 'mid', 'high', 'pro', 'extreme'] as const;

    for (const coupon of coupons) {
      try {
        const relatedLinks = linksByIdAndType.get(`${coupon.id}`) || [];
        const usedLinks = relatedLinks.filter(link => link.is_used === true);

        const couponTypes: CouponAnalytics['couponTypes'] = {};
        let totalCoupons = 0;
        let usedCoupons = 0;
        let totalValue = 0;

        COUPON_TYPES.forEach(type => {
          const value = parseFloat(coupon[`Coupon_Value_${type}` as keyof CouponData] as string) || 0;
          const count = parseFloat(coupon[`Coupon_Count_${type}` as keyof CouponData] as string) || 0;
          const used = usedLinks.filter(link => link.Coupon_type === type).length;

          if (count > 0) {
            couponTypes[type] = {
              value,
              count,
              used,
              usageRate: count > 0 ? (used / count) * 100 : 0
            };

            totalCoupons += count;
            usedCoupons += used;
            totalValue += value * used;
          }
        });

        if (totalCoupons > 0) {
          const lastUsedLink = usedLinks
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
        console.error(`Error processing coupon ${coupon.id}:`, error);
        continue;
      }
    }

    analytics.sort((a, b) => b.usedCoupons - a.usedCoupons);

    console.log(`Generated analytics for ${analytics.length} coupons`);
    setCachedDbData(cacheKey, analytics);
    return analytics;
  } catch (error) {
    console.error('Error generating optimized coupon analytics:', error);
    return [];
  }
};

// Helper functions
export const getCouponAnalyticsByType = async (type: string): Promise<CouponAnalytics[]> => {
  try {
    const allAnalytics = await generateOptimizedCouponAnalytics();
    return allAnalytics.filter(analytics => 
      Object.keys(analytics.couponTypes).some(t => 
        t.toLowerCase() === type.toLowerCase()
      )
    );
  } catch (error) {
    console.error(`Error getting coupon analytics by type ${type}:`, error);
    return [];
  }
};

export const getTopPerformingCoupons = async (limit: number = 10): Promise<CouponAnalytics[]> => {
  try {
    const allAnalytics = await generateOptimizedCouponAnalytics();
    return allAnalytics
      .filter(c => c.usedCoupons > 0)
      .sort((a, b) => {
        if (b.usageRate !== a.usageRate) {
          return b.usageRate - a.usageRate;
        }
        return b.totalValue - a.totalValue;
      })
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting top performing coupons:', error);
    return [];
  }
};

export const getCouponSummaryStats = async () => {
  try {
    const analytics = await generateOptimizedCouponAnalytics();
    
    return {
      totalCoupons: analytics.reduce((sum, c) => sum + c.totalCoupons, 0),
      totalUsed: analytics.reduce((sum, c) => sum + c.usedCoupons, 0),
      totalValue: analytics.reduce((sum, c) => sum + c.totalValue, 0),
      averageUsageRate: analytics.length > 0 
        ? analytics.reduce((sum, c) => sum + c.usageRate, 0) / analytics.length 
        : 0,
      totalActiveCoupons: analytics.length
    };
  } catch (error) {
    console.error('Error getting coupon summary stats:', error);
    return {
      totalCoupons: 0,
      totalUsed: 0,
      totalValue: 0,
      averageUsageRate: 0,
      totalActiveCoupons: 0
    };
  }
};

export const clearCouponServiceCache = (): void => {
  dbCache.clear();
  console.log('Coupon service cache cleared');
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
  getCouponAnalyticsByType,
  getTopPerformingCoupons,
  getCouponSummaryStats,
  clearCouponServiceCache
};