import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'fallback-32-character-key-change-me';
const IV_LENGTH = 16;

if (!process.env.ENCRYPTION_KEY) {
  console.warn('ENCRYPTION_KEY not set in environment variables. Using fallback key.');
}

// Derive a proper 32-byte key from the passphrase
const getKey = (): Buffer => {
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
};

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

export const decrypt = (encryptedText: string): string => {
  const textParts = encryptedText.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encrypted = textParts.join(':');
  const key = getKey();
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

export const hashPassword = (password: string): string => {
  return bcrypt.hashSync(password, 10);
};

export const verifyPassword = (password: string, storedHash: string): boolean => {
  return bcrypt.compareSync(password, storedHash);
};