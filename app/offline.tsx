export const options = {
  headerShown: false,
};

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function OfflineScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const bgColor = colorScheme === 'dark' ? '#181b1f' : '#f4faff';
  const textColor = colorScheme === 'dark' ? '#fff' : '#222';
  const subTextColor = colorScheme === 'dark' ? '#eee' : '#444';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Ionicons name="cloud-offline-outline" size={64} color="#2D60FF" style={{ marginBottom: 24 }} />
      <Text style={[styles.title, { color: textColor }]}>You're Offline</Text>
      <Text style={[styles.subtitle, { color: subTextColor }]}>No internet connection detected. Please check your connection and try again.</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.replace('/')}>
        <Text style={styles.buttonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2D60FF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
