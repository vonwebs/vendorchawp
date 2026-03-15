import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useNavigation, router } from 'expo-router';

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();
  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);
  const colors = useThemeColors();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <IconSymbol name="chevron.left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Privacy Policy</Text>
          <View style={styles.headerRight} />
        </View>
        <Text style={[styles.text, { color: colors.textSecondary }]}>Your privacy is important to us. We are committed to protecting your personal information and your right to privacy. This policy explains what data we collect, how we use it, and your rights.</Text>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Data We Collect</Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>- Name, email, and phone number (if provided)</Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>- Order and delivery details</Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>- Device information and usage data (for app improvement)</Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>- Device token for push notifications (if enabled)</Text>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>How We Use Your Data</Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>- To process and deliver your orders</Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>- To send you notifications about your orders (if enabled)</Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>- To improve app experience and provide customer support</Text>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Data Storage & Security</Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>- All data is securely stored using Google Firebase services</Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>- Your data is encrypted and protected with industry-standard security practices</Text>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Third-Party Sharing</Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>- We do not sell or share your data with third parties</Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>- Your data is only shared with Firebase to provide core app functionality</Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>- We do not use analytics or crash reporting tools that collect personal data</Text>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Your Rights & Choices</Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>- You can update or delete your account at any time from the app</Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>- You can opt out of notifications in your device settings</Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>- To request deletion of your data, contact us at the email below</Text>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Policy Updates</Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>- We may update this policy from time to time. Changes will be posted in the app and take effect immediately.</Text>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Contact</Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>For questions or data requests, contact gabbyhimself10@gmail.com or +233539115369.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    paddingVertical: 8,
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    flex: 1,
  },
  headerRight: {
    width: 40,
    height: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 8,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
});
