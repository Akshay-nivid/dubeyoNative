/**
 * Single source of truth for app colors.
 * Used by: (1) Tailwind via tailwind.config.js → use classes like text-text_primary, bg-bg_white, border-border_primary.
 * (2) Native props (e.g. Icon color) → use colors.text_primary, colors.icon_secondary.
 * Changing values here and rebuilding applies the theme across the app.
 */
export const colors = {
  // Palette Colors from Design
  palette_dark_blue: "#151f5a",
  palette_light_blue_gray: "#f1edea",
  palette_light_cream: "#F7F7FA",
  // Primary Colors
  primary: "#108EAA", // Dark blue - Main brand color
  primary_dark: "#1f2937", // Darker shade for hover states
  primary_light: "#4a5568", // Lighter shade
  // Button Colors
  primary_btn: "#108EAA", // Dark blue - Primary button
  success_btn: "#16a34a", // Green-600 - Success button (keeping for functionality)
  danger_btn: "#dc2626", // Red-600 - Danger button
  // Background Colors
  bg_primary: "#F6F6F6", // Light cream - Main app background
  bg_secondary: "#ffffff", // Light blue-gray - Cards, sections, inputs
  bg_white: "#ffffff", // Pure white for cards/content
  bg_black: "#000000",
  bg_gray_400: "#9ca3af", // Medium gray (disabled states)
  // Text Colors (use in Tailwind: text-text_primary, text-text_tertiary, etc.)
  text_primary: "#151f5a", // Dark blue - Main text, input value text
  text_secondary: "#f1edea", // Light blue-gray - Secondary/muted text
  text_tertiary: "#9ca3af", // Gray-400 - Placeholder text, input placeholder
  text_light: "#F7F7FA", // Light cream - Text on dark backgrounds
  text_white: "#ffffff", // White text
  // Border Colors
  border_primary: "#f1edea", // Light blue-gray
  border_secondary: "#e5e7eb", // Light gray fallback
  // Icon Colors
  icon_primary: "#000000", // Dark blue
  icon_secondary: "#f1edea", // Light blue-gray
  icon_light: "#F7F7FA", // Light cream
  // Status Colors (keeping functional colors)
  success: "#16a34a",
  warning: "#ea580c",
  error: "#dc2626",

  // Post Ad Colors
  // Post Ad Colors
  main_bg_gradient_start: '#f7e2fbff',
  main_bg_gradient_middle: '#d8ecf9ff',
  main_bg_gradient_end: '#d7d1f3ff',
  post_ad_text_gradient_teal: '#14B8A6',
  post_ad_text_gradient_blue: '#3B82F6',
  post_ad_text_gradient_violet: '#8B5CF6',
  post_ad_upload_bg: '#F0F4FF',
  post_ad_upload_border: '#1e3a8a',
  post_ad_delete_icon: '#EF4444',
};
// Export for Tailwind config compatibility
export default colors;
