// Correctly reference the logo from the /public directory
export const defaultLogoUrl = '/swaz.png';
export const altLogoUrl = '/swaz-logo.png';

// Helper to get logo URL with fallback
export const getLogoUrl = (customLogoUrl?: string, customLogoBase64?: string): string => {
  if (customLogoBase64) return customLogoBase64;
  if (customLogoUrl) return customLogoUrl;
  return defaultLogoUrl; // Always return default as fallback
};
