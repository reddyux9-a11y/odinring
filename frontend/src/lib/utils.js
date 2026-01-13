import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitizes username for URL usage by replacing spaces with underscores
 * @param {string} username - The username to sanitize
 * @returns {string} - URL-safe username with underscores instead of spaces
 */
export function sanitizeUsernameForUrl(username) {
  if (!username) return "";
  return username.replace(/\s+/g, '_');
}
