/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // Added theme-specific colors
    placeholder: '#9BA1A6', // A standard placeholder gray
    card: '#FFFFFF',       // Standard white card for light mode
    border: '#E1E3E5',     // Light gray border
    inputBackground: '#F9F9F9', // Slightly off-white input background
    backgroundSubtle: '#F0F8FF', // Alice blue for subtle backgrounds
    textSecondary: '#687076', // Secondary text color
    error: '#F44336',       // Use existing danger color
    successMuted: '#A5D6A7', // Muted green
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // Added theme-specific colors
    placeholder: '#687076', // Darker placeholder for dark mode
    card: '#1C1C1E',       // Slightly off-black card for dark mode
    border: '#3A3A3C',     // Darker gray border
    inputBackground: '#2C2C2E', // Dark input background
    backgroundSubtle: '#2C2C2E', // Dark subtle background
    textSecondary: '#9BA1A6', // Secondary text color for dark
    error: '#FF6B6B',       // Lighter red for dark mode error
    successMuted: '#4E8E50', // Darker muted green
  },

  // Note: darkGray seems redundant with dark, consider removing or differentiating
  darkGray: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },

  primary: '#0a7ea4',
  primaryLight: '#88c8d8',
  primaryDark: '#065d7a',
  
  // Colores secundarios
  secondary: '#4CAF50',
  secondaryLight: 'rgba(76, 175, 80, 0.1)',
  secondaryDark: '#2E7D32',
  
  // Estados
  success: '#4CAF50',
  warning: '#FFC107',
  danger: '#F44336',
  info: '#2196F3',
};
