import { useTheme } from '@/context/theme-context';

export const useThemeColors = () => {
  const { isDark } = useTheme();

  return {
    // Backgrounds
    background: isDark ? '#0F0F0F' : '#FAFAFA',
    cardBg: isDark ? '#1A1A1A' : '#FFFFFF',
    surfaceBg: isDark ? '#252525' : '#F5F5F5',

    // Text
    textPrimary: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#A0A0A0' : '#666666',
    textTertiary: isDark ? '#808080' : '#999999',

    // Accents
    primary: '#2D60FF',
    secondary: '#2D60FF',
    error: '#FF6B6B',
    success: '#4CAF50',
    warning: '#FFA500',

    // Borders
    border: isDark ? '#333333' : '#E0E0E0',
    divider: isDark ? '#1F1F1F' : '#F0F0F0',

    // Shadows
    shadowColor: isDark ? '#000000' : '#000000',
    shadowOpacity: isDark ? 0.4 : 0.08,
  };
};
