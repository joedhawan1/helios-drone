import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Card } from '../ui/Card';
import { GlowButton } from '../ui/GlowButton';
import type { GpsCoordinates, Recurrence } from '../../types/drone';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

interface ScheduleFormProps {
  coords: GpsCoordinates | null;
  onSubmit: (data: {
    name: string;
    dateTime: number;
    recurrence: Recurrence;
    brightness: number;
    coordinates: GpsCoordinates;
  }) => void;
  onCancel: () => void;
}

const RECURRENCE_OPTIONS: Recurrence[] = ['none', 'daily', 'weekly'];

export function ScheduleForm({ coords, onSubmit, onCancel }: ScheduleFormProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date(Date.now() + 3600000));
  const [recurrence, setRecurrence] = useState<Recurrence>('none');
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');

  const handleSubmit = () => {
    if (!name.trim() || !coords) return;
    onSubmit({
      name: name.trim(),
      dateTime: date.getTime(),
      recurrence,
      brightness: 1.0,
      coordinates: coords,
    });
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>NEW SCHEDULE</Text>

      <Text style={styles.label}>NAME</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Mission name"
        placeholderTextColor={Colors.text.muted}
      />

      <Text style={styles.label}>DATE & TIME</Text>
      {Platform.OS === 'android' && (
        <GlowButton
          label={date.toLocaleString()}
          variant="ghost"
          onPress={() => setShowPicker(true)}
          style={styles.dateBtn}
        />
      )}
      {showPicker && (
        <DateTimePicker
          value={date}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'compact' : 'default'}
          minimumDate={new Date()}
          onChange={(_e, selected) => {
            if (Platform.OS === 'android') setShowPicker(false);
            if (selected) setDate(selected);
          }}
          themeVariant="dark"
        />
      )}

      <Text style={styles.label}>RECURRENCE</Text>
      <View style={styles.recurrenceRow}>
        {RECURRENCE_OPTIONS.map((opt) => (
          <GlowButton
            key={opt}
            label={opt.toUpperCase()}
            variant={recurrence === opt ? 'primary' : 'ghost'}
            onPress={() => setRecurrence(opt)}
          />
        ))}
      </View>

      {!coords && (
        <Text style={styles.warning}>GPS coordinates required — open Camera tab first</Text>
      )}

      <View style={styles.actions}>
        <GlowButton label="CANCEL" variant="ghost" onPress={onCancel} />
        <GlowButton
          label="CREATE"
          onPress={handleSubmit}
          disabled={!name.trim() || !coords}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Layout.spacing.md },
  title: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: Layout.spacing.md,
  },
  label: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: Layout.spacing.xs,
    marginTop: Layout.spacing.sm,
  },
  input: {
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius.sm,
    color: Colors.text.primary,
    fontSize: 14,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.sm,
  },
  dateBtn: { alignSelf: 'flex-start' },
  recurrenceRow: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  warning: {
    color: Colors.accent.warning,
    fontSize: 11,
    marginTop: Layout.spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Layout.spacing.sm,
    marginTop: Layout.spacing.lg,
  },
});
