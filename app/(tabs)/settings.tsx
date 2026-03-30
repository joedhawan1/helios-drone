import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../src/components/ui/Card';
import { GlowButton } from '../../src/components/ui/GlowButton';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { ConnectionForm } from '../../src/components/settings/ConnectionForm';
import { useDrone } from '../../src/hooks/useDrone';
import { Colors } from '../../src/constants/colors';
import { Layout } from '../../src/constants/layout';
import type { DroneSettings } from '../../src/types/drone';

export default function SettingsScreen() {
  const { connectionStatus, settings, connect, disconnect, updateSettings } = useDrone();
  const [draft, setDraft] = useState<DroneSettings>(settings);
  const [saved, setSaved] = useState(false);
  const insets = useSafeAreaInsets();

  const isConnected = connectionStatus === 'connected';
  const isConnecting = connectionStatus === 'connecting';

  const handleSave = async () => {
    await updateSettings(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Layout.spacing.lg },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <Text style={styles.screenTitle}>SETTINGS</Text>
      <Text style={styles.screenSubtitle}>Configure your drone connection</Text>

      {/* Endpoint config */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>DRONE CONNECTION</Text>
        <ConnectionForm values={draft} onChange={setDraft} />
      </Card>

      {/* Save button */}
      <GlowButton
        label={saved ? '✓ SAVED' : 'SAVE SETTINGS'}
        onPress={handleSave}
        variant="primary"
      />

      {/* Connection status */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>CONNECTION</Text>
        <View style={styles.statusRow}>
          <StatusBadge status={connectionStatus} />
        </View>
        <View style={styles.buttonRow}>
          {isConnected ? (
            <GlowButton label="DISCONNECT" variant="danger" onPress={disconnect} />
          ) : (
            <GlowButton
              label="CONNECT TO DRONE"
              variant="primary"
              onPress={connect}
              loading={isConnecting}
            />
          )}
        </View>
      </Card>

      {/* Demo mode hint */}
      <Card style={[styles.card, styles.hintCard]}>
        <Text style={styles.hintTitle}>DEMO MODE</Text>
        <Text style={styles.hintBody}>
          Set Host to{' '}
          <Text style={styles.hintCode}>demo</Text>
          {' '}to simulate a drone connection without real hardware. All commands are simulated locally.
        </Text>
      </Card>

      <View style={{ height: Layout.spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  content: {
    paddingHorizontal: Layout.spacing.md,
    gap: Layout.spacing.md,
  },
  screenTitle: {
    color: Colors.text.primary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 4,
  },
  screenSubtitle: {
    color: Colors.text.secondary,
    fontSize: 13,
    marginBottom: Layout.spacing.xs,
  },
  sectionTitle: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: Layout.spacing.md,
  },
  card: {
    marginBottom: 0,
  },
  statusRow: {
    marginBottom: Layout.spacing.md,
  },
  buttonRow: {},
  hintCard: {
    borderColor: Colors.accent.blue + '40',
  },
  hintTitle: {
    color: Colors.accent.cyan,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: Layout.spacing.sm,
  },
  hintBody: {
    color: Colors.text.secondary,
    fontSize: 13,
    lineHeight: 20,
  },
  hintCode: {
    color: Colors.accent.blue,
    fontWeight: '700',
  },
});
