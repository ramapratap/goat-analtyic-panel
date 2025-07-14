// src/types/index.ts - Updated Types for Actual API Integration
export interface FilterOptions {
  dateRange: {
    start: string;
    end: string;
  };
  category?: string;
  brand?: string;
  userType?: string;
}

export interface DashboardStats {
  totalUsers: number;
  uniqueUsers: number;
  totalSessions: number;
  totalErrors: number;
  conversionRate: string;
  qrScanCount: number;
  totalCoupons: number;
  totalCouponsUsed: number;
  totalSavings: number;
  avgSavingsPerCoupon: number;
  couponUsageRate: string;
  lastUpdated: string;
  dataSource: string;
  // Additional required fields
  avgSessionDuration: string;
  qrScans: number;
  topProducts: any[];
  topCoupons: any[];
}

export interface UserFlow {
  id: string;
  userId: string;
  timestamp: string;
  source: string;
  destination: string;
  action: string;
  productName?: string;
  productBrand?: string;
  sessionId: string;
  // Required fields
  userAgent: string;
  ipAddress: string;
}

export interface ProductAnalytics {
  _id: string;
  user_id: string;
  productName: string;
  productBrand?: string;
  productCategory?: string;
  productPrice?: number;
  searchSource?: string;
  timestamp: string;
  successCount: number;
  errorCount: number;
  platform?: string;
  savings?: string;
  category?: string;
  exclusive?: string | null;
  couponCode?: string | null;
  deviceInfo?: string;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  name?: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface ExportOptions {
  format: 'json' | 'csv';
  type: 'products' | 'user-flows';
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface PaginationInfo {
  limit: number;
  offset: number;
  hasMore: boolean;
  total?: number;
}

export interface ApiResponse<T> {
  data: T;
  pagination?: PaginationInfo;
  meta?: {
    timestamp: string;
    cached: boolean;
    source: string;
  };
  error?: string;
}

// QR Scan Data Types
export interface QRScanData {
  status: boolean;
  data: {
    qrData: {
      qr_scan_count: number;
      analytics: {
        deviceBreakdown: {
          mobile: number;
          tablet: number;
          desktop: number;
        };
        browserBreakdown: {
          chrome: number;
          firefox: number;
          safari: number;
          edge: number;
          other: number;
        };
        osBreakdown: {
          windows: number;
          macos: number;
          linux: number;
          ios: number;
          android: number;
          other: number;
        };
        timeStats: {
          hourlyScans: Record<string, number>;
          dailyScans: Record<string, number>;
          monthlyScans: Record<string, number>;
        };
        locationBreakdown: Record<string, number>;
        firstScan: string;
        lastScan: string;
      };
      qr_name: string;
      qr_url: string;
      first_created: string;
      last_updated: string;
    };
  };
  msg: string;
}

// Product Record Types
export interface ProductRecord {
  _id: string;
  product_name: string;
  price: string; // Contains user's uploaded image URL
  image_path: string;
  timestamp: string;
  device_info: string;
  logo_detected: string;
  search_source: string; // Contains amazon_name, flipkart_name, concise_name, etc.
  amazon_price: string;
  flipkart_price: {
    name: string;
    price: string;
    wow_price: string;
    link: string;
  } | string;
  user_id: string;
  input_type: string;
  flipkart_product_name: string;
  Category: string;
  exclusive: string | null;
  hero_deal: string | null;
  coupon_code: string | null;
}

// Search Source Info
export interface SearchSourceInfo {
  amazonName: string;
  flipkartName: string;
  conciseName: string;
  inputType: string;
  category: string;
  platform: string;
  savings: string;
  status: string;
}

// Component prop types
export interface DashboardOverviewProps {
  stats: DashboardStats | null;
  onRefreshQrScans: () => void;
}

export interface UserFlowAnalyticsProps {
  userFlows: UserFlow[];
  onExport: (type: string, format?: string) => Promise<void>;
}

export interface ProductAnalyticsProps {
  productAnalytics: ProductAnalytics[];
  onExport: (type: string, format?: string) => Promise<void>;
}

export interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

// Chart data interfaces
export interface ChartDataPoint {
  name: string;
  value: number;
  label?: string;
  color?: string;
}

export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
  category?: string;
}

export interface CategoryPerformance {
  category: string;
  count: number;
  totalValue: number;
  avgValue: number;
  usageRate?: number;
}

export interface BrandPerformance {
  brand: string;
  count: number;
  totalValue: number;
  avgValue: number;
  usageRate?: number;
}

// Analytics summary interfaces
export interface ProductSummary {
  totalProducts: number;
  totalValue: number;
  avgPrice: number;
  topCategories: CategoryPerformance[];
  topBrands: BrandPerformance[];
  priceRanges: { range: string; count: number }[];
}

export interface UserSummary {
  totalUsers: number;
  activeUsers: number;
  avgSessionDuration: string;
  totalSessions: number;
  conversionRate: number;
  topSources: { source: string; count: number }[];
}

// Device Analytics
export interface DeviceAnalytics {
  name: string;
  value: number;
  color: string;
}

// Daily Scan Trends
export interface DailyScanTrend {
  date: string;
  scans: number;
}

// Platform Performance
export interface PlatformPerformance {
  platform: string;
  count: number;
  successRate: number;
  totalSavings: number;
  avgSavings: number;
}

// Input Type Analytics
export interface InputTypeAnalytics {
  type: string;
  count: number;
  successRate: number;
  avgResponseTime?: number;
}

// Category Analytics
export interface CategoryAnalytics {
  category: string;
  count: number;
  successRate: number;
  totalSavings: number;
  avgPrice: number;
  topBrands: string[];
}

// Error Analytics
export interface ErrorAnalytics {
  errorType: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

// Performance Metrics
export interface PerformanceMetrics {
  responseTime: number;
  successRate: number;
  errorRate: number;
  throughput: number;
  availability: number;
}

// User Engagement
export interface UserEngagement {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  avgSessionsPerUser: number;
  avgSessionDuration: string;
  retentionRate: number;
}

// Export types
export type ExportType = 'products' | 'user-flows';
export type ExportFormat = 'json' | 'csv' | 'xlsx';

// Loading states
export interface LoadingStates {
  dashboard: boolean;
  userFlows: boolean;
  productAnalytics: boolean;
}

// Error types
export interface ErrorState {
  hasError: boolean;
  message: string;
  code?: string;
  timestamp: string;
}

// Success metrics
export interface SuccessMetrics {
  totalSuccessfulRequests: number;
  successRate: number;
  avgResponseTime: number;
  peakHour: string;
  bestPerformingCategory: string;
}