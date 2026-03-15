import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/hooks/use-theme-colors';

export interface ToastConfig {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  duration?: number;
}

interface ToastProps {
  visible: boolean;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  onHide?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ visible, message, type, onHide }) => {
  const colors = useThemeColors();
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  const getBackgroundColor = () => {
    switch (type) {
      case 'error':
        return '#FF6B6B';
      case 'warning':
        return '#FFB700'; // Changed to gold
      case 'success':
        return '#51CF66';
      case 'info':
      default:
        return '#4ECDC4';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => {
          Animated.timing(translateY, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            onHide?.();
          });
        }}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.toast,
            {
              backgroundColor: getBackgroundColor(),
            },
          ]}
        >
          <Text style={styles.icon}>{getIcon()}</Text>
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 220,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  icon: {
    fontSize: 18,
  },
  message: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
