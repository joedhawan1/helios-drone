import React, { useEffect, useRef, useMemo } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const STAR_COUNT = 80;
const DRONE_DOT_SIZE = 18;

interface SpectatorDrone {
  id: string;
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
  brightness: number; // 0-100
  color: string;
}

interface SpectatorViewProps {
  showName: string;
  shareCode: string;
  spectatorCount: number;
  progressPct: number; // 0-100
  elapsedSec: number;
  totalSec: number;
  drones: SpectatorDrone[];
  isLive: boolean;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function LiveBadge() {
  const blink = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, [blink]);

  return (
    <View style={styles.liveBadge}>
      <Animated.View style={[styles.liveDot, { opacity: blink }]} />
      <Text style={styles.liveText}>LIVE</Text>
    </View>
  );
}

function GlowingDrone({ drone }: { drone: SpectatorDrone }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const delay = Math.random() * 2000;
    const t = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.4, duration: 800 + Math.random() * 400, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 800 + Math.random() * 400, useNativeDriver: true }),
        ])
      ).start();
    }, delay);
    return () => clearTimeout(t);
  }, [pulse]);

  const opacity = 0.2 + (drone.brightness / 100) * 0.8;

  return (
    <Animated.View
      style={[
        styles.droneDot,
        {
          left: drone.x * (SCREEN_W - DRONE_DOT_SIZE * 2) + DRONE_DOT_SIZE / 2,
          top: drone.y * (SCREEN_H * 0.55) + 60,
          backgroundColor: drone.color,
          opacity,
          shadowColor: drone.color,
          transform: [{ scale: pulse }],
        },
      ]}
    />
  );
}

export function SpectatorView({
  showName,
  shareCode,
  spectatorCount,
  progressPct,
  elapsedSec,
  totalSec,
  drones,
  isLive,
}: SpectatorViewProps) {
  // Generate stable star positions
  const stars = useMemo(() =>
    Array.from({ length: STAR_COUNT }, (_, i) => ({
      id: i,
      x: (Math.sin(i * 137.508) * 0.5 + 0.5) * SCREEN_W,
      y: (Math.cos(i * 97.381) * 0.5 + 0.5) * SCREEN_H * 0.75,
      size: 1 + (i % 3),
      opacity: 0.2 + (i % 5) * 0.12,
    })), []);

  return (
    <View style={styles.overlay}>
      {/* Star field */}
      {stars.map((star) => (
        <View
          key={star.id}
          style={[
            styles.star,
            {
              left: star.x,
              top: star.y,
              width: star.size,
              height: star.size,
              borderRadius: star.size / 2,
              opacity: star.opacity,
            },
          ]}
        />
      ))}

      {/* Drone representations */}
      {drones.map((drone) => (
        <GlowingDrone key={drone.id} drone={drone} />
      ))}

      {/* Top bar */}
      <View style={styles.topBar}>
        {isLive && <LiveBadge />}
        <View style={styles.spectatorBadge}>
          <Text style={styles.spectatorIcon}>👁</Text>
          <Text style={styles.spectatorCount}>{spectatorCount}</Text>
        </View>
      </View>

      {/* Bottom panel */}
      <View style={styles.bottomPanel}>
        <Text style={styles.showName}>{showName}</Text>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, progressPct))}%` }]} />
        </View>

        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(elapsedSec)}</Text>
          <Text style={styles.timeText}>{formatTime(totalSec)}</Text>
        </View>

        {/* Share code */}
        <View style={styles.shareSection}>
          <Text style={styles.shareLabel}>SHARE CODE</Text>
          <View style={styles.shareCodeBox}>
            <Text style={styles.shareCode}>{shareCode}</Text>
          </View>
          <Text style={styles.shareHint}>Share this code with your audience</Text>
        </View>
      </View>
    </View>
  );
}

const MONO = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#05080f',
  },
  star: {
    position: 'absolute',
    backgroundColor: '#fff',
  },
  droneDot: {
    position: 'absolute',
    width: DRONE_DOT_SIZE,
    height: DRONE_DOT_SIZE,
    borderRadius: DRONE_DOT_SIZE / 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 8,
  },
  topBar: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.accent.danger,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.accent.danger,
  },
  liveText: {
    color: Colors.accent.danger,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    fontFamily: MONO,
  },
  spectatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  spectatorIcon: { fontSize: 12 },
  spectatorCount: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: MONO,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(5,8,15,0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    padding: Layout.spacing.lg,
    gap: Layout.spacing.sm,
  },
  showName: {
    color: Colors.text.primary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent.cyan,
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: MONO,
    letterSpacing: 1,
  },
  shareSection: {
    alignItems: 'center',
    gap: Layout.spacing.xs,
    marginTop: Layout.spacing.xs,
  },
  shareLabel: {
    color: Colors.text.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
  },
  shareCodeBox: {
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.4)',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.sm,
  },
  shareCode: {
    color: Colors.accent.blue,
    fontSize: 22,
    fontWeight: '800',
    fontFamily: MONO,
    letterSpacing: 6,
    textAlign: 'center',
  },
  shareHint: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '500',
    opacity: 0.6,
  },
});
