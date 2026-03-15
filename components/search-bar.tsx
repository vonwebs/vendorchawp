import { useThemeColors } from '@/hooks/use-theme-colors';
import React, { forwardRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { IconSymbol } from './ui/icon-symbol';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  editable?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export const SearchBar = forwardRef<TextInput, SearchBarProps>(
  ({ value, onChangeText, editable = true, placeholder = 'Search for food or restaurants', autoFocus = false }, ref) => {
    const colors = useThemeColors();

    return (
      <View style={[styles.container, { backgroundColor: colors.surfaceBg }]}>
        <IconSymbol name="magnifyingglass" size={20} color={colors.textSecondary} />
        <TextInput
          ref={ref}
          style={[styles.input, { color: colors.textPrimary }]}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          autoFocus={autoFocus}
        />
      </View>
    );
  }
);

SearchBar.displayName = 'SearchBar';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
});
