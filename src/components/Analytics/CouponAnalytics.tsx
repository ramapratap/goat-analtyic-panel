import React, { useState, useEffect } from 'react';
import { Download, Filter, Search, TrendingUp, Ticket, Users, DollarSign, Award } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Helper functions at the top level
const getTypeColor = (type: string): string => {
  const colors = {
    'low': '#10B981',
    'mid': '#3B82F6', 
    'high': '#F59E0B',
    'pro': '#8B5CF6',
    'extreme': '#EF4444'
  };
  return colors[type as keyof typeof colors] || '#6B7280';
};

const convertToCSV = (data: any[]): string => {
  if (!data.length) return '';
  
  const headers = ['ID', 'Category', 'Brand', 'Model', 'Total Coupons', 'Used Coupons', 'Usage Rate', 'Total Value', 'Avg Discount'];
  const csvContent = [
    headers.join(','),
    ...data.map(row => [
      row.id || '',
      row.category || '',
      row.brand || '',
      row.model || '',
      row.totalCoupons || 0,
      row.usedCoupons || 0,
      (row.usageRate || 0).toFixed(2),
      row.totalValue || 0,
      (row.avgDiscount || 0).toFixed(2)
    ].join(','))
  ].join('\n');
  return csvContent;
};

// Helper function to safely render values
const safeRender = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    if (value.$oid) return value.$oid;
    return JSON.stringify(value);
  }
  return String(value);
};

interface CouponAnalytics {
  id: number;
  category: string;
  brand: string;
  model: string;
  totalCoupons: number;
  usedCoupons: number;
  usageRate: number;
  totalValue: number;
  avgDiscount: number;
  lastUsed?: string;
  couponTypes: {
    [key: string]: {
      value: number;
      count: number;
      used: number;
      usageRate: number;
    };
  };
}

interface CouponSummary {
  totalCoupons: number;
  totalUsed: number;
  totalValue: number;
  averageUsageRate: number;
  totalActiveCoupons: number;
  categoryDistribution: Record<string, number>;
  typeDistribution: Record<string, number>;
  mostUsedCategory: string;
  csvUsedCount: number;
  dbUsedCount: number;
}

const CouponAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<CouponAnalytics[]>([]);
  const [summary, setSummary] = useState<CouponSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCouponData();
  }, []);

  const loadCouponData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading coupon analytics from API...');
      
      const token = localStorage.getItem('authToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [analyticsResponse, summaryResponse] = await Promise.all([
        fetch('/api/analytics/coupons', { headers }),
        fetch('/api/analytics/coupons?summary=true', { headers })
      ]);
      
      console.log('Analytics response status:', analyticsResponse.status);
      console.log('Summary response status:', summaryResponse.status);
      
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        console.log('Analytics data received:', analyticsData);
        setAnalytics(analyticsData.analytics || analyticsData || []);
      } else {
        const errorText = await analyticsResponse.text();
        console.error('Analytics API error:', errorText);
        setError(`Failed to load analytics: ${analyticsResponse.status}`);
      }
      
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        console.log('Summary data received:', summaryData);
        setSummary(summaryData.summary || summaryData || null);
      } else {
        const errorText = await summaryResponse.text();
        console.error('Summary API error:', errorText);
      }
      
      console.log('Coupon analytics loaded successfully');
    } catch (error) {
      console.error('Error loading coupon data:', error);
      setError(`Error loading coupon data: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnalytics = analytics.filter(item => {
    const matchesSearch = (item.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.model || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || Object.keys(item.couponTypes || {}).includes(selectedType);
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  const paginatedAnalytics = filteredAnalytics.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredAnalytics.length / itemsPerPage);

  const categories = [...new Set(analytics.map(item => item.category))];
  const types = ['low', 'mid', 'high', 'pro', 'extreme'];

  // Chart data
  const chartData = analytics.slice(0, 10).map(item => ({
    name: `${item.brand || ''} ${item.model || ''}`.substring(0, 15),
    total: item.totalCoupons || 0,
    used: item.usedCoupons || 0,
    usageRate: item.usageRate || 0
  }));

  const typeDistributionData = summary ? Object.entries(summary.typeDistribution || {}).map(([type, count]) => ({
    name: type,
    value: count as number,
    color: getTypeColor(type)
  })) : [];

  const categoryDistributionData = summary ? Object.entries(summary.categoryDistribution || {}).map(([category, count]) => ({
    name: category,
    value: count as number
  })) : [];

  const exportData = (format: 'csv' | 'json') => {
    const dataToExport = format === 'csv' 
      ? convertToCSV(filteredAnalytics)
      : JSON.stringify(filteredAnalytics, null, 2);
    
    const blob = new Blob([dataToExport], { 
      type: format === 'csv' ? 'text/csv' : 'application/json' 
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `coupon_analytics_${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading coupon analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Coupon Data</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={loadCouponData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Coupon Analytics</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportData('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => exportData('json')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: TrendingUp },
            { id: 'performance', name: 'Performance', icon: Award },
            { id: 'categories', name: 'Categories', icon: Filter }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Coupons</p>
              <p className="text-2xl font-bold text-gray-900">{(summary?.totalCoupons || 0).toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Ticket className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Coupons Used</p>
              <p className="text-2xl font-bold text-gray-900">{(summary?.totalUsed || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500">DB: {summary?.dbUsedCount || 0} | CSV: {summary?.csvUsedCount || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Savings</p>
              <p className="text-2xl font-bold text-gray-900">₹{(summary?.totalValue || 0).toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Usage Rate</p>
              <p className="text-2xl font-bold text-gray-900">{(summary?.averageUsageRate || 0).toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Top Category</p>
              <p className="text-lg font-bold text-gray-900">{summary?.mostUsedCategory || 'N/A'}</p>
            </div>
            <div className="w-12 h-12 bg-pink-50 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-pink-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Coupons</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#3B82F6" name="Total" />
                  <Bar dataKey="used" fill="#10B981" name="Used" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No coupon data available
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Coupon Type Distribution</h3>
            {typeDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={typeDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {typeDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No type distribution data available
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search coupons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              {types.map(type => (
                <option key={type} value={type}>{type.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {paginatedAnalytics.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Brand</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Model</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Total Coupons</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Used</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Usage Rate</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Total Value</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Types</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAnalytics.map((item, index) => (
                      <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="py-3 px-4 text-sm text-gray-900 font-mono">{safeRender(item.id)}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{safeRender(item.category)}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{safeRender(item.brand)}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{safeRender(item.model)}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{item.totalCoupons || 0}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{item.usedCoupons || 0}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${Math.min(item.usageRate || 0, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">
                              {(item.usageRate || 0).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">₹{(item.totalValue || 0).toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {Object.keys(item.couponTypes || {}).map(type => (
                              <span
                                key={type}
                                className="px-2 py-1 rounded-full text-xs font-medium"
                                style={{ 
                                  backgroundColor: getTypeColor(type) + '20',
                                  color: getTypeColor(type)
                                }}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAnalytics.length)} of {filteredAnalytics.length} results
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No coupon data found matching your criteria.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h3>
            {categoryDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8B5CF6" name="Used Coupons" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No category data available
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
            <div className="space-y-4">
              {categoryDistributionData.slice(0, 8).map((category, index) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-purple-500 rounded"></div>
                    <span className="text-sm font-medium text-gray-900">{category.name}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {category.value.toLocaleString()} used
                  </div>
                </div>
              ))}
              {categoryDistributionData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No category performance data available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponAnalytics;