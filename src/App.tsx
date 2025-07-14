import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Sidebar from './components/Layout/Sidebar';
import DashboardOverview from './components/Dashboard/DashboardOverview';
import UserFlowAnalytics from './components/Analytics/UserFlowAnalytics';
import ProductAnalytics from './components/Analytics/ProductAnalytics';
import UserManagement from './components/UserManagement/UserManagement';
import FilterPanel from './components/FilterPanel';
import { useAnalytics } from './hooks/useAnalytics';
import { FilterOptions } from './types';
import { fetchQRScanData } from './services/externalApi';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [qrScanData, setQrScanData] = useState({
    totalScans: 0,
    todayScans: 0,
    lastUpdated: new Date().toISOString()
  });
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: {
      start: '2025-07-10', // Fixed date filter from July 10, 2025
      end: new Date().toISOString().split('T')[0],
    },
  });

  const { 
    stats, 
    userFlows, 
    productAnalytics, 
    loadingStates,
    isStatsLoaded,
    error, 
    exportData 
  } = useAnalytics(filters);

  const handleRefreshQrScans = async () => {
    try {
      const data = await fetchQRScanData();
      if (data.status && data.data?.qrData) {
        const qrData = data.data.qrData;
        const todayScans = Object.values(qrData.analytics?.timeStats?.dailyScans || {}).pop() as number || 0;
        
        setQrScanData({
          totalScans: qrData.qr_scan_count,
          todayScans,
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to refresh QR scans:', error);
    }
  };

  const renderContent = () => {
    // Show error state only for critical errors
    if (error && activeTab === 'dashboard' && !isStatsLoaded) {
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
        return <DashboardOverview stats={stats} onRefreshQrScans={handleRefreshQrScans} />;
      case 'products':
        return (
          <div>
            {loadingStates.productAnalytics && productAnalytics.length === 0 ? (
              <div className="p-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading product analytics...</span>
              </div>
            ) : (
              <ProductAnalytics productAnalytics={productAnalytics} onExport={exportData} />
            )}
          </div>
        );
      case 'user-flows':
        return (
          <div>
            {loadingStates.userFlows && userFlows.length === 0 ? (
              <div className="p-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading user flows...</span>
              </div>
            ) : (
              <UserFlowAnalytics userFlows={userFlows} onExport={exportData} />
            )}
          </div>
        );
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
        {(activeTab === 'dashboard' || activeTab === 'user-flows' || activeTab === 'products') && (
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <Login />;
};

export default App;