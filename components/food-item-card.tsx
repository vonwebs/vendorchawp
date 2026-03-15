import { useThemeColors } from '@/hooks/use-theme-colors';
import { MenuItem } from '@/types';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, Animated } from 'react-native';
import { IconSymbol } from './ui/icon-symbol';

interface FoodItemCardProps {
  item: MenuItem;
  onPress: () => void;
}

const ImageSkeleton = ({ height, colors }: { height: number; colors: any }) => {
  const opacity = React.useRef(new Animated.Value(0.3)).current;
  const isDark = colors.textPrimary === '#FFFFFF';

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height,
        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E1E9EE',
        opacity,
        zIndex: 1,
      }}
    />
  );
};

export function FoodItemCard({ item, onPress }: FoodItemCardProps) {
  const colors = useThemeColors();
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.cardBg, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity }]} onPress={onPress} activeOpacity={0.7}>
      <View style={{ position: 'relative', backgroundColor: colors.cardBg }}>
        {!imageLoaded && <ImageSkeleton height={120} colors={colors} />}
        <Image 
          source={{ uri: item.image }} 
          style={[styles.image, { opacity: imageLoaded ? 1 : 0 }]} 
          onLoad={() => setImageLoaded(true)}
        />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
          {item.isPopular && (
            <View style={styles.popularBadge}>
              <IconSymbol name="flame.fill" size={12} color="#FF6B6B" />
              <Text style={styles.popularText}>Popular</Text>
            </View>
          )}
        </View>
        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.footer}>
          <Text style={[styles.price, { color: colors.primary }]}>₵{item.price.toFixed(2)}</Text>
          {item.isVegetarian && (
            <View style={styles.vegBadge}>
              <Text style={styles.vegText}>🌱</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    width: 200,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
  },
  content: {
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FFE8E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  popularText: {
    fontSize: 10,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  vegBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  vegText: {
    fontSize: 12,
  },
});
