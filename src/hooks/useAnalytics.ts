// src/hooks/useAnalytics.ts - Updated for actual API integration
import { useState, useEffect } from 'react';
import { FilterOptions, DashboardStats, UserFlow, ProductAnalytics } from '../types';
import { fetchQRScanData, fetchProductRecords, parseSearchSource, getFlipkartPrice, isRealUser, maskPhoneNumber, categorizeProduct } from '../services/externalApi';

interface LoadingStates {
  dashboard: boolean;
  userFlows: boolean;
  productAnalytics: boolean;
}

interface UseAnalyticsReturn {
  stats: DashboardStats | null;
  userFlows: UserFlow[];
  productAnalytics: ProductAnalytics[];
  loadingStates: LoadingStates;
  isStatsLoaded: boolean;
  error: string | null;
  exportData: (type: string, format?: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

export const useAnalytics = (filters: FilterOptions): UseAnalyticsReturn => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userFlows, setUserFlows] = useState<UserFlow[]>([]);
  const [productAnalytics, setProductAnalytics] = useState<ProductAnalytics[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isStatsLoaded, setIsStatsLoaded] = useState(false);
  
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    dashboard: false,
    userFlows: false,
    productAnalytics: false,
  });

  const updateLoadingState = (key: keyof LoadingStates, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  };

  const fetchDashboardStats = async () => {
    updateLoadingState('dashboard', true);
    try {
      console.log('Fetching dashboard stats...');
      
      const [qrData, productRecords] = await Promise.all([
        fetchQRScanData(),
        fetchProductRecords()
      ]);

      // Filter real users
      const realProductRecords = productRecords.filter(record => 
        record.user_id && isRealUser(record.user_id)
      );

      const uniqueUsers = new Set(realProductRecords.map(r => r.user_id)).size;
      const totalSessions = realProductRecords.length;
      
      // Calculate success/error rates based on search_source
      const successfulSessions = realProductRecords.filter(record => {
        const sourceInfo = parseSearchSource(record.search_source);
        return sourceInfo.status === 'Success';
      }).length;
      
      const errorSessions = totalSessions - successfulSessions;
      
      // Calculate coupon usage
      const couponsUsed = realProductRecords.filter(record => 
        record.coupon_code && record.coupon_code !== null
      ).length;
      
      // Calculate exclusive deals
      const exclusiveDeals = realProductRecords.filter(record => 
        record.exclusive && record.exclusive !== null
      ).length;

      // Calculate total savings from search_source
      let totalSavings = 0;
      realProductRecords.forEach(record => {
        const sourceInfo = parseSearchSource(record.search_source);
        if (sourceInfo.savings) {
          const savingsMatch = sourceInfo.savings.match(/₹([\d,]+)/);
          if (savingsMatch) {
            totalSavings += parseInt(savingsMatch[1].replace(/,/g, ''));
          }
        }
      });

      const conversionRate = totalSessions > 0 ? ((successfulSessions / totalSessions) * 100).toFixed(2) : '0';
      const avgSavingsPerSession = totalSessions > 0 ? Math.round(totalSavings / totalSessions) : 0;

      const dashboardStats: DashboardStats = {
        totalUsers: uniqueUsers,
        uniqueUsers: uniqueUsers,
        totalSessions,
        totalErrors: errorSessions,
        conversionRate,
        qrScanCount: qrData.data?.qrData?.qr_scan_count || 0,
        totalCoupons: couponsUsed + exclusiveDeals,
        totalCouponsUsed: couponsUsed,
        totalSavings,
        avgSavingsPerCoupon: couponsUsed > 0 ? Math.round(totalSavings / couponsUsed) : 0,
        couponUsageRate: ((couponsUsed / (couponsUsed + exclusiveDeals || 1)) * 100).toFixed(2),
        lastUpdated: new Date().toISOString(),
        dataSource: 'live',
        avgSessionDuration: '2:30',
        qrScans: qrData.data?.qrData?.qr_scan_count || 0,
        topProducts: realProductRecords.slice(0, 5).map(record => ({
          id: record._id,
          productName: record.product_name,
          category: categorizeProduct(record.Category, record.product_name),
          brand: parseSearchSource(record.search_source).flipkartName || 'Unknown',
          price: getFlipkartPrice(record.flipkart_price).replace(/[₹,]/g, '') || 0,
          count: 1
        })),
        topCoupons: []
      };

      setStats(dashboardStats);
      setIsStatsLoaded(true);
      console.log('Dashboard stats loaded successfully');
    } catch (error: any) {
      console.error('Dashboard stats error:', error);
      setError(error.message);
    } finally {
      updateLoadingState('dashboard', false);
    }
  };

  const fetchUserFlows = async () => {
    updateLoadingState('userFlows', true);
    try {
      console.log('Fetching user flows...');
      
      const productRecords = await fetchProductRecords();
      const realProductRecords = productRecords.filter(record => 
        record.user_id && isRealUser(record.user_id)
      );

      const flows: UserFlow[] = realProductRecords.map((record, index) => {
        const sourceInfo = parseSearchSource(record.search_source);
        
        return {
          id: record._id,
          userId: maskPhoneNumber(record.user_id),
          timestamp: record.timestamp,
          source: sourceInfo.inputType || 'Unknown',
          destination: sourceInfo.platform || 'Product Search',
          action: sourceInfo.status === 'Success' ? 'success' : 'error',
          productName: record.product_name,
          productBrand: sourceInfo.flipkartName || 'Unknown',
          sessionId: `session_${record._id}`,
          userAgent: record.device_info || 'Unknown',
          ipAddress: 'Hidden'
        };
      });

      flows.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setUserFlows(flows.slice(0, 100)); // Limit to 100 for performance
      console.log(`User flows loaded: ${flows.length} records`);
    } catch (error: any) {
      console.error('User flows error:', error);
      setUserFlows([]);
    } finally {
      updateLoadingState('userFlows', false);
    }
  };

  const fetchProductAnalyticsData = async () => {
    updateLoadingState('productAnalytics', true);
    try {
      console.log('Fetching product analytics...');
      
      const productRecords = await fetchProductRecords();
      const realProductRecords = productRecords.filter(record => 
        record.user_id && isRealUser(record.user_id)
      );

      const analytics: ProductAnalytics[] = realProductRecords.map(record => {
        const sourceInfo = parseSearchSource(record.search_source);
        const flipkartPrice = getFlipkartPrice(record.flipkart_price);
        const priceValue = flipkartPrice.replace(/[₹,]/g, '') || '0';
        
        return {
          _id: record._id,
          user_id: maskPhoneNumber(record.user_id),
          productName: record.product_name,
          productBrand: sourceInfo.flipkartName || sourceInfo.amazonName || 'Unknown',
          productCategory: categorizeProduct(record.Category, record.product_name),
          productPrice: parseInt(priceValue) || 0,
          searchSource: sourceInfo.inputType || 'Unknown',
          timestamp: record.timestamp,
          successCount: sourceInfo.status === 'Success' ? 1 : 0,
          errorCount: sourceInfo.status === 'Success' ? 0 : 1,
          platform: sourceInfo.platform || 'Unknown',
          savings: sourceInfo.savings || '₹0',
          category: record.Category || 'Unknown',
          exclusive: record.exclusive,
          couponCode: record.coupon_code,
          deviceInfo: record.device_info
        };
      });

      setProductAnalytics(analytics);
      console.log(`Product analytics loaded: ${analytics.length} records`);
    } catch (error: any) {
      console.error('Product analytics error:', error);
      setProductAnalytics([]);
    } finally {
      updateLoadingState('productAnalytics', false);
    }
  };

  const exportData = async (type: string, format: string = 'json') => {
    try {
      let data: any[] = [];
      let filename = '';

      switch (type) {
        case 'products':
          data = productAnalytics;
          filename = `product_analytics_${new Date().toISOString().split('T')[0]}`;
          break;
        case 'user-flows':
          data = userFlows;
          filename = `user_flows_${new Date().toISOString().split('T')[0]}`;
          break;
        default:
          throw new Error('Invalid export type');
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${filename}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Export error:', error);
      setError(`Export failed: ${error.message}`);
    }
  };

  const refreshData = async () => {
    setError(null);
    
    // Load dashboard stats first (highest priority)
    await fetchDashboardStats();
    
    // Then load other data with small delays for better UX
    setTimeout(() => fetchUserFlows(), 100);
    setTimeout(() => fetchProductAnalyticsData(), 200);
  };

  useEffect(() => {
    refreshData();
  }, [filters]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!Object.values(loadingStates).some(loading => loading)) {
        refreshData();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadingStates]);

  return {
    stats,
    userFlows,
    productAnalytics,
    loadingStates,
    isStatsLoaded,
    error,
    exportData,
    refreshData,
  };
};