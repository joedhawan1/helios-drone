import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { TelemetryStats } from '../../types/drone';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

interface DroneStatRowProps {
  droneName: string;
  stats: TelemetryStats;
}

export function DroneStatRow({ droneName, stats }: DroneStatRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.name}>{droneName}</Text>
      <View style={styles.stats}>
        <Text style={styles.stat}>{stats.totalCommands} cmd</Text>
        <Text style={styles.stat}>{(stats.successRate * 100).toFixed(0)}%</Text>
        <Text style={styles.stat}>{stats.avgLatencyMs}ms</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bg.elevated,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Layout.spacing.sm,
    marginBottom: Layout.spacing.xs,
  },
  name: { color: Colors.text.primary, fontSize: 13, fontWeight: '600' },
  stats: { flexDirection: 'row', gap: Layout.spacing.md },
  stat: { color: Colors.text.secondary, fontSize: 11, fontWeight: '600' },
});
