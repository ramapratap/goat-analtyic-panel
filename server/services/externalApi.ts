// server/services/externalApi.ts - OPTIMIZED VERSION
import fetch from 'node-fetch';

export interface ProductRecord {
  _id: string;
  user_id: string;
  product_name: string;
  product_price: number;
  product_brand: string;
  product_category: string;
  search_source: string;
  timestamp: string;
  device_info: string;
}

export interface ProductFeedback {
  _id: string;
  user_id: string;
  product_name: string;
  rating: number;
  comment: string;
  timestamp: string;
}

export interface QRScanData {
  qr_scan_count: number;
  error?: string;
  timestamp?: string;
}

// Enhanced caching with TTL and memory management
const apiCache = new Map();
const PRODUCT_CACHE_DURATION = 3 * 60 * 1000; // 3 minutes for product data
const QR_CACHE_DURATION = 60 * 1000; // 1 minute for QR data
const MAX_CACHE_SIZE = 50;

const getCachedApiData = (key: string, ttl: number) => {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  apiCache.delete(key);
  return null;
};

const setCachedApiData = (key: string, data: any) => {
  // Implement cache size limit
  if (apiCache.size >= MAX_CACHE_SIZE) {
    const firstKey = apiCache.keys().next().value;
    apiCache.delete(firstKey);
  }
  apiCache.set(key, { data, timestamp: Date.now() });
};

// Enhanced fetch with timeout and retry logic
const fetchWithTimeout = async (url: string, options: any = {}, timeout: number = 10000, retries: number = 2): Promise<any> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Flipkart-Analytics-Dashboard/1.0',
        'Accept': 'application/json',
        ...options.headers
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (retries > 0 && !controller.signal.aborted) {
      console.log(`Retrying request to ${url}. Retries left: ${retries - 1}`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      return fetchWithTimeout(url, options, timeout, retries - 1);
    }
    
    throw error;
  }
};

// OPTIMIZED: Fetch product records from external API
export const fetchProductRecords = async (): Promise<ProductRecord[]> => {
  const cacheKey = 'product_records';
  const cached = getCachedApiData(cacheKey, PRODUCT_CACHE_DURATION);
  if (cached) {
    console.log('Returning cached product records');
    return cached;
  }

  try {
    console.log('Fetching product records from external API...');
    console.time('Product API Call');
    
    const data = await fetchWithTimeout(
      'https://goatapi.web-dimension.com/api/v1/get-records',
      {
        method: 'GET'
      },
      15000, // 15 second timeout
      3 // 3 retries
    );

    console.timeEnd('Product API Call');
    
    if (!Array.isArray(data)) {
      console.error('Invalid product data format received:', typeof data);
      return [];
    }

    // Validate and clean data
    const validatedRecords = data
      .filter(record => record && typeof record === 'object')
      .map(record => ({
        _id: record._id || record.id || Math.random().toString(36),
        user_id: record.user_id || '',
        product_name: record.product_name || 'Unknown Product',
        product_price: parseFloat(record.product_price) || 0,
        product_brand: record.product_brand || 'Unknown Brand',
        product_category: record.product_category || 'Unknown Category',
        search_source: record.search_source || 'Unknown Source',
        timestamp: record.timestamp || new Date().toISOString(),
        device_info: record.device_info || 'Unknown Device'
      }))
      .slice(0, 5000); // Limit to prevent memory issues

    console.log(`Successfully fetched and validated ${validatedRecords.length} product records`);
    setCachedApiData(cacheKey, validatedRecords);
    return validatedRecords;
  } catch (error) {
    console.error('Error fetching product records:', error);
    
    // Return cached data if available, even if expired
    const expiredCache = apiCache.get(cacheKey);
    if (expiredCache) {
      console.log('Returning expired cached product records due to API error');
      return expiredCache.data;
    }
    
    return [];
  }
};

