import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

interface AimIndicatorProps {
  azimuth: number;   // -180 to 180
  elevation: number; // -90 to 90
  intensity: number; // 0 to 100
}

const SIZE = 200;
const DOT = 12;

export function AimIndicator({ azimuth, elevation, intensity }: AimIndicatorProps) {
  // Map azimuth (-180..180) to X (0..SIZE), elevation (-90..90) to Y (0..SIZE)
  const dotX = ((azimuth + 180) / 360) * SIZE - DOT / 2;
  const dotY = ((90 - elevation) / 180) * SIZE - DOT / 2;
  const glowOpacity = 0.3 + (intensity / 100) * 0.7;
  const borderColor = intensity > 50 ? Colors.accent.cyan : Colors.accent.blue;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.circle, { borderColor, shadowColor: borderColor, shadowOpacity: glowOpacity }]}>
        {/* Crosshair horizontal */}
        <View style={styles.crossH} />
        {/* Crosshair vertical */}
        <View style={styles.crossV} />
        {/* Aim dot */}
        <View style={[styles.dot, { left: dotX, top: dotY, shadowColor: Colors.accent.cyan }]} />
      </View>
      <View style={styles.readouts}>
        <View style={styles.readout}>
          <Text style={styles.readoutLabel}>AZ</Text>
          <Text style={styles.readoutVal}>{azimuth.toFixed(1)}°</Text>
        </View>
        <View style={styles.readout}>
          <Text style={styles.readoutLabel}>EL</Text>
          <Text style={styles.readoutVal}>{elevation.toFixed(1)}°</Text>
        </View>
        <View style={styles.readout}>
          <Text style={styles.readoutLabel}>INT</Text>
          <Text style={[styles.readoutVal, { color: Colors.accent.cyan }]}>{intensity.toFixed(0)}%</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 2,
    backgroundColor: Colors.bg.surface,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  crossH: {
    position: 'absolute',
    top: SIZE / 2 - 0.5,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.border,
  },
  crossV: {
    position: 'absolute',
    left: SIZE / 2 - 0.5,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: Colors.border,
  },
  dot: {
    position: 'absolute',
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: Colors.accent.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 8,
  },
  readouts: {
    flexDirection: 'row',
    gap: Layout.spacing.lg,
  },
  readout: {
    alignItems: 'center',
    gap: 2,
  },
  readoutLabel: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  readoutVal: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
