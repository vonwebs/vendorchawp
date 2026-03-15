import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useRouter, usePathname } from 'expo-router';

export function useOfflineRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (!state.isConnected && pathname !== '/offline') {
        router.replace('/offline');
      }
      if (state.isConnected && pathname === '/offline') {
        router.replace('/');
      }
    });
    return () => unsubscribe();
  }, [router, pathname]);
}
