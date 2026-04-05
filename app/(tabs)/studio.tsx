import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SimpleSlider } from '../../src/components/ui/SimpleSlider';
import { GlowButton } from '../../src/components/ui/GlowButton';
import { Card } from '../../src/components/ui/Card';
import { FrequencyVisualizer } from '../../src/components/studio/FrequencyVisualizer';
import { AimIndicator } from '../../src/components/studio/AimIndicator';
import { PaintCanvas } from '../../src/components/studio/PaintCanvas';
import { PatternButton } from '../../src/components/studio/PatternButton';
import type { LightPattern } from '../../src/components/studio/PatternButton';
import type { RepeatCount } from '../../src/hooks/useStudio';
import { useStudio } from '../../src/hooks/useStudio';
import { Colors } from '../../src/constants/colors';
import { Layout } from '../../src/constants/layout';

const PATTERNS: LightPattern[] = ['pulse', 'strobe', 'wave', 'chase', 'rainbow', 'breathe'];
const PRESETS = ['Heart', 'Star', 'Spiral', 'Zigzag', 'Infinity'];
const REPEAT_OPTIONS: RepeatCount[] = [1, 2, 3, 'infinite'];

function SectionHeader({
  title,
  open,
  onToggle,
  badge,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  badge?: string;
}) {
  return (
    <Pressable style={styles.sectionHeader} onPress={onToggle}>
      <View style={styles.sectionHeaderLeft}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {badge ? (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.chevron}>{open ? '▲' : '▼'}</Text>
    </Pressable>
  );
}

function RowLabel({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.rowLabel}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {value !== undefined && <Text style={styles.fieldValue}>{value}</Text>}
    </View>
  );
}

function Toggle({ value, onToggle, label }: { value: boolean; onToggle: () => void; label: string }) {
  return (
    <Pressable style={styles.toggleRow} onPress={onToggle}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.togglePill, value && styles.togglePillOn]}>
        <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
      </View>
    </Pressable>
  );
}

