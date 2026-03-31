import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { GlowButton } from '../ui/GlowButton';
import type { FormationShape, FireMode, FleetDrone } from '../../types/drone';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

interface FormationBuilderProps {
  fleet: FleetDrone[];
  onSubmit: (data: {
    name: string;
    shape: FormationShape;
    fireMode: FireMode;
    droneIds: string[];
    delayBetweenMs: number;
    brightness: number;
  }) => void;
  onCancel: () => void;
}

const SHAPES: FormationShape[] = ['line', 'v-shape', 'circle', 'grid'];
const FIRE_MODES: FireMode[] = ['simultaneous', 'sequential', 'ripple'];

export function FormationBuilder({ fleet, onSubmit, onCancel }: FormationBuilderProps) {
  const [name, setName] = useState('');
  const [shape, setShape] = useState<FormationShape>('line');
  const [fireMode, setFireMode] = useState<FireMode>('simultaneous');
  const [selectedDrones, setSelectedDrones] = useState<string[]>(fleet.map((d) => d.id));
  const [delayMs, setDelayMs] = useState('200');
  const [brightness, setBrightness] = useState('100');

  const toggleDrone = (id: string) => {
    setSelectedDrones((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  };

  const handleSubmit = () => {
    if (!name.trim() || selectedDrones.length === 0) return;
    onSubmit({
      name: name.trim(),
      shape,
      fireMode,
      droneIds: selectedDrones,
      delayBetweenMs: parseInt(delayMs, 10) || 200,
      brightness: parseInt(brightness, 10) || 100,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NEW FORMATION</Text>

      <Text style={styles.label}>NAME</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Formation name"
        placeholderTextColor={Colors.text.muted}
      />

      <Text style={styles.label}>SHAPE</Text>
      <View style={styles.segmented}>
        {SHAPES.map((s) => (
          <Pressable
            key={s}
            onPress={() => setShape(s)}
            style={[styles.segment, shape === s && styles.segmentActive]}
          >
            <Text style={[styles.segmentLabel, shape === s && styles.segmentLabelActive]}>
              {s.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>FIRE MODE</Text>
      <View style={styles.segmented}>
        {FIRE_MODES.map((m) => (
          <Pressable
            key={m}
            onPress={() => setFireMode(m)}
            style={[styles.segment, fireMode === m && styles.segmentActive]}
          >
            <Text style={[styles.segmentLabel, fireMode === m && styles.segmentLabelActive]}>
              {m.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>DELAY BETWEEN (MS)</Text>
      <TextInput
        style={styles.input}
        value={delayMs}
        onChangeText={setDelayMs}
        keyboardType="number-pad"
        placeholderTextColor={Colors.text.muted}
      />

      <Text style={styles.label}>BRIGHTNESS (%)</Text>
      <TextInput
        style={styles.input}
        value={brightness}
        onChangeText={setBrightness}
        keyboardType="number-pad"
        placeholderTextColor={Colors.text.muted}
      />

      <Text style={styles.label}>DRONES</Text>
      {fleet.map((drone) => (
        <Pressable
          key={drone.id}
          onPress={() => toggleDrone(drone.id)}
          style={[styles.droneRow, selectedDrones.includes(drone.id) && styles.droneRowActive]}
        >
          <Text style={styles.droneLabel}>{drone.label}</Text>
          <Text style={styles.droneCheck}>
            {selectedDrones.includes(drone.id) ? '●' : '○'}
          </Text>
        </Pressable>
      ))}

      <View style={styles.actions}>
        <GlowButton label="CANCEL" variant="ghost" onPress={onCancel} />
        <GlowButton label="CREATE" onPress={handleSubmit} disabled={!name.trim() || selectedDrones.length === 0} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bg.elevated,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    gap: Layout.spacing.xs,
  },
  title: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: Layout.spacing.sm,
  },
  label: {
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
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  segmentLabelActive: { color: '#fff' },
  droneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bg.surface,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    marginTop: Layout.spacing.xs,
  },
  droneRowActive: { borderColor: Colors.accent.blue },
  droneLabel: { color: Colors.text.primary, fontSize: 13 },
  droneCheck: { color: Colors.accent.blue, fontSize: 16 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Layout.spacing.sm,
    marginTop: Layout.spacing.md,
  },
});
