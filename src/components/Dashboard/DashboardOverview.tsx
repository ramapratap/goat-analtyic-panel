import React from 'react';
import { Users, Activity, ShoppingCart, TrendingUp, AlertCircle, QrCode, RefreshCw, Ticket } from 'lucide-react';
import { DashboardStats } from '../../types';
import StatsCard from './StatsCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface DashboardOverviewProps {
  stats: DashboardStats;
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
  // Show skeleton while stats are loading
  if (!stats) {
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

  const conversionData = [
    { name: 'Jan', conversions: 45, visits: 100 },
    { name: 'Feb', conversions: 52, visits: 120 },
    { name: 'Mar', conversions: 38, visits: 95 },
    { name: 'Apr', conversions: 61, visits: 140 },
    { name: 'May', conversions: 48, visits: 110 },
    { name: 'Jun', conversions: 55, visits: 125 },
  ];

  const pieData = [
    { name: 'Success', value: 75, color: '#10B981' },
    { name: 'Errors', value: 15, color: '#EF4444' },
    { name: 'Pending', value: 10, color: '#F59E0B' },
  ];

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
                    {stats.qrScans.totalScans.toLocaleString()}
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
              Today: {stats.qrScans.todayScans.toLocaleString()}
            </p>
          </div>
          
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          change={12.5}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Unique Users"
          value={stats.uniqueUsers}
          change={8.2}
          icon={Activity}
          color="green"
        />
        <StatsCard
          title="Total Sessions"
          value={stats.totalSessions}
          change={-2.4}
          icon={TrendingUp}
          color="yellow"
        />
        <StatsCard
          title="Error Rate"
          value={stats.totalSessions > 0 ? ((stats.totalErrors / stats.totalSessions) * 100).toFixed(1) : '0'}
          change={-5.1}
          icon={AlertCircle}
          color="red"
          suffix="%"
        />
        <StatsCard
          title="Coupons Used"
          value={stats.totalCouponsUsed}
          icon={Ticket}
          color="green"
        />
        <StatsCard
          title="Total Savings"
          value={`₹${(stats.totalSavings / 1000).toFixed(0)}K`}
          icon={TrendingUp}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={conversionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="conversions" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="visits" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Success Rate Distribution</h3>
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
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Products</h3>
        {stats.topProducts && stats.topProducts.length > 0 ? (
          <div className="space-y-4">
            {stats.topProducts.slice(0, 5).map((product, index) => (
              <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{product.productName}</h4>
                    <p className="text-sm text-gray-600">{product.category} • {product.brand}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">₹{product.price.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">{product.successCount} conversions</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No product data available yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardOverview;