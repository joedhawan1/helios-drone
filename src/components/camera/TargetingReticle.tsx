import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/colors';

const SIZE = 200;
const BRACKET = 24;
const THICKNESS = 2;

interface TargetingReticleProps {
  active?: boolean;
}

export function TargetingReticle({ active = true }: TargetingReticleProps) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) {
      pulse.setValue(1);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [active, pulse]);

  const color = Colors.reticle;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Top-left bracket */}
      <View style={[styles.bracket, styles.topLeft]}>
        <View style={[styles.hLine, { backgroundColor: color }]} />
        <View style={[styles.vLine, { backgroundColor: color }]} />
      </View>
      {/* Top-right bracket */}
      <View style={[styles.bracket, styles.topRight]}>
        <View style={[styles.hLine, { backgroundColor: color }]} />
        <View style={[styles.vLine, { backgroundColor: color }]} />
      </View>
      {/* Bottom-left bracket */}
      <View style={[styles.bracket, styles.bottomLeft]}>
        <View style={[styles.hLine, { backgroundColor: color }]} />
        <View style={[styles.vLine, { backgroundColor: color }]} />
      </View>
      {/* Bottom-right bracket */}
      <View style={[styles.bracket, styles.bottomRight]}>
        <View style={[styles.hLine, { backgroundColor: color }]} />
        <View style={[styles.vLine, { backgroundColor: color }]} />
      </View>

      {/* Center dot */}
      <Animated.View style={[styles.centerDot, { backgroundColor: color, opacity: pulse }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bracket: {
    position: 'absolute',
    width: BRACKET,
    height: BRACKET,
  },
  topLeft: { top: 0, left: 0 },
  topRight: { top: 0, right: 0, transform: [{ scaleX: -1 }] },
  bottomLeft: { bottom: 0, left: 0, transform: [{ scaleY: -1 }] },
  bottomRight: {
    bottom: 0,
    right: 0,
    transform: [{ scaleX: -1 }, { scaleY: -1 }],
  },
  hLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: BRACKET,
    height: THICKNESS,
  },
  vLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: THICKNESS,
    height: BRACKET,
  },
  centerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