export default function StudioScreen() {
  const insets = useSafeAreaInsets();
  const studio = useStudio();

  const [showLightshow, setShowLightshow] = useState(true);
  const [showGestureAim, setShowGestureAim] = useState(false);
  const [showARPaint, setShowARPaint] = useState(false);

  const { lightshow, gestureAim, arPaint } = studio;

  // Determine active mode badge
  const activeBadge = lightshow.active
    ? 'ACTIVE'
    : gestureAim.active
    ? 'ACTIVE'
    : arPaint.executing
    ? 'EXECUTING'
    : undefined;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Layout.spacing.md, paddingBottom: insets.bottom + Layout.spacing.xl },
      ]}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>Studio</Text>
          <Text style={styles.screenSubtitle}>Creative Light Tools</Text>
        </View>
        {activeBadge && (
          <View style={styles.headerBadge}>
            <View style={styles.headerBadgeDot} />
            <Text style={styles.headerBadgeText}>{activeBadge}</Text>
          </View>
        )}
      </View>

      {/* ────────────────────────────────────────────
          Section 1: Sound-Reactive Lightshow
      ──────────────────────────────────────────── */}
      <Card style={styles.sectionCard}>
        <SectionHeader
          title="SOUND-REACTIVE LIGHTSHOW"
          open={showLightshow}
          onToggle={() => setShowLightshow((v) => !v)}
          badge={lightshow.active ? 'LIVE' : undefined}
        />

        {showLightshow && (
          <View style={styles.sectionBody}>
            {/* Pattern row */}
            <RowLabel label="PATTERN" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.patternScroll}>
              <View style={styles.patternRow}>
                {PATTERNS.map((p) => (
                  <PatternButton
                    key={p}
                    pattern={p}
                    selected={lightshow.pattern === p}
                    onPress={studio.setPattern}
                  />
                ))}
              </View>
            </ScrollView>

            {/* Sensitivity */}
            <RowLabel label="SENSITIVITY" value={`${lightshow.sensitivity}%`} />
            <SimpleSlider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={lightshow.sensitivity}
              onValueChange={studio.setSensitivity}
              minimumTrackTintColor={Colors.accent.blue}
              maximumTrackTintColor={Colors.border}
              thumbTintColor={Colors.accent.blue}
            />

            {/* Brightness range */}
            <RowLabel label="MIN BRIGHTNESS" value={`${lightshow.minBrightness}%`} />
            <SimpleSlider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={lightshow.minBrightness}
              onValueChange={studio.setMinBrightness}
              minimumTrackTintColor={Colors.accent.cyan}
              maximumTrackTintColor={Colors.border}
              thumbTintColor={Colors.accent.cyan}
            />

            <RowLabel label="MAX BRIGHTNESS" value={`${lightshow.maxBrightness}%`} />
            <SimpleSlider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={lightshow.maxBrightness}
              onValueChange={studio.setMaxBrightness}
              minimumTrackTintColor={Colors.accent.cyan}
              maximumTrackTintColor={Colors.border}
              thumbTintColor={Colors.accent.cyan}
            />

            {/* BPM */}
            <View style={styles.bpmRow}>
              <View style={styles.bpmDisplay}>
                <Text style={styles.bpmValue}>{lightshow.bpm}</Text>
                <Text style={styles.bpmLabel}>BPM</Text>
              </View>
              <GlowButton label="TAP BPM" variant="ghost" onPress={studio.tapBpm} />
            </View>

            <GlowButton
              label="SIMULATE BEAT"
              variant="ghost"
              onPress={studio.simulateBeat}
              style={styles.mb}
            />

            {/* Visualizer (shown when active) */}
            {lightshow.active && (
              <FrequencyVisualizer bands={lightshow.bands} droneCount={3} />
            )}

            <GlowButton
              label={lightshow.active ? 'STOP LIGHTSHOW' : 'START LIGHTSHOW'}
              variant={lightshow.active ? 'danger' : 'primary'}
              onPress={lightshow.active ? studio.stopLightshow : studio.startLightshow}
              style={styles.mt}
            />
          </View>
        )}
      </Card>

      {/* ────────────────────────────────────────────
          Section 2: Gesture Aim
      ──────────────────────────────────────────── */}
      <Card style={styles.sectionCard}>
        <SectionHeader
          title="GESTURE AIM — SKY POINTER"
          open={showGestureAim}
          onToggle={() => setShowGestureAim((v) => !v)}
          badge={gestureAim.active ? 'LIVE' : undefined}
        />

        {showGestureAim && (
          <View style={styles.sectionBody}>
            {/* Aim indicator (shown when active) */}
            {gestureAim.active && (
              <View style={styles.aimContainer}>
                <AimIndicator
                  azimuth={gestureAim.azimuth}
                  elevation={gestureAim.elevation}
                  intensity={gestureAim.intensity}
                />
              </View>
            )}

            <RowLabel label="SENSITIVITY X" value={`${gestureAim.sensitivityX}%`} />
            <SimpleSlider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={gestureAim.sensitivityX}
              onValueChange={studio.setAimSensitivityX}
              minimumTrackTintColor={Colors.accent.blue}
              maximumTrackTintColor={Colors.border}
              thumbTintColor={Colors.accent.blue}
            />

            <RowLabel label="SENSITIVITY Y" value={`${gestureAim.sensitivityY}%`} />
            <SimpleSlider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={gestureAim.sensitivityY}
              onValueChange={studio.setAimSensitivityY}
              minimumTrackTintColor={Colors.accent.blue}
              maximumTrackTintColor={Colors.border}
              thumbTintColor={Colors.accent.blue}
            />

            <Toggle value={gestureAim.invertX} onToggle={studio.toggleInvertX} label="INVERT X" />
            <Toggle value={gestureAim.invertY} onToggle={studio.toggleInvertY} label="INVERT Y" />

            <RowLabel label="DEADZONE" value={`${gestureAim.deadzone}°`} />
            <SimpleSlider
              style={styles.slider}
              minimumValue={0}
              maximumValue={30}
              step={1}
              value={gestureAim.deadzone}
              onValueChange={studio.setDeadzone}
              minimumTrackTintColor={Colors.accent.warning}
              maximumTrackTintColor={Colors.border}
              thumbTintColor={Colors.accent.warning}
            />

            <RowLabel label="SMOOTHING" value={`${gestureAim.smoothing}%`} />
            <SimpleSlider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={gestureAim.smoothing}
              onValueChange={studio.setSmoothing}
              minimumTrackTintColor={Colors.accent.blue}
              maximumTrackTintColor={Colors.border}
              thumbTintColor={Colors.accent.blue}
            />

            <View style={styles.rowActions}>
              <GlowButton
                label="CALIBRATE"
                variant="ghost"
                onPress={studio.calibrateAim}
                style={styles.flex1}
              />
              <GlowButton
                label={gestureAim.active ? 'STOP' : 'START AIM'}
                variant={gestureAim.active ? 'danger' : 'primary'}
                onPress={gestureAim.active ? studio.stopGestureAim : studio.startGestureAim}
                style={styles.flex1}
              />
            </View>
          </View>
        )}
      </Card>

      {/* ────────────────────────────────────────────
          Section 3: AR Light Painting
      ──────────────────────────────────────────── */}
      <Card style={styles.sectionCard}>
        <SectionHeader
          title="AR LIGHT PAINTING"
          open={showARPaint}
          onToggle={() => setShowARPaint((v) => !v)}
          badge={arPaint.executing ? 'RUNNING' : undefined}
        />

        {showARPaint && (
          <View style={styles.sectionBody}>
            {/* Canvas */}
            <PaintCanvas
              strokes={arPaint.strokes}
              onStrokeStart={studio.startStroke}
              onStrokeMove={studio.moveStroke}
              onStrokeEnd={studio.endStroke}
            />

            {/* Presets */}
            <RowLabel label="PRESETS" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.patternScroll}>
              <View style={styles.patternRow}>
                {PRESETS.map((p) => (
                  <Pressable key={p} style={styles.presetBtn} onPress={() => studio.loadPreset(p)}>
                    <Text style={styles.presetText}>{p}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* Speed */}
            <RowLabel label="SPEED" value={`${arPaint.speed}%`} />
            <SimpleSlider
              style={styles.slider}
              minimumValue={1}
              maximumValue={100}
              step={1}
              value={arPaint.speed}
              onValueChange={studio.setSpeed}
              minimumTrackTintColor={Colors.accent.cyan}
              maximumTrackTintColor={Colors.border}
              thumbTintColor={Colors.accent.cyan}
            />

            {/* Repeat count */}
            <RowLabel label="REPEAT" />
            <View style={styles.segmented}>
              {REPEAT_OPTIONS.map((r) => (
                <Pressable
                  key={String(r)}
                  style={[styles.segment, arPaint.repeatCount === r && styles.segmentActive]}
                  onPress={() => studio.setRepeatCount(r)}
                >
                  <Text style={[styles.segmentLabel, arPaint.repeatCount === r && styles.segmentLabelActive]}>
                    {r === 'infinite' ? '∞' : String(r)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Toggle value={arPaint.fadeTrail} onToggle={studio.toggleFadeTrail} label="FADE TRAIL" />

            {/* Exposure hint */}
            <View style={styles.exposureRow}>
              <Text style={styles.fieldLabel}>SUGGESTED EXPOSURE</Text>
              <Text style={styles.exposureVal}>{arPaint.exposureSec.toFixed(1)}s</Text>
            </View>

            {/* Progress bar when executing */}
            {arPaint.executing && (
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${arPaint.progress}%` }]} />
                <Text style={styles.progressLabel}>{Math.round(arPaint.progress)}%</Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.rowActions}>
              <GlowButton
                label={arPaint.executing ? 'STOP' : 'EXECUTE'}
                variant={arPaint.executing ? 'danger' : 'primary'}
                onPress={arPaint.executing ? studio.stopExecute : studio.executePattern}
                style={styles.flex1}
                disabled={arPaint.strokes.length === 0 && !arPaint.executing}
              />
            </View>

            <View style={styles.rowActions}>
              <GlowButton label="SAVE" variant="ghost" onPress={studio.savePattern} style={styles.flex1} />
              <GlowButton
                label="CLEAR"
                variant="ghost"
                onPress={studio.clearCanvas}
                style={styles.flex1}
                disabled={arPaint.strokes.length === 0}
              />
            </View>
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg.primary },
  content: { paddingHorizontal: Layout.spacing.md },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.lg,
  },
  screenTitle: {
    color: Colors.text.primary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1,
  },
  screenSubtitle: {
    color: Colors.text.muted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 2,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bg.elevated,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.accent.success,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
  },
  headerBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent.success,
  },
  headerBadgeText: {
    color: Colors.accent.success,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // Section
  sectionCard: { marginBottom: Layout.spacing.md, padding: 0, overflow: 'hidden' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.spacing.md,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  sectionTitle: {
    color: Colors.text.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  activeBadge: {
    backgroundColor: Colors.accent.success,
    borderRadius: Layout.borderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  activeBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  chevron: {
    color: Colors.text.muted,
    fontSize: 10,
  },
  sectionBody: {
    paddingHorizontal: Layout.spacing.md,
    paddingBottom: Layout.spacing.md,
    gap: Layout.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },

  // Labels
  rowLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Layout.spacing.xs,
  },
  fieldLabel: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  fieldValue: {
    color: Colors.text.secondary,
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  // Slider
  slider: { height: 36, marginHorizontal: -4 },

  // Pattern row
  patternScroll: { marginHorizontal: -Layout.spacing.xs },
  patternRow: {
    flexDirection: 'row',
    gap: Layout.spacing.xs,
    paddingHorizontal: Layout.spacing.xs,
  },

  // BPM
  bpmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bg.surface,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Layout.spacing.md,
  },
  bpmDisplay: { alignItems: 'center' },
  bpmValue: {
    color: Colors.accent.cyan,
    fontSize: 32,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  bpmLabel: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Layout.spacing.xs,
  },
  toggleLabel: {
    color: Colors.text.secondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  togglePill: {
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  togglePillOn: {
    backgroundColor: Colors.accent.blue,
    borderColor: Colors.accent.blue,
  },
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.text.muted,
    alignSelf: 'flex-start',
  },
  toggleThumbOn: {
    backgroundColor: '#fff',
    alignSelf: 'flex-end',
  },

  // Aim
  aimContainer: { alignItems: 'center', paddingVertical: Layout.spacing.md },

  // Row actions
  rowActions: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  flex1: { flex: 1 },

  // Segmented
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
  segmentActive: { backgroundColor: Colors.accent.blue },
  segmentLabel: {
    color: Colors.text.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  segmentLabelActive: { color: '#fff' },

  // Preset buttons
  presetBtn: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs + 2,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg.surface,
  },
  presetText: {
    color: Colors.text.secondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Exposure
  exposureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bg.surface,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
  },
  exposureVal: {
    color: Colors.accent.warning,
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },

  // Progress
  progressTrack: {
    height: 24,
    backgroundColor: Colors.bg.surface,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.accent.blue,
    borderRadius: Layout.borderRadius.sm,
  },
  progressLabel: {
    color: Colors.text.primary,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1,
  },

  // Misc
  mt: { marginTop: Layout.spacing.xs },
  mb: { marginBottom: Layout.spacing.xs },
});
