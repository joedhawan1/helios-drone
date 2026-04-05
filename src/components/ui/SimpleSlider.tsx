import React, { useCallback, useRef } from 'react';
import {
  PanResponder,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

interface SimpleSliderProps {
  value: number;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  onValueChange: (value: number) => void;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  style?: ViewStyle;
}

export function SimpleSlider({
  value,
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  onValueChange,
  minimumTrackTintColor = Colors.accent.blue,
  maximumTrackTintColor = Colors.border,
  thumbTintColor = Colors.accent.blue,
  style,
}: SimpleSliderProps) {
  const trackWidth = useRef(0);
  const range = maximumValue - minimumValue;
  const pct = range === 0 ? 0 : (value - minimumValue) / range;

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    trackWidth.current = e.nativeEvent.layout.width;
  }, []);

  const computeValue = useCallback(
    (dx: number, startPct: number): number => {
      if (trackWidth.current === 0) return value;
      const newPct = Math.max(0, Math.min(1, startPct + dx / trackWidth.current));
      const raw = minimumValue + newPct * range;
      const stepped = Math.round(raw / step) * step;
      return Math.max(minimumValue, Math.min(maximumValue, stepped));
    },
    [minimumValue, maximumValue, range, step, value]
  );

  const startPctRef = useRef(pct);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startPctRef.current = (value - minimumValue) / range;
      },
      onPanResponderMove: (_e, gs) => {
        const v = computeValue(gs.dx, startPctRef.current);
        onValueChange(v);
      },
    })
  ).current;

  return (
    <View style={[styles.container, style]} onLayout={handleLayout}>
      <View style={styles.track}>
        <View
          style={[styles.fill, { width: `${pct * 100}%` as any, backgroundColor: minimumTrackTintColor }]}
        />
        <View style={[styles.remaining, { backgroundColor: maximumTrackTintColor }]} />
      </View>
      <View
        style={[
          styles.thumb,
          {
            left: `${pct * 100}%` as any,
            backgroundColor: thumbTintColor,
            shadowColor: thumbTintColor,
            transform: [{ translateX: -10 }],
          },
        ]}
        {...panResponder.panHandlers}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  track: {
    height: 4,
    borderRadius: 2,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: Colors.border,
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  remaining: {
    flex: 1,
    height: '100%',
  },
  thumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    top: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
});
