import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/colors';

interface CaptureButtonProps {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

const OUTER = 80;
const INNER = 62;

export function CaptureButton({ onPress, disabled = false, loading = false }: CaptureButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const innerScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, speed: 50 }).start();
    Animated.spring(innerScale, { toValue: 0.85, useNativeDriver: true, speed: 50 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();
    Animated.spring(innerScale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();
  };

  const isDisabled = disabled || loading;

  return (
    <Animated.View style={{ transform: [{ scale }], opacity: isDisabled ? 0.4 : 1 }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={styles.outer}
      >
        <View style={styles.ring}>
          <Animated.View
            style={[styles.inner, { transform: [{ scale: innerScale }] }]}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: OUTER,
    height: OUTER,
    borderRadius: OUTER / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    width: OUTER,
    height: OUTER,
    borderRadius: OUTER / 2,
    borderWidth: 2.5,
    borderColor: Colors.reticle,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.reticle,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 8,
  },
  inner: {
    width: INNER,
    height: INNER,
    borderRadius: INNER / 2,
    backgroundColor: Colors.reticle,
    opacity: 0.9,
  },
});
