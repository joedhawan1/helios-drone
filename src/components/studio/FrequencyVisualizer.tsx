import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

export interface FrequencyBands {
  sub: number;
  bass: number;
  mid: number;
  high: number;
  brilliance: number;
}

interface FrequencyVisualizerProps {
  bands: FrequencyBands;
  droneCount?: number;
}

const BAND_COLORS = ['#6366F1', '#3B82F6', '#06B6D4', '#10B981', '#A3E635'];
const BAND_LABELS = ['SUB', 'BASS', 'MID', 'HIGH', 'BRIL'];
const BAND_KEYS: (keyof FrequencyBands)[] = ['sub', 'bass', 'mid', 'high', 'brilliance'];
const MAX_HEIGHT = 100;

export function FrequencyVisualizer({ bands, droneCount = 1 }: FrequencyVisualizerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.bars}>
        {BAND_KEYS.map((key, i) => {
          const pct = Math.max(0, Math.min(100, bands[key]));
          const barH = (pct / 100) * MAX_HEIGHT;
          return (
            <View key={key} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: barH,
                      backgroundColor: BAND_COLORS[i],
                      shadowColor: BAND_COLORS[i],
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{BAND_LABELS[i]}</Text>
            </View>
          );
        })}
      </View>
      {droneCount > 0 && (
        <View style={styles.droneRow}>
          {Array.from({ length: droneCount }).map((_, i) => {
            const brightness = Math.round(
              (bands.sub + bands.bass + bands.mid + bands.high + bands.brilliance) / 5
            );
            return (
              <View key={i} style={styles.droneChip}>
                <Text style={styles.droneLabel}>D{i + 1}</Text>
                <Text style={styles.droneVal}>{brightness}%</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bg.surface,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Layout.spacing.md,
    gap: Layout.spacing.sm,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: MAX_HEIGHT + 24,
    gap: Layout.spacing.xs,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barTrack: {
    width: '100%',
    height: MAX_HEIGHT,
    backgroundColor: Colors.bg.elevated,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  barLabel: {
    color: Colors.text.muted,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  droneRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.xs,
    marginTop: Layout.spacing.xs,
  },
  droneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bg.elevated,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 3,
  },
  droneLabel: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  droneVal: {
    color: Colors.accent.cyan,
    fontSize: 10,
    fontWeight: '700',
  },
});
