import React, { useState } from 'react';
import { CouponAnalytics as CouponAnalyticsType } from '../../types';
import { Download, Search, Tag, TrendingUp, Users, Percent } from 'lucide-react';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';

interface CouponAnalyticsProps {
  couponAnalytics: CouponAnalyticsType[];
  onExport: (type: 'coupons', format: 'csv' | 'json') => void;
}

const CouponAnalytics: React.FC<CouponAnalyticsProps> = ({ couponAnalytics, onExport }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');

  const filteredCoupons = couponAnalytics.filter(coupon => {
    const matchesSearch = coupon.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coupon.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || coupon.category === selectedCategory;
    const matchesBrand = selectedBrand === 'all' || coupon.brand === selectedBrand;
    
    return matchesSearch && matchesCategory && matchesBrand;
  });

  const categories = [...new Set(couponAnalytics.map(coupon => coupon.category))];
  const brands = [...new Set(couponAnalytics.map(coupon => coupon.brand))];

  const pieData = categories.map(category => ({
    name: category,
    value: couponAnalytics.filter(c => c.category === category).length,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`,
  }));

  const usageData = filteredCoupons.slice(0, 10).map(coupon => ({
    name: coupon.model.substring(0, 15) + '...',
    used: coupon.usedCoupons,
    total: coupon.totalCoupons,
    usageRate: coupon.usageRate
  }));

  const getTotalSavings = () => {
    return filteredCoupons.reduce((total, coupon) => total + coupon.totalValue, 0);
  };

  const getTotalUsed = () => {
    return filteredCoupons.reduce((total, coupon) => total + coupon.usedCoupons, 0);
  };

  const getAverageUsageRate = () => {
    if (filteredCoupons.length === 0) return 0;
    return filteredCoupons.reduce((total, coupon) => total + coupon.usageRate, 0) / filteredCoupons.length;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Coupon Analytics</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onExport('coupons', 'csv')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Tag className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Total Used</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{getTotalUsed()}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Total Savings</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">₹{getTotalSavings().toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Percent className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Avg. Usage Rate</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{getAverageUsageRate().toFixed(1)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={usageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="used" fill="#3B82F6" name="Used" />
              <Bar dataKey="total" fill="#E5E7EB" name="Total Available" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

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
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Brands</option>
            {brands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Product Model</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Brand</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Usage Rate</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Used/Total</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Total Value</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Last Used</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoupons.map((coupon, index) => (
                <tr key={coupon.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{coupon.model}</p>
                      <p className="text-xs text-gray-500">ID: {coupon.id}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {coupon.brand}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {coupon.category}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${coupon.usageRate}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">
                        {coupon.usageRate.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {coupon.usedCoupons} / {coupon.totalCoupons}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    ₹{coupon.totalValue.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {coupon.lastUsed ? format(new Date(coupon.lastUsed), 'MMM dd, yyyy') : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCoupons.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No coupons found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CouponAnalytics;