/**
 * Input Sanitization Utilities
 * Prevents XSS attacks by sanitizing user input
 */

// HTML tags to remove
const HTML_TAGS = /<[^>]*>/g;

// Special characters that could be dangerous
const DANGEROUS_CHARS = /[&<>"'`]/g;

const DANGEROUS_CHAR_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '`': '&#x60;',
};

/**
 * Sanitize HTML string to prevent XSS
 * Removes all HTML tags and escapes dangerous characters
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  
  // Remove HTML tags
  const withoutTags = input.replace(HTML_TAGS, '');
  
  // Escape dangerous characters
  const sanitized = withoutTags.replace(DANGEROUS_CHARS, (char) => 
    DANGEROUS_CHAR_MAP[char] || char
  );
  
  return sanitized;
}

/**
 * Sanitize object with string values
 * Recursively sanitizes all string properties
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized: any = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeHtml(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize email address
 * Basic validation and sanitization
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';
  
  // Trim whitespace and convert to lowercase
  const trimmed = email.trim().toLowerCase();
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    throw new Error('Invalid email format');
  }
  
  return trimmed;
}

/**
 * Sanitize URL
 * Only allows http, https, and mailto protocols
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  const trimmed = url.trim();
  
  try {
    const parsed = new URL(trimmed);
    
    // Only allow safe protocols
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return '';
    }
    
    return parsed.href;
  } catch {
    // If URL parsing fails, return empty string
    return '';
  }
}

/**
 * Sanitize file name
 * Removes dangerous characters and prevents path traversal
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return '';
  
  // Remove path components
  const basename = filename.split(/[\\/]/).pop() || '';
  
  // Remove dangerous characters
  const sanitized = basename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\.{2,}/g, '.'); // Prevent multiple dots
  
  return sanitized || 'unnamed';
}

/**
 * Validate and sanitize phone number
 * Allows only digits, +, -, (), and spaces
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';
  
  // Remove all characters except digits and common phone symbols
  return phone.replace(/[^\d+\-\s()]/g, '');
}

/**
 * Create a safe HTML attribute value
 */
export function sanitizeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Middleware-style sanitizer for API routes
 * Use this to sanitize request bodies
 */
export function sanitizeRequest<T extends Record<string, any>>(body: T): T {
  return sanitizeObject(body);
}
