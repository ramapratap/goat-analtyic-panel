import React, { useState, useEffect } from 'react';
import { fetchProductRecords, parseSearchSource, isRealUser, maskPhoneNumber, categorizeProduct } from '../../services/externalApi';
import { Download, Filter, Search, TrendingUp, AlertCircle, CheckCircle, Image, Link, Type } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ProductRecord {
  _id: string;
  user_id: string;
  product_name: string;
  price: string;
  image_path: string;
  timestamp: string;
  device_info: string;
  logo_detected: string;
  search_source: string;
  amazon_price: string;
  flipkart_price: any;
  input_type: string;
  flipkart_product_name: string;
  Category: string;
  exclusive: string | null;
  hero_deal: string | null;
  coupon_code: string | null;
}

// Define helper functions at the top level
const getInputTypeColor = (type: string): string => {
  const colors = {
    'image_url': '#10B981',
    'amazon_url': '#F59E0B',
    'text': '#3B82F6',
    'flipkart_url': '#8B5CF6',
    'unknown': '#6B7280'
  };
  return colors[type as keyof typeof colors] || '#6B7280';
};

const isInitialRequest = (searchSource: string): boolean => {
  if (!searchSource) return false;
  return searchSource.toLowerCase().includes('intial request') || 
         searchSource.toLowerCase().includes('initial request');
};

const convertToCSV = (data: any[]): string => {
  if (!data.length) return '';
  
  const headers = ['ID', 'User ID', 'Product Name', 'Category', 'Input Type', 'Timestamp', 'Device Info'];
  const csvContent = [
    headers.join(','),
    ...data.map(row => [
      row._id,
      maskPhoneNumber(row.user_id),
      `"${row.product_name}"`,
      categorizeProduct(row.Category, row.product_name),
      row.input_type,
      row.timestamp,
      `"${row.device_info}"`
    ].join(','))
  ].join('\n');
  return csvContent;
};

