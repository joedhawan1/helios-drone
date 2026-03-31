import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFleetContext } from '../../src/context/FleetContext';
import { useLocation } from '../../src/hooks/useLocation';
import { DroneCard } from '../../src/components/fleet/DroneCard';
import { FleetStatusBar } from '../../src/components/fleet/FleetStatusBar';
import { WeatherCard } from '../../src/components/fleet/WeatherCard';
import { ScheduleCard } from '../../src/components/fleet/ScheduleCard';
import { ScheduleForm } from '../../src/components/fleet/ScheduleForm';
import { MissionCard } from '../../src/components/fleet/MissionCard';
import { FormationCard } from '../../src/components/fleet/FormationCard';
import { FormationBuilder } from '../../src/components/fleet/FormationBuilder';
import { GlowButton } from '../../src/components/ui/GlowButton';
import { useMissionContext } from '../../src/context/MissionContext';
import {
  createFormation,
  saveFormation,
  loadFormations,
  deleteFormation as deleteFormationStorage,
  fireFormation,
} from '../../src/services/FormationService';
import type { DroneSettings, Protocol, Formation } from '../../src/types/drone';
import { Colors } from '../../src/constants/colors';
import { Layout } from '../../src/constants/layout';

const DEFAULT_NEW_DRONE: DroneSettings & { label: string } = {
  label: '',
  host: 'demo',
  port: '8080',
  accessCode: '',
  protocol: 'ws' as Protocol,
};

export default function FleetScreen() {
  const insets = useSafeAreaInsets();
  const {
    fleet,
    schedules,
    weather,
    weatherLoading,
    addDrone,
    removeDrone,
    connectFleet,
    disconnectFleet,
    illuminateFleet,
    fetchWeather,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  } = useFleetContext();
  const { coords, requestLocation } = useLocation();

  const [showAddDrone, setShowAddDrone] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [newDrone, setNewDrone] = useState(DEFAULT_NEW_DRONE);
  const [connecting, setConnecting] = useState(false);
  const [illuminating, setIlluminating] = useState(false);

  // Missions
  const { missions, playMission, deleteMission, playbackStatus } = useMissionContext();
  const [playingMissionId, setPlayingMissionId] = useState<string | null>(null);

  // Formations
  const [formations, setFormations] = useState<Formation[]>([]);
  const [showFormationBuilder, setShowFormationBuilder] = useState(false);
  const [firingFormationId, setFiringFormationId] = useState<string | null>(null);

  React.useEffect(() => {
    loadFormations().then(setFormations);
  }, []);

  const handleAddDrone = () => {
    if (!newDrone.label.trim()) return;
    addDrone(newDrone.label.trim(), {
      host: newDrone.host,
      port: newDrone.port,
      accessCode: newDrone.accessCode,
      protocol: newDrone.protocol,
    });
    setNewDrone(DEFAULT_NEW_DRONE);
    setShowAddDrone(false);
  };

  const handleConnectAll = async () => {
    setConnecting(true);
    try { await connectFleet(); } finally { setConnecting(false); }
  };

  const handleIlluminateAll = async () => {
    const loc = coords ?? await requestLocation();
    if (!loc) return;
    setIlluminating(true);
    try { await illuminateFleet(loc, null); } finally { setIlluminating(false); }
  };

  const handleFetchWeather = async () => {
    const loc = coords ?? await requestLocation();
    if (loc) await fetchWeather(loc);
  };

  const handlePlayMission = async (mission: typeof missions[0]) => {
    setPlayingMissionId(mission.id);
    try { await playMission(mission); } finally { setPlayingMissionId(null); }
  };

  const handleCreateFormation = async (data: {
    name: string;
    shape: Formation['shape'];
    fireMode: Formation['fireMode'];
    droneIds: string[];
    delayBetweenMs: number;
    brightness: number;
  }) => {
    const formation = createFormation(data.name, data.shape, data.fireMode, data.droneIds, data.delayBetweenMs, data.brightness);
    await saveFormation(formation);
    setFormations(await loadFormations());
    setShowFormationBuilder(false);
  };

  const handleDeleteFormation = async (id: string) => {
    const updated = await deleteFormationStorage(id);
    setFormations(updated);
  };

  const handleFireFormation = async (formation: Formation) => {
    const loc = coords ?? await requestLocation();
    if (!loc) return;
    setFiringFormationId(formation.id);
    try { await fireFormation(formation, loc); } finally { setFiringFormationId(null); }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Layout.spacing.md }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── FLEET ── */}
        <Text style={styles.sectionTitle}>FLEET</Text>
        <FleetStatusBar fleet={fleet} />

        {fleet.map((drone) => (
          <DroneCard key={drone.id} drone={drone} onRemove={removeDrone} />
        ))}

        {fleet.length === 0 && (
          <Text style={styles.empty}>No drones added yet</Text>
        )}

        {showAddDrone ? (
          <View style={styles.addForm}>
            <Text style={styles.formTitle}>ADD DRONE</Text>
            <Text style={styles.fieldLabel}>LABEL</Text>
            <TextInput
              style={styles.input}
              value={newDrone.label}
              onChangeText={(v) => setNewDrone((p) => ({ ...p, label: v }))}
              placeholder="e.g. Drone Alpha"
              placeholderTextColor={Colors.text.muted}
            />
            <Text style={styles.fieldLabel}>HOST / IP</Text>
            <TextInput
              style={styles.input}
              value={newDrone.host}
              onChangeText={(v) => setNewDrone((p) => ({ ...p, host: v }))}
              placeholder="demo"
              placeholderTextColor={Colors.text.muted}
              autoCapitalize="none"
            />
            <Text style={styles.fieldLabel}>PORT</Text>
            <TextInput
              style={styles.input}
              value={newDrone.port}
              onChangeText={(v) => setNewDrone((p) => ({ ...p, port: v }))}
              placeholder="8080"
              placeholderTextColor={Colors.text.muted}
              keyboardType="number-pad"
            />
            <Text style={styles.fieldLabel}>ACCESS CODE</Text>
            <TextInput
              style={styles.input}
              value={newDrone.accessCode}
              onChangeText={(v) => setNewDrone((p) => ({ ...p, accessCode: v }))}
              placeholder="Leave blank if none"
              placeholderTextColor={Colors.text.muted}
              secureTextEntry
              autoCapitalize="none"
            />
            <Text style={styles.fieldLabel}>PROTOCOL</Text>
            <View style={styles.segmented}>
              {(['ws', 'http'] as Protocol[]).map((proto) => (
                <Pressable
                  key={proto}
                  onPress={() => setNewDrone((p) => ({ ...p, protocol: proto }))}
                  style={[styles.segment, newDrone.protocol === proto && styles.segmentActive]}
                >
                  <Text style={[styles.segmentLabel, newDrone.protocol === proto && styles.segmentLabelActive]}>
                    {proto.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.formActions}>
              <GlowButton label="CANCEL" variant="ghost" onPress={() => setShowAddDrone(false)} />
              <GlowButton label="ADD" onPress={handleAddDrone} disabled={!newDrone.label.trim()} />
            </View>
          </View>
        ) : (
          <GlowButton
            label="+ ADD DRONE"
            variant="ghost"
            onPress={() => setShowAddDrone(true)}
            style={styles.addBtn}
          />
        )}

        <View style={styles.fleetActions}>
          <GlowButton
            label="CONNECT ALL"
            onPress={handleConnectAll}
            loading={connecting}
            disabled={fleet.length === 0}
            style={styles.actionBtn}
          />
          <GlowButton
            label="DISCONNECT ALL"
            variant="danger"
            onPress={disconnectFleet}
            disabled={fleet.length === 0}
            style={styles.actionBtn}
          />
        </View>
        <GlowButton
          label="ILLUMINATE ALL"
          onPress={handleIlluminateAll}
          loading={illuminating}
          disabled={fleet.length === 0}
          style={styles.illuminateBtn}
        />

        {/* ── WEATHER ── */}
        <Text style={[styles.sectionTitle, styles.sectionGap]}>WEATHER</Text>
        {weather ? (
          <WeatherCard weather={weather} />
        ) : (
          <Text style={styles.empty}>No weather data</Text>
        )}
        <GlowButton
          label="FETCH WEATHER"
          variant="ghost"
          onPress={handleFetchWeather}
          loading={weatherLoading}
          style={styles.weatherBtn}
        />

        {/* ── SCHEDULES ── */}
        <Text style={[styles.sectionTitle, styles.sectionGap]}>SCHEDULES</Text>
        {schedules.map((s) => (
          <ScheduleCard
            key={s.id}
            schedule={s}
            onToggle={updateSchedule}
            onDelete={deleteSchedule}
          />
        ))}
        {schedules.length === 0 && !showScheduleForm && (
          <Text style={styles.empty}>No schedules</Text>
        )}

        {showScheduleForm ? (
          <ScheduleForm
            coords={coords}
            onSubmit={(data) => {
              createSchedule({ ...data, droneIds: [], enabled: true });
              setShowScheduleForm(false);
            }}
            onCancel={() => setShowScheduleForm(false)}
          />
        ) : (
          <GlowButton
            label="+ NEW SCHEDULE"
            variant="ghost"
            onPress={() => {
              if (!coords) requestLocation();
              setShowScheduleForm(true);
            }}
            style={styles.addBtn}
          />
        )}

        {/* ── MISSIONS ── */}
        <Text style={[styles.sectionTitle, styles.sectionGap]}>MISSIONS</Text>
        {missions.map((m) => (
          <MissionCard
            key={m.id}
            mission={m}
            onPlay={handlePlayMission}
            onDelete={deleteMission}
            playing={playingMissionId === m.id}
          />
        ))}
        {missions.length === 0 && (
          <Text style={styles.empty}>No missions recorded. Use REC on the Camera tab.</Text>
        )}

        {/* ── FORMATIONS ── */}
        <Text style={[styles.sectionTitle, styles.sectionGap]}>FORMATIONS</Text>
        {formations.map((f) => (
          <FormationCard
            key={f.id}
            formation={f}
            onFire={handleFireFormation}
            onDelete={handleDeleteFormation}
            firing={firingFormationId === f.id}
          />
        ))}
        {formations.length === 0 && !showFormationBuilder && (
          <Text style={styles.empty}>No formations</Text>
        )}

        {showFormationBuilder ? (
          <FormationBuilder
            fleet={fleet}
            onSubmit={handleCreateFormation}
            onCancel={() => setShowFormationBuilder(false)}
          />
        ) : (
          <GlowButton
            label="+ FORMATION"
            variant="ghost"
            onPress={() => setShowFormationBuilder(true)}
            style={styles.addBtn}
          />
        )}

        <View style={{ height: insets.bottom + Layout.spacing.xl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Layout.spacing.md },
  sectionTitle: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: Layout.spacing.md,
  },
  sectionGap: { marginTop: Layout.spacing.xl },
  empty: {
    color: Colors.text.muted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: Layout.spacing.md,
  },
  addBtn: { marginBottom: Layout.spacing.md },
  addForm: {
    backgroundColor: Colors.bg.elevated,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    gap: Layout.spacing.xs,
  },
  formTitle: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: Layout.spacing.sm,
  },
  fieldLabel: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: Layout.spacing.xs,
  },
  input: {
    backgroundColor: Colors.bg.surface,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm + 2,
    color: Colors.text.primary,
    fontSize: 14,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginTop: Layout.spacing.xs,
  },
  segment: {
    flex: 1,
    paddingVertical: Layout.spacing.sm,
    alignItems: 'center',
    backgroundColor: Colors.bg.surface,
  },
  segmentActive: { backgroundColor: Colors.accent.blue },
  segmentLabel: {
    color: Colors.text.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  segmentLabelActive: { color: '#fff' },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Layout.spacing.sm,
    marginTop: Layout.spacing.md,
  },
  fleetActions: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.sm,
  },
  actionBtn: { flex: 1 },
  illuminateBtn: { marginBottom: Layout.spacing.md },
  weatherBtn: { marginTop: Layout.spacing.sm },
});
