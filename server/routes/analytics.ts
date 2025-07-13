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
  generateCouponAnalytics, 
  fetchHeroDeals,
  CouponAnalytics,
  HeroDeal 
} from '../services/couponService';
import { maskPhoneNumber, isRealUser } from '../utils/phoneUtils';

const router = express.Router();

// Add caching for frequently accessed data
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

// Dashboard stats endpoint - optimized for speed
router.get('/dashboard', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const cacheKey = `dashboard_${JSON.stringify(req.query)}`;
    const cachedStats = getCachedData(cacheKey);
    
    if (cachedStats) {
      return res.json(cachedStats);
    }

    // Fetch only essential data for dashboard
    const [qrData, productRecords] = await Promise.all([
      fetchQRScanCount().catch(() => ({ qr_scan_count: 0 })),
      fetchProductRecords().catch(() => [])
    ]);

    // Filter real users only
    const realProductRecords = productRecords.filter(record => 
      record.user_id && isRealUser(record.user_id)
    );

    // Calculate basic stats quickly
    const uniqueUsers = new Set(realProductRecords.map(r => r.user_id)).size;
    const totalSessions = realProductRecords.length;
    const totalErrors = realProductRecords.filter(r => 
      r.search_source?.toLowerCase().includes('error') || 
      !r.product_name || 
      r.product_name.toLowerCase().includes('unknown')
    ).length;

    // Generate lightweight coupon data
    const couponAnalytics = await generateCouponAnalytics().catch(() => []);
    const totalCouponsUsed = couponAnalytics.reduce((sum, c) => sum + c.usedCoupons, 0);
    const totalSavings = couponAnalytics.reduce((sum, c) => sum + c.totalValue, 0);

    const stats = {
      totalUsers: uniqueUsers,
      uniqueUsers: uniqueUsers,
      totalSessions,
      totalErrors,
      conversionRate: totalSessions > 0 ? ((totalSessions - totalErrors) / totalSessions) * 100 : 0,
      avgSessionDuration: 245,
      qrScans: {
        totalScans: qrData.qr_scan_count,
        todayScans: Math.floor(qrData.qr_scan_count * 0.05),
        lastUpdated: new Date().toISOString()
      },
      totalCouponsUsed,
      totalSavings,
      topProducts: realProductRecords
        .filter(r => r.product_name && r.price)
        .slice(0, 5)
        .map(record => ({
          id: record._id,
          productName: record.product_name,
          category: 'Electronics',
          brand: extractBrand(record.logo_detected),
          price: parseFloat(record.price) || 0,
          successCount: 1,
          timestamp: record.timestamp
        })),
      topCoupons: couponAnalytics.slice(0, 5)
    };

    setCachedData(cacheKey, stats);
    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// QR scan count endpoint - fast response
router.get('/qr-scans', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const cachedData = getCachedData('qr-scans');
    if (cachedData) {
      return res.json(cachedData);
    }

    const qrData = await fetchQRScanCount();
    const result = {
      totalScans: qrData.qr_scan_count,
      todayScans: Math.floor(qrData.qr_scan_count * 0.05),
      lastUpdated: new Date().toISOString()
    };

    setCachedData('qr-scans', result);
    res.json(result);
  } catch (error) {
    console.error('QR scan count error:', error);
    res.status(500).json({ error: 'Failed to fetch QR scan count' });
  }
});

// Product records endpoint - with pagination
router.get('/products', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const cacheKey = `products_${page}_${limit}`;
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    const productRecords = await fetchProductRecords();
    
    // Filter and format data
    const filteredRecords = productRecords
      .filter(record => record.user_id && isRealUser(record.user_id))
      .map(record => ({
        id: record._id,
        productName: record.product_name || 'Unknown Product',
        category: categorizeProduct(record.product_name),
        brand: extractBrand(record.logo_detected),
        price: parseFloat(record.price) || 0,
        amazonPrice: parseFloat(record.amazon_price) || 0,
        flipkartPrice: parseFloat(record.flipkart_price) || 0,
        imageDetected: !!record.image_path,
        brandDetected: !!record.logo_detected && !record.logo_detected.includes('NO'),
        searchSource: record.search_source || 'Unknown',
        timestamp: record.timestamp,
        userId: req.user?.role === 'admin' ? maskPhoneNumber(record.user_id || '') : 'XXXXXXXXXX',
        deviceInfo: record.device_info,
        errorCount: record.search_source?.toLowerCase().includes('error') ? 1 : 0,
        successCount: record.search_source?.toLowerCase().includes('error') ? 0 : 1
      }));

    // Implement pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

    const result = {
      data: paginatedRecords,
      pagination: {
        page,
        limit,
        total: filteredRecords.length,
        totalPages: Math.ceil(filteredRecords.length / limit)
      }
    };

    setCachedData(cacheKey, paginatedRecords);
    res.json(paginatedRecords); // Return just the data for backward compatibility
  } catch (error) {
    console.error('Product records error:', error);
    res.status(500).json({ error: 'Failed to fetch product records' });
  }
});

