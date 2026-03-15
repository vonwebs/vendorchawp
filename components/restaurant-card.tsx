import { useThemeColors } from '@/hooks/use-theme-colors';
import { Restaurant } from '@/types';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View, Animated } from 'react-native';
import { IconSymbol } from './ui/icon-symbol';

interface RestaurantCardProps {
  restaurant: Restaurant;
  compact?: boolean;
  onNavigate?: () => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

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

export function RestaurantCard({ restaurant, compact = false, onNavigate }: RestaurantCardProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const [imageLoaded, setImageLoaded] = useState(false);

  const cardWidth = compact ? 240 : CARD_WIDTH;
  const imageHeight = compact ? 135 : 180;

  const handlePress = () => {
    if (onNavigate) {
      onNavigate();
    } else {
      router.push(`/restaurant/${restaurant.id}` as any);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        compact ? styles.cardCompact : null,
        { width: cardWidth, backgroundColor: colors.cardBg, shadowColor: colors.shadowColor, shadowOpacity: colors.shadowOpacity },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={{ position: 'relative', backgroundColor: colors.cardBg }}>
        {!imageLoaded && <ImageSkeleton height={imageHeight} colors={colors} />}
        <Image 
          source={{ uri: restaurant.image }} 
          style={[styles.image, { height: imageHeight, opacity: imageLoaded ? 1 : 0 }]} 
          onLoad={() => setImageLoaded(true)}
        />
      </View>
      {!restaurant.isOpen && (
        <View style={[styles.closedOverlay, { height: imageHeight }]}>
          <Text style={styles.closedText}>Closed</Text>
        </View>
      )}
      <View style={[styles.content, compact && styles.contentCompact]}>
        <Text style={[compact ? styles.nameCompact : styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
          {restaurant.name}
        </Text>
        {!compact && (
          <Text style={[styles.cuisine, { color: colors.textSecondary }]} numberOfLines={1}>
            {restaurant.cuisine.join(' • ')}
          </Text>
        )}
        <View style={[styles.infoRow, compact && styles.infoRowCompact]}>
          <View style={styles.infoItem}>
            <IconSymbol name="star.fill" size={14} color="#FFD700" />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>{restaurant.rating}</Text>
          </View>
          <View style={styles.infoItem}>
            <IconSymbol name="clock" size={14} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>{restaurant.deliveryTime}</Text>
          </View>
        </View>
        {!compact && (
          <View style={styles.footer}>
            <Text style={[styles.deliveryFee, { color: colors.primary }]}>
              Delivery: ₵{restaurant.deliveryFee.toFixed(2)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    width: CARD_WIDTH,
  },
  cardCompact: {
    marginBottom: 0,
    marginRight: 12,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#f0f0f0',
  },
  closedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    height: 180,
  },
  closedText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  contentCompact: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  nameCompact: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  cuisine: {
    fontSize: 14,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 10,
  },
  infoRowCompact: {
    gap: 10,
    marginBottom: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryFee: {
    fontSize: 13,
    fontWeight: '700',
  },
});
