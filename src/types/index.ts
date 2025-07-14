// src/types/index.ts - Updated Types
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
  errorCount: any;
  successCount: any;
  _id: string;
  user_id: string;
  productName: string;
  productBrand?: string;
  productCategory?: string;
  productPrice?: number;
  searchSource?: string;
  timestamp: string;
}

export interface CouponAnalytics {
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

export interface ProductFeedback {
  id: string;
  productName: string;
  rating: number;
  timestamp: string;
  userId: string;
}

export interface CouponLink {
  _id: string;
  id: number;
  Coupon_Link: string;
  Coupon_type: string;
  is_used: boolean;
  timestamp: string;
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
  type: 'products' | 'coupons' | 'coupon-links' | 'user-flows' | 'product-feedback';
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

export interface CouponAnalyticsProps {
  couponAnalytics: CouponAnalytics[];
  onExport: (type: string, format?: string) => Promise<void>;
}

export interface ProductFeedbackProps {
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

// Database collection interfaces
export interface CouponData {
  _id: string;
  id: number;
  Category: string;
  Brand: string;
  Model: string;
  Coupon_Value_low: string;
  Coupon_Count_low: string;
  Coupon_Value_mid: string;
  Coupon_Count_mid: string;
  Coupon_Value_high: string;
  Coupon_Count_high: string;
  Coupon_Value_pro: string;
  Coupon_Count_pro: string;
  Coupon_Value_extreme: string;
  Coupon_Count_extreme: string;
}

export interface QRScanData {
  qr_scan_count: number;
  timestamp?: string;
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
export interface CouponSummary {
  totalCoupons: number;
  totalUsed: number;
  totalValue: number;
  averageUsageRate: number;
  totalActiveCoupons: number;
  typeDistribution: Record<string, {
    total: number;
    used: number;
    value: number;
    usageRate: number;
  }>;
  topCategories: Record<string, CategoryPerformance>;
  topBrands: Record<string, BrandPerformance>;
}

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