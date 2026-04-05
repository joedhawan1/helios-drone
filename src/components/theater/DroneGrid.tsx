import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

export interface DroneState {
  id: string;
  label: string;
  brightness: number; // 0-100
  colorTemp: number;  // 2700 (warm) - 6500 (cool)
}

interface DroneGridProps {
  drones: DroneState[];
}

function colorTempToRgb(temp: number): string {
  // Map 2700-6500K to warm orange → white → cool blue
  const t = Math.max(0, Math.min(1, (temp - 2700) / (6500 - 2700)));
  if (t < 0.5) {
    // warm orange (#F59E0B) → white (#F1F5F9)
    const f = t * 2;
    const r = Math.round(245 + (241 - 245) * f);
    const g = Math.round(158 + (245 - 158) * f);
    const b = Math.round(11 + (249 - 11) * f);
    return `rgb(${r},${g},${b})`;
  } else {
    // white (#F1F5F9) → cool blue (#3B82F6)
    const f = (t - 0.5) * 2;
    const r = Math.round(241 + (59 - 241) * f);
    const g = Math.round(245 + (130 - 245) * f);
    const b = Math.round(249 + (246 - 249) * f);
    return `rgb(${r},${g},${b})`;
  }
}

function DroneDot({ drone }: { drone: DroneState }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const prevBrightness = useRef(drone.brightness);

  useEffect(() => {
    if (Math.abs(drone.brightness - prevBrightness.current) > 5) {
      prevBrightness.current = drone.brightness;
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.35, duration: 120, useNativeDriver: true }),
        Animated.spring(pulse, { toValue: 1, useNativeDriver: true, speed: 20 }),
      ]).start();
    }
  }, [drone.brightness, pulse]);

  const color = colorTempToRgb(drone.colorTemp);
  const opacity = 0.12 + (drone.brightness / 100) * 0.88;

  return (
    <View style={styles.droneCell}>
      <Animated.View
        style={[
          styles.droneCircleOuter,
          {
            borderColor: color,
            opacity,
            transform: [{ scale: pulse }],
            shadowColor: color,
          },
        ]}
      >
        <View
          style={[
            styles.droneCircleInner,
            { backgroundColor: color },
          ]}
        />
      </Animated.View>
      <Text style={styles.droneLabel} numberOfLines={1}>{drone.label}</Text>
    </View>
  );
}

export function DroneGrid({ drones }: DroneGridProps) {
  if (drones.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>◯</Text>
        <Text style={styles.emptyText}>NO DRONES</Text>
        <Text style={styles.emptySubtext}>Connect drones in the Fleet tab</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {drones.map((drone) => (
        <DroneDot key={drone.id} drone={drone} />
      ))}
    </View>
  );
}

const MONO = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
    justifyContent: 'center',
    padding: Layout.spacing.sm,
  },
  droneCell: {
    alignItems: 'center',
    gap: 4,
    minWidth: 56,
  },
  droneCircleOuter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 5,
  },
  droneCircleInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    opacity: 0.9,
  },
  droneLabel: {
    color: Colors.text.muted,
    fontSize: 9,
    fontWeight: '700',
    fontFamily: MONO,
    letterSpacing: 0.5,
    maxWidth: 56,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.xl,
    gap: Layout.spacing.xs,
  },
  emptyIcon: {
    color: Colors.text.muted,
    fontSize: 32,
  },
  emptyText: {
    color: Colors.text.muted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  emptySubtext: {
    color: Colors.text.muted,
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.6,
  },
});
