import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { GlowButton } from '../ui/GlowButton';
import type { FleetDrone } from '../../types/drone';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

interface DroneCardProps {
  drone: FleetDrone;
  onRemove: (id: string) => void;
}

export function DroneCard({ drone, onRemove }: DroneCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.label}>{drone.label}</Text>
          <Text style={styles.host}>
            {drone.settings.host}:{drone.settings.port}
          </Text>
        </View>
        <View style={styles.statusCol}>
          <StatusBadge status={drone.connectionStatus} compact />
          {drone.illuminationStatus !== 'idle' && (
            <StatusBadge status={drone.illuminationStatus} compact />
          )}
        </View>
      </View>
      <GlowButton
        label="REMOVE"
        variant="danger"
        onPress={() => onRemove(drone.id)}
        style={styles.removeBtn}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Layout.spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  info: { flex: 1 },
  label: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  host: {
    color: Colors.text.secondary,
    fontSize: 11,
    marginTop: 2,
  },
  statusCol: { alignItems: 'flex-end', gap: Layout.spacing.xs },
  removeBtn: { marginTop: Layout.spacing.sm, alignSelf: 'flex-end' },
});
