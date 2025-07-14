// server/utils/phoneUtils.ts
/**
 * Utility functions for phone number handling and user validation
 */

/**
 * Masks a phone number for privacy protection
 * Example: "9876543210" -> "98****3210"
 */
export const maskPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return 'XXXXXXXXXX';
  }

  // Remove any non-digit characters
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  if (cleanNumber.length < 4) {
    return 'XXXXXXXXXX';
  }

  if (cleanNumber.length === 10) {
    // Indian mobile number format: 98****3210
    return `${cleanNumber.slice(0, 2)}****${cleanNumber.slice(-4)}`;
  } else if (cleanNumber.length === 11 && cleanNumber.startsWith('0')) {
    // Remove leading 0 and format
    const withoutZero = cleanNumber.slice(1);
    return `${withoutZero.slice(0, 2)}****${withoutZero.slice(-4)}`;
  } else if (cleanNumber.length > 10) {
    // International format or longer numbers
    return `${cleanNumber.slice(0, 2)}****${cleanNumber.slice(-4)}`;
  } else {
    // Shorter numbers
    return `${cleanNumber.slice(0, 2)}****${cleanNumber.slice(-2)}`;
  }
};

/**
 * Validates if a phone number appears to be from a real user
 * Filters out test numbers, dummy data, etc.
 */
export const isRealUser = (phoneNumber: string): boolean => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return false;
  }

  // Remove any non-digit characters
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // Basic length validation (Indian mobile numbers are typically 10 digits)
  if (cleanNumber.length < 7 || cleanNumber.length > 15) {
    return false;
  }

  // Common test/dummy number patterns to exclude
  const testPatterns = [
    /^0+$/, // All zeros
    /^1+$/, // All ones
    /^9+$/, // All nines
    /^1234567/, // Sequential numbers
    /^9876543/, // Reverse sequential
    /^0000000/, // Test pattern
    /^1111111/, // Repeated ones
    /^9999999/, // Repeated nines
    /^5555555/, // Repeated fives
    /^7777777/, // Repeated sevens
    /^8888888/, // Repeated eights
  ];

  // Check if number matches any test pattern
  for (const pattern of testPatterns) {
    if (pattern.test(cleanNumber)) {
      return false;
    }
  }

  // Check for valid Indian mobile number prefixes
  if (cleanNumber.length === 10) {
    const validPrefixes = ['6', '7', '8', '9']; // Valid Indian mobile prefixes
    if (!validPrefixes.includes(cleanNumber[0])) {
      return false;
    }
  }

  // Check for numbers that are too repetitive
  const uniqueDigits = new Set(cleanNumber.split(''));
  if (uniqueDigits.size < 3) {
    // If number has less than 3 unique digits, likely fake
    return false;
  }

  // Additional validation: check for ascending/descending sequences
  let isAscending = true;
  let isDescending = true;
  
  for (let i = 1; i < cleanNumber.length; i++) {
    const current = parseInt(cleanNumber[i]);
    const previous = parseInt(cleanNumber[i - 1]);
    
    if (current !== previous + 1) {
      isAscending = false;
    }
    if (current !== previous - 1) {
      isDescending = false;
    }
  }
  
  // Reject pure ascending or descending sequences
  if (isAscending || isDescending) {
    return false;
  }

  return true;
};

/**
 * Validates if an email appears to be from a real user
 */
export const isRealEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  // Common test email patterns to exclude
  const testPatterns = [
    /test@/i,
    /dummy@/i,
    /fake@/i,
    /example@/i,
    /@test\./i,
    /@example\./i,
    /@dummy\./i,
    /admin@admin/i,
    /user@user/i,
    /123@/i,
    /abc@/i,
  ];

  for (const pattern of testPatterns) {
    if (pattern.test(email)) {
      return false;
    }
  }

  return true;
};

/**
 * Sanitizes user ID for safe database queries
 */
export const sanitizeUserId = (userId: string): string => {
  if (!userId || typeof userId !== 'string') {
    return '';
  }

  // Remove any potentially harmful characters
  return userId.replace(/[^\w\d@.+-]/g, '');
};

/**
 * Formats phone number for display
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return '';
  }

  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  if (cleanNumber.length === 10) {
    // Format as: +91 98765 43210
    return `+91 ${cleanNumber.slice(0, 5)} ${cleanNumber.slice(5)}`;
  } else if (cleanNumber.length === 11 && cleanNumber.startsWith('0')) {
    // Remove leading 0 and format
    const withoutZero = cleanNumber.slice(1);
    return `+91 ${withoutZero.slice(0, 5)} ${withoutZero.slice(5)}`;
  }
  
  return phoneNumber;
};

/**
 * Gets user type based on usage patterns
 */
export const getUserType = (sessionCount: number, feedbackCount: number): 'new' | 'returning' | 'power' => {
  if (sessionCount === 1 && feedbackCount === 0) {
    return 'new';
  } else if (sessionCount > 10 || feedbackCount > 3) {
    return 'power';
  } else {
    return 'returning';
  }
};

/**
 * Validates user activity patterns
 */
export const isValidUserActivity = (sessions: any[]): boolean => {
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return false;
  }

  // Check for suspicious patterns like too many sessions in short time
  const timestamps = sessions.map(s => new Date(s.timestamp).getTime()).sort();
  
  // Check if all sessions are within a very short time frame (suspicious)
  const timeRange = timestamps[timestamps.length - 1] - timestamps[0];
  const averageInterval = timeRange / (timestamps.length - 1);
  
  // If average interval is less than 1 second, likely bot activity
  if (averageInterval < 1000 && sessions.length > 5) {
    return false;
  }

  return true;
};

export default {
  maskPhoneNumber,
  isRealUser,
  isRealEmail,
  sanitizeUserId,
  formatPhoneNumber,
  getUserType,
  isValidUserActivity
};