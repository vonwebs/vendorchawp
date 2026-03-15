import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(!!state.isConnected);
      // Consider slow if connection type is cellular and effectiveType is 2g/3g
      setIsSlow(
        state.type === 'cellular' &&
        (state.details?.cellularGeneration === '2g' || state.details?.cellularGeneration === '3g')
      );
    });
    return () => unsubscribe();
  }, []);

  return { isConnected, isSlow };
}
