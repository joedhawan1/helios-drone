import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { FleetDrone } from '../../types/drone';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

interface FleetStatusBarProps {
  fleet: FleetDrone[];
}

const LUMENS_PER_DRONE = 5000;

export function FleetStatusBar({ fleet }: FleetStatusBarProps) {
  const total = fleet.length;
  const online = fleet.filter((d) => d.connectionStatus === 'connected').length;
  const estLumens = (online * LUMENS_PER_DRONE).toLocaleString();

  return (
    <View style={styles.bar}>
      <Text style={styles.text}>
        {online}/{total} ONLINE
      </Text>
      <View style={styles.divider} />
      <Text style={styles.text}>~{estLumens} LM</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg.elevated,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.accent.blue + '40',
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    gap: Layout.spacing.sm,
  },
  text: {
    color: Colors.accent.cyan,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: Colors.border,
  },
});
