/**
 * VS Code Dark Theme Colors
 * Based on GitHub Dark theme used in VS Code
 */

import { Platform } from 'react-native';

// VS Code Dark Theme Colors
export const VSCodeColors = {
  // Backgrounds
  background: "#0D1117",        // Main background
  panel: "#161B22",             // Panel background
  editor: "#0D1117",            // Editor background
  surface: "#21262D",            // Surface elements
  
  // Borders
  border: "#30363D",            // Borders
  borderMuted: "#21262D",       // Muted borders
  
  // Text
  textPrimary: "#C9D1D9",       // Primary text
  textSecondary: "#8B949E",     // Secondary text
  textMuted: "#6E7681",         // Muted text
  
  // Buttons
  buttonPrimary: "#238636",     // GitHub green (primary action)
  buttonPrimaryHover: "#2EA043",
  buttonSecondary: "#21262D",   // Secondary button
  buttonSecondaryHover: "#30363D",
  buttonDanger: "#DA3633",      // Danger/delete
  
  // Accents
  accent: "#58A6FF",            // VS Code blue
  accentHover: "#79C0FF",
  success: "#238636",           // Success green
  warning: "#D29922",           // Warning yellow
  error: "#F85149",             // Error red
  
  // Special
  link: "#58A6FF",              // Links
  selection: "#264F78",         // Selection background
} as const;

export const Colors = {
  light: VSCodeColors,
  dark: VSCodeColors,
} as const;

// VS Code Fonts (Monospace)
export const Fonts = Platform.select({
  ios: {
    mono: 'Menlo',
    sans: 'SF Pro Text',
  },
  android: {
    mono: 'monospace',
    sans: 'Roboto',
  },
  default: {
    mono: 'monospace',
    sans: 'system',
  },
  web: {
    mono: "'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Fira Mono', 'Droid Sans Mono', 'Source Code Pro', 'Consolas', 'Courier New', monospace",
    sans: "'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
});

// Font weights
export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};


