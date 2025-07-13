import fetch from 'node-fetch';

const GOAT_API_BASE = 'https://goatapi.web-dimension.com/api/v1';
const QR_SCAN_API = 'https://s-qc.in/fetchQrById/686b71212597a48fc4b9bc95';

export interface QRScanData {
  qr_scan_count: number;
}

export interface ProductRecord {
  _id: string;
  product_name: string;
  price: string;
  image_path: string;
  timestamp: string;
  device_info: string;
  logo_detected: string;
  search_source: string;
  amazon_price: string;
  flipkart_price: string;
  user_id?: string;
}

export interface ProductFeedback {
  _id: string;
  user_id: string;
  product_name: string;
  feedback: string;
  rating: number;
  timestamp: string;
  category?: string;
}

// Fetch QR scan count
export const fetchQRScanCount = async (): Promise<QRScanData> => {
  try {
    const response = await fetch(QR_SCAN_API);
    if (!response.ok) {
      throw new Error(`QR API error: ${response.status}`);
    }
    const data = await response.json() as QRScanData;
    return data;
  } catch (error) {
    console.error('Error fetching QR scan count:', error);
    // Return fallback data
    return { qr_scan_count: 0 };
  }
};

// Fetch product records from GOAT API
export const fetchProductRecords = async (): Promise<ProductRecord[]> => {
  try {
    const response = await fetch(`${GOAT_API_BASE}/get-records`);
    if (!response.ok) {
      throw new Error(`Product records API error: ${response.status}`);
    }
    const data = await response.json() as ProductRecord[];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching product records:', error);
    return [];
  }
};

// Fetch product feedback from GOAT API
export const fetchProductFeedback = async (): Promise<ProductFeedback[]> => {
  try {
    const response = await fetch(`${GOAT_API_BASE}/get-records-feedback`);
    if (!response.ok) {
      throw new Error(`Product feedback API error: ${response.status}`);
    }
    const data = await response.json() as ProductFeedback[];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching product feedback:', error);
    return [];
  }
};