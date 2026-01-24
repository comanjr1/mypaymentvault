import { createCipheriv, createDecipheriv, randomBytes, scryptSync, createHash } from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;

// Validate encryption environment variables on startup
function validateEncryptionConfig() {
  if (!process.env.ENCRYPTION_SECRET || process.env.ENCRYPTION_SECRET.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_SECRET must be set and at least 32 characters in production');
    }
    console.warn('WARNING: Using default ENCRYPTION_SECRET. Set a strong secret in production!');
  }
  
  if (!process.env.ENCRYPTION_SALT || process.env.ENCRYPTION_SALT.length < 16) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_SALT must be set and at least 16 characters in production');
    }
    console.warn('WARNING: Using default ENCRYPTION_SALT. Set a strong salt in production!');
  }
}

// Run validation on module load
validateEncryptionConfig();

const SALT = process.env.ENCRYPTION_SALT || 'default-salt-dev-only';
const SECRET = process.env.ENCRYPTION_SECRET || 'default-secret-dev-only-change-me';

// Derive encryption key from secret
function getKey(): Buffer {
  return scryptSync(SECRET, SALT, KEY_LENGTH);
}

/**
 * Encrypt sensitive data
 * @param text - Plain text to encrypt
 * @returns Encrypted string with IV and auth tag
 */
export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const key = getKey();
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return IV:authTag:encrypted format
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 * @param encryptedData - Encrypted string with IV and auth tag
 * @returns Decrypted plain text
 */
export function decrypt(encryptedData: string): string {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [ivHex, authTagHex, encrypted] = parts;
    const key = getKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash sensitive data for logging (one-way, cannot be decrypted)
 * @param text - Plain text to hash
 * @returns SHA-256 hash
 */
export function hashForLogging(text: string): string {
  return createHash('sha256').update(text).digest('hex').substring(0, 16) + '...';
}

/**
 * Redact sensitive data for logging
 * @param text - Text to redact
 * @returns Redacted text showing only first/last chars
 */
export function redactForLogging(text: string): string {
  if (!text || text.length < 4) return '****';
  return `${text.substring(0, 2)}${'*'.repeat(text.length - 4)}${text.substring(text.length - 2)}`;
}
