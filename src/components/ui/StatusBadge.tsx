import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ConnectionStatus, IlluminationStatus } from '../../types/drone';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import {
  formatConnectionStatus,
  formatIlluminationStatus,
} from '../../utils/formatters';

type Status = ConnectionStatus | IlluminationStatus;

function getStatusStyle(status: Status) {
  switch (status) {
    case 'connected':
    case 'active':
      return { color: Colors.accent.success, icon: 'checkmark-circle' as const };
    case 'connecting':
    case 'sending':
    case 'acknowledged':
      return { color: Colors.accent.warning, icon: 'time' as const };
    case 'error':
      return { color: Colors.accent.danger, icon: 'alert-circle' as const };
    default:
      return { color: Colors.text.muted, icon: 'radio-button-off' as const };
  }
}

function isConnectionStatus(s: Status): s is ConnectionStatus {
  return ['connected', 'connecting', 'disconnected', 'error'].includes(s);
}

interface StatusBadgeProps {
  status: Status;
  compact?: boolean;
}

export function StatusBadge({ status, compact = false }: StatusBadgeProps) {
  const { color, icon } = getStatusStyle(status);
  const label = isConnectionStatus(status)
    ? formatConnectionStatus(status)
    : formatIlluminationStatus(status);

  return (
    <View style={[styles.badge, { borderColor: color + '40' }]}>
      <Ionicons name={icon} size={compact ? 10 : 12} color={color} />
      {!compact && <Text style={[styles.label, { color }]}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    backgroundColor: Colors.bg.elevated,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
});
