export interface User {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  name: string;
  passwordHash: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface UserFlow {
  id: string;
  userId: string;
  timestamp: Date;
  source: string;
  destination: string;
  action: string;
  productId?: string;
  sessionId: string;
  userAgent: string;
  ipAddress: string;
  rating?: number;
}

export interface ProductAnalytics {
  id: string;
  productName: string;
  category: string;
  brand: string;
  price: number;
  amazonPrice?: number;
  flipkartPrice?: number;
  imageDetected: boolean;
  brandDetected: boolean;
  searchSource: string;
  timestamp: Date;
  userId: string;
  deviceInfo?: string;
  errorCount: number;
  successCount: number;
}

export interface ProductFeedback {
  id: string;
  userId: string;
  productName: string;
  feedback: string;
  rating: number;
  timestamp: Date;
  category: string;
}

export interface CouponAnalytics {
  id: string;
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
    low: { value: number; count: number; used: number };
    mid: { value: number; count: number; used: number };
    high: { value: number; count: number; used: number };
    pro: { value: number; count: number; used: number };
    extreme: { value: number; count: number; used: number };
  };
}

export interface HeroDeal {
  id: string;
  category: string;
  vertical: string;
  productName: string;
  deal: string;
  fsn: string;
  productLink: string;
  verticalCleaning: string;
  timestamp: string;
}

export interface DashboardStats {
  totalUsers: number;
  uniqueUsers: number;
  totalSessions: number;
  totalErrors: number;
  conversionRate: number;
  avgSessionDuration: number;
  qrScans: {
    totalScans: number;
    todayScans: number;
    lastUpdated: string;
  };
  totalCouponsUsed: number;
  totalSavings: number;
  topProducts: Array<{
    id: string;
    productName: string;
    category: string;
    brand: string;
    price: number;
    successCount: number;
    timestamp: Date;
  }>;
  topCoupons: Array<{
    id: string;
    category: string;
    brand: string;
    usedCoupons: number;
    totalValue: number;
  }>;
}

export interface FilterOptions {
  dateRange: {
    start: string;
    end: string;
  };
  userSegment?: 'new' | 'returning' | 'premium';
  productCategory?: string;
  brand?: string;
  source?: string;
}

export interface QRScanData {
  qr_scan_count: number;
  todayScans?: number;
  lastUpdated?: string;
}

export interface AuthRequest {
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'editor' | 'viewer';
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchFilters {
  searchTerm?: string;
  category?: string;
  brand?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
}

export interface ExportOptions {
  type: 'products' | 'feedback' | 'coupons' | 'hero-deals' | 'user-flows';
  format: 'csv' | 'json' | 'xlsx';
  filters?: SearchFilters;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyReports: boolean;
  errorAlerts: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  notifications: NotificationSettings;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'error';
  uptime: number;
  lastCheck: string;
  services: {
    database: 'online' | 'offline' | 'degraded';
    api: 'online' | 'offline' | 'degraded';
    cache: 'online' | 'offline' | 'degraded';
  };
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  details: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseConnection {
  id: string;
  name: string;
  type: 'mongodb' | 'postgresql' | 'mysql';
  host: string;
  port: number;
  database: string;
  status: 'connected' | 'disconnected' | 'error';
  lastConnected?: Date;
}

export interface BackupInfo {
  id: string;
  name: string;
  size: number;
  createdAt: Date;
  type: 'full' | 'incremental';
  status: 'completed' | 'in-progress' | 'failed';
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
  percentage?: number;
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
  label?: string;
}

export interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any) => React.ReactNode;
}

export interface TableProps {
  columns: TableColumn[];
  data: any[];
  loading?: boolean;
  pagination?: PaginationOptions;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: SearchFilters) => void;
  onRowClick?: (row: any) => void;
  selectable?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'date' | 'file';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: any) => string | null;
  };
}

export interface FormConfig {
  fields: FormField[];
  onSubmit: (data: any) => void;
  initialValues?: any;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
}

// Re-export commonly used React types for convenience
export type { ReactNode, ComponentType, FC } from 'react';