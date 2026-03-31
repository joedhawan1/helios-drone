import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFleetContext } from '../../src/context/FleetContext';
import { telemetryService } from '../../src/services/TelemetryService';
import { StatCard } from '../../src/components/telemetry/StatCard';
import { DroneStatRow } from '../../src/components/telemetry/DroneStatRow';
import { CommandLogItem } from '../../src/components/telemetry/CommandLogItem';
import { GlowButton } from '../../src/components/ui/GlowButton';
import type { CommandLog, TelemetryStats } from '../../src/types/drone';
import { Colors } from '../../src/constants/colors';
import { Layout } from '../../src/constants/layout';

export default function TelemetryScreen() {
  const insets = useSafeAreaInsets();
  const { fleet } = useFleetContext();
  const [stats, setStats] = useState<TelemetryStats | null>(null);
  const [droneStats, setDroneStats] = useState<{ name: string; stats: TelemetryStats }[]>([]);
  const [recentCommands, setRecentCommands] = useState<CommandLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [overall, commands] = await Promise.all([
      telemetryService.getStats(),
      telemetryService.getRecentCommands(50),
    ]);
    setStats(overall);
    setRecentCommands(commands);

    const perDrone = await Promise.all(
      fleet.map(async (d) => ({
        name: d.label,
        stats: await telemetryService.getStats(d.id),
      })),
    );
    setDroneStats(perDrone.filter((d) => d.stats.totalCommands > 0));
  }, [fleet]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleClear = async () => {
    await telemetryService.clearHistory();
    await loadData();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Layout.spacing.md }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent.cyan} />}
    >
      <Text style={styles.sectionTitle}>TELEMETRY</Text>

      {/* Summary cards */}
      {stats && (
        <View style={styles.statsRow}>
          <StatCard label="COMMANDS" value={String(stats.totalCommands)} />
          <StatCard label="SUCCESS" value={`${(stats.successRate * 100).toFixed(0)}%`} />
          <StatCard label="AVG LATENCY" value={`${stats.avgLatencyMs}ms`} />
          <StatCard label="TOTAL ILLUM" value={`${(stats.totalIlluminationMs / 1000).toFixed(1)}s`} />
        </View>
      )}

      {/* Per-drone breakdown */}
      {droneStats.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, styles.sectionGap]}>PER-DRONE</Text>
          {droneStats.map((d) => (
            <DroneStatRow key={d.stats.droneId ?? d.name} droneName={d.name} stats={d.stats} />
          ))}
        </>
      )}

      {/* Recent commands */}
      <Text style={[styles.sectionTitle, styles.sectionGap]}>RECENT COMMANDS</Text>
      {recentCommands.length === 0 ? (
        <Text style={styles.empty}>No commands recorded</Text>
      ) : (
        <View style={styles.logContainer}>
          {recentCommands.map((cmd) => (
            <CommandLogItem key={cmd.commandId} entry={cmd} />
          ))}
        </View>
      )}

      <GlowButton
        label="CLEAR HISTORY"
        variant="danger"
        onPress={handleClear}
        style={styles.clearBtn}
      />

      <View style={{ height: insets.bottom + Layout.spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  content: { paddingHorizontal: Layout.spacing.md },
  sectionTitle: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: Layout.spacing.md,
  },
  sectionGap: { marginTop: Layout.spacing.xl },
  statsRow: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  empty: {
    color: Colors.text.muted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: Layout.spacing.md,
  },
  logContainer: {
    backgroundColor: Colors.bg.elevated,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Layout.spacing.sm,
  },
  clearBtn: { marginTop: Layout.spacing.lg },
});
