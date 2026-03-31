import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Card } from '../ui/Card';
import { GlowButton } from '../ui/GlowButton';
import type { Schedule } from '../../types/drone';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

interface ScheduleCardProps {
  schedule: Schedule;
  onToggle: (schedule: Schedule) => void;
  onDelete: (id: string) => void;
}

function formatDateTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ScheduleCard({ schedule, onToggle, onDelete }: ScheduleCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.name}>{schedule.name}</Text>
          <Text style={styles.time}>{formatDateTime(schedule.dateTime)}</Text>
          {schedule.recurrence !== 'none' && (
            <View style={styles.recurrenceBadge}>
              <Text style={styles.recurrenceText}>{schedule.recurrence.toUpperCase()}</Text>
            </View>
          )}
        </View>
        <Switch
          value={schedule.enabled}
          onValueChange={() => onToggle({ ...schedule, enabled: !schedule.enabled })}
          trackColor={{ false: Colors.border, true: Colors.accent.blue + '60' }}
          thumbColor={schedule.enabled ? Colors.accent.blue : Colors.text.muted}
        />
      </View>
      <View style={styles.footer}>
        <Text style={styles.brightness}>
          BRIGHTNESS {Math.round(schedule.brightness * 100)}%
        </Text>
        <GlowButton
          label="DELETE"
          variant="danger"
          onPress={() => onDelete(schedule.id)}
          style={styles.deleteBtn}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Layout.spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  info: { flex: 1 },
  name: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  time: {
    color: Colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  recurrenceBadge: {
    marginTop: Layout.spacing.xs,
    backgroundColor: Colors.accent.blue + '20',
    borderRadius: Layout.borderRadius.sm,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  recurrenceText: {
    color: Colors.accent.blue,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Layout.spacing.sm,
  },
  brightness: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  deleteBtn: {},
});
