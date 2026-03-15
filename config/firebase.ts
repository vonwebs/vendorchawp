import { initializeApp, getApps } from 'firebase/app';
// @ts-ignore
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Chawp Vendor Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDm1eENxGfGOS119QLTL8OfIEiqhMzdY0s",
  authDomain: "snakk-679e1.firebaseapp.com",
  projectId: "snakk-679e1",
  storageBucket: "snakk-679e1.firebasestorage.app",
  messagingSenderId: "894137478030",
  appId: "1:894137478030:web:3b09b23218d591bbbe92df"
};

// Initialize Firebase App
const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = (() => {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
  } catch (error) {
    // If already initialized, get the existing instance
    return getAuth(app);
  }
})();

// Initialize Firestore with local persistence for lightning-fast caching
export const db = (() => {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch (error) {
    return getFirestore(app);
  }
})();

// Export Auth instance
export { auth };

export default app;
