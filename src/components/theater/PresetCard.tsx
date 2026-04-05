import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

export type PresetType =
  | 'fireworks'
  | 'aurora'
  | 'constellation'
  | 'storm'
  | 'sunrise'
  | 'nebula'
  | 'pulse'
  | 'matrix';

export interface ShowPreset {
  id: string;
  type: PresetType;
  name: string;
  description: string;
  minDrones: number;
  durationSec: number;
}

const PRESET_ICONS: Record<PresetType, string> = {
  fireworks: '🎆',
  aurora: '🌌',
  constellation: '⭐',
  storm: '⛈️',
  sunrise: '🌅',
  nebula: '🌠',
  pulse: '💠',
  matrix: '🔢',
};

const PRESET_ACCENT: Record<PresetType, string> = {
  fireworks: '#EF4444',
  aurora: '#06B6D4',
  constellation: '#F59E0B',
  storm: '#6366F1',
  sunrise: '#F97316',
  nebula: '#A855F7',
  pulse: '#3B82F6',
  matrix: '#10B981',
};

interface PresetCardProps {
  preset: ShowPreset;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function PresetCard({ preset, selected, onSelect }: PresetCardProps) {
  const accent = PRESET_ACCENT[preset.type];

  return (
    <Pressable
      style={[
        styles.card,
        selected && { borderColor: accent, backgroundColor: accent + '15' },
      ]}
      onPress={() => onSelect(preset.id)}
    >
      {/* Icon */}
      <View style={[styles.iconWrap, { borderColor: accent + '60', backgroundColor: accent + '20' }]}>
        <Text style={styles.icon}>{PRESET_ICONS[preset.type]}</Text>
      </View>

      {/* Name */}
      <Text style={[styles.name, selected && { color: accent }]} numberOfLines={1}>
        {preset.name}
      </Text>

      {/* Description */}
      <Text style={styles.description} numberOfLines={2}>
        {preset.description}
      </Text>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={[styles.badge, { backgroundColor: accent + '25', borderColor: accent + '60' }]}>
          <Text style={[styles.badgeText, { color: accent }]}>
            {preset.minDrones}+ DRONES
          </Text>
        </View>
        <Text style={styles.duration}>
          {Math.round(preset.durationSec)}s
        </Text>
      </View>

      {/* Selected indicator */}
      {selected && (
        <View style={[styles.selectedDot, { backgroundColor: accent }]} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    backgroundColor: Colors.bg.elevated,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Layout.spacing.md,
    gap: Layout.spacing.xs,
    position: 'relative',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  icon: {
    fontSize: 22,
  },
  name: {
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  description: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  badge: {
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  duration: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  selectedDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
