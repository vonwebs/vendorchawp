import { useThemeColors } from '@/hooks/use-theme-colors';
import React from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

const Shimmer = ({ style }: { style?: any }) => {
  const colors = useThemeColors();
  const opacity = React.useRef(new Animated.Value(0.3)).current;

  // Infer dark mode from text color
  const isDark = colors.textPrimary === '#FFFFFF';

  // Define base background color based on theme
  const baseColor = isDark ? 'rgba(255,255,255,0.1)' : '#E1E9EE';

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.shimmer,
        { 
          backgroundColor: baseColor,
          opacity: opacity,
        },
        style,
      ]}
    />
  );
};

export const HeroSkeleton = () => {
  return <Shimmer style={styles.hero} />;
};

export const SkeletonLine = ({ width = '60%', height = 14, style }: { width?: number | string; height?: number; style?: any }) => {
  return <Shimmer style={[styles.line, { width, height }, style]} />;
};

export const CategorySkeletonRow = () => {
  return (
    <View style={styles.row}>
      {[...Array(4)].map((_, i) => (
        <Shimmer key={i} style={styles.categoryPill} />
      ))}
    </View>
  );
};

export const RestaurantCardSkeleton = ({ compact = false }: { compact?: boolean }) => {
  const cardWidth = compact ? 240 : CARD_WIDTH;
  const imageHeight = compact ? 135 : 180;
  return (
    <View style={[styles.card, { width: cardWidth }]}>
      <Shimmer style={[styles.image, { height: imageHeight, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]} />
      <View style={[styles.cardContent, compact && { paddingHorizontal: 12, paddingVertical: 10 }]}>
        <Shimmer style={[styles.line, { width: compact ? '70%' : '55%', height: 16 }]} />
        {!compact && <Shimmer style={[styles.line, { width: '65%', height: 12, marginTop: 8 }]} />}
        <View style={[styles.row, { paddingHorizontal: 0, marginTop: 10, gap: compact ? 10 : 14 }]}>
          <Shimmer style={[styles.dot, { width: 12, height: 12 }]} />
          <Shimmer style={[styles.line, { width: 60, height: 12 }]} />
          <Shimmer style={[styles.dot, { width: 12, height: 12 }]} />
          <Shimmer style={[styles.line, { width: 70, height: 12 }]} />
          {!compact && <Shimmer style={[styles.line, { width: 90, height: 12 }]} />}
        </View>
        {!compact && <Shimmer style={[styles.line, { width: 110, height: 12, marginTop: 8 }]} />}
      </View>
    </View>
  );
};

export const FoodCardSkeleton = () => {
  return (
    <View style={[styles.card, { width: 200 }]}>
      <Shimmer style={[styles.image, { height: 120, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]} />
      <View style={styles.cardContent}>
        <Shimmer style={[styles.line, { width: '70%', height: 14 }]} />
        <Shimmer style={[styles.line, { width: '90%', height: 12, marginTop: 8 }]} />
        <View style={[styles.row, { paddingHorizontal: 0, marginTop: 10, justifyContent: 'space-between' }]}>
          <Shimmer style={[styles.line, { width: 70, height: 14 }]} />
          <Shimmer style={[styles.dot, { width: 16, height: 16 }]} />
        </View>
      </View>
    </View>
  );
};

export const SectionHeaderSkeleton = () => (
  <View style={[styles.row, { justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 }]}>
    <Shimmer style={[styles.line, { width: 140, height: 18 }]} />
    <Shimmer style={[styles.line, { width: 70, height: 14 }]} />
  </View>
);

export const RestaurantHeroSkeleton = () => (
  <View>
    <Shimmer style={[styles.hero, { height: 220 }]} />
    <View style={{ marginTop: 16, paddingHorizontal: 16, gap: 10 }}>
      <Shimmer style={[styles.line, { width: '50%', height: 18 }]} />
      <Shimmer style={[styles.line, { width: '70%', height: 14 }]} />
      <View style={[styles.row, { paddingHorizontal: 0, gap: 12 }]}>
        <Shimmer style={[styles.dot, { width: 14, height: 14 }]} />
        <Shimmer style={[styles.line, { width: 80, height: 12 }]} />
        <Shimmer style={[styles.dot, { width: 14, height: 14 }]} />
        <Shimmer style={[styles.line, { width: 70, height: 12 }]} />
      </View>
    </View>
  </View>
);

export const MenuItemRowSkeleton = () => (
  <View style={[styles.menuRow, { backgroundColor: 'transparent' }]}>
    <View style={{ flex: 1, gap: 8 }}>
      <Shimmer style={[styles.line, { width: '70%', height: 16 }]} />
      <Shimmer style={[styles.line, { width: '90%', height: 12 }]} />
      <Shimmer style={[styles.line, { width: '45%', height: 12 }]} />
    </View>
    <Shimmer style={[styles.menuImage]} />
  </View>
);

export const OrderCardSkeleton = () => (
  <View style={[styles.card, { padding: 16, backgroundColor: 'transparent', marginBottom: 12 }]}>
    <Shimmer style={[styles.line, { width: '50%', height: 14, marginBottom: 8 }]} />
    <View style={{ marginTop: 10, gap: 6 }}>
      <Shimmer style={[styles.line, { width: '75%', height: 12 }]} />
      <Shimmer style={[styles.line, { width: '65%', height: 12 }]} />
    </View>
    <View style={[styles.row, { justifyContent: 'space-between', paddingHorizontal: 0, marginTop: 12 }]}>
      <Shimmer style={[styles.line, { width: 80, height: 12 }]} />
      <Shimmer style={[styles.line, { width: 60, height: 12 }]} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  shimmer: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  hero: {
    marginTop: 16,
    marginHorizontal: 20,
    height: 150,
    borderRadius: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  categoryPill: {
    height: 34,
    width: 80,
    borderRadius: 12,
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  image: {
    width: '100%',
    borderRadius: 16,
  },
  cardContent: {
    padding: 12,
    gap: 6,
  },
  line: {
    height: 12,
    borderRadius: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  menuImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },
});
