import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
  interpolate
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const NetworkStatusBanner = () => {
  const { isConnected, isSlow } = useNetworkStatus();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  const isVisible = !isConnected || isSlow;

  useEffect(() => {
    if (isVisible) {
      translateY.value = withSpring(insets.top + 10, { damping: 15 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withTiming(-100, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [isVisible, insets.top]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: isConnected ? '#FF9500' : '#FF3B30',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 10,
        },
        animatedStyle
      ]}
    >
      <Ionicons
        name={isConnected ? 'timer-outline' : 'cloud-offline-outline'}
        size={18}
        color="#fff"
        style={{ marginRight: 8 }}
      />
      <Text style={[styles.text, { color: '#fff' }]}>
        {isConnected
          ? 'Network is slow'
          : 'You are offline'}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    justifyContent: 'center',
    zIndex: 9999,
  },
  text: {
    fontWeight: '700',
    fontSize: 14,
  },
});
