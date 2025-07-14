import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Package, TrendingUp, Users, DollarSign, Search, Filter, Download, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface CouponAnalytics {
  totalCoupons: number;
  totalUsed: number;
  dbUsedCount: number;
  csvUsedCount: number;
  totalValue: number;
  avgUsageRate: number;
  typeDistribution: { [key: string]: number };
  categoryDistribution: { [key: string]: number };
  topPerforming: Array<{
    id: string;
    category: string;
    brand: string;
    model: string;
    usageRate: number;
    totalValue: number;
    totalCoupons: number;
    usedCoupons: number;
    couponTypes: {
      [key: string]: {
        value: number;
        count: number;
        used: number;
        usageRate: number;
      };
    };
  }>;
  totalRecords: number;
  lastUpdated: string;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function CouponAnalytics() {
  const [analytics, setAnalytics] = useState<CouponAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const fetchCouponAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching enhanced coupon analytics...');
      const response = await fetch('/api/analytics/coupons?summary=true');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 Received enhanced coupon analytics:', data);
      
      if (data.analytics && Array.isArray(data.analytics)) {
        const processedAnalytics: CouponAnalytics = {
          totalCoupons: data.summary?.totalCoupons || 0,
          totalUsed: data.summary?.totalUsed || 0,
          dbUsedCount: data.summary?.dbUsedCount || 0,
          csvUsedCount: data.summary?.csvUsedCount || 0,
          totalValue: data.summary?.totalValue || 0,
          avgUsageRate: data.summary?.avgUsageRate || 0,
          typeDistribution: data.summary?.typeDistribution || {},
          categoryDistribution: {},
          topPerforming: data.analytics.slice(0, 50),
          totalRecords: data.totalRecords || 0,
          lastUpdated: data.lastUpdated || new Date().toISOString()
        };

        // Calculate category distribution
        data.analytics.forEach((item: any) => {
          const category = item.category || 'Unknown';
          processedAnalytics.categoryDistribution[category] = 
            (processedAnalytics.categoryDistribution[category] || 0) + item.totalCoupons;
        });

        setAnalytics(processedAnalytics);
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (err) {
      console.error('❌ Error fetching coupon analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch coupon analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCouponAnalytics();
  }, []);

  const exportData = (format: 'csv' | 'json') => {
    if (!analytics) return;
    
    const dataStr = format === 'json' 
      ? JSON.stringify(analytics, null, 2)
      : convertToCSV(analytics);
    
    const blob = new Blob([dataStr], { 
      type: format === 'json' ? 'application/json' : 'text/csv' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coupon-analytics-${new Date().toISOString().split('T')[0]}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: CouponAnalytics): string => {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Coupons', data.totalCoupons.toString()],
      ['Total Used', data.totalUsed.toString()],
      ['DB Used Count', data.dbUsedCount.toString()],
      ['CSV Used Count', data.csvUsedCount.toString()],
      ['Total Value', data.totalValue.toString()],
      ['Average Usage Rate', `${data.avgUsageRate.toFixed(2)}%`],
    ];
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-lg text-gray-600">Loading enhanced coupon analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="text-red-600">❌</div>
            <div>
              <h3 className="text-red-800 font-medium">Error Loading Data</h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchCouponAnalytics}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          No coupon analytics data available
        </div>
      </div>
    );
  }

  // Enhanced data processing for charts
  const typeDistributionData = Object.entries(analytics.typeDistribution).map(([type, count]) => ({
    name: type,
    value: count,
    percentage: analytics.totalCoupons > 0 ? ((count / analytics.totalCoupons) * 100) : 0
  }));

  const categoryPerformanceData = Object.entries(analytics.categoryDistribution)
    .map(([category, count]) => ({
      category,
      count,
      percentage: analytics.totalCoupons > 0 ? ((count / analytics.totalCoupons) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Usage type distribution for pie chart
  const usageTypeData = Object.entries(analytics.typeDistribution).map(([type, count], index) => {
    const used = analytics.topPerforming.reduce((sum, item) => {
      return sum + (item.couponTypes[type]?.used || 0);
    }, 0);
    
    return {
      name: type,
      value: used,
      percentage: analytics.totalUsed > 0 ? ((used / analytics.totalUsed) * 100) : 0,
      color: COLORS[index % COLORS.length]
    };
  }).filter(item => item.value > 0);

  // Filter data for categories tab
  const filteredTopPerforming = analytics.topPerforming.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTopPerforming.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredTopPerforming.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enhanced Coupon Analytics</h1>
          <p className="text-gray-600 mt-1">
            Last updated: {new Date(analytics.lastUpdated).toLocaleString()}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => exportData('csv')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => exportData('json')}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={fetchCouponAnalytics}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: Package },
            { id: 'performance', name: 'Performance', icon: TrendingUp },
            { id: 'categories', name: 'Categories', icon: Filter }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Coupons</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.totalCoupons.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">All coupon links</p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Coupons Used</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.totalUsed.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    DB: {analytics.dbUsedCount} + CSV: {analytics.csvUsedCount}
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">DB Used</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.dbUsedCount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Database count</p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">CSV Used</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.csvUsedCount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">CSV file count</p>
                </div>
                <Users className="w-8 h-8 text-orange-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Savings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{analytics.totalValue.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-yellow-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Usage Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.avgUsageRate.toFixed(2)}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-pink-600" />
              </div>
            </div>
          </div>

          {/* Enhanced Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing Coupons */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Coupons</h3>
              {analytics.topPerforming.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.topPerforming.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="brand" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'usageRate' ? `${Number(value).toFixed(2)}%` : value,
                        name === 'usageRate' ? 'Usage Rate' : 'Total Value'
                      ]}
                    />
                    <Bar dataKey="usageRate" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  No coupon data available
                </div>
              )}
            </div>

            {/* Enhanced Coupon Type Distribution */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Used Coupon Type Distribution</h3>
              {usageTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={usageTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage.toFixed(2)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {usageTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Used Count']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  No usage distribution data available
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
            {categoryPerformanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={categoryPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="category" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-500 py-12">
                No category performance data available
              </div>
            )}
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search coupons..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {Object.keys(analytics.categoryDistribution).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Enhanced Coupon Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Coupons</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Used</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Types</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((coupon, index) => (
                    <tr key={coupon.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {coupon.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {coupon.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {coupon.brand}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {coupon.model}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {coupon.totalCoupons.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {coupon.usedCoupons.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${Math.min(coupon.usageRate, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">
                            {coupon.usageRate.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{coupon.totalValue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(coupon.couponTypes).map(([type, data]) => (
                            <span
                              key={type}
                              className={`px-2 py-1 text-xs rounded-full ${
                                type === 'low' ? 'bg-green-100 text-green-800' :
                                type === 'mid' ? 'bg-blue-100 text-blue-800' :
                                type === 'high' ? 'bg-yellow-100 text-yellow-800' :
                                type === 'pro' ? 'bg-purple-100 text-purple-800' :
                                'bg-red-100 text-red-800'
                              }`}
                            >
                              {type}: {data.used}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(startIndex + itemsPerPage, filteredTopPerforming.length)}
                      </span>{' '}
                      of <span className="font-medium">{filteredTopPerforming.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(currentPage - 2 + i, totalPages - 4 + i));
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNum
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
            
            {filteredTopPerforming.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No coupons found matching your criteria
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}