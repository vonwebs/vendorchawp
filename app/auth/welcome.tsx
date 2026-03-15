

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, Animated, Easing, Dimensions, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useNavigation } from 'expo-router';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTheme } from '@/context/theme-context';
import { LinearGradient } from 'expo-linear-gradient';
import { requestNotificationPermissions, getDeviceToken, storeDeviceToken } from '@/services/notifications';

const { width } = Dimensions.get('window');

const WelcomeScreen = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const colors = useThemeColors();
  const { isDark } = useTheme();
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const hasPermission = await requestNotificationPermissions();
        if (hasPermission) {
          const token = await getDeviceToken();
          if (token) {
            await storeDeviceToken(user.uid, token, user.email);
          }
        }
        router.replace('/(tabs)' as any);
      } else {
        setAuthChecked(true);
      }
    });

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const startDotLoader = () => {
      const bounce = (anim: Animated.Value, delay: number) =>
        Animated.sequence([
          Animated.timing(anim, {
            toValue: -12,
            duration: 260,
            delay,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 260,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]);

      Animated.loop(
        Animated.stagger(150, [
          bounce(dot1Anim, 0),
          bounce(dot2Anim, 0),
          bounce(dot3Anim, 0),
        ])
      ).start();
    };
    startDotLoader();

    return unsubscribe;
  }, [navigation]);

  if (!authChecked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
          {[dot1Anim, dot2Anim, dot3Anim].map((anim, i) => (
            <Animated.View key={i} style={{ transform: [{ translateY: anim }] }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} />
            </Animated.View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#0F0F0F', '#1A1A1A'] : ['#F8FAFF', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <View style={styles.topSection}>
          <Animated.View style={[styles.textContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              CHAWP<Text style={{ color: colors.primary }}> VENDOR</Text>
            </Text>
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>
              Everything you need to manage your business in one powerful dashboard.
            </Text>
          </Animated.View>
        </View>

        <Animated.View style={[styles.buttonGroup, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.buttonWrapper}
            onPress={() => router.push('/vendor/login' as any)}
          >
            <LinearGradient
              colors={['#6366F1', '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonPrimary}
            >
              <Text style={styles.buttonPrimaryText}>Sign In to Dashboard</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.secondaryButton, { borderColor: isDark ? '#334155' : '#E2E8F0' }]}
            onPress={() => WebBrowser.openBrowserAsync('https://wa.me/233593117766?text=Hi%2C%20I%20want%20to%20become%20a%20Chawp%20Vendor')}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>
              Become a Partner
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={[styles.footerText, { color: colors.textTertiary }]}>
          Built for modern food businesses
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: '35%',
    paddingBottom: 80,
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  topSection: {
    alignItems: 'center',
    width: '100%',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -2,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 52,
  },
  tagline: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: '85%',
    fontWeight: '400',
    opacity: 0.9,
  },
  buttonGroup: {
    width: '100%',
    gap: 16,
    marginTop: 40,
  },
  buttonWrapper: {
    width: '100%',
    borderRadius: 14,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonPrimary: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonPrimaryText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
});

export default WelcomeScreen;
