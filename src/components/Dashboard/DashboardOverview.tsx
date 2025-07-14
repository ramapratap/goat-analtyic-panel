import React, { useState, useEffect } from 'react';
import { Users, Activity, ShoppingCart, TrendingUp, AlertCircle, QrCode, RefreshCw, Ticket, Smartphone, Monitor } from 'lucide-react';
import { DashboardStats } from '../../types';
import StatsCard from './StatsCard';
import { fetchProductRecords, fetchQRScanData, parseSearchSource, isRealUser, categorizeProduct } from '../../services/externalApi';
import { generateCouponAnalytics } from '../../services/couponService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface DashboardOverviewProps {
  stats: DashboardStats | null;
  onRefreshQrScans: () => void;
}

const LoadingSkeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

const StatsCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <LoadingSkeleton className="h-4 w-24 mb-2" />
        <LoadingSkeleton className="h-8 w-16 mb-1" />
        <LoadingSkeleton className="h-3 w-12" />
      </div>
      <LoadingSkeleton className="w-12 h-12 rounded-lg" />
    </div>
  </div>
);

const ChartSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <LoadingSkeleton className="h-6 w-32 mb-4" />
    <LoadingSkeleton className="h-64 w-full" />
  </div>
);

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ stats, onRefreshQrScans }) => {
  const [realTimeStats, setRealTimeStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRealTimeData();
  }, []);

  const loadRealTimeData = async () => {
    try {
      const [productRecords, qrData, couponAnalytics] = await Promise.all([
        fetchProductRecords(),
        fetchQRScanData(),
        generateCouponAnalytics()
      ]);

      // Filter real users and INITIAL REQUEST records
      const initialRequests = productRecords.filter(record => 
        record.user_id && 
        isRealUser(record.user_id) &&
        record.search_source?.includes('INITIAL REQUEST')
      );

      const realProductRecords = productRecords.filter(record => 
        record.user_id && 
        isRealUser(record.user_id) &&
        !record.search_source?.includes('INITIAL REQUEST')
      );

      // Calculate metrics
      const uniqueUsers = new Set(realProductRecords.map(r => r.user_id)).size;
      const totalApiHits = initialRequests.length;
      
      // Softline vs Hardline analysis
      const softlineCount = realProductRecords.filter(record => {
        const sourceInfo = parseSearchSource(record.search_source);
        return sourceInfo.category === 'Softline';
      }).length;
      
      const hardlineCount = realProductRecords.filter(record => {
        const sourceInfo = parseSearchSource(record.search_source);
        return sourceInfo.category === 'Hardline';
      }).length;

      // Exclusive products
      const exclusiveProducts = realProductRecords.filter(record => 
        record.exclusive && record.exclusive !== null
      ).length;

      // Flipkart savings
      const flipkartSavings = realProductRecords.reduce((total, record) => {
        const sourceInfo = parseSearchSource(record.search_source);
        if (sourceInfo.platform === 'Flipkart' && sourceInfo.savings) {
          const savingsMatch = sourceInfo.savings.match(/₹([\d,]+)/);
          if (savingsMatch) {
            return total + parseInt(savingsMatch[1].replace(/,/g, ''));
          }
        }
        return total;
      }, 0);

      // Platform distribution
      const platformStats = realProductRecords.reduce((acc, record) => {
        const sourceInfo = parseSearchSource(record.search_source);
        const platform = sourceInfo.platform || 'Unknown';
        acc[platform] = (acc[platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Error analysis
      const errorCount = realProductRecords.filter(record => {
        const sourceInfo = parseSearchSource(record.search_source);
        return sourceInfo.status === 'Error' || record.search_source?.toLowerCase().includes('error');
      }).length;

      // Category analysis for coupons
      const couponCategoryStats = couponAnalytics.reduce((acc, coupon) => {
        acc[coupon.category] = (acc[coupon.category] || 0) + coupon.usedCoupons;
        return acc;
      }, {} as Record<string, number>);

      const mostUsedCouponCategory = Object.entries(couponCategoryStats)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Fashion';

      setRealTimeStats({
        totalApiHits,
        uniqueUsers,
        softlineCount,
        hardlineCount,
        exclusiveProducts,
        flipkartSavings,
        platformStats,
        errorCount,
        qrScanCount: qrData.data?.qrData?.qr_scan_count || 0,
        mostUsedCouponCategory,
        totalCouponsUsed: couponAnalytics.reduce((sum, c) => sum + c.usedCoupons, 0),
        deviceBreakdown: qrData.data?.qrData?.analytics?.deviceBreakdown || { mobile: 0, tablet: 0, desktop: 0 },
        dailyScans: qrData.data?.qrData?.analytics?.timeStats?.dailyScans || {}
      });
    } catch (error) {
      console.error('Error loading real-time data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show skeleton while loading
  if (loading || !realTimeStats) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <LoadingSkeleton className="h-8 w-48" />
          <div className="flex items-center gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <LoadingSkeleton className="w-5 h-5 rounded" />
                <div>
                  <LoadingSkeleton className="h-4 w-16 mb-1" />
                  <LoadingSkeleton className="h-6 w-20" />
                </div>
              </div>
              <LoadingSkeleton className="h-3 w-24 mt-1" />
            </div>
            <LoadingSkeleton className="h-4 w-32" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>

        <ChartSkeleton />
      </div>
    );
  }

  const platformData = Object.entries(realTimeStats.platformStats).map(([platform, count]) => ({
    name: platform,
    value: count as number,
    color: platform === 'Flipkart' ? '#F59E0B' : platform === 'Amazon' ? '#FF9500' : '#3B82F6'
  }));

  const deviceData = Object.entries(realTimeStats.deviceBreakdown).map(([device, count]) => ({
    name: device,
    value: count as number,
    color: device === 'mobile' ? '#10B981' : device === 'tablet' ? '#8B5CF6' : '#3B82F6'
  }));

  const dailyScanData = Object.entries(realTimeStats.dailyScans)
    .slice(-7)
    .map(([date, scans]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      scans: scans as number
    }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <div className="flex items-center gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-700">QR Scans</p>
                  <p className="text-lg font-bold text-gray-900">
                    {realTimeStats.qrScanCount.toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={onRefreshQrScans}
                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                title="Refresh QR scan count"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Live count from QR system
            </p>
          </div>
          
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <StatsCard
          title="API Hits (Initial)"
          value={realTimeStats.totalApiHits}
          change={12.5}
          icon={Activity}
          color="blue"
        />
        <StatsCard
          title="Unique Users"
          value={realTimeStats.uniqueUsers}
          change={8.2}
          icon={Users}
          color="green"
        />
        <StatsCard
          title="Softline Products"
          value={realTimeStats.softlineCount}
          icon={ShoppingCart}
          color="yellow"
        />
        <StatsCard
          title="Hardline Products"
          value={realTimeStats.hardlineCount}
          icon={Monitor}
          color="purple"
        />
        <StatsCard
          title="Exclusive Products"
          value={realTimeStats.exclusiveProducts}
          icon={Ticket}
          color="pink"
        />
        <StatsCard
          title="Error Messages"
          value={realTimeStats.errorCount}
          icon={AlertCircle}
          color="red"
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Flipkart Savings</h3>
              <p className="text-2xl font-bold text-yellow-600">₹{realTimeStats.flipkartSavings.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Total savings when Flipkart is the best platform
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Ticket className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Top Coupon Category</h3>
              <p className="text-2xl font-bold text-green-600">{realTimeStats.mostUsedCouponCategory}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Most frequently used coupon category
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Coupons Used</h3>
              <p className="text-2xl font-bold text-blue-600">{realTimeStats.totalCouponsUsed}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Total coupons redeemed by users
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={platformData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {platformData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={deviceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {deviceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">QR Scan Trends (7 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dailyScanData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="scans" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Real-time Insights */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">User Engagement</h4>
            <p className="text-sm text-blue-700">
              {realTimeStats.uniqueUsers} unique users generated {realTimeStats.totalApiHits} API requests
            </p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Product Categories</h4>
            <p className="text-sm text-green-700">
              {realTimeStats.softlineCount} Softline vs {realTimeStats.hardlineCount} Hardline products
            </p>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">Platform Performance</h4>
            <p className="text-sm text-yellow-700">
              Flipkart savings: ₹{realTimeStats.flipkartSavings.toLocaleString()}
            </p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 mb-2">Quality Metrics</h4>
            <p className="text-sm text-purple-700">
              {realTimeStats.errorCount} errors out of {realTimeStats.totalApiHits + realTimeStats.uniqueUsers} total requests
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;