/**
 * Password Validation Utilities
 * 
 * Single source of truth for password validation rules.
 * Rules MUST match backend validation (see docs/PASSWORD_VALIDATION_SPEC.md)
 * 
 * @see docs/PASSWORD_VALIDATION_SPEC.md
 */

// Password validation constants (must match backend)
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_UPPERCASE_REGEX = /[A-Z]/;
export const PASSWORD_LOWERCASE_REGEX = /[a-z]/;
export const PASSWORD_DIGIT_REGEX = /[0-9]/;

/**
 * Validate password against all requirements
 * 
 * @param {string} password - Password to validate
 * @returns {{valid: boolean, errors: string[]}} - Validation result
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    errors.push("Password must be at least 8 characters");
  }
  
  if (!PASSWORD_UPPERCASE_REGEX.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (!PASSWORD_LOWERCASE_REGEX.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (!PASSWORD_DIGIT_REGEX.test(password)) {
    errors.push("Password must contain at least one digit");
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Check if password meets all requirements (quick validation)
 * 
 * @param {string} password - Password to check
 * @returns {boolean} - True if password is valid
 */
export const isPasswordValid = (password) => {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return false;
  }
  
  if (!PASSWORD_UPPERCASE_REGEX.test(password)) {
    return false;
  }
  
  if (!PASSWORD_LOWERCASE_REGEX.test(password)) {
    return false;
  }
  
  if (!PASSWORD_DIGIT_REGEX.test(password)) {
    return false;
  }
  
  return true;
};

/**
 * Get password validation requirements as a string
 * 
 * @returns {string} - Human-readable requirements
 */
export const getPasswordRequirements = () => {
  return "Must be 8+ characters with uppercase, lowercase, and digit";
};



