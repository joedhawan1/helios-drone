import React from 'react';
import { StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import type { DroneSettings, Protocol } from '../../types/drone';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

interface ConnectionFormProps {
  values: DroneSettings;
  onChange: (values: DroneSettings) => void;
}

export function ConnectionForm({ values, onChange }: ConnectionFormProps) {
  const set = (field: keyof DroneSettings, value: string) =>
    onChange({ ...values, [field]: value });

  return (
    <View style={styles.container}>
      <FormField
        label="HOST / IP"
        value={values.host}
        onChangeText={(v) => set('host', v)}
        placeholder="demo"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <FormField
        label="PORT"
        value={values.port}
        onChangeText={(v) => set('port', v)}
        placeholder="8080"
        keyboardType="number-pad"
      />
      <FormField
        label="ACCESS CODE"
        value={values.accessCode}
        onChangeText={(v) => set('accessCode', v)}
        placeholder="Leave blank if none"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={styles.protocolRow}>
        <Text style={styles.fieldLabel}>PROTOCOL</Text>
        <View style={styles.segmented}>
          {(['ws', 'http'] as Protocol[]).map((proto) => (
            <Pressable
              key={proto}
              onPress={() => onChange({ ...values, protocol: proto })}
              style={[
                styles.segment,
                values.protocol === proto && styles.segmentActive,
              ]}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  values.protocol === proto && styles.segmentLabelActive,
                ]}
              >
                {proto.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  keyboardType?: 'default' | 'number-pad';
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  autoCapitalize,
  autoCorrect,
  keyboardType = 'default',
}: FormFieldProps) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.text.muted}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        keyboardType={keyboardType}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Layout.spacing.md,
  },
  fieldWrapper: {
    gap: Layout.spacing.xs,
  },
  fieldLabel: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
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
  protocolRow: {
    gap: Layout.spacing.xs,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: Layout.spacing.sm,
    alignItems: 'center',
    backgroundColor: Colors.bg.surface,
  },
  segmentActive: {
    backgroundColor: Colors.accent.blue,
  },
  segmentLabel: {
    color: Colors.text.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  segmentLabelActive: {
    color: '#fff',
  },
});
