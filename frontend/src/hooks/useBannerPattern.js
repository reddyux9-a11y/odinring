import { useMemo } from "react";
import { getBannerPatternClass, getDefaultBannerPattern, isValidBannerPattern } from "../lib/bannerUtils";

/**
 * Custom hook for banner pattern management
 * @param {object} profile - User profile object
 * @returns {object} Banner pattern utilities and state
 */
export const useBannerPattern = (profile) => {
  return useMemo(() => {
    const patternId = profile?.banner_pattern || getDefaultBannerPattern();
    const isValid = isValidBannerPattern(patternId);
    const finalPatternId = isValid ? patternId : getDefaultBannerPattern();
    const className = getBannerPatternClass(finalPatternId);
    
    return {
      patternId: finalPatternId,
      className,
      isValid,
      isDefault: finalPatternId === getDefaultBannerPattern()
    };
  }, [profile?.banner_pattern]);
};
