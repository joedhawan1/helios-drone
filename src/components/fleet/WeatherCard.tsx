import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import type { WeatherData, WeatherCondition } from '../../types/drone';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

interface WeatherCardProps {
  weather: WeatherData;
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function weatherIcon(condition: WeatherCondition): IoniconName {
  switch (condition) {
    case 'clear': return 'sunny';
    case 'cloudy': return 'partly-sunny';
    case 'overcast': return 'cloud';
    case 'rain': return 'rainy';
    case 'storm': return 'thunderstorm';
    case 'snow': return 'snow';
    case 'fog': return 'cloud-outline';
    default: return 'help-circle';
  }
}

export function WeatherCard({ weather }: WeatherCardProps) {
  const brightnessPercent = Math.round(weather.brightnessRecommendation * 100);

  return (
    <Card>
      <View style={styles.header}>
        <Ionicons name={weatherIcon(weather.condition)} size={28} color={Colors.accent.cyan} />
        <View style={styles.headerText}>
          <Text style={styles.condition}>{weather.condition.toUpperCase()}</Text>
          <Text style={styles.description}>{weather.description}</Text>
        </View>
        <Text style={styles.temp}>{weather.tempC.toFixed(0)}°C</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>WIND</Text>
          <Text style={styles.statValue}>{weather.windSpeedMs.toFixed(1)} m/s</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>HUMIDITY</Text>
          <Text style={styles.statValue}>{weather.humidity}%</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>REC. BRIGHTNESS</Text>
          <Text style={styles.statValue}>{brightnessPercent}%</Text>
        </View>
      </View>

      {/* Brightness recommendation bar */}
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${brightnessPercent}%` }]} />
      </View>

      {weather.warnings.length > 0 && (
        <View style={styles.warnings}>
          {weather.warnings.map((w, i) => (
            <View key={i} style={styles.warningRow}>
              <Ionicons name="warning" size={12} color={Colors.accent.warning} />
              <Text style={styles.warningText}>{w}</Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.md,
  },
  headerText: { flex: 1 },
  condition: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  description: {
    color: Colors.text.secondary,
    fontSize: 11,
    marginTop: 2,
  },
  temp: {
    color: Colors.text.primary,
    fontSize: 22,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.sm,
  },
  stat: { alignItems: 'center' },
  statLabel: {
    color: Colors.text.muted,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
  },
  statValue: {
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  barTrack: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Layout.spacing.sm,
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.accent.cyan,
    borderRadius: 2,
  },
  warnings: {
    gap: Layout.spacing.xs,
    marginTop: Layout.spacing.xs,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  warningText: {
    color: Colors.accent.warning,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
