import React, { useState, useEffect } from 'react';
import { Users, Activity, ShoppingCart, TrendingUp, AlertCircle, QrCode, RefreshCw, Ticket, Smartphone, Monitor, IndianRupee, Target, Award, ExternalLink, X } from 'lucide-react';
import { DashboardStats } from '../../types';
import StatsCard from './StatsCard';
import { 
  fetchProductRecords, 
  fetchQRScanData, 
  parseSearchSource, 
  isRealUser, 
  categorizeProduct, 
  isInitialRequest,
  calculatePlatformSavings,
  getPlatformDistribution,
  getFlipkartPriceNumeric
} from '../../services/externalApi';
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

// Savings Details Modal Component
const SavingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  savingsDetails: Array<{
    productName: string;
    platform: string;
    savings: number;
    flipkartPrice: string;
    amazonPrice: string;
    productLink: string;
  }>;
}> = ({ isOpen, onClose, title, savingsDetails }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            {savingsDetails.map((detail, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-2">{detail.productName}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Flipkart Price:</span>
                        <p className="font-medium text-green-600">{detail.flipkartPrice}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Amazon Price:</span>
                        <p className="font-medium text-orange-600">{detail.amazonPrice}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">You Saved:</span>
                        <p className="font-bold text-blue-600">₹{detail.savings.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  {detail.productLink && (
                    <a
                      href={detail.productLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View on Flipkart"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {savingsDetails.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No savings data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ stats, onRefreshQrScans }) => {
  const [realTimeStats, setRealTimeStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingsModal, setSavingsModal] = useState<{
    isOpen: boolean;
    title: string;
    details: any[];
  }>({
    isOpen: false,
    title: '',
    details: []
  });

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

      // Filter INITIAL REQUEST records for API hits count
      const initialRequests = productRecords.filter(record => 
        record.user_id && 
        isRealUser(record.user_id) &&
        isInitialRequest(record.search_source)
      );

      // Filter real product records (excluding INITIAL REQUEST)
      const realProductRecords = productRecords.filter(record => 
        record.user_id && 
        isRealUser(record.user_id) &&
        !isInitialRequest(record.search_source)
      );

      // Calculate metrics
      const uniqueUsers = new Set([
        ...initialRequests.map(r => r.user_id),
        ...realProductRecords.map(r => r.user_id)
      ]).size;
      
      const totalApiHits = initialRequests.length;
      
      // Enhanced Softline vs Hardline analysis
      const softlineCount = realProductRecords.filter(record => {
        const sourceInfo = parseSearchSource(record.search_source);
        return sourceInfo.isSoftline;
      }).length;
      
      const hardlineCount = realProductRecords.filter(record => {
        const sourceInfo = parseSearchSource(record.search_source);
        return sourceInfo.isHardline;
      }).length;

      // Exclusive products
      const exclusiveProducts = realProductRecords.filter(record => 
        record.exclusive && record.exclusive !== null
      ).length;

      // FIXED: Enhanced platform savings calculation with details
      const platformSavings = calculatePlatformSavings(realProductRecords);
      const platformDistribution = getPlatformDistribution(realProductRecords);

      // Error analysis
      const errorCount = realProductRecords.filter(record => {
        const sourceInfo = parseSearchSource(record.search_source);
        return sourceInfo.status === 'Error' || sourceInfo.status === 'Failed';
      }).length;

      const successCount = realProductRecords.filter(record => {
        const sourceInfo = parseSearchSource(record.search_source);
        return sourceInfo.status === 'Success';
      }).length;

      // Input type analysis
      const inputTypeStats = realProductRecords.reduce((acc, record) => {
        const sourceInfo = parseSearchSource(record.search_source);
        const type = sourceInfo.inputType || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Category analysis for coupons
      const couponCategoryStats = couponAnalytics.reduce((acc, coupon) => {
        acc[coupon.category] = (acc[coupon.category] || 0) + coupon.usedCoupons;
        return acc;
      }, {} as Record<string, number>);

      const mostUsedCouponCategory = Object.entries(couponCategoryStats)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Fashion';

      // Price analysis
      const totalProductValue = realProductRecords.reduce((sum, record) => {
        return sum + getFlipkartPriceNumeric(record.flipkart_price);
      }, 0);

      const avgProductPrice = realProductRecords.length > 0 ? totalProductValue / realProductRecords.length : 0;

      setRealTimeStats({
        totalApiHits,
        uniqueUsers,
        softlineCount,
        hardlineCount,
        exclusiveProducts,
        flipkartSavings: platformSavings.flipkartSavings,
        amazonSavings: platformSavings.amazonSavings,
        totalSavings: platformSavings.totalSavings,
        flipkartWins: platformSavings.flipkartWins,
        amazonWins: platformSavings.amazonWins,
        savingsDetails: platformSavings.savingsDetails, // Add savings details
        platformDistribution,
        errorCount,
        successCount,
        successRate: realProductRecords.length > 0 ? ((successCount / realProductRecords.length) * 100).toFixed(1) : '0',
        qrScanCount: qrData.data?.qrData?.qr_scan_count || 0,
        mostUsedCouponCategory,
        totalCouponsUsed: couponAnalytics.reduce((sum, c) => sum + c.usedCoupons, 0),
        deviceBreakdown: qrData.data?.qrData?.analytics?.deviceBreakdown || { mobile: 0, tablet: 0, desktop: 0 },
        dailyScans: qrData.data?.qrData?.analytics?.timeStats?.dailyScans || {},
        inputTypeStats,
        totalProductValue,
        avgProductPrice,
        totalProducts: realProductRecords.length
      });
    } catch (error) {
      console.error('Error loading real-time data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavingsClick = (type: 'flipkart' | 'amazon' | 'total') => {
    if (!realTimeStats?.savingsDetails) return;

    let filteredDetails = realTimeStats.savingsDetails;
    let title = '';

    switch (type) {
      case 'flipkart':
        filteredDetails = realTimeStats.savingsDetails.filter((d: any) => d.platform === 'flipkart');
        title = `Flipkart Savings Details (₹${realTimeStats.flipkartSavings.toLocaleString()})`;
        break;
      case 'amazon':
        filteredDetails = realTimeStats.savingsDetails.filter((d: any) => d.platform === 'amazon');
        title = `Amazon Savings Details (₹${realTimeStats.amazonSavings.toLocaleString()})`;
        break;
      case 'total':
        title = `Total Savings Details (₹${realTimeStats.totalSavings.toLocaleString()})`;
        break;
    }

    setSavingsModal({
      isOpen: true,
      title,
      details: filteredDetails
    });
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

  const platformData = [
    { name: 'Flipkart', value: realTimeStats.flipkartWins, savings: realTimeStats.flipkartSavings, color: '#F59E0B' },
    { name: 'Amazon', value: realTimeStats.amazonWins, savings: realTimeStats.amazonSavings, color: '#FF9500' },
  ];

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

  const inputTypeData = Object.entries(realTimeStats.inputTypeStats).map(([type, count]) => ({
    name: type,
    value: count as number,
    color: type === 'Image' ? '#10B981' : type === 'Text' ? '#3B82F6' : type === 'Amazon URL' ? '#FF9500' : '#8B5CF6'
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <div className="flex items-center gap-4">
        
         
        </div>
      </div>

      {/* Enhanced Stats Cards */}
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
          title="Success Rate"
          value={`${realTimeStats.successRate}%`}
          icon={Target}
          color="green"
        />
        <StatsCard
          title="Error Count"
          value={realTimeStats.errorCount}
          icon={AlertCircle}
          color="red"
        />
      </div>

      {/* Enhanced Platform Performance Cards with Clickable Savings */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Flipkart Savings</h3>
              <button
                onClick={() => handleSavingsClick('flipkart')}
                className="text-2xl font-bold text-yellow-600 hover:text-yellow-700 transition-colors cursor-pointer flex items-center gap-1"
              >
                ₹{realTimeStats.flipkartSavings.toLocaleString()}
                {/* <ExternalLink className="w-4 h-4" /> */}
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {realTimeStats.flipkartWins} times Flipkart was cheaper
          </p>
        </div>

        {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Amazon Savings</h3>
              <button
                onClick={() => handleSavingsClick('amazon')}
                className="text-2xl font-bold text-orange-600 hover:text-orange-700 transition-colors cursor-pointer flex items-center gap-1"
              >
                ₹{realTimeStats.amazonSavings.toLocaleString()}
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {realTimeStats.amazonWins} times Amazon was cheaper
          </p>
        </div> */}

        {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Total Savings</h3>
              <button
                onClick={() => handleSavingsClick('total')}
                className="text-2xl font-bold text-green-600 hover:text-green-700 transition-colors cursor-pointer flex items-center gap-1"
              >
                ₹{realTimeStats.totalSavings.toLocaleString()}
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Combined platform savings
          </p>
        </div> */}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Avg Product Price</h3>
              <p className="text-2xl font-bold text-blue-600">₹{Math.round(realTimeStats.avgProductPrice).toLocaleString()}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Across {realTimeStats.totalProducts} products
          </p>
        </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-10 h-10 text-blue-600" />
                <div>
                  <p className="text-lg font-bold text-gray-700">QR Scans</p>
                  <p className="text-2xl font-bold text-green-900">
                    {realTimeStats.qrScanCount.toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={onRefreshQrScans}
                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                title="Refresh QR scan count"
              >
                <RefreshCw className="w-7 h-7" />
              </button>
            </div>
            
            <p className="text-sm text-gray-500 mt-3">
              Live count from QR system
            </p>
             <div className="text-sm text-gray-500 mt-2">
            Last updated: {new Date().toLocaleString()}</div>
          </div>
          
      </div>

      {/* Enhanced Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Performance</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={platformData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'value' ? `wins` : `${value}`,
                  name === 'Savings' ? 'Savings' : 'Wins'
                ]}
              />
              <Bar dataKey="value" fill="#3B82F6" name="Wins" />
              <Bar dataKey="savings" fill="#10B981" name="Savings" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Input Type Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={inputTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {inputTypeData.map((entry, index) => (
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
      </div>

      {/* QR Scan Trends */}
      {dailyScanData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">QR Scan Trends (7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyScanData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="scans" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Enhanced Insights */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">User Engagement</h4>
            <p className="text-sm text-blue-700">
              {realTimeStats.uniqueUsers} unique users with {realTimeStats.totalApiHits} initial requests
            </p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Product Categories</h4>
            <p className="text-sm text-green-700">
              {realTimeStats.hardlineCount} Hardline vs {realTimeStats.softlineCount} Softline products
            </p>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">Platform Savings</h4>
            <p className="text-sm text-yellow-700">
              Total savings: ₹{realTimeStats.flipkartSavings.toLocaleString()} across platforms
            </p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 mb-2">Success Rate</h4>
            <p className="text-sm text-purple-700">
              {realTimeStats.successRate}% success rate with {realTimeStats.errorCount} errors
            </p>
          </div>
        </div>
      </div>

      {/* Savings Details Modal */}
      <SavingsModal
        isOpen={savingsModal.isOpen}
        onClose={() => setSavingsModal({ isOpen: false, title: '', details: [] })}
        title={savingsModal.title}
        savingsDetails={savingsModal.details}
      />
    </div>
  );
};

export default DashboardOverview;