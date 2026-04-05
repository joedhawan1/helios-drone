import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

export type LightPattern = 'pulse' | 'strobe' | 'wave' | 'chase' | 'rainbow' | 'breathe';

const PATTERN_META: Record<LightPattern, { label: string; icon: string }> = {
  pulse:   { label: 'Pulse',   icon: '◐' },
  strobe:  { label: 'Strobe',  icon: '⚡' },
  wave:    { label: 'Wave',    icon: '〰' },
  chase:   { label: 'Chase',   icon: '➤' },
  rainbow: { label: 'Rainbow', icon: '🌈' },
  breathe: { label: 'Breathe', icon: '💨' },
};

interface PatternButtonProps {
  pattern: LightPattern;
  selected: boolean;
  onPress: (pattern: LightPattern) => void;
}

export function PatternButton({ pattern, selected, onPress }: PatternButtonProps) {
  const meta = PATTERN_META[pattern];
  return (
    <Pressable
      onPress={() => onPress(pattern)}
      style={[styles.btn, selected && styles.btnSelected]}
    >
      <Text style={styles.icon}>{meta.icon}</Text>
      <Text style={[styles.label, selected && styles.labelSelected]}>{meta.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs + 2,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg.surface,
    minWidth: 52,
    gap: 2,
  },
  btnSelected: {
    borderColor: Colors.accent.cyan,
    backgroundColor: Colors.bg.elevated,
  },
  icon: {
    fontSize: 14,
  },
  label: {
    color: Colors.text.muted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  labelSelected: {
    color: Colors.accent.cyan,
  },
});
