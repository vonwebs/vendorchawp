import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/config/firebase';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaintenanceScreen from '@/components/MaintenanceScreen';
import BannedScreen from '@/components/BannedScreen';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Listen for Maintenance Mode
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'metadata', 'platformSettings'), (doc) => {
      setIsMaintenance(doc.data()?.maintenanceMode || false);
    }, (err) => {
      console.log("Maintenance check skipped", err);
    });
    return () => unsub();
  }, []);

  // Listen for User Ban Status and Admin Status
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Check if user is admin
        setIsAdmin(user.email?.toLowerCase() === 'admin@chawp.com');

        const unsubUser = onSnapshot(doc(db, 'users', user.uid), (doc) => {
          setIsBanned(doc.data()?.isBanned || false);
        });
        return () => unsubUser();
      } else {
        setIsBanned(false);
        setIsAdmin(false);
      }
    });
    return () => unsubAuth();
  }, []);

  // Show banned screen if user is banned
  if (isBanned) {
    return <BannedScreen />;
  }

  // Show maintenance screen if in maintenance mode AND user is not admin
  if (isMaintenance && !isAdmin) {
    return <MaintenanceScreen />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: { display: 'none' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Vendor',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="building.2.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
