import { getOldDb } from '../config/database';
import { ObjectId } from 'mongodb';

export interface CouponData {
  _id: ObjectId;
  id: string;
  Category: string;
  Brand: string;
  Model: string;
  FSN_List: string;
  Min_Range: string;
  Max_Range: string;
  Coupon_Value_low: string;
  Coupon_Value_mid: string;
  Coupon_Value_high: string;
  Coupon_Value_pro: string;
  Coupon_Value_extreme: string;
  Coupon_Count_low: string;
  Coupon_Count_mid: string;
  Coupon_Count_high: string;
  Coupon_Count_pro: string;
  Coupon_Count_extreme: string;
  Coupon_Code_Links_low: string;
  Coupon_Code_Links_mid: string;
  Coupon_Code_Links_high: string;
  Coupon_Code_Links_pro: string;
  Coupon_Code_Links_extreme: string;
  timestamp: string;
}

export interface CouponLink {
  _id: ObjectId;
  id: string;
  Coupon_Link: string;
  Coupon_type: string;
  timestamp: string;
  is_used?: boolean;
}

export interface HeroDeal {
  _id: ObjectId;
  Category: string;
  Vertical: string;
  Product_Name: string;
  Deal: string;
  FSN: string;
  Product_Link: string;
  Vertical_Cleaning: string;
  timestamp: string;
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
  lastUsed?: string;
  couponTypes: {
    low: { value: number; count: number; used: number };
    mid: { value: number; count: number; used: number };
    high: { value: number; count: number; used: number };
    pro: { value: number; count: number; used: number };
    extreme: { value: number; count: number; used: number };
  };
}

// Fetch coupon data from old database
export const fetchCouponData = async (): Promise<CouponData[]> => {
  try {
    const db = getOldDb();
    const coupons = await db.collection('coupons').find({}).toArray();
    return coupons as CouponData[];
  } catch (error) {
    console.error('Error fetching coupon data:', error);
    return [];
  }
};

// Fetch coupon links from old database
export const fetchCouponLinks = async (): Promise<CouponLink[]> => {
  try {
    const db = getOldDb();
    const couponLinks = await db.collection('coupon_link').find({}).toArray();
    return couponLinks as CouponLink[];
  } catch (error) {
    console.error('Error fetching coupon links:', error);
    return [];
  }
};

// Fetch hero deals from old database
export const fetchHeroDeals = async (): Promise<HeroDeal[]> => {
  try {
    const db = getOldDb();
    const heroDeals = await db.collection('herodeals').find({}).toArray();
    return heroDeals as HeroDeal[];
  } catch (error) {
    console.error('Error fetching hero deals:', error);
    return [];
  }
};

// Generate coupon analytics by combining coupon data and usage
export const generateCouponAnalytics = async (): Promise<CouponAnalytics[]> => {
  try {
    const [coupons, couponLinks] = await Promise.all([
      fetchCouponData(),
      fetchCouponLinks()
    ]);

    const analytics: CouponAnalytics[] = [];

    for (const coupon of coupons) {
      // Get usage data for this coupon ID
      const relatedLinks = couponLinks.filter(link => link.id === coupon.id);
      const usedLinks = relatedLinks.filter(link => link.is_used === true);

      // Calculate coupon type statistics
      const couponTypes = {
        low: {
          value: parseFloat(coupon.Coupon_Value_low) || 0,
          count: parseFloat(coupon.Coupon_Count_low) || 0,
          used: usedLinks.filter(link => link.Coupon_type === 'low').length
        },
        mid: {
          value: parseFloat(coupon.Coupon_Value_mid) || 0,
          count: parseFloat(coupon.Coupon_Count_mid) || 0,
          used: usedLinks.filter(link => link.Coupon_type === 'mid').length
        },
        high: {
          value: parseFloat(coupon.Coupon_Value_high) || 0,
          count: parseFloat(coupon.Coupon_Count_high) || 0,
          used: usedLinks.filter(link => link.Coupon_type === 'high').length
        },
        pro: {
          value: parseFloat(coupon.Coupon_Value_pro) || 0,
          count: parseFloat(coupon.Coupon_Count_pro) || 0,
          used: usedLinks.filter(link => link.Coupon_type === 'pro').length
        },
        extreme: {
          value: parseFloat(coupon.Coupon_Value_extreme) || 0,
          count: parseFloat(coupon.Coupon_Count_extreme) || 0,
          used: usedLinks.filter(link => link.Coupon_type === 'extreme').length
        }
      };

      const totalCoupons = Object.values(couponTypes).reduce((sum, type) => sum + type.count, 0);
      const usedCoupons = Object.values(couponTypes).reduce((sum, type) => sum + type.used, 0);
      const totalValue = Object.values(couponTypes).reduce((sum, type) => sum + (type.value * type.used), 0);
      const avgDiscount = usedCoupons > 0 ? totalValue / usedCoupons : 0;

      // Find last used timestamp
      const lastUsedLink = usedLinks
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

      analytics.push({
        id: coupon.id,
        category: coupon.Category || 'Unknown',
        brand: coupon.Brand || 'Unknown',
        model: coupon.Model || 'Unknown',
        totalCoupons,
        usedCoupons,
        usageRate: totalCoupons > 0 ? (usedCoupons / totalCoupons) * 100 : 0,
        totalValue,
        avgDiscount,
        lastUsed: lastUsedLink?.timestamp,
        couponTypes
      });
    }

    return analytics.sort((a, b) => b.usedCoupons - a.usedCoupons);
  } catch (error) {
    console.error('Error generating coupon analytics:', error);
    return [];
  }
};