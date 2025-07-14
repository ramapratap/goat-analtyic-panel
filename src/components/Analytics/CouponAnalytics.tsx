import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Package, TrendingUp, Users, DollarSign, Search, Filter, Download, RefreshCw } from 'lucide-react';

interface CouponData {
  _id: string;
  id: string;
  Category: string;
  Brand: string;
  Model: string;
  'FSN List': string[];
  'Min Range': string;
  'Max Range': string;
  Coupon_Value_low: string;
  Coupon_Value_mid: string;
  Coupon_Value_high: string;
  Coupon_Value_pro: string;
  Coupon_Value_extreme: string;
  Coupon_Count_low: string;
  Coupon_Count_mid: string;
  Coupon_Count_high: string;
  Coupon_Count_pro: string;
  Coupon_Count_extreme: string;
}

interface CouponLink {
  _id: string;
  id: string;
  'Coupon Link': string;
  'Coupon type': string;
  is_used?: boolean;
  timestamp?: string;
}

interface CouponAnalytics {
  totalCoupons: number;
  totalUsed: number;
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

  const fetchCouponAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching coupon analytics...');
      const response = await fetch('/api/analytics/coupons');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 Received coupon analytics:', data);
      
      setAnalytics(data);
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
    a.download = `coupon-analytics.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: CouponAnalytics): string => {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Coupons', data.totalCoupons.toString()],
      ['Total Used', data.totalUsed.toString()],
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
            <span className="text-lg text-gray-600">Loading coupon analytics...</span>
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

  const typeDistributionData = Object.entries(analytics.typeDistribution).map(([type, count]) => ({
    name: type,
    value: count,
    percentage: ((count / analytics.totalCoupons) * 100).toFixed(1)
  }));

  const categoryPerformanceData = Object.entries(analytics.categoryDistribution)
    .map(([category, count]) => ({
      category,
      count,
      percentage: ((count / analytics.totalCoupons) * 100).toFixed(1)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupon Analytics</h1>
          <p className="text-gray-600 mt-1">
            Last updated: {analytics.lastUpdated}
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
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Coupons</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.totalCoupons.toLocaleString()}
                  </p>
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
                    DB + CSV data
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
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
                    {analytics.avgUsageRate.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Top Category</p>
                  <p className="text-lg font-bold text-gray-900">
                    {categoryPerformanceData[0]?.category || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {categoryPerformanceData[0]?.percentage}% of total
                  </p>
                </div>
                <Filter className="w-8 h-8 text-pink-600" />
              </div>
            </div>
          </div>

          {/* Charts */}
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
                        name === 'usageRate' ? `${value}%` : value,
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

            {/* Coupon Type Distribution */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Coupon Type Distribution</h3>
              {typeDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={typeDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {typeDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  No type distribution data available
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
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                {Object.keys(analytics.typeDistribution).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Coupon Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Brand
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Model
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Coupons
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Used
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Types
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.topPerforming.slice(0, 20).map((coupon, index) => (
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
                        {coupon.totalValue}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {Math.round((coupon.usageRate / 100) * coupon.totalValue)}
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
                            {coupon.usageRate.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{coupon.totalValue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-1">
                          {['low', 'mid', 'high', 'pro'].map(type => (
                            <span
                              key={type}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                type === 'low' ? 'bg-green-100 text-green-800' :
                                type === 'mid' ? 'bg-blue-100 text-blue-800' :
                                type === 'high' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}