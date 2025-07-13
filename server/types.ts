import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'editor' | 'viewer';
  };
}

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
  errorCount: number;
  successCount: number;
}

export interface CouponAnalytics {
  id: string;
  couponCode: string;
  productId: string;
  userId: string;
  appliedCount: number;
  maxApplications: number;
  discountValue: number;
  discountType: 'percentage' | 'fixed';
  timestamp: Date;
  category: string;
  brand: string;
}