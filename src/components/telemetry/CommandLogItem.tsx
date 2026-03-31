import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { CommandLog } from '../../types/drone';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

interface CommandLogItemProps {
  entry: CommandLog;
}

function statusColor(status: CommandLog['status']): string {
  switch (status) {
    case 'success': return Colors.accent.success;
    case 'pending': return Colors.accent.warning;
    case 'timeout': return Colors.accent.warning;
    case 'error': return Colors.accent.danger;
  }
}

export function CommandLogItem({ entry }: CommandLogItemProps) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.drone}>{entry.droneName}</Text>
        <Text style={styles.time}>{new Date(entry.sentAt).toLocaleTimeString()}</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.status, { color: statusColor(entry.status) }]}>
          {entry.status.toUpperCase()}
        </Text>
        {entry.latencyMs != null && (
          <Text style={styles.latency}>{entry.latencyMs}ms</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  left: { gap: 2 },
  right: { alignItems: 'flex-end', gap: 2 },
  drone: { color: Colors.text.primary, fontSize: 12, fontWeight: '600' },
  time: { color: Colors.text.muted, fontSize: 10 },
  status: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  latency: { color: Colors.text.secondary, fontSize: 10 },
});
