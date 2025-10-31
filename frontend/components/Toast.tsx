import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../lib/colors';

interface ToastProps {
  toast: {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number;
  };
  onHide: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export function Toast({ toast, onHide }: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-hide after duration (default 3 seconds)
    const duration = toast.duration || 3000;
    const timer = setTimeout(() => {
      handleHide();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const handleHide = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  const getToastConfig = () => {
    switch (toast.type) {
      case 'success':
        return {
          backgroundColor: Colors.semantic.success,
          icon: <CheckCircle size={20} color={Colors.utility.white} />,
          borderColor: Colors.brand.green,
        };
      case 'error':
        return {
          backgroundColor: Colors.semantic.error,
          icon: <AlertCircle size={20} color={Colors.utility.white} />,
          borderColor: '#C0392B',
        };
      case 'warning':
        return {
          backgroundColor: Colors.semantic.warning,
          icon: <AlertTriangle size={20} color={Colors.utility.white} />,
          borderColor: '#E67E22',
        };
      case 'info':
        return {
          backgroundColor: Colors.semantic.info,
          icon: <Info size={20} color={Colors.utility.white} />,
          borderColor: '#2980B9',
        };
      default:
        return {
          backgroundColor: Colors.semantic.info,
          icon: <Info size={20} color={Colors.utility.white} />,
          borderColor: '#2980B9',
        };
    }
  };

  const config = getToastConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 10,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={[styles.toast, { backgroundColor: config.backgroundColor, borderColor: config.borderColor }]}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            {config.icon}
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{toast.title}</Text>
            {toast.message && (
              <Text style={styles.message}>{toast.message}</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleHide}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={16} color={Colors.utility.white} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: Colors.semantic.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.utility.white,
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.utility.white,
    opacity: 0.9,
    lineHeight: 20,
  },
  closeButton: {
    marginLeft: 12,
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});