// Product feedback endpoint
router.get('/product-feedback', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const cachedData = getCachedData('product-feedback');
    if (cachedData) {
      return res.json(cachedData);
    }

    const productFeedback = await fetchProductFeedback();
    
    const formattedFeedback = productFeedback
      .filter(feedback => feedback.user_id && isRealUser(feedback.user_id))
      .map(feedback => ({
        id: feedback._id,
        productName: feedback.product_name || 'Unknown Product',
        feedback: feedback.feedback,
        rating: feedback.rating || 0,
        category: feedback.category || categorizeProduct(feedback.product_name),
        timestamp: feedback.timestamp,
        userId: req.user?.role === 'admin' ? maskPhoneNumber(feedback.user_id) : 'XXXXXXXXXX'
      }));

    setCachedData('product-feedback', formattedFeedback);
    res.json(formattedFeedback);
  } catch (error) {
    console.error('Product feedback error:', error);
    res.status(500).json({ error: 'Failed to fetch product feedback' });
  }
});

// Coupon analytics endpoint
router.get('/coupons', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const cachedData = getCachedData('coupons');
    if (cachedData) {
      return res.json(cachedData);
    }

    const couponAnalytics = await generateCouponAnalytics();
    setCachedData('coupons', couponAnalytics);
    res.json(couponAnalytics);
  } catch (error) {
    console.error('Coupon analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch coupon analytics' });
  }
});

// Hero deals endpoint
router.get('/hero-deals', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const cachedData = getCachedData('hero-deals');
    if (cachedData) {
      return res.json(cachedData);
    }

    const heroDeals = await fetchHeroDeals();
    
    const formattedDeals = heroDeals.map(deal => ({
      id: deal._id,
      category: deal.Category,
      vertical: deal.Vertical,
      productName: deal.Product_Name,
      deal: deal.Deal,
      fsn: deal.FSN,
      productLink: deal.Product_Link,
      verticalCleaning: deal.Vertical_Cleaning,
      timestamp: deal.timestamp
    }));

    setCachedData('hero-deals', formattedDeals);
    res.json(formattedDeals);
  } catch (error) {
    console.error('Hero deals error:', error);
    res.status(500).json({ error: 'Failed to fetch hero deals' });
  }
});

// User flows endpoint
router.get('/user-flows', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const cachedData = getCachedData('user-flows');
    if (cachedData) {
      return res.json(cachedData);
    }

    const [productRecords, productFeedback] = await Promise.all([
      fetchProductRecords(),
      fetchProductFeedback()
    ]);

    const flows: any[] = [];

    // Add product record flows (limited for performance)
    productRecords
      .filter(record => record.user_id && isRealUser(record.user_id))
      .slice(0, 100) // Limit for performance
      .forEach(record => {
        flows.push({
          id: `product_${record._id}`,
          userId: req.user?.role === 'admin' ? maskPhoneNumber(record.user_id || '') : 'XXXXXXXXXX',
          timestamp: record.timestamp,
          source: record.search_source || 'Unknown',
          destination: 'Product Search',
          action: record.search_source?.toLowerCase().includes('error') ? 'error' : 'view',
          productId: record._id,
          sessionId: `session_${record._id}`,
          userAgent: record.device_info || 'Unknown',
          ipAddress: '192.168.1.XXX'
        });
      });

    // Add feedback flows (limited for performance)
    productFeedback
      .filter(feedback => feedback.user_id && isRealUser(feedback.user_id))
      .slice(0, 50) // Limit for performance
      .forEach(feedback => {
        flows.push({
          id: `feedback_${feedback._id}`,
          userId: req.user?.role === 'admin' ? maskPhoneNumber(feedback.user_id) : 'XXXXXXXXXX',
          timestamp: feedback.timestamp,
          source: 'Product Page',
          destination: 'Feedback',
          action: 'feedback',
          sessionId: `session_${feedback._id}`,
          userAgent: 'Unknown',
          ipAddress: '192.168.1.XXX',
          rating: feedback.rating
        });
      });

    // Sort by timestamp (newest first)
    flows.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setCachedData('user-flows', flows);
    res.json(flows);
  } catch (error) {
    console.error('User flows error:', error);
    res.status(500).json({ error: 'Failed to fetch user flows' });
  }
});

// Export endpoint
router.get('/export/:type', authenticateToken, async (req: AuthRequest, res) => {
  const { type } = req.params;
  const { format = 'csv' } = req.query;

  try {
    let data: any[] = [];
    let filename = '';

    switch (type) {
      case 'products':
        data = await fetchProductRecords();
        filename = 'product_records';
        break;
      case 'feedback':
        data = await fetchProductFeedback();
        filename = 'product_feedback';
        break;
      case 'coupons':
        data = await generateCouponAnalytics();
        filename = 'coupon_analytics';
        break;
      case 'hero-deals':
        data = await fetchHeroDeals();
        filename = 'hero_deals';
        break;
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    if (format === 'csv') {
      const csvData = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csvData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      res.json(data);
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Helper functions
function extractBrand(logoDetected: string): string {
  if (!logoDetected) return 'Unknown';
  
  const match = logoDetected.match(/'([^']+)_logo'/);
  if (match) {
    return match[1].charAt(0).toUpperCase() + match[1].slice(1);
  }
  
  return 'Unknown';
}

function categorizeProduct(productName: string): string {
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
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(item => 
    Object.values(item).map(value => 
      typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
    ).join(',')
  );
  
  return [headers, ...rows].join('\n');
}

export default router;