import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../ui/Card';
import { GlowButton } from '../ui/GlowButton';
import type { Mission } from '../../types/drone';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

interface MissionCardProps {
  mission: Mission;
  onPlay: (mission: Mission) => void;
  onDelete: (id: string) => void;
  playing?: boolean;
}

export function MissionCard({ mission, onPlay, onDelete, playing }: MissionCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{mission.name}</Text>
        <Text style={styles.meta}>
          {mission.waypoints.length} waypoint{mission.waypoints.length !== 1 ? 's' : ''}
        </Text>
      </View>
      {mission.lastRunAt && (
        <Text style={styles.lastRun}>Last run: {new Date(mission.lastRunAt).toLocaleString()}</Text>
      )}
      <View style={styles.actions}>
        <GlowButton label="PLAY" onPress={() => onPlay(mission)} loading={playing} style={styles.btn} />
        <GlowButton label="DELETE" variant="danger" onPress={() => onDelete(mission.id)} style={styles.btn} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Layout.spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: Colors.text.primary, fontSize: 14, fontWeight: '700' },
  meta: { color: Colors.text.muted, fontSize: 11, fontWeight: '600' },
  lastRun: { color: Colors.text.secondary, fontSize: 10, marginTop: Layout.spacing.xs },
  actions: { flexDirection: 'row', gap: Layout.spacing.sm, marginTop: Layout.spacing.sm },
  btn: { flex: 1 },
});
