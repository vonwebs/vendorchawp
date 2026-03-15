import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { onSnapshot, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/config/firebase';


import { ThemeProvider, useTheme } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useOfflineRedirect } from '../hooks/use-offline-redirect';
import MaintenanceScreen from '@/components/MaintenanceScreen';
import BannedScreen from '@/components/BannedScreen';
import { requestNotificationPermissions, getDeviceToken, storeDeviceToken, setupNotificationChannels } from '@/services/notifications';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Keep the splash screen visible while we prepare the app
SplashScreen.preventAutoHideAsync();

const RootLayoutContent = () => {
  useOfflineRedirect();
  const colorScheme = useColorScheme();
  const { isDark } = useTheme();
  const navTheme = isDark ? DarkTheme : DefaultTheme;
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | undefined>(undefined);

  // Handle Splash Screen hiding
  useEffect(() => {
    if (isAuthenticated !== undefined) {
      SplashScreen.hideAsync().catch(() => { });
    }
  }, [isAuthenticated]);

  // Listen for Maintenance Mode
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'metadata', 'platformSettings'), (doc) => {
      setIsMaintenance(doc.data()?.maintenanceMode || false);
    }, (err) => {
      console.log("Maintenance check skipped", err);
    });
    return () => unsub();
  }, []);

  // Handle Notifications
  useEffect(() => {
    const registerNotifications = async () => {
      await setupNotificationChannels();
      const hasPermission = await requestNotificationPermissions();
      if (hasPermission) {
        const token = await getDeviceToken();
        if (token && auth.currentUser) {
          await storeDeviceToken(auth.currentUser.uid, token, auth.currentUser.email);
        }
      }
    };

    registerNotifications();

    // Listen for notification interactions
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped:', data);
    });

    return () => subscription.remove();
  }, [isAuthenticated]);

  // Listen for User Ban Status
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      if (user) {
        const unsubUser = onSnapshot(doc(db, 'users', user.uid), (doc) => {
          setIsBanned(doc.data()?.isBanned || false);
        });
        return () => unsubUser();
      } else {
        setIsBanned(false);
      }
    });
    return () => unsubAuth();
  }, []);

  return (
    <NavThemeProvider value={navTheme}>
      <Stack screenOptions={{ headerBackTitle: '' }}>
        <Stack.Screen name="offline" options={{ headerShown: false }} />
        <Stack.Screen name="auth/welcome" options={{ headerShown: false }} />
        <Stack.Screen name="vendor" options={{ headerShown: false }} />

        {/* Home tabs */}
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            title: '',
            headerBackTitle: '',
            gestureEnabled: false,
          }}
        />
      </Stack>

      <StatusBar style="auto" />
    </NavThemeProvider>
  );
};

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootLayoutContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
