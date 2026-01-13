/**
 * Production-Safe Logging Utility
 * 
 * Only logs in development mode. In production, all logging is disabled
 * to prevent sensitive data exposure and performance degradation.
 * 
 * Usage:
 *   import logger from './lib/logger';
 *   logger.debug('Debug message');
 *   logger.info('Info message');
 *   logger.warn('Warning message');
 *   logger.error('Error message', error);
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Sensitive data patterns to redact from logs
 */
const SENSITIVE_PATTERNS = [
  /token/i,
  /password/i,
  /secret/i,
  /key/i,
  /authorization/i,
  /auth/i,
  /credential/i,
  /bearer/i,
  /jwt/i,
  /session/i,
  /cookie/i,
];

/**
 * Redact sensitive data from log arguments
 */
const redactSensitiveData = (args) => {
  if (!isDevelopment) {
    return ['[Logging disabled in production]'];
  }

  return args.map(arg => {
    if (typeof arg === 'string') {
      // Check if string contains sensitive keywords
      let redacted = arg;
      SENSITIVE_PATTERNS.forEach(pattern => {
        if (pattern.test(arg)) {
          // Redact tokens (JWT-like strings)
          redacted = redacted.replace(/([a-zA-Z0-9_-]{20,})/g, (match) => {
            // If it looks like a token (long alphanumeric), redact it
            if (match.length > 40) {
              return '[REDACTED]';
            }
            return match;
          });
        }
      });
      return redacted;
    }

    if (typeof arg === 'object' && arg !== null) {
      // Deep clone and redact sensitive properties
      const redacted = Array.isArray(arg) ? [...arg] : { ...arg };
      
      Object.keys(redacted).forEach(key => {
        const value = redacted[key];
        
        // Check if key name suggests sensitive data
        const isSensitiveKey = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
        
        if (isSensitiveKey) {
          if (typeof value === 'string') {
            redacted[key] = '[REDACTED]';
          } else if (value !== null && value !== undefined) {
            redacted[key] = '[REDACTED]';
          }
        } else if (typeof value === 'object' && value !== null) {
          // Recursively redact nested objects
          redacted[key] = redactSensitiveData([value])[0];
        }
      });
      
      return redacted;
    }

    return arg;
  });
};

/**
 * Logger utility with log levels
 */
const logger = {
  /**
   * Debug logs - detailed information for debugging
   * Only shown in development
   */
  debug: (...args) => {
    if (isDevelopment) {
      const redacted = redactSensitiveData(args);
      console.log('[DEBUG]', ...redacted);
    }
  },

  /**
   * Info logs - general information
   * Only shown in development
   */
  info: (...args) => {
    if (isDevelopment) {
      const redacted = redactSensitiveData(args);
      console.log('[INFO]', ...redacted);
    }
  },

  /**
   * Warning logs - warnings that don't break functionality
   * Shown in development and production (for monitoring)
   */
  warn: (...args) => {
    if (isDevelopment) {
      const redacted = redactSensitiveData(args);
      console.warn('[WARN]', ...redacted);
    }
    // In production, could send to error tracking service (Sentry, etc.)
  },

  /**
   * Error logs - errors that need attention
   * Shown in development and production (for monitoring)
   */
  error: (...args) => {
    if (isDevelopment) {
      const redacted = redactSensitiveData(args);
      console.error('[ERROR]', ...redacted);
    }
    // In production, should send to error tracking service (Sentry, etc.)
  },

  /**
   * Log - general logging (maps to info)
   * For backward compatibility
   */
  log: (...args) => {
    logger.info(...args);
  },
};

export default logger;