const ProductAnalytics: React.FC = () => {
  const [productRecords, setProductRecords] = useState<ProductRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ProductRecord[]>([]);
  const [imageUploads, setImageUploads] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInputType, setSelectedInputType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadProductData();
  }, []);

  useEffect(() => {
    filterData();
  }, [productRecords, searchTerm, selectedInputType, selectedCategory]);

  const loadProductData = async () => {
    setLoading(true);
    try {
      const records = await fetchProductRecords();
      
      // Filter out INITIAL REQUEST records for main analytics
      const filteredRecords = records.filter(record => 
        record.user_id && 
        isRealUser(record.user_id) &&
        !isInitialRequest(record.search_source)
      );

      // Get image uploads
      const imageRecords = records.filter(record =>
        record.user_id &&
        isRealUser(record.user_id) &&
        record.input_type === 'image_url' &&
        record.image_path &&
        !isInitialRequest(record.search_source)
      );

      setProductRecords(filteredRecords);
      setImageUploads(imageRecords);
    } catch (error) {
      console.error('Error loading product data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = productRecords;

    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.user_id?.includes(searchTerm) ||
        record.Category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedInputType !== 'all') {
      filtered = filtered.filter(record => record.input_type === selectedInputType);
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(record => 
        categorizeProduct(record.Category, record.product_name) === selectedCategory
      );
    }

    setFilteredRecords(filtered);
    setCurrentPage(1);
  };

  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  // Analytics calculations
  const userStats = React.useMemo(() => {
    const userMap = new Map();
    
    filteredRecords.forEach(record => {
      const userId = record.user_id;
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          userId: maskPhoneNumber(userId),
          totalHits: 0,
          categories: new Set(),
          inputTypes: new Set(),
          lastActivity: record.timestamp
        });
      }
      
      const user = userMap.get(userId);
      user.totalHits++;
      user.categories.add(categorizeProduct(record.Category, record.product_name));
      user.inputTypes.add(record.input_type);
      
      if (new Date(record.timestamp) > new Date(user.lastActivity)) {
        user.lastActivity = record.timestamp;
      }
    });

    return Array.from(userMap.values()).sort((a, b) => b.totalHits - a.totalHits);
  }, [filteredRecords]);

  const inputTypeStats = React.useMemo(() => {
    const stats = filteredRecords.reduce((acc, record) => {
      const type = record.input_type || 'unknown';
      if (!acc[type]) {
        acc[type] = { count: 0, users: new Set() };
      }
      acc[type].count++;
      acc[type].users.add(record.user_id);
      return acc;
    }, {} as Record<string, { count: number; users: Set<string> }>);

    return Object.entries(stats).map(([type, data]) => ({
      type,
      count: data.count,
      uniqueUsers: data.users.size,
      color: getInputTypeColor(type)
    }));
  }, [filteredRecords]);

  const categoryStats = React.useMemo(() => {
    const stats = filteredRecords.reduce((acc, record) => {
      const category = categorizeProduct(record.Category, record.product_name);
      if (!acc[category]) {
        acc[category] = { count: 0, users: new Set() };
      }
      acc[category].count++;
      acc[category].users.add(record.user_id);
      return acc;
    }, {} as Record<string, { count: number; users: Set<string> }>);

    return Object.entries(stats).map(([category, data]) => ({
      category,
      count: data.count,
      uniqueUsers: data.users.size
    })).sort((a, b) => b.count - a.count);
  }, [filteredRecords]);

  const exportData = (format: 'csv' | 'json') => {
    const dataToExport = format === 'csv' 
      ? convertToCSV(filteredRecords)
      : JSON.stringify(filteredRecords, null, 2);
    
    const blob = new Blob([dataToExport], { 
      type: format === 'csv' ? 'text/csv' : 'application/json' 
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `product_analytics_${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const inputTypes = [...new Set(productRecords.map(r => r.input_type))];
  const categories = [...new Set(productRecords.map(r => categorizeProduct(r.Category, r.product_name)))];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading product analytics...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Product Analytics</h2>
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
            { id: 'users', name: 'User Analysis', icon: CheckCircle },
            { id: 'images', name: 'Image Uploads', icon: Image }
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{filteredRecords.length.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unique Users</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.length.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Image Uploads</p>
              <p className="text-2xl font-bold text-gray-900">{imageUploads.length.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Image className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <Filter className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Input Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={inputTypeStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {inputTypeStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryStats.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" name="Records" />
              <Bar dataKey="uniqueUsers" fill="#10B981" name="Users" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={selectedInputType}
              onChange={(e) => setSelectedInputType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Input Types</option>
              {inputTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

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
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Product</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">User ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Input Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Timestamp</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Device</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.map((record, index) => (
                  <tr key={record._id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{record.product_name}</p>
                        <p className="text-xs text-gray-600">{record._id}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 font-mono">
                      {maskPhoneNumber(record.user_id)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {categorizeProduct(record.Category, record.product_name)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1">
                        {record.input_type === 'image_url' && <Image className="w-4 h-4" />}
                        {record.input_type === 'amazon_url' && <Link className="w-4 h-4" />}
                        {record.input_type === 'text' && <Type className="w-4 h-4" />}
                        <span className="text-sm text-gray-900">{record.input_type}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {format(new Date(record.timestamp), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {record.device_info}
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
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length} results
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
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">User ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Total Hits</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Categories</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Input Types</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {userStats.slice(0, 50).map((user, index) => (
                  <tr key={user.userId} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-3 px-4 text-sm text-gray-900 font-mono">{user.userId}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{user.totalHits}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{user.categories.size}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{user.inputTypes.size}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {format(new Date(user.lastActivity), 'MMM dd, yyyy HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'images' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Image Uploads</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {imageUploads.slice(0, 20).map((record) => (
              <div key={record._id} className="border border-gray-200 rounded-lg p-4">
                <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                  {record.image_path ? (
                    <img 
                      src={record.image_path} 
                      alt={record.product_name}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className="hidden text-gray-400">
                    <Image className="w-8 h-8" />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">{record.product_name}</p>
                <p className="text-xs text-gray-600">{maskPhoneNumber(record.user_id)}</p>
                <p className="text-xs text-gray-500">{format(new Date(record.timestamp), 'MMM dd, yyyy')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductAnalytics;