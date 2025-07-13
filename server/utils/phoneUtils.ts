// Utility to mask phone numbers for privacy
export const maskPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return 'XXXXXXXXXX';
  }
  
  // Remove any non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  if (digits.length >= 10) {
    // Show first 2 and last 2 digits, mask the middle
    const first = digits.substring(0, 2);
    const last = digits.substring(digits.length - 2);
    const middle = 'X'.repeat(digits.length - 4);
    return `${first}${middle}${last}`;
  }
  
  // If less than 10 digits, mask all but first and last
  if (digits.length > 2) {
    const first = digits.substring(0, 1);
    const last = digits.substring(digits.length - 1);
    const middle = 'X'.repeat(digits.length - 2);
    return `${first}${middle}${last}`;
  }
  
  return 'X'.repeat(digits.length);
};

// Check if user ID contains only numbers (real user) or has alphabets (test user)
export const isRealUser = (userId: string): boolean => {
  if (!userId || typeof userId !== 'string') {
    return false;
  }
  
  // Remove any non-alphanumeric characters and check if it contains only digits
  const cleaned = userId.replace(/[^a-zA-Z0-9]/g, '');
  return /^\d+$/.test(cleaned);
};