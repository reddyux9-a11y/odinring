/**
 * Brand Colors Utility
 * 
 * Provides consistent access to the Mocha Medley brand color palette
 * and utility functions for color manipulation and contrast checking.
 */

/**
 * Mocha Medley Brand Colors
 * 
 * Primary brand palette inspired by rich coffee tones:
 * - Coffee Dark: Primary text, headers, emphasis
 * - Coffee: Secondary text, borders
 * - Taupe: Tertiary elements, dividers
 * - Sand: Light backgrounds, card surfaces
 * - Off-White: Primary backgrounds, page surfaces
 */
export const brandColors = {
  coffeeDark: '#332820',
  coffee: '#5A4D40',
  taupe: '#98867B',
  sand: '#D0C6BD',
  offWhite: '#EFEDEA',
  
  // HSL values for CSS variables
  hsl: {
    coffeeDark: '30 25% 18%',
    coffee: '30 18% 30%',
    taupe: '30 12% 52%',
    sand: '30 18% 75%',
    offWhite: '30 10% 93%'
  },
  
  // Dark mode adaptations
  dark: {
    coffeeDark: '#D4C5B0',
    coffee: '#B3A08F',
    taupe: '#9A8A7A',
    sand: '#3D3429',
    offWhite: '#1A1816',
    hsl: {
      coffeeDark: '30 25% 85%',
      coffee: '30 18% 70%',
      taupe: '30 12% 60%',
      sand: '30 18% 25%',
      offWhite: '30 10% 10%'
    }
  }
};

/**
 * Get brand color by name
 * @param {string} colorName - Name of the color (coffeeDark, coffee, taupe, sand, offWhite)
 * @param {boolean} isDark - Whether to return dark mode variant
 * @returns {string} Hex color code
 */
export const getBrandColor = (colorName, isDark = false) => {
  const palette = isDark ? brandColors.dark : brandColors;
  return palette[colorName] || brandColors.coffeeDark;
};

/**
 * Get brand color HSL value
 * @param {string} colorName - Name of the color
 * @param {boolean} isDark - Whether to return dark mode variant
 * @returns {string} HSL value for CSS
 */
export const getBrandColorHSL = (colorName, isDark = false) => {
  const palette = isDark ? brandColors.dark.hsl : brandColors.hsl;
  return palette[colorName] || brandColors.hsl.coffeeDark;
};

/**
 * Calculate brightness of a color
 * @param {string} hex - Hex color code (e.g., '#332820')
 * @returns {number} Brightness value (0-255)
 */
export const getBrightness = (hex) => {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substr(0, 2), 16);
  const g = parseInt(cleanHex.substr(2, 2), 16);
  const b = parseInt(cleanHex.substr(4, 2), 16);
  return ((r * 299) + (g * 587) + (b * 114)) / 1000;
};

/**
 * Check if a color is dark
 * @param {string} hex - Hex color code
 * @returns {boolean} True if color is dark (brightness < 128)
 */
export const isDarkColor = (hex) => {
  return getBrightness(hex) < 128;
};

/**
 * Get appropriate text color for a background
 * @param {string} backgroundColor - Hex color code of background
 * @returns {string} Hex color code for text (white or black)
 */
export const getTextColorForBackground = (backgroundColor) => {
  return isDarkColor(backgroundColor) ? '#ffffff' : '#000000';
};

/**
 * Get secondary text color for a background
 * @param {string} backgroundColor - Hex color code of background
 * @returns {string} Hex color code for secondary text
 */
export const getSecondaryTextColorForBackground = (backgroundColor) => {
  return isDarkColor(backgroundColor) ? '#e5e7eb' : '#6b7280';
};

/**
 * Calculate contrast ratio between two colors
 * @param {string} color1 - First hex color
 * @param {string} color2 - Second hex color
 * @returns {number} Contrast ratio (1-21)
 */
export const getContrastRatio = (color1, color2) => {
  const getLuminance = (hex) => {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substr(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substr(2, 2), 16) / 255;
    const b = parseInt(cleanHex.substr(4, 2), 16) / 255;
    
    const [rLinear, gLinear, bLinear] = [r, g, b].map(val => {
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  };
  
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Check if contrast meets WCAG AA standard (4.5:1 for normal text)
 * @param {string} foreground - Foreground hex color
 * @param {string} background - Background hex color
 * @returns {boolean} True if contrast meets WCAG AA
 */
export const meetsWCAGAA = (foreground, background) => {
  return getContrastRatio(foreground, background) >= 4.5;
};

/**
 * Get brand gradient
 * @param {string} variant - 'subtle', 'medium', or 'rich'
 * @param {boolean} isDark - Whether to return dark mode variant
 * @returns {string} CSS gradient string
 */
export const getBrandGradient = (variant = 'subtle', isDark = false) => {
  const palette = isDark ? brandColors.dark : brandColors;
  
  switch (variant) {
    case 'subtle':
      return `linear-gradient(135deg, ${palette.offWhite} 0%, ${palette.sand} 100%)`;
    case 'medium':
      return `linear-gradient(135deg, ${palette.sand} 0%, ${palette.taupe} 100%)`;
    case 'rich':
      return `linear-gradient(135deg, ${palette.coffee} 0%, ${palette.coffeeDark} 100%)`;
    default:
      return `linear-gradient(135deg, ${palette.offWhite} 0%, ${palette.sand} 100%)`;
  }
};

/**
 * Brand color presets for common use cases
 */
export const brandPresets = {
  primary: {
    background: brandColors.coffeeDark,
    text: brandColors.offWhite,
    description: 'Primary buttons, CTAs, important actions'
  },
  secondary: {
    background: brandColors.sand,
    text: brandColors.coffeeDark,
    description: 'Secondary buttons, subtle actions'
  },
  card: {
    background: brandColors.offWhite,
    border: brandColors.sand,
    text: brandColors.coffeeDark,
    description: 'Card components, elevated surfaces'
  },
  input: {
    background: brandColors.offWhite,
    border: brandColors.sand,
    focus: brandColors.coffee,
    placeholder: brandColors.taupe,
    description: 'Input fields, form elements'
  },
  link: {
    default: brandColors.coffeeDark,
    hover: brandColors.coffee,
    visited: brandColors.taupe,
    description: 'Link colors and states'
  }
};

export default brandColors;







