import React, { useState } from 'react';
import { ProductAnalytics as ProductAnalyticsType } from '../../types';
import { Download, Filter, Search, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProductAnalyticsProps {
  productAnalytics: ProductAnalyticsType[];
  onExport: (type: 'products', format: 'csv' | 'json') => void;
}

const ProductAnalytics: React.FC<ProductAnalyticsProps> = ({ productAnalytics, onExport }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredProducts = productAnalytics.filter(product => {
    const matchesSearch = product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = selectedBrand === 'all' || product.brand === selectedBrand;
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    
    return matchesSearch && matchesBrand && matchesCategory;
  });

  const brands = [...new Set(productAnalytics.map(product => product.brand))];
  const categories = [...new Set(productAnalytics.map(product => product.category))];

  const chartData = filteredProducts.slice(0, 10).map(product => ({
    name: product.productName.substring(0, 20) + '...',
    success: product.successCount,
    errors: product.errorCount,
    price: product.price,
  }));

  const getSuccessRate = (product: ProductAnalyticsType) => {
    const total = product.successCount + product.errorCount;
    return total > 0 ? (product.successCount / total) * 100 : 0;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Product Analytics</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onExport('products', 'csv')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Success vs Error Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="success" fill="#10B981" name="Success" />
            <Bar dataKey="errors" fill="#EF4444" name="Errors" />
          </BarChart>
        </ResponsiveContainer>
      </div>

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
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Brands</option>
            {brands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
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
                <th className="text-left py-3 px-4 font-medium text-gray-900">Brand</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Price</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Success Rate</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Detection</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Source</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => (
                <tr key={product.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{product.productName}</p>
                      <p className="text-xs text-gray-600">{format(new Date(product.timestamp), 'MMM dd, yyyy')}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {product.brand}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {product.category}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    ₹{product.price.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${getSuccessRate(product)}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">
                        {getSuccessRate(product).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {product.imageDetected && (
                        <CheckCircle className="w-4 h-4 text-green-600" title="Image Detected" />
                      )}
                      {product.brandDetected && (
                        <CheckCircle className="w-4 h-4 text-blue-600" title="Brand Detected" />
                      )}
                      {!product.imageDetected && !product.brandDetected && (
                        <AlertCircle className="w-4 h-4 text-red-600" title="No Detection" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {product.searchSource}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductAnalytics;