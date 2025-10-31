/**
 * Centralized Brand Color System
 * 
 * This file contains all brand colors used throughout the application.
 * Import this file to use consistent colors across all components.
 */

export const Colors = {
  // Brand Colors
  brand: {
    lightGrey: '#F6F6F6',    // Light Grey (instead of white)
    darkGrey: '#1E1E1E',     // Dark Grey (instead of black)
    green: '#006A4E',         // Primary Green
    yellow: '#FFD403',        // Accent Yellow
  },

  // Semantic Colors (derived from brand colors)
  semantic: {
    // Backgrounds
    background: '#F6F6F6',    // Light Grey background
    surface: '#FFFFFF',       // White surface (cards, modals)
    surfaceSecondary: '#F6F6F6', // Secondary surface
    
    // Text Colors
    textPrimary: '#1E1E1E',   // Dark Grey for primary text
    textSecondary: '#8E8E93', // Muted text
    textTertiary: '#C7C7CC',  // Very light text
    
    // Interactive Elements
    primary: '#006A4E',       // Primary brand green
    primaryHover: '#005A42',  // Darker green for hover states
    secondary: '#FFD403',     // Yellow accent
    secondaryHover: '#E6BF03', // Darker yellow for hover
    
    // Status Colors
    success: '#006A4E',       // Success (using brand green)
    warning: '#FFD403',       // Warning (using brand yellow)
    error: '#FF3B30',         // Error red
    info: '#007AFF',          // Info blue
    
    // Border Colors
    border: '#E5E5E5',        // Light border
    borderSecondary: '#F0F0F0', // Very light border
    borderFocus: '#006A4E',   // Focus border (brand green)
    
    // Shadow Colors
    shadow: '#000000',        // Black shadow
    shadowLight: 'rgba(0, 0, 0, 0.05)', // Light shadow
    shadowMedium: 'rgba(0, 0, 0, 0.1)', // Medium shadow
    shadowHeavy: 'rgba(0, 0, 0, 0.3)',  // Heavy shadow
  },

  // Legacy Colors (for gradual migration)
  legacy: {
    // Old color mappings for backward compatibility
    iosLightGray: '#F5F5F7',  // Old iOS background
    iosDarkText: '#1C1C1E',   // Old dark text
    oldGreen: '#0C7C59',       // Old green color
    oldSecondary: '#8E8E93',  // Old secondary text
  },

  // Utility Colors
  utility: {
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
    overlay: 'rgba(0, 0, 0, 0.5)', // Semi-transparent overlay
  }
} as const;

// Type definitions for better TypeScript support
export type ColorKey = keyof typeof Colors;
export type BrandColorKey = keyof typeof Colors.brand;
export type SemanticColorKey = keyof typeof Colors.semantic;

// Helper function to get color with opacity
export const withOpacity = (color: string, opacity: number): string => {
  // Convert hex to rgba
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Helper function to get semantic color
export const getSemanticColor = (key: SemanticColorKey): string => {
  return Colors.semantic[key];
};

// Helper function to get brand color
export const getBrandColor = (key: BrandColorKey): string => {
  return Colors.brand[key];
};

export default Colors;
