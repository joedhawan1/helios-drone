import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../ui/Card';
import { GlowButton } from '../ui/GlowButton';
import type { Formation } from '../../types/drone';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

interface FormationCardProps {
  formation: Formation;
  onFire: (formation: Formation) => void;
  onDelete: (id: string) => void;
  firing?: boolean;
}

export function FormationCard({ formation, onFire, onDelete, firing }: FormationCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{formation.name}</Text>
        <Text style={styles.meta}>{formation.shape.toUpperCase()}</Text>
      </View>
      <Text style={styles.detail}>
        {formation.fireMode.toUpperCase()} | {formation.slots.length} drone{formation.slots.length !== 1 ? 's' : ''} | {formation.delayBetweenMs}ms delay
      </Text>
      <View style={styles.actions}>
        <GlowButton label="FIRE" onPress={() => onFire(formation)} loading={firing} style={styles.btn} />
        <GlowButton label="DELETE" variant="danger" onPress={() => onDelete(formation.id)} style={styles.btn} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Layout.spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: Colors.text.primary, fontSize: 14, fontWeight: '700' },
  meta: { color: Colors.accent.cyan, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  detail: { color: Colors.text.secondary, fontSize: 11, marginTop: Layout.spacing.xs },
  actions: { flexDirection: 'row', gap: Layout.spacing.sm, marginTop: Layout.spacing.sm },
  btn: { flex: 1 },
});