// OPTIMIZED: Fetch QR scan count from external API
export const fetchQRScanCount = async (qrId: string = 'default'): Promise<QRScanData> => {
  const cacheKey = `qr_scan_${qrId}`;
  const cached = getCachedApiData(cacheKey, QR_CACHE_DURATION);
  if (cached) {
    console.log(`Returning cached QR scan count for ${qrId}`);
    return cached;
  }

  try {
    console.log(`Fetching QR scan count for ID: ${qrId}`);
    console.time('QR API Call');
    
    // Updated endpoint to use fetchqrcodebyid as per your requirement
    const data = await fetchWithTimeout(
      'https://s-qc.in/fetchQrById/686b71212597a48fc4b9bc95',
      {
        method: 'GET'
      },
      5000, // 5 second timeout for QR API
      2 // 2 retries
    );

    console.timeEnd('QR API Call');

    // Validate QR data
    const qrData: QRScanData = {
      qr_scan_count: parseInt(data.qr_scan_count) || parseInt(data.scan_count) || parseInt(data.count) || 0,
      timestamp: new Date().toISOString()
    };

    if (qrData.qr_scan_count < 0) {
      qrData.qr_scan_count = 0;
    }

    console.log(`QR scan count for ${qrId}: ${qrData.qr_scan_count}`);
    setCachedApiData(cacheKey, qrData);
    return qrData;
  } catch (error:any) {
    console.error(`Error fetching QR scan count for ${qrId}:`, error);
    
    // Return cached data if available, even if expired
    const expiredCache = apiCache.get(cacheKey);
    if (expiredCache) {
      console.log(`Returning expired cached QR data for ${qrId} due to API error`);
      return { ...expiredCache.data, error: error.message };
    }
    
    return {
      qr_scan_count: 0,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// OPTIMIZED: Fetch product feedback (if you have this endpoint)
export const fetchProductFeedback = async (): Promise<ProductFeedback[]> => {
  const cacheKey = 'product_feedback';
  const cached = getCachedApiData(cacheKey, PRODUCT_CACHE_DURATION);
  if (cached) {
    console.log('Returning cached product feedback');
    return cached;
  }

  try {
    console.log('Fetching product feedback...');
    
    // This would be your product feedback endpoint if available
    // For now, returning empty array as this might not exist in your external APIs
    console.log('Product feedback endpoint not configured - returning empty array');
    
    const feedbackData: ProductFeedback[] = [];
    setCachedApiData(cacheKey, feedbackData);
    return feedbackData;
  } catch (error) {
    console.error('Error fetching product feedback:', error);
    return [];
  }
};

// OPTIMIZED: Batch fetch multiple QR codes
export const fetchMultipleQRScans = async (qrIds: string[]): Promise<Record<string, QRScanData>> => {
  const cacheKey = `multiple_qr_${qrIds.sort().join('_')}`;
  const cached = getCachedApiData(cacheKey, QR_CACHE_DURATION);
  if (cached) {
    console.log('Returning cached multiple QR scan data');
    return cached;
  }

  try {
    console.log(`Fetching QR scan counts for ${qrIds.length} QR codes`);
    
    // Fetch all QR codes in parallel with concurrency limit
    const batchSize = 5; // Limit concurrent requests
    const results: Record<string, QRScanData> = {};
    
    for (let i = 0; i < qrIds.length; i += batchSize) {
      const batch = qrIds.slice(i, i + batchSize);
      const batchPromises = batch.map(async (qrId) => {
        try {
          const data = await fetchQRScanCount(qrId);
          return { qrId, data };
        } catch (error:any) {
          console.error(`Error fetching QR ${qrId}:`, error);
          return { 
            qrId, 
            data: { 
              qr_scan_count: 0, 
              error: error.message, 
              timestamp: new Date().toISOString() 
            } 
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ qrId, data }) => {
        results[qrId] = data;
      });
      
      // Small delay between batches to avoid overwhelming the API
      if (i + batchSize < qrIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    setCachedApiData(cacheKey, results);
    return results;
  } catch (error) {
    console.error('Error fetching multiple QR scans:', error);
    return {};
  }
};

// OPTIMIZED: Get API health status
export const getExternalApiHealth = async (): Promise<{
  productAPI: { status: string; responseTime?: number; error?: string };
  qrAPI: { status: string; responseTime?: number; error?: string };
}> => {
  const results = {
    productAPI: { status: 'unknown' as string, responseTime: undefined as number | undefined, error: undefined as string | undefined },
    qrAPI: { status: 'unknown' as string, responseTime: undefined as number | undefined, error: undefined as string | undefined }
  };

  // Test Product API
  try {
    const startTime = Date.now();
    await fetchWithTimeout(
      'https://goatapi.web-dimension.com/api/v1/get-records',
      { method: 'HEAD' },
      5000,
      1
    );
    results.productAPI = {
      status: 'healthy',
      responseTime: Date.now() - startTime,
      error: undefined
    };
  } catch (error:any) {
    results.productAPI = {
      status: 'unhealthy',
      error: error.message,
      responseTime: undefined
    };
  }

  // Test QR API
  try {
    const startTime = Date.now();
    await fetchWithTimeout(
      'https://s-qc.in/fetchqrcodebyid/test',
      { method: 'GET' },
      5000,
      1
    );
    results.qrAPI = {
      status: 'healthy',
      responseTime: Date.now() - startTime,
      error: undefined
    };
  } catch (error:any) {
    results.qrAPI = {
      status: 'unhealthy',
      error: error.message,
      responseTime: undefined
    };
  }

  return results;
};

// OPTIMIZED: Clear external API cache
export const clearExternalApiCache = (): void => {
  apiCache.clear();
  console.log('External API cache cleared');
};

// OPTIMIZED: Get cache statistics
export const getApiCacheStats = () => {
  const stats = {
    cacheSize: apiCache.size,
    cacheKeys: Array.from(apiCache.keys()),
    cacheEntries: Array.from(apiCache.entries()).map(([key, value]) => ({
      key,
      age: Date.now() - value.timestamp,
      size: JSON.stringify(value.data).length
    }))
  };

  return stats;
};

// OPTIMIZED: Prefetch data for better performance
export const prefetchCriticalData = async (): Promise<void> => {
  try {
    console.log('Prefetching critical data...');
    
    // Prefetch product records and default QR scan in parallel
    await Promise.allSettled([
      fetchProductRecords(),
      fetchQRScanCount('default')
    ]);
    
    console.log('Critical data prefetched successfully');
  } catch (error) {
    console.error('Error prefetching critical data:', error);
  }
};

// Utility functions for data validation and cleaning
export const isRealUser = (userId: string): boolean => {
  if (!userId || typeof userId !== 'string') return false;
  
  // Filter out test users, bots, and invalid IDs
  const invalidPatterns = [
    /^test/i,
    /^bot/i,
    /^admin/i,
    /^demo/i,
    /^null$/i,
    /^undefined$/i,
    /^unknown$/i,
    /^\d{1,3}$/, // Very short numeric IDs
    /^[0]+$/, // All zeros
  ];
  
  return !invalidPatterns.some(pattern => pattern.test(userId)) && userId.length > 3;
};

export const maskPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber || typeof phoneNumber !== 'string') return 'XXXXXXXXXX';
  
  if (phoneNumber.length >= 10) {
    return phoneNumber.substring(0, 2) + 'X'.repeat(phoneNumber.length - 4) + phoneNumber.slice(-2);
  }
  
  return 'X'.repeat(phoneNumber.length);
};

export const extractBrand = (productName: string): string => {
  if (!productName) return 'Unknown';
  
  // Common brand extraction patterns
  const brandPatterns = [
    /^(\w+)\s+/,  // First word
    /(\w+)\s*-/,  // Word before dash
    /(\w+)\s*\|/  // Word before pipe
  ];
  
  for (const pattern of brandPatterns) {
    const match = productName.match(pattern);
    if (match && match[1] && match[1].length > 2) {
      return match[1];
    }
  }
  
  return productName.split(' ')[0] || 'Unknown';
};

export const categorizeProduct = (productName: string): string => {
  if (!productName) return 'Unknown';
  
  const name = productName.toLowerCase();
  
  // Category mapping based on keywords
  const categories = {
    'Electronics': ['phone', 'mobile', 'laptop', 'tablet', 'computer', 'tv', 'camera', 'headphone', 'speaker', 'watch'],
    'Fashion': ['shirt', 'jeans', 'dress', 'shoes', 'bag', 'jacket', 'saree', 'kurta', 'tshirt'],
    'Home & Kitchen': ['furniture', 'kitchen', 'home', 'decor', 'appliance', 'cookware', 'bedsheet', 'curtain'],
    'Books': ['book', 'novel', 'textbook', 'magazine', 'journal'],
    'Sports': ['cricket', 'football', 'gym', 'fitness', 'sports', 'exercise', 'yoga'],
    'Beauty': ['makeup', 'cosmetic', 'skincare', 'perfume', 'beauty', 'cream', 'lotion'],
    'Toys': ['toy', 'game', 'doll', 'puzzle', 'kids', 'children'],
    'Automotive': ['car', 'bike', 'automotive', 'vehicle', 'motor']
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => name.includes(keyword))) {
      return category;
    }
  }
  
  return 'Other';
};

// Cleanup expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of apiCache.entries()) {
    const maxAge = key.includes('qr_scan') ? QR_CACHE_DURATION : PRODUCT_CACHE_DURATION;
    if (now - value.timestamp > maxAge) {
      apiCache.delete(key);
    }
  }
}, 60000); // Clean up every minute

// Export all functions and utilities
export default {
  fetchProductRecords,
  fetchQRScanCount,
  fetchProductFeedback,
  fetchMultipleQRScans,
  getExternalApiHealth,
  clearExternalApiCache,
  getApiCacheStats,
  prefetchCriticalData,
  isRealUser,
  maskPhoneNumber,
  extractBrand,
  categorizeProduct
};