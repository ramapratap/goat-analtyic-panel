import { useState, useEffect } from 'react';
import { DashboardStats, FilterOptions, UserFlow, ProductAnalytics, CouponAnalytics, ProductFeedback, HeroDeal } from '../types';

export const useAnalytics = (filters: FilterOptions) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userFlows, setUserFlows] = useState<UserFlow[]>([]);
  const [productAnalytics, setProductAnalytics] = useState<ProductAnalytics[]>([]);
  const [productFeedback, setProductFeedback] = useState<ProductFeedback[]>([]);
  const [couponAnalytics, setCouponAnalytics] = useState<CouponAnalytics[]>([]);
  const [heroDeals, setHeroDeals] = useState<HeroDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      const queryParams = new URLSearchParams({
        startDate: filters.dateRange.start,
        endDate: filters.dateRange.end,
        ...(filters.userSegment && { userSegment: filters.userSegment }),
        ...(filters.productCategory && { productCategory: filters.productCategory }),
        ...(filters.brand && { brand: filters.brand }),
        ...(filters.source && { source: filters.source }),
      });

      const [statsRes, flowsRes, productsRes, feedbackRes, couponsRes, heroDealsRes] = await Promise.all([
        fetch(`/api/analytics/dashboard?${queryParams}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/analytics/user-flows?${queryParams}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/analytics/products?${queryParams}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/analytics/product-feedback?${queryParams}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/analytics/coupons?${queryParams}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/analytics/hero-deals?${queryParams}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!statsRes.ok || !flowsRes.ok || !productsRes.ok || !feedbackRes.ok || !couponsRes.ok || !heroDealsRes.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const [statsData, flowsData, productsData, feedbackData, couponsData, heroDealsData] = await Promise.all([
        statsRes.json(),
        flowsRes.json(),
        productsRes.json(),
        feedbackRes.json(),
        couponsRes.json(),
        heroDealsRes.json()
      ]);

      setStats(statsData);
      setUserFlows(flowsData);
      setProductAnalytics(productsData);
      setProductFeedback(feedbackData);
      setCouponAnalytics(couponsData);
      setHeroDeals(heroDealsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

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

  return {
    stats,
    userFlows,
    productAnalytics,
    productFeedback,
    couponAnalytics,
    heroDeals,
    loading,
    error,
    exportData,
    refetch: fetchAnalytics
  };
};