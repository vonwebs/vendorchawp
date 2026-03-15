import { useThemeColors } from '@/hooks/use-theme-colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

const AnimatedView = Animated.createAnimatedComponent(View);

const SPLASH_SHOWN_KEY = '@chawp_vendor_splash_shown';

export default function SplashScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const navigatedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [showSlowWarning, setShowSlowWarning] = useState(false);

  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const slideY = useSharedValue(20);

  useEffect(() => {
    const checkAndNavigate = async () => {
      try {
        // Always clear splash flag in dev to always show splash
        await AsyncStorage.removeItem(SPLASH_SHOWN_KEY);

        // Show splash animation
        setIsReady(true);

        // Animate logo scale and opacity
        opacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });
        scale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.2)) });
        slideY.value = withTiming(0, { duration: 700, easing: Easing.out(Easing.quad) });

        // Show warning if loading takes too long
        const warningTimer = setTimeout(() => {
          setShowSlowWarning(true);
        }, 4000);

        // Navigate to home after 2 seconds with smooth fade out
        const timer = setTimeout(() => {
          // Start fade out animation
          opacity.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) });
          scale.value = withTiming(0.9, { duration: 500, easing: Easing.out(Easing.quad) });

          // Navigate after fade completes
          setTimeout(() => {
            if (!navigatedRef.current) {
              navigatedRef.current = true;
              router.replace('/(tabs)' as any);
            }
          }, 500);
        }, 2000);

        return () => {
          clearTimeout(timer);
          clearTimeout(warningTimer);
        };
      } catch (error) {
        console.error('Splash screen error:', error);
        setIsReady(true);
      }
    };

    checkAndNavigate();
  }, [router, scale, opacity, slideY]);

  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }, { translateY: slideY.value }],
      opacity: opacity.value,
    };
  });

  const subtitleAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(opacity.value, [0, 1], [0, 1]),
      transform: [{ translateY: interpolate(slideY.value, [20, 0], [10, 0]) }],
    };
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      scrollEnabled={false}
      bounces={false}
    >
      <AnimatedView style={logoAnimatedStyle}>
        <View style={styles.logoWrapper}>
          <View style={[styles.logoContainer, { backgroundColor: colors.cardBg }]}>
            <Animated.Image
              source={require('@/assets/images/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>
      </AnimatedView>

      <Animated.View style={[styles.titleContainer, subtitleAnimatedStyle]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          CHAWP<Text style={{ color: colors.primary }}> VENDOR</Text>
        </Text>
        <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
          Partner Portal
        </Text>
      </Animated.View>

      {showSlowWarning && (
        <View style={styles.warningContainer}>
          <Text style={[styles.warningText, { color: colors.textSecondary }]}>
            Optimization in progress...
          </Text>
        </View>
      )}

      <View style={styles.dotsContainer}>
        {[0, 1, 2].map((i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: colors.primary,
                opacity: interpolate(opacity.value, [0, 1], [0.1, 0.3 + i * 0.2]),
              },
            ]}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  logoWrapper: {
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  warningContainer: {
    position: 'absolute',
    bottom: 120,
    alignItems: 'center',
  },
  warningText: {
    fontSize: 13,
    fontWeight: '500',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    gap: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
