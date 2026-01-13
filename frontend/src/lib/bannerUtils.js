// Banner pattern utilities for consistent banner implementation across components

export const BANNER_PATTERNS = {
  gradient: {
    id: "gradient",
    name: "Gradient",
    className: "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500",
    preview: "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"
  },
  dots: {
    id: "dots", 
    name: "Dots",
    className: "bg-gradient-to-br from-blue-400 to-purple-600",
    preview: "bg-gradient-to-br from-blue-400 to-purple-600"
  },
  waves: {
    id: "waves",
    name: "Waves", 
    className: "bg-gradient-to-br from-emerald-400 to-blue-500",
    preview: "bg-gradient-to-br from-emerald-400 to-blue-500"
  },
  geometric: {
    id: "geometric",
    name: "Geometric",
    className: "bg-gradient-to-br from-orange-400 to-red-500", 
    preview: "bg-gradient-to-br from-orange-400 to-red-500"
  },
  minimal: {
    id: "minimal",
    name: "Minimal",
    className: "bg-gradient-to-br from-gray-100 to-gray-200",
    preview: "bg-gradient-to-br from-gray-100 to-gray-200"
  },
  solid: {
    id: "solid",
    name: "Solid",
    className: "bg-gray-200",
    preview: "bg-gray-200"
  }
};

/**
 * Get banner pattern configuration by ID
 * @param {string} patternId - The pattern identifier
 * @returns {object} Pattern configuration object
 */
export const getBannerPattern = (patternId) => {
  return BANNER_PATTERNS[patternId] || BANNER_PATTERNS.gradient;
};

/**
 * Get banner pattern class name for styling
 * @param {string} patternId - The pattern identifier  
 * @returns {string} CSS class name
 */
export const getBannerPatternClass = (patternId) => {
  return getBannerPattern(patternId).className;
};

/**
 * Get all banner patterns as array for UI components
 * @returns {Array} Array of pattern objects
 */
export const getAllBannerPatterns = () => {
  return Object.values(BANNER_PATTERNS);
};

/**
 * Get default banner pattern
 * @returns {string} Default pattern ID
 */
export const getDefaultBannerPattern = () => {
  return "gradient";
};

/**
 * Validate banner pattern ID
 * @param {string} patternId - The pattern identifier to validate
 * @returns {boolean} True if valid pattern ID
 */
export const isValidBannerPattern = (patternId) => {
  return patternId && BANNER_PATTERNS.hasOwnProperty(patternId);
};
