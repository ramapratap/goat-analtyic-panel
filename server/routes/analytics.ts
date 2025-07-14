// server/routes/analytics.ts - FIXED VERSION (NEW_DB Only)
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest } from '../types';
import { 
  fetchQRScanCount, 
  fetchProductRecords, 
  fetchProductFeedback,
  ProductRecord,
  ProductFeedback 
} from '../services/externalApi';
import { 
  generateOptimizedCouponAnalytics, 
  fetchCouponData,
  fetchCouponLinks,
  CouponAnalytics,
  getCouponSummaryStats
} from '../services/couponService';
import { maskPhoneNumber, isRealUser } from '../utils/phoneUtils';

const router = express.Router();

// Enhanced caching with better memory management
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;

const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCachedData = (key: string, data: any) => {
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, { data, timestamp: Date.now() });
};

// Cleanup expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      cache.delete(key);
    }
  }
}, CACHE_DURATION);

// FIXED Dashboard stats endpoint
router.get('/dashboard', async (req: AuthRequest, res) => {
  try {
    const cacheKey = 'dashboard_stats';
    const cachedStats = getCachedData(cacheKey);
    
    if (cachedStats) {
      return res.json(cachedStats);
    }

    console.log('Fetching fresh dashboard data...');

    // Fetch data with proper error handling and type safety
    const [qrData, productRecords, couponAnalytics] = await Promise.allSettled([
      fetchQRScanCount().catch(() => ({ qr_scan_count: 0 })),
      fetchProductRecords().catch(() => []),
      generateOptimizedCouponAnalytics().catch(() => [])
    ]);

    // Extract values from PromiseSettledResult
    const qrResult = qrData.status === 'fulfilled' ? qrData.value : { qr_scan_count: 0 };
    const productResult = productRecords.status === 'fulfilled' ? productRecords.value : [];
    const couponResult = couponAnalytics.status === 'fulfilled' ? couponAnalytics.value : [];

    // Ensure productResult is an array
    const productArray = Array.isArray(productResult) ? productResult : [];
    
    // Filter real users
    const realProductRecords = productArray.filter((record: any) => 
      record?.user_id && isRealUser(record.user_id)
    );

    const uniqueUsers = new Set(realProductRecords.map((r: any) => r.user_id)).size;
    const totalSessions = realProductRecords.length;
    const totalErrors = realProductRecords.filter((r: any) => 
      r.search_source?.toLowerCase().includes('error') || 
      !r.product_name || 
      r.product_name.toLowerCase().includes('unknown')
    ).length;

    // Calculate coupon metrics safely
    const totalCouponsUsed = Array.isArray(couponResult) 
      ? couponResult.reduce((sum: number, c: any) => sum + (c.usedCoupons || 0), 0)
      : 0;
    const totalSavings = Array.isArray(couponResult)
      ? couponResult.reduce((sum: number, c: any) => sum + (c.totalValue || 0), 0)
      : 0;
    const totalCoupons = Array.isArray(couponResult)
      ? couponResult.reduce((sum: number, c: any) => sum + (c.totalCoupons || 0), 0)
      : 0;

    const stats = {
      totalUsers: uniqueUsers,
      uniqueUsers: uniqueUsers,
      totalSessions,
      totalErrors,
      conversionRate: totalSessions > 0 ? ((totalCouponsUsed / totalSessions) * 100).toFixed(2) : '0',
      qrScanCount: qrResult?.qr_scan_count || 0,
      totalCoupons,
      totalCouponsUsed,
      totalSavings: Math.round(totalSavings),
      avgSavingsPerCoupon: totalCouponsUsed > 0 ? Math.round(totalSavings / totalCouponsUsed) : 0,
      couponUsageRate: totalCoupons > 0 ? ((totalCouponsUsed / totalCoupons) * 100).toFixed(2) : '0',
      lastUpdated: new Date().toISOString(),
      dataSource: 'live',
      // Additional required fields for compatibility
      avgSessionDuration: '0:00',
      qrScans: qrResult?.qr_scan_count || 0,
      topProducts: [],
      topCoupons: []
    };

    setCachedData(cacheKey, stats);
    res.json(stats);
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard stats',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// FIXED Product analytics endpoint
router.get('/products', async (req: AuthRequest, res) => {
  try {
    const { limit = 100, offset = 0, brand, category } = req.query;
    const cacheKey = `products_${limit}_${offset}_${brand || 'all'}_${category || 'all'}`;
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    console.log('Fetching product analytics...');
    
    const productRecords = await fetchProductRecords().catch(() => []);
    const productArray = Array.isArray(productRecords) ? productRecords : [];

    let filteredRecords = productArray.filter((record: any) => 
      record?.user_id && isRealUser(record.user_id)
    );

    if (brand) {
      filteredRecords = filteredRecords.filter((r: any) => 
        r.product_brand?.toLowerCase().includes(brand.toString().toLowerCase())
      );
    }

    if (category) {
      filteredRecords = filteredRecords.filter((r: any) => 
        r.product_category?.toLowerCase().includes(category.toString().toLowerCase())
      );
    }

    const startIndex = parseInt(offset.toString());
    const limitNum = parseInt(limit.toString());
    const paginatedRecords = filteredRecords.slice(startIndex, startIndex + limitNum);

    const result = {
      records: paginatedRecords.map((record: any) => ({
        ...record,
        user_id: req.user?.role === 'admin' ? maskPhoneNumber(record.user_id) : null
      })),
      totalRecords: filteredRecords.length,
      pagination: {
        limit: limitNum,
        offset: startIndex,
        hasMore: startIndex + limitNum < filteredRecords.length
      }
    };

    setCachedData(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Product analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch product analytics' });
  }
});

// FIXED Coupon analytics endpoint
router.get('/coupons', async (req: AuthRequest, res) => {
  try {
    const { type, limit = 50, summary } = req.query;
    const cacheKey = `coupons_${type || 'all'}_${limit}`;
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    console.log('🔄 Fetching coupon analytics from database...');

    // Import the coupon service functions with proper error handling
    let generateOptimizedCouponAnalytics, getCouponSummaryStats;
    try {
      const couponService = await import('../services/couponService');
      generateOptimizedCouponAnalytics = couponService.generateOptimizedCouponAnalytics;
      getCouponSummaryStats = couponService.getCouponSummaryStats;
      console.log('✅ Coupon service imported successfully');
    } catch (importError) {
      console.error('❌ Error importing coupon service:', importError);
      return res.status(500).json({ error: 'Failed to load coupon service' });
    }
    
    console.log('📊 Generating coupon analytics...');
    const [couponAnalytics, summaryStats] = await Promise.allSettled([
      generateOptimizedCouponAnalytics(),
      summary ? getCouponSummaryStats() : Promise.resolve(null)
    ]);
    
    // Extract results from PromiseSettledResult
    const analyticsResult = couponAnalytics.status === 'fulfilled' ? couponAnalytics.value : [];
    const summaryResult = summaryStats.status === 'fulfilled' ? summaryStats.value : null;
    
    if (couponAnalytics.status === 'rejected') {
      console.error('❌ Error generating coupon analytics:', couponAnalytics.reason);
    }
    if (summaryStats.status === 'rejected') {
      console.error('❌ Error generating summary stats:', summaryStats.reason);
    }
    
    let filteredAnalytics = analyticsResult;
    if (type) {
      filteredAnalytics = analyticsResult.filter((c: any) => 
        Object.keys(c.couponTypes).some(t => t.toLowerCase() === type.toString().toLowerCase())
      );
    }

    const limitedAnalytics = filteredAnalytics.slice(0, parseInt(limit.toString()));

    const analyticsummary = {
      totalCoupons: filteredAnalytics.reduce((sum: number, c: any) => sum + (c.totalCoupons || 0), 0),
      totalUsed: filteredAnalytics.reduce((sum: number, c: any) => sum + (c.usedCoupons || 0), 0),
      totalValue: filteredAnalytics.reduce((sum: number, c: any) => sum + (c.totalValue || 0), 0),
      avgUsageRate: filteredAnalytics.length > 0 
        ? filteredAnalytics.reduce((sum: number, c: any) => sum + (c.usageRate || 0), 0) / filteredAnalytics.length 
        : 0,
      typeDistribution: {}
    };

    const result = {
      analytics: limitedAnalytics,
      summary: summary ? summaryResult : analyticsummary,
      totalRecords: filteredAnalytics.length,
      lastUpdated: new Date().toISOString(),
      debug: {
        analyticsCount: analyticsResult.length,
        filteredCount: filteredAnalytics.length,
        summaryAvailable: !!summaryResult
      }
    };

    console.log('✅ Coupon analytics response prepared:', {
      analyticsCount: result.analytics.length,
      totalRecords: result.totalRecords,
      hasSummary: !!result.summary
    });

    setCachedData(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('❌ Coupon analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch coupon analytics',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// FIXED Coupon Links endpoint
router.get('/coupon-links', async (req: AuthRequest, res) => {
  try {
    const { coupon_id, coupon_type, is_used, limit = 100, offset = 0 } = req.query;
    const cacheKey = `coupon_links_${coupon_id || 'all'}_${coupon_type || 'all'}_${is_used || 'all'}_${limit}_${offset}`;
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    console.log('Fetching coupon links...');

    const couponLinks = await fetchCouponLinks();
    
    let filteredLinks = couponLinks;
    
    if (coupon_id) {
      filteredLinks = filteredLinks.filter((link: any) => link.id === parseInt(coupon_id.toString()));
    }
    
    if (coupon_type) {
      filteredLinks = filteredLinks.filter((link: any) => 
        link.Coupon_type?.toLowerCase() === coupon_type.toString().toLowerCase()
      );
    }
    
    if (is_used !== undefined) {
      const isUsedBool = is_used.toString() === 'true';
      filteredLinks = filteredLinks.filter((link: any) => link.is_used === isUsedBool);
    }

    const startIndex = parseInt(offset.toString());
    const limitNum = parseInt(limit.toString());
    const paginatedLinks = filteredLinks.slice(startIndex, startIndex + limitNum);

    const result = {
      links: paginatedLinks,
      totalRecords: filteredLinks.length,
      pagination: {
        limit: limitNum,
        offset: startIndex,
        hasMore: startIndex + limitNum < filteredLinks.length
      },
      filters: { coupon_id, coupon_type, is_used }
    };

    setCachedData(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Coupon links error:', error);
    res.status(500).json({ error: 'Failed to fetch coupon links' });
  }
});

// FIXED Product feedback endpoint
router.get('/product-feedback', async (req: AuthRequest, res) => {
  try {
    const { limit = 50 } = req.query;
    const cacheKey = `product_feedback_${limit}`;
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    console.log('Fetching product feedback...');

    const productFeedback = await fetchProductFeedback().catch(() => []);
    const feedbackArray = Array.isArray(productFeedback) ? productFeedback : [];
    
    const filteredFeedback = feedbackArray
      .filter((feedback: any) => feedback?.user_id && isRealUser(feedback.user_id))
      .slice(0, parseInt(limit.toString()));

    const formattedFeedback = filteredFeedback.map((feedback: any) => ({
      id: feedback._id,
      productName: feedback.product_name,
      rating: feedback.rating,
      timestamp: feedback.timestamp,
      userId: req.user?.role === 'admin' 
        ? maskPhoneNumber(feedback.user_id) 
        : 'XXXXXXXXXX'
    }));

    setCachedData(cacheKey, formattedFeedback);
    res.json(formattedFeedback);
  } catch (error) {
    console.error('Product feedback error:', error);
    res.status(500).json({ error: 'Failed to fetch product feedback' });
  }
});

// FIXED User flows endpoint
router.get('/user-flows', async (req: AuthRequest, res) => {
  try {
    const { limit = 100 } = req.query;
    const cacheKey = `user_flows_${limit}`;
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    console.log('Generating user flows...');

    const productRecords = await fetchProductRecords().catch(() => []);
    const productArray = Array.isArray(productRecords) ? productRecords : [];

    const flows: any[] = [];
    const limitNum = parseInt(limit.toString());

    const realProductRecords = productArray
      .filter((record: any) => record?.user_id && isRealUser(record.user_id))
      .slice(0, limitNum);

    realProductRecords.forEach((record: any, index: number) => {
      flows.push({
        id: `product_${record._id || index}`,
        userId: req.user?.role === 'admin' 
          ? maskPhoneNumber(record.user_id || '') 
          : 'XXXXXXXXXX',
        timestamp: record.timestamp,
        source: record.search_source || 'Unknown',
        destination: 'Product Search',
        action: record.search_source?.toLowerCase().includes('error') ? 'error' : 'view',
        productName: record.product_name,
        productBrand: record.product_brand,
        sessionId: `session_${record._id || index}`,
        // Add missing required fields for UserFlow type
        userAgent: 'Unknown',
        ipAddress: 'Hidden'
      });
    });

    flows.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setCachedData(cacheKey, flows);
    res.json(flows);
  } catch (error) {
    console.error('User flows error:', error);
    res.status(500).json({ error: 'Failed to fetch user flows' });
  }
});

// QR Scan endpoint
router.get('/qr-scans/:id?', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `qr_scans_${id || 'default'}`;
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    console.log(`Fetching QR scan count for ID: ${id || 'default'}`);

    const qrData = await fetchQRScanCount().catch(() => ({ qr_scan_count: 0 }));
    
    const result = {
      qrId: id || 'default',
      scanCount: qrData?.qr_scan_count || 0,
      timestamp: new Date().toISOString(),
      status: 'success'
    };

    cache.set(cacheKey, { data: result, timestamp: Date.now() - (CACHE_DURATION - 60000) });
    
    res.json(result);
  } catch (error) {
    console.error('QR scan error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch QR scan count',
      qrId: req.params.id || 'default',
      scanCount: 0,
      timestamp: new Date().toISOString(),
      status: 'error'
    });
  }
});

// Export endpoint - Removed hero-deals
router.get('/export/:type', async (req: AuthRequest, res) => {
  const { type } = req.params;
  const { format = 'json' } = req.query;

  try {
    let data: any[] = [];
    let filename = '';

    switch (type) {
      case 'products':
        data = await fetchProductRecords().catch(() => []);
        filename = `product_records_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'coupons':
        data = await generateOptimizedCouponAnalytics().catch(() => []);
        filename = `coupon_analytics_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'coupon-links':
        data = await fetchCouponLinks().catch(() => []);
        filename = `coupon_links_${new Date().toISOString().split('T')[0]}`;
        break;
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    if (format === 'csv') {
      const csv = convertToCSV(Array.isArray(data) ? data : []);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      res.json(Array.isArray(data) ? data : []);
    }
  } catch (error) {
    console.error(`Export ${type} error:`, error);
    res.status(500).json({ error: `Failed to export ${type}` });
  }
});

// Cache management endpoint
router.post('/cache/clear', async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { keys } = req.body;
    
    if (keys && Array.isArray(keys)) {
      keys.forEach(key => cache.delete(key));
      res.json({ message: `Cleared ${keys.length} cache entries`, clearedKeys: keys });
    } else {
      const cacheSize = cache.size;
      cache.clear();
      res.json({ message: `Cleared all ${cacheSize} cache entries` });
    }
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Utility function to convert data to CSV
function convertToCSV(data: any[]): string {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
        return value;
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
}

export default router;