import { useEffect, useState, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useSlowNetwork = () => {
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // Check if device is connected
      if (!state.isConnected) {
        setIsSlowNetwork(false);
        return;
      }

      // Check connection type and speed
      const isSlow =
        state.type === '2g' ||
        state.type === '3g' ||
        (state.type === 'cellular' && state.isConnectionExpensive) ||
        state.effectiveType === '2g' ||
        state.effectiveType === '3g' ||
        state.effectiveType === '4g-slow';

      setIsSlowNetwork(isSlow);

      // Also check download speed if available
      if (state.details && 'downloadSpeed' in state.details) {
        const downloadSpeed = (state.details as any).downloadSpeed;
        // If download speed is less than 1 Mbps, consider it slow
        if (downloadSpeed && downloadSpeed < 1) {
          setIsSlowNetwork(true);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return isSlowNetwork;
};
