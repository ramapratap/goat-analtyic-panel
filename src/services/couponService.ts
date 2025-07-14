// Frontend coupon service with mock data generation
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

export interface HeroDeal {
  id: string;
  category: string;
  vertical: string;
  productName: string;
  deal: string;
  fsn: string;
  productLink: string;
  verticalCleaning: string;
  timestamp: string;
}

// Generate realistic coupon analytics data
export const generateCouponAnalytics = (): CouponAnalytics[] => {
  const categories = ['Mobile', 'Laptop', 'Television', 'Audio', 'Camera', 'Watch', 'AirConditioner'];
  const brands = ['Apple', 'Samsung', 'Sony', 'LG', 'OnePlus', 'Xiaomi', 'Dell', 'HP', 'Lenovo'];
  
  const analytics: CouponAnalytics[] = [];
  
  for (let i = 0; i < 50; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const brand = brands[Math.floor(Math.random() * brands.length)];
    
    const couponTypes = {
      low: {
        value: Math.floor(Math.random() * 500) + 100,
        count: Math.floor(Math.random() * 100) + 50,
        used: Math.floor(Math.random() * 30) + 10
      },
      mid: {
        value: Math.floor(Math.random() * 1000) + 500,
        count: Math.floor(Math.random() * 80) + 30,
        used: Math.floor(Math.random() * 25) + 5
      },
      high: {
        value: Math.floor(Math.random() * 2000) + 1000,
        count: Math.floor(Math.random() * 60) + 20,
        used: Math.floor(Math.random() * 20) + 3
      },
      pro: {
        value: Math.floor(Math.random() * 3000) + 2000,
        count: Math.floor(Math.random() * 40) + 10,
        used: Math.floor(Math.random() * 15) + 2
      },
      extreme: {
        value: Math.floor(Math.random() * 5000) + 3000,
        count: Math.floor(Math.random() * 20) + 5,
        used: Math.floor(Math.random() * 10) + 1
      }
    };

    const totalCoupons = Object.values(couponTypes).reduce((sum, type) => sum + type.count, 0);
    const usedCoupons = Object.values(couponTypes).reduce((sum, type) => sum + type.used, 0);
    const totalValue = Object.values(couponTypes).reduce((sum, type) => sum + (type.value * type.used), 0);
    const avgDiscount = usedCoupons > 0 ? totalValue / usedCoupons : 0;

    analytics.push({
      id: `coupon_${i + 1}`,
      category,
      brand,
      model: `${brand} ${category} Model ${i + 1}`,
      totalCoupons,
      usedCoupons,
      usageRate: totalCoupons > 0 ? (usedCoupons / totalCoupons) * 100 : 0,
      totalValue,
      avgDiscount,
      lastUsed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      couponTypes
    });
  }

  return analytics.sort((a, b) => b.usedCoupons - a.usedCoupons);
};

// Generate hero deals data
export const generateHeroDeals = (): HeroDeal[] => {
  const categories = ['Electronics', 'Fashion', 'Home', 'Sports', 'Books'];
  const verticals = ['Flipkart', 'Amazon', 'Myntra', 'Ajio', 'Nykaa'];
  const deals = ['50% OFF', '₹1000 OFF', 'Buy 1 Get 1', '70% OFF', 'Flat ₹500 OFF'];
  
  const heroDeals: HeroDeal[] = [];
  
  for (let i = 0; i < 30; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const vertical = verticals[Math.floor(Math.random() * verticals.length)];
    const deal = deals[Math.floor(Math.random() * deals.length)];
    
    heroDeals.push({
      id: `deal_${i + 1}`,
      category,
      vertical,
      productName: `${category} Product ${i + 1}`,
      deal,
      fsn: `FSN${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      productLink: `https://${vertical.toLowerCase()}.com/product/${i + 1}`,
      verticalCleaning: `${vertical} Exclusive`,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  }

  return heroDeals.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};