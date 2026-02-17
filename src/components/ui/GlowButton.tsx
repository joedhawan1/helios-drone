import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

type Variant = 'primary' | 'danger' | 'ghost';

interface GlowButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

function getVariantColors(variant: Variant) {
  switch (variant) {
    case 'primary':
      return { bg: Colors.accent.blue, text: '#fff', shadow: Colors.accent.blue };
    case 'danger':
      return { bg: Colors.accent.danger, text: '#fff', shadow: Colors.accent.danger };
    case 'ghost':
      return { bg: 'transparent', text: Colors.accent.blue, shadow: 'transparent' };
  }
}

export function GlowButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: GlowButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const { bg, text, shadow } = getVariantColors(variant);

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  };

  const isDisabled = disabled || loading;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[
          styles.button,
          {
            backgroundColor: bg,
            borderColor: variant === 'ghost' ? Colors.accent.blue : bg,
            shadowColor: shadow,
            opacity: isDisabled ? 0.45 : 1,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={text} />
        ) : (
          <Text style={[styles.label, { color: text }]}>{label}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.sm + 2,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
