// server/services/couponService.ts - Real Database Integration with CSV Merge
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
159,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=PREM4zFCDPR3DHV,pro
24,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=ASHI2zFS3KFGU4Y,low
24,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=ASHI2z97X9C5ECC,low
24,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=ASHI2zD659E7UPC,low
24,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=ASHI2zPKUXHGF4Y,low
24,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=ASHI2z5TCNP94BU,low
24,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=ASHI2zWU3YTXCRY,low
24,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=ASHI2zXNWPBNG5H,low
24,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=ASHI2zBKAT8BMUB,low
24,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=ASHI2zBVW3DSH7V,low
24,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=ASHI2zR6EGPTN5U,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3z5GNY78PAK,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3z3A6N6SPMN,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3zSFYTTMTH7,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3z9DV6R4YPC,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3zY98GJSKYM,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3z5YNCPATP3,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3zNRCDTXVMC,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3z7MWVF7VSS,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3zDV3M7DR78,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3zFHPBNMVJY,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3zXDE4U9DMT,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3zPYTF6X796,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3zACNV9BMEB,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3zU86KGNANC,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3z3HPTFGF77,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3zMMU9GU3CJ,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3zGNKGYCC6F,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3z8Y3C5RN5E,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3zF3SE8M5PX,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3zRVJ3KY5RC,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3z4SKMS9WMN,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3z3G6J8EF8U,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3zBN7NT8HPD,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3zD5YTFB8AV,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3z4GNNY9PJV,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3zAF8U75W6M,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3z4MCSG9H7K,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3z36TYGWD5S,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3zJVXSBGKFY,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3zKS97D5AH6,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3zXJ68CNJX6,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3zJCA77GBYW,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3z5W4MCT7SH,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3zVP9EPHY7M,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3z7NNARP8MJ,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3zK4E4BKXHS,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3zYWT8T3566,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3zXDARJKRUK,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3z4E9D8S48A,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI3zYH43PKBAC,low
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI2zB8B87P885,mid
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI2zW43GMAEPG,mid
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI2zGVK84TWWY,mid
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI2zJWY4SG977,mid
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI1zVC79XPKHW,high
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI1zWB3VBX8D6,high
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI1z6CAXH6FS9,high
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI1zUE3J5NH35,high
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI1z3N9PTNYAH,high
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI1zTXYKGM3XV,high
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI1z9WJH5TCKF,high
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI1zHRHPJHC59,high
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI1zC6BGYHJTF,high
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI1zPWDKCY76K,high
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI1zU5R3WBVXV,high
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBI1zY883RJUB3,high
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBINzRYAC8PJN8,pro
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBINzVBXPXBTVR,pro
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBINz3TVVW9E7V,pro
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBINzAV7KS3R7R,pro
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBINz3K3NH37AJ,pro
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBINzCFWWMRK3Y,pro
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBINzRY7YVJFWE,pro
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBINzXKR4NME6V,pro
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBINzEGBW558RS,pro
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBINz4NYKPTJ3Y,pro
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBINzY644DY9V3,pro
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBINz8TADSB8U6,pro
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBINzBKWBFPFK3,pro
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBINzU8RSU9UW5,pro
25,https://www.flipkart.com/myrewards?enableCouponCode=true&couponCode=SUBINz4XRCHTUWP,pro`;

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

// Fetch coupon data from database
export const fetchCouponData = async (): Promise<CouponData[]> => {
  const cacheKey = 'coupon_data';
  const cached = getCachedDbData(cacheKey);
  if (cached) return cached;

  try {
    console.log('Fetching coupon data from database...');
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

    console.log(`Fetched ${coupons.length} coupon records from database`);
    const typedCoupons = coupons as unknown as CouponData[];
    setCachedDbData(cacheKey, typedCoupons);
    return typedCoupons;
  } catch (error) {
    console.error('Error fetching coupon data:', error);
    return [];
  }
};

// Fetch coupon links from database
export const fetchCouponLinks = async (): Promise<CouponLink[]> => {
  const cacheKey = 'coupon_links';
  const cached = getCachedDbData(cacheKey);
  if (cached) return cached;

  try {
    console.log('Fetching coupon links from database...');
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

    console.log(`Fetched ${couponLinks.length} coupon link records from database`);
    const typedLinks = couponLinks as unknown as CouponLink[];
    setCachedDbData(cacheKey, typedLinks);
    return typedLinks;
  } catch (error) {
    console.error('Error fetching coupon links:', error);
    return [];
  }
};

// Generate comprehensive coupon analytics with CSV merge
export const generateOptimizedCouponAnalytics = async (): Promise<CouponAnalytics[]> => {
  const cacheKey = 'optimized_coupon_analytics';
  const cached = getCachedDbData(cacheKey);
  if (cached) return cached;

  try {
    console.log('Generating comprehensive coupon analytics...');
    
    const [coupons, couponLinks] = await Promise.all([
      fetchCouponData(),
      fetchCouponLinks()
    ]);

    // Parse CSV used coupons data
    const csvUsedCoupons = parseUsedCouponsCSV();
    console.log(`Parsed ${csvUsedCoupons.length} used coupons from CSV`);

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
        console.error(`Error processing coupon ${coupon.id}:`, error);
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

    console.log(`Generated analytics for ${analytics.length} coupons with CSV merge`);
    setCachedDbData(cacheKey, analytics);
    return analytics;
  } catch (error) {
    console.error('Error generating optimized coupon analytics:', error);
    return [];
  }
};

// Get coupon analytics by category
export const getCouponAnalyticsByCategory = async (category: string): Promise<CouponAnalytics[]> => {
  try {
    const allAnalytics = await generateOptimizedCouponAnalytics();
    return allAnalytics.filter(analytics => 
      analytics.category.toLowerCase() === category.toLowerCase()
    );
  } catch (error) {
    console.error(`Error getting coupon analytics by category ${category}:`, error);
    return [];
  }
};

// Get top performing coupons
export const getTopPerformingCoupons = async (limit: number = 10): Promise<CouponAnalytics[]> => {
  try {
    const allAnalytics = await generateOptimizedCouponAnalytics();
    return allAnalytics
      .filter(c => c.usedCoupons > 0)
      .sort((a, b) => {
        // Sort by usage rate first, then by total value
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
      dbUsedCount: totalUsed - csvUsedCoupons.length
    };
  } catch (error) {
    console.error('Error getting coupon summary stats:', error);
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
  getCouponAnalyticsByCategory,
  getTopPerformingCoupons,
  getCouponSummaryStats,
  clearCouponServiceCache
};