import React, { useState, useEffect } from 'react';
import { fetchProductRecords, parseSearchSource, isRealUser, maskPhoneNumber, categorizeProduct } from '../../services/externalApi';
import { Download, Filter, Search, TrendingUp, AlertCircle, CheckCircle, Image, Link, Type, ChevronLeft, ChevronRight, Eye, X } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ProductRecord {
  _id: string | { $oid: string };
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

// Image Preview Modal Component
const ImagePreviewModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  productName: string;
}> = ({ isOpen, onClose, imageUrl, productName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{productName}</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 flex items-center justify-center">
          <img 
            src={imageUrl} 
            alt={productName}
            className="max-w-full max-h-[70vh] object-contain rounded-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBMMTMwIDEwMEgxMTBWMTMwSDkwVjEwMEg3MEwxMDAgNzBaIiBmaWxsPSIjOUI5Qjk5Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUI5Qjk5IiBmb250LXNpemU9IjEyIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+Cjwvc3ZnPg==';
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Helper functions at the top level
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
      extractId(row._id),
      maskPhoneNumber(row.user_id),
      `"${row.product_name || ''}"`,
      categorizeProduct(row.Category, row.product_name),
      row.input_type || '',
      row.timestamp || '',
      `"${row.device_info || ''}"`
    ].join(','))
  ].join('\n');
  return csvContent;
};

