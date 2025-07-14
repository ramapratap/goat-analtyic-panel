// src/hooks/useAnalytics.ts - Fixed Version
import { useState, useEffect } from 'react';
import { FilterOptions, DashboardStats, UserFlow, ProductAnalytics, CouponAnalytics, ProductFeedback } from '../types';

interface LoadingStates {
  dashboard: boolean;
  userFlows: boolean;
  productAnalytics: boolean;
  couponAnalytics: boolean;
  productFeedback: boolean;
}

interface UseAnalyticsReturn {
  stats: DashboardStats | null;
  userFlows: UserFlow[];
  productAnalytics: ProductAnalytics[];
  couponAnalytics: CouponAnalytics[];
  productFeedback: ProductFeedback[];
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
  const [couponAnalytics, setCouponAnalytics] = useState<CouponAnalytics[]>([]);
  const [productFeedback, setProductFeedback] = useState<ProductFeedback[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isStatsLoaded, setIsStatsLoaded] = useState(false);
  
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    dashboard: false,
    userFlows: false,
    productAnalytics: false,
    couponAnalytics: false,
    productFeedback: false,
  });

  const updateLoadingState = (key: keyof LoadingStates, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  };

  const fetchWithErrorHandling = async <T>(
    url: string,
    loadingKey: keyof LoadingStates,
    fallbackValue: T
  ): Promise<T> => {
    updateLoadingState(loadingKey, true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error: any) {
      console.error(`Error fetching ${loadingKey}:`, error);
      setError(error.message || `Failed to fetch ${loadingKey}`);
      return fallbackValue;
    } finally {
      updateLoadingState(loadingKey, false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const data = await fetchWithErrorHandling<DashboardStats>(
        '/api/analytics/dashboard',
        'dashboard',
        {
          totalUsers: 0,
          uniqueUsers: 0,
          totalSessions: 0,
          totalErrors: 0,
          conversionRate: '0',
          qrScanCount: 0,
          totalCoupons: 0,
          totalCouponsUsed: 0,
          totalSavings: 0,
          avgSavingsPerCoupon: 0,
          couponUsageRate: '0',
          lastUpdated: new Date().toISOString(),
          dataSource: 'cache',
          avgSessionDuration: "0:00",
          qrScans: 0,
          topProducts: [],
          topCoupons: []
        }
      );
      setStats(data);
      setIsStatsLoaded(true);
    } catch (error: any) {
      console.error('Dashboard stats error:', error);
      setError(error.message);
    }
  };

  const fetchUserFlows = async () => {
    try {
      const data = await fetchWithErrorHandling<UserFlow[]>(
        '/api/analytics/user-flows?limit=100',
        'userFlows',
        []
      );
      setUserFlows(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('User flows error:', error);
      setUserFlows([]);
    }
  };

  const fetchProductAnalytics = async () => {
    try {
      const data = await fetchWithErrorHandling<{ records: ProductAnalytics[] }>(
        '/api/analytics/products?limit=100',
        'productAnalytics',
        { records: [] }
      );
      setProductAnalytics(data.records || []);
    } catch (error: any) {
      console.error('Product analytics error:', error);
      setProductAnalytics([]);
    }
  };

  const fetchCouponAnalytics = async () => {
    try {
      const data = await fetchWithErrorHandling<{ analytics: CouponAnalytics[] }>(
        '/api/analytics/coupons?limit=50',
        'couponAnalytics',
        { analytics: [] }
      );
      setCouponAnalytics(data.analytics || []);
    } catch (error: any) {
      console.error('Coupon analytics error:', error);
      setCouponAnalytics([]);
    }
  };

  const fetchProductFeedback = async () => {
    try {
      const data = await fetchWithErrorHandling<ProductFeedback[]>(
        '/api/analytics/product-feedback?limit=50',
        'productFeedback',
        []
      );
      setProductFeedback(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Product feedback error:', error);
      setProductFeedback([]);
    }
  };

  const exportData = async (type: string, format: string = 'json') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/analytics/export/${type}?format=${format}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.${format}`;
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
    await Promise.all([
      fetchDashboardStats(),
      fetchUserFlows(),
      fetchProductAnalytics(),
      fetchCouponAnalytics(),
      fetchProductFeedback(),
    ]);
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
    couponAnalytics,
    productFeedback,
    loadingStates,
    isStatsLoaded,
    error,
    exportData,
    refreshData,
  };
};