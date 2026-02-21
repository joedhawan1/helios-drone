import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBadge } from '../ui/StatusBadge';
import { TargetingReticle } from './TargetingReticle';
import type { ConnectionStatus, GpsCoordinates, IlluminationStatus } from '../../types/satellite';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import { formatCoords, formatIlluminationStatus } from '../../utils/formatters';

interface HUDOverlayProps {
  connectionStatus: ConnectionStatus;
  illuminationStatus: IlluminationStatus;
  coords: GpsCoordinates | null;
  locationError: string | null;
}

const MONO = Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' });

export function HUDOverlay({
  connectionStatus,
  illuminationStatus,
  coords,
  locationError,
}: HUDOverlayProps) {
  const insets = useSafeAreaInsets();
  const isActive = illuminationStatus === 'active';
  const isSending = illuminationStatus === 'sending' || illuminationStatus === 'acknowledged';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + Layout.spacing.sm }]}>
        <Text style={styles.appTitle}>HELIOS v1.01</Text>
        <StatusBadge status={connectionStatus} />
      </View>

      {/* Scanning lines decoration */}
      <View style={styles.scanLine1} />
      <View style={styles.scanLine2} />

      {/* Center reticle */}
      <View style={styles.reticleWrapper}>
        <TargetingReticle active={connectionStatus === 'connected'} />
        {isSending && (
          <Text style={styles.sendingLabel}>TRANSMITTING...</Text>
        )}
        {isActive && (
          <Text style={[styles.sendingLabel, { color: Colors.accent.success }]}>
            ● ILLUMINATING
          </Text>
        )}
      </View>

      {/* Bottom info strip */}
      <View style={styles.bottomInfo}>
        <Text style={styles.statusLabel}>
          {formatIlluminationStatus(illuminationStatus)}
        </Text>
        {locationError ? (
          <Text style={[styles.coordText, { color: Colors.accent.danger }]}>
            {locationError}
          </Text>
        ) : coords ? (
          <Text style={styles.coordText}>{formatCoords(coords)}</Text>
        ) : (
          <Text style={[styles.coordText, { color: Colors.text.muted }]}>
            GPS AWAITING CAPTURE
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingBottom: Layout.spacing.sm,
  },
  appTitle: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 3,
  },
  reticleWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  sendingLabel: {
    color: Colors.accent.warning,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  bottomInfo: {
    paddingHorizontal: Layout.spacing.md,
    paddingBottom: Layout.spacing.xl,
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  statusLabel: {
    color: Colors.accent.cyan,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
  coordText: {
    fontFamily: MONO,
    color: Colors.text.secondary,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  scanLine1: {
    position: 'absolute',
    top: '33%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.accent.blue + '18',
  },
  scanLine2: {
    position: 'absolute',
    top: '66%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.accent.blue + '18',
  },
});
