import { useThemeColors } from '@/hooks/use-theme-colors';
import { Category } from '@/types';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

interface CategoryChipProps {
  category: Category;
  isSelected: boolean;
  onPress: () => void;
}

export function CategoryChip({ category, isSelected, onPress }: CategoryChipProps) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        { backgroundColor: isSelected ? category.color : colors.surfaceBg },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.icon}>{category.icon}</Text>
      <Text style={[styles.text, { color: isSelected ? '#fff' : colors.textSecondary }]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );
}

interface CategoryListProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function CategoryList({ categories, selectedCategory, onSelectCategory }: CategoryListProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <CategoryChip
        category={{ id: 'all', name: 'All', icon: '🍽️', color: '#2D60FF' }}
        isSelected={selectedCategory === null}
        onPress={() => onSelectCategory(null)}
      />
      {categories.map((category) => (
        <CategoryChip
          key={category.id}
          category={category}
          isSelected={selectedCategory === category.id}
          onPress={() => onSelectCategory(category.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  content: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginRight: 8,
  },
  icon: {
    fontSize: 18,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedText: {
    color: '#fff',
  },
});