// Helper function to extract ID from MongoDB ObjectId or string
const extractId = (id: string | { $oid: string } | any): string => {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  if (typeof id === 'object' && id._id) return extractId(id._id);
  return String(id);
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
  
  // User Analysis pagination
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [userItemsPerPage] = useState(15);
  
  // Image uploads pagination
  const [imageCurrentPage, setImageCurrentPage] = useState(1);
  const [imageItemsPerPage] = useState(12);
  
  // Image preview modal
  const [previewImage, setPreviewImage] = useState<{
    isOpen: boolean;
    imageUrl: string;
    productName: string;
  }>({
    isOpen: false,
    imageUrl: '',
    productName: ''
  });

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
      
      // FIXED: Use consistent filtering - include ALL real user records
      const allRealRecords = records.filter(record => 
        record.user_id && 
        isRealUser(record.user_id)
      );

      // Get image uploads with proper filtering
      const imageRecords = allRealRecords.filter(record =>
        record.input_type === 'image_url' &&
        record.image_path &&
        !isInitialRequest(record.search_source || '')
      );

      setProductRecords(allRealRecords);
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
        (record.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.user_id || '').includes(searchTerm) ||
        (record.Category || '').toLowerCase().includes(searchTerm.toLowerCase())
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

  // Enhanced user analytics with category and input type details
  const userStats = React.useMemo(() => {
    const userMap = new Map();
    
    filteredRecords.forEach(record => {
      const userId = record.user_id;
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          userId: maskPhoneNumber(userId),
          totalHits: 0,
          categories: new Map(),
          inputTypes: new Map(),
          lastActivity: record.timestamp
        });
      }
      
      const user = userMap.get(userId);
      user.totalHits++;
      
      // Track categories with counts
      const category = categorizeProduct(record.Category, record.product_name);
      user.categories.set(category, (user.categories.get(category) || 0) + 1);
      
      // Track input types with counts
      const inputType = record.input_type || 'unknown';
      user.inputTypes.set(inputType, (user.inputTypes.get(inputType) || 0) + 1);
      
      if (new Date(record.timestamp) > new Date(user.lastActivity)) {
        user.lastActivity = record.timestamp;
      }
    });

    return Array.from(userMap.values()).sort((a, b) => b.totalHits - a.totalHits);
  }, [filteredRecords]);

  // User analysis pagination
  const paginatedUserStats = userStats.slice(
    (userCurrentPage - 1) * userItemsPerPage,
    userCurrentPage * userItemsPerPage
  );
  const userTotalPages = Math.ceil(userStats.length / userItemsPerPage);

  // Image uploads pagination
  const paginatedImageUploads = imageUploads.slice(
    (imageCurrentPage - 1) * imageItemsPerPage,
    imageCurrentPage * imageItemsPerPage
  );
  const imageTotalPages = Math.ceil(imageUploads.length / imageItemsPerPage);

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
                  <tr key={extractId(record._id)} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{safeRender(record.product_name)}</p>
                        <p className="text-xs text-gray-600">{extractId(record._id)}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 font-mono">
                      {maskPhoneNumber(safeRender(record.user_id))}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {categorizeProduct(record.Category, record.product_name)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1">
                        {record.input_type === 'image_url' && <Image className="w-4 h-4" />}
                        {record.input_type === 'amazon_url' && <Link className="w-4 h-4" />}
                        {record.input_type === 'text' && <Type className="w-4 h-4" />}
                        <span className="text-sm text-gray-900">{safeRender(record.input_type)}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {record.timestamp ? format(new Date(record.timestamp), 'MMM dd, yyyy HH:mm') : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {safeRender(record.device_info)}
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Enhanced User Analysis</h3>
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
                {paginatedUserStats.map((user, index) => (
                  <tr key={user.userId} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-3 px-4 text-sm text-gray-900 font-mono">{user.userId}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{user.totalHits}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {Array.from(user.categories.entries()).map(([category, count]) => (
                          <span
                            key={category}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                          >
                            {category}: {count}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {Array.from(user.inputTypes.entries()).map(([type, count]) => (
                          <span
                            key={type}
                            className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full"
                          >
                            {type}: {count}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {user.lastActivity ? format(new Date(user.lastActivity), 'MMM dd, yyyy HH:mm') : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* User Analysis Pagination */}
          {userTotalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing {((userCurrentPage - 1) * userItemsPerPage) + 1} to {Math.min(userCurrentPage * userItemsPerPage, userStats.length)} of {userStats.length} users
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUserCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={userCurrentPage === 1}
                  className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Page {userCurrentPage} of {userTotalPages}
                </span>
                <button
                  onClick={() => setUserCurrentPage(prev => Math.min(prev + 1, userTotalPages))}
                  disabled={userCurrentPage === userTotalPages}
                  className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'images' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Image Uploads with Preview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedImageUploads.map((record) => (
              <div key={extractId(record._id)} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                  {record.image_path ? (
                    <>
                      <img 
                        src={record.image_path} 
                        alt={safeRender(record.product_name)}
                        className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setPreviewImage({
                          isOpen: true,
                          imageUrl: record.image_path,
                          productName: safeRender(record.product_name)
                        })}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="flex flex-col items-center justify-center text-gray-400 h-full">
                                <svg class="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                <span class="text-xs">Image not found</span>
                              </div>
                            `;
                          }
                        }}
                      />
                      <button
                        onClick={() => setPreviewImage({
                          isOpen: true,
                          imageUrl: record.image_path,
                          productName: safeRender(record.product_name)
                        })}
                        className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Image className="w-8 h-8 mb-2" />
                      <span className="text-xs">No image</span>
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">{safeRender(record.product_name)}</p>
                <p className="text-xs text-gray-600">{maskPhoneNumber(safeRender(record.user_id))}</p>
                <p className="text-xs text-gray-500">
                  {record.timestamp ? format(new Date(record.timestamp), 'MMM dd, yyyy') : 'N/A'}
                </p>
              </div>
            ))}
          </div>

          {/* Image Uploads Pagination */}
          {imageTotalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing {((imageCurrentPage - 1) * imageItemsPerPage) + 1} to {Math.min(imageCurrentPage * imageItemsPerPage, imageUploads.length)} of {imageUploads.length} images
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setImageCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={imageCurrentPage === 1}
                  className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Page {imageCurrentPage} of {imageTotalPages}
                </span>
                <button
                  onClick={() => setImageCurrentPage(prev => Math.min(prev + 1, imageTotalPages))}
                  disabled={imageCurrentPage === imageTotalPages}
                  className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={previewImage.isOpen}
        onClose={() => setPreviewImage({ isOpen: false, imageUrl: '', productName: '' })}
        imageUrl={previewImage.imageUrl}
        productName={previewImage.productName}
      />
    </div>
  );
};

export default ProductAnalytics;