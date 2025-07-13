import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Sidebar from './components/Layout/Sidebar';
import DashboardOverview from './components/Dashboard/DashboardOverview';
import UserFlowAnalytics from './components/Analytics/UserFlowAnalytics';
import ProductAnalytics from './components/Analytics/ProductAnalytics';
import ProductFeedback from './components/Analytics/ProductFeedback';
import CouponAnalytics from './components/Analytics/CouponAnalytics';
import HeroDeals from './components/Analytics/HeroDeals';
import UserManagement from './components/UserManagement/UserManagement';
import FilterPanel from './components/FilterPanel';
import { useAnalytics } from './hooks/useAnalytics';
import { FilterOptions } from './types';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [qrScanData, setQrScanData] = useState({
    totalScans: 1247,
    todayScans: 89,
    lastUpdated: new Date().toISOString()
  });
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
  });

  const { stats, userFlows, productAnalytics, couponAnalytics, loading, error, exportData } = useAnalytics(filters);
  const { productFeedback, heroDeals } = useAnalytics(filters);

  const handleRefreshQrScans = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/analytics/qr-scans', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setQrScanData(data);
      }
    } catch (error) {
      console.error('Failed to refresh QR scans:', error);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return stats ? <DashboardOverview stats={stats} onRefreshQrScans={handleRefreshQrScans} /> : null;
      case 'products':
        return <ProductAnalytics productAnalytics={productAnalytics} onExport={exportData} />;
      case 'product-feedback':
        return <ProductFeedback onExport={exportData} />;
      case 'coupons':
        return <CouponAnalytics couponAnalytics={couponAnalytics} onExport={exportData} />;
      case 'hero-deals':
        return <HeroDeals onExport={exportData} />;
      case 'user-flows':
        return <UserFlowAnalytics userFlows={userFlows} onExport={exportData} />;
      case 'users':
        return user?.role === 'admin' ? <UserManagement /> : null;
      default:
        return <div className="p-6">Content not found</div>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
      />
      <div className="flex-1 overflow-auto">
        {(activeTab === 'dashboard' || activeTab === 'user-flows' || activeTab === 'products' || activeTab === 'product-feedback' || activeTab === 'coupons' || activeTab === 'hero-deals') && (
          <div className="p-6 pb-0">
            <FilterPanel filters={filters} onFiltersChange={setFilters} />
          </div>
        )}
        {renderContent()}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return user ? <Dashboard /> : <Login />;
};

export default App;