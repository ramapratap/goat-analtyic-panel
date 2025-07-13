import { useState, useEffect, useCallback } from 'react';
import { DashboardStats, FilterOptions, UserFlow, ProductAnalytics, CouponAnalytics, ProductFeedback, HeroDeal } from '../types';

interface AnalyticsState {
  stats: DashboardStats | null;
  userFlows: UserFlow[];
  productAnalytics: ProductAnalytics[];
  productFeedback: ProductFeedback[];
  couponAnalytics: CouponAnalytics[];
  heroDeals: HeroDeal[];
  loading: {
    stats: boolean;
    userFlows: boolean;
    productAnalytics: boolean;
    productFeedback: boolean;
    couponAnalytics: boolean;
    heroDeals: boolean;
  };
  error: string | null;
}

export const useAnalytics = (filters: FilterOptions) => {
  const [state, setState] = useState<AnalyticsState>({
    stats: null,
    userFlows: [],
    productAnalytics: [],
    productFeedback: [],
    couponAnalytics: [],
    heroDeals: [],
    loading: {
      stats: true,
      userFlows: true,
      productAnalytics: true,
      productFeedback: true,
      couponAnalytics: true,
      heroDeals: true,
    },
    error: null,
  });

  const updateLoading = (key: keyof AnalyticsState['loading'], value: boolean) => {
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, [key]: value }
    }));
  };

  const updateData = (key: keyof Omit<AnalyticsState, 'loading' | 'error'>, data: any) => {
    setState(prev => ({
      ...prev,
      [key]: data
    }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  // Fetch dashboard stats first (highest priority)
  const fetchStats = useCallback(async () => {
    try {
      updateLoading('stats', true);
      const token = localStorage.getItem('authToken');
      const queryParams = new URLSearchParams({
        startDate: filters.dateRange.start,
        endDate: filters.dateRange.end,
        ...(filters.userSegment && { userSegment: filters.userSegment }),
        ...(filters.productCategory && { productCategory: filters.productCategory }),
        ...(filters.brand && { brand: filters.brand }),
        ...(filters.source && { source: filters.source }),
      });

      const response = await fetch(`/api/analytics/dashboard?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      
      const data = await response.json();
      updateData('stats', data);
    } catch (err) {
      console.error('Stats fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      updateLoading('stats', false);
    }
  }, [filters]);

  // Fetch other data with delays to prevent overwhelming the server
  const fetchWithDelay = useCallback(async (
    endpoint: string, 
    dataKey: keyof Omit<AnalyticsState, 'loading' | 'error'>,
    loadingKey: keyof AnalyticsState['loading'],
    delay: number = 0
  ) => {
    try {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      updateLoading(loadingKey, true);
      const token = localStorage.getItem('authToken');
      const queryParams = new URLSearchParams({
        startDate: filters.dateRange.start,
        endDate: filters.dateRange.end,
        ...(filters.userSegment && { userSegment: filters.userSegment }),
        ...(filters.productCategory && { productCategory: filters.productCategory }),
        ...(filters.brand && { brand: filters.brand }),
        ...(filters.source && { source: filters.source }),
      });

      const response = await fetch(`/api/analytics/${endpoint}?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`);
      
      const data = await response.json();
      updateData(dataKey, data);
    } catch (err) {
      console.error(`${endpoint} fetch error:`, err);
      // Don't set global error for individual data fetches
    } finally {
      updateLoading(loadingKey, false);
    }
  }, [filters]);

  const fetchAllData = useCallback(async () => {
    setError(null);
    
    // Fetch stats immediately
    await fetchStats();
    
    // Fetch other data with staggered delays
    const fetchPromises = [
      fetchWithDelay('products', 'productAnalytics', 'productAnalytics', 500),
      fetchWithDelay('user-flows', 'userFlows', 'userFlows', 1000),
      fetchWithDelay('product-feedback', 'productFeedback', 'productFeedback', 1500),
      fetchWithDelay('coupons', 'couponAnalytics', 'couponAnalytics', 2000),
      fetchWithDelay('hero-deals', 'heroDeals', 'heroDeals', 2500),
    ];

    // Don't wait for all to complete, let them load independently
    Promise.allSettled(fetchPromises);
  }, [fetchStats, fetchWithDelay]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const exportData = async (type: 'flows' | 'products' | 'feedback' | 'coupons' | 'hero-deals', format: 'csv' | 'json' = 'csv') => {
    try {
      const token = localStorage.getItem('authToken');
      const queryParams = new URLSearchParams({
        startDate: filters.dateRange.start,
        endDate: filters.dateRange.end,
        format,
        ...(filters.userSegment && { userSegment: filters.userSegment }),
        ...(filters.productCategory && { productCategory: filters.productCategory }),
        ...(filters.brand && { brand: filters.brand }),
        ...(filters.source && { source: filters.source }),
      });

      const response = await fetch(`/api/analytics/export/${type}?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_analytics_${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // Calculate overall loading state
  const isLoading = Object.values(state.loading).some(loading => loading);
  const isStatsLoaded = !state.loading.stats && state.stats !== null;

  return {
    ...state,
    loading: isLoading, // Overall loading state for backward compatibility
    loadingStates: state.loading, // Individual loading states
    isStatsLoaded,
    exportData,
    refetch: fetchAllData
  };
};