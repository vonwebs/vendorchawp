import * as Notifications from 'expo-notifications';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Platform } from 'react-native';
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    // Add custom sound for foreground notifications
    sound: 'alert.wav',
  }),
});

// Setup specialized notification channels (Android only)
export const setupNotificationChannels = async () => {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('new-orders', {
        name: 'New Orders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00CD8B',
        sound: 'alert', // On Android, use resource name without extension
      });
    } catch (error) {
      console.error('Error setting up notification channels:', error);
    }
  }
};

// Request permissions
export const requestNotificationPermissions = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

// Get device token
export const getDeviceToken = async () => {
  try {
    const Constants = (await import('expo-constants')).default;
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.warn('EAS Project ID not found. Ensure you have run "eas build" or configured it in app.json.');
    }
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: projectId || "fdf70af2-709a-4091-b366-21247200e357", // Updated to match app.json
    });
    return token.data;
  } catch (error) {
    console.error('Error getting device token:', error);
    return null;
  }
};

// Store device token for user
export const storeDeviceToken = async (userId: string, token: string, email?: string | null, activeVendorId?: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const updateData: any = {
      vendorDeviceToken: token,
      deviceToken: token, // Keep this as fallback for now
      updatedAt: new Date(),
    };

    if (email) {
      updateData.email = email.toLowerCase();
    }

    if (activeVendorId) {
      updateData.activeVendorId = activeVendorId;
    }

    await setDoc(userRef, updateData, { merge: true });
  } catch (error) {
    console.error('Error storing device token:', error);
  }
};

// Clear active vendor for user (e.g. on logout)
export const clearActiveVendor = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      activeVendorId: null,
      updatedAt: new Date(),
    }, { merge: true });
  } catch (error) {
    console.error('Error clearing active vendor:', error);
  }
};