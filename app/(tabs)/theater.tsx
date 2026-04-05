import React, { useState, useRef } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlowButton } from '../../src/components/ui/GlowButton';
import { Card } from '../../src/components/ui/Card';
import { SimpleSlider } from '../../src/components/ui/SimpleSlider';
import { DroneGrid } from '../../src/components/theater/DroneGrid';
import { TimelineEditor } from '../../src/components/theater/TimelineEditor';
import { PresetCard } from '../../src/components/theater/PresetCard';
import { SpectatorView } from '../../src/components/theater/SpectatorView';
import { Colors } from '../../src/constants/colors';
import { Layout } from '../../src/constants/layout';
import type { DroneState } from '../../src/components/theater/DroneGrid';
import type { ShowPreset } from '../../src/components/theater/PresetCard';
import type { TimelineScene } from '../../src/components/theater/TimelineEditor';

// ─── Types ───────────────────────────────────────────────────────────────────

type ChoreographStyle = 'rhythmic' | 'melodic' | 'chaotic' | 'cinematic';
type DurationOption = 30 | 60 | 120 | 300;
type PlaybackState = 'stopped' | 'playing' | 'paused';

interface SavedShow {
  id: string;
  name: string;
  durationSec: number;
  sceneCount: number;
  lastPlayed?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_DRONES: DroneState[] = [
  { id: 'd1', label: 'DRONE-1', brightness: 82, colorTemp: 3200 },
  { id: 'd2', label: 'DRONE-2', brightness: 45, colorTemp: 5500 },
  { id: 'd3', label: 'DRONE-3', brightness: 100, colorTemp: 2700 },
  { id: 'd4', label: 'DRONE-4', brightness: 60, colorTemp: 6000 },
  { id: 'd5', label: 'DRONE-5', brightness: 20, colorTemp: 4000 },
  { id: 'd6', label: 'DRONE-6', brightness: 75, colorTemp: 3500 },
];

const MOCK_SCENES: TimelineScene[] = [
  { id: 's1', name: 'INTRO',    startSec: 0,  durationSec: 15, color: '#3B82F6' },
  { id: 's2', name: 'RISE',     startSec: 15, durationSec: 20, color: '#06B6D4' },
  { id: 's3', name: 'CLIMAX',   startSec: 35, durationSec: 25, color: '#EF4444' },
  { id: 's4', name: 'FADE OUT', startSec: 60, durationSec: 20, color: '#A855F7' },
];

const SHOW_PRESETS: ShowPreset[] = [
  { id: 'p1', type: 'fireworks',     name: 'Grand Finale',   description: 'Explosive bursts synchronized to music peaks',  minDrones: 8,  durationSec: 120 },
  { id: 'p2', type: 'aurora',        name: 'Aurora Wave',    description: 'Flowing curtain of color across the night sky', minDrones: 6,  durationSec: 180 },
  { id: 'p3', type: 'constellation', name: 'Star Map',       description: 'Drones trace classic constellation patterns',    minDrones: 12, durationSec: 90  },
  { id: 'p4', type: 'storm',         name: 'Tempest',        description: 'Electric chaos — lightning and rumbling thunder',minDrones: 5,  durationSec: 60  },
  { id: 'p5', type: 'sunrise',       name: 'Golden Hour',    description: 'Warm amber gradient rising from the horizon',   minDrones: 4,  durationSec: 150 },
  { id: 'p6', type: 'nebula',        name: 'Deep Space',     description: 'Swirling cosmic colors in slow formation',      minDrones: 10, durationSec: 240 },
];

const SAVED_SHOWS: SavedShow[] = [
  { id: 'sh1', name: 'Festival Opening',  durationSec: 180, sceneCount: 8,  lastPlayed: '2026-04-03' },
  { id: 'sh2', name: 'Wedding Ceremony',  durationSec: 300, sceneCount: 12, lastPlayed: '2026-03-28' },
  { id: 'sh3', name: 'Product Launch',    durationSec: 90,  sceneCount: 5,  lastPlayed: undefined },
];

const STYLE_OPTIONS: ChoreographStyle[] = ['rhythmic', 'melodic', 'chaotic', 'cinematic'];
const DURATION_OPTIONS: DurationOption[] = [30, 60, 120, 300];

const STYLE_ICONS: Record<ChoreographStyle, string> = {
  rhythmic: '🥁',
  melodic:  '🎵',
  chaotic:  '⚡',
  cinematic:'🎬',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const MONO = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

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

function PlaybackControls({
  state,
  onPlay,
  onPause,
  onStop,
}: {
  state: PlaybackState;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
}) {
  return (
    <View style={styles.playbackControls}>
      <Pressable style={styles.controlBtn} onPress={onStop}>
        <Text style={styles.controlIcon}>⏹</Text>
        <Text style={styles.controlLabel}>STOP</Text>
      </Pressable>
      <Pressable
        style={[styles.controlBtn, styles.controlBtnPrimary]}
        onPress={state === 'playing' ? onPause : onPlay}
      >
        <Text style={[styles.controlIcon, styles.controlIconPrimary]}>
          {state === 'playing' ? '⏸' : '▶'}
        </Text>
        <Text style={[styles.controlLabel, styles.controlLabelPrimary]}>
          {state === 'playing' ? 'PAUSE' : 'PLAY'}
        </Text>
      </Pressable>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TheaterScreen() {
  const insets = useSafeAreaInsets();

  // Section visibility
  const [showNowPlaying,  setShowNowPlaying]  = useState(true);
  const [showChoreograph, setShowChoreograph] = useState(true);
  const [showPresets,     setShowPresets]     = useState(true);
  const [showSaved,       setShowSaved]       = useState(false);
  const [showSpectator,   setShowSpectator]   = useState(false);

  // Playback state
  const [playbackState,   setPlaybackState]   = useState<PlaybackState>('stopped');
  const [currentTimeSec,  setCurrentTimeSec]  = useState(18.5);
  const [currentScene,    setCurrentScene]    = useState('RISE');
  const totalDurationSec = 80;

  // Choreograph state
  const [choreoStyle,     setChoreoStyle]     = useState<ChoreographStyle>('rhythmic');
  const [intensity,       setIntensity]       = useState(60);
  const [choreoDuration,  setChoreoduration]   = useState<DurationOption>(60);
  const [bpm,             setBpm]             = useState(128);
  const lastTapRef = useRef<number[]>([]);

  // Presets state
  const [selectedPreset,  setSelectedPreset]  = useState<string | null>(null);

  // Spectator state
  const [broadcasting,    setBroadcasting]    = useState(false);
  const [shareCode]       = useState('HLSX-7734');
  const [spectatorCount]  = useState(12);

  // Spectator view
  const [spectatorViewOpen, setSpectatorViewOpen] = useState(false);

  const connectedDrones = MOCK_DRONES;

  function handlePlay()  { setPlaybackState('playing'); }
  function handlePause() { setPlaybackState('paused'); }
  function handleStop()  { setPlaybackState('stopped'); setCurrentTimeSec(0); }

  function handleTapBpm() {
    const now = Date.now();
    const taps = lastTapRef.current;
    taps.push(now);
    if (taps.length > 8) taps.splice(0, taps.length - 8);
    if (taps.length >= 2) {
      const gaps = taps.slice(1).map((t, i) => t - taps[i]);
      const avg  = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      setBpm(Math.round(60000 / avg));
    }
  }

  function handleGenerate() {
    // Simulate generation
    setPlaybackState('stopped');
    setCurrentTimeSec(0);
  }

  const selectedPresetObj = SHOW_PRESETS.find((p) => p.id === selectedPreset);
  const needMoreDrones = selectedPresetObj
    ? connectedDrones.length < selectedPresetObj.minDrones
    : false;

  const progressPct = totalDurationSec > 0
    ? (currentTimeSec / totalDurationSec) * 100
    : 0;

  // Spectator drones mapped to random positions
  const spectatorDrones = connectedDrones.map((d, i) => ({
    id: d.id,
    x: 0.1 + (i / Math.max(1, connectedDrones.length - 1)) * 0.8,
    y: 0.2 + Math.sin(i * 1.3) * 0.25 + 0.1,
    brightness: d.brightness,
    color: d.colorTemp < 4000 ? Colors.accent.warning : d.colorTemp > 5500 ? Colors.accent.blue : Colors.accent.cyan,
  }));

  return (
    <>
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
            <Text style={styles.screenTitle}>Theater</Text>
            <Text style={styles.screenSubtitle}>Swarm Choreography</Text>
          </View>
          {playbackState === 'playing' && (
            <View style={styles.headerBadge}>
              <View style={styles.headerBadgeDot} />
              <Text style={styles.headerBadgeText}>PLAYING</Text>
            </View>
          )}
          {broadcasting && playbackState !== 'playing' && (
            <View style={[styles.headerBadge, styles.headerBadgeLive]}>
              <View style={[styles.headerBadgeDot, styles.headerBadgeDotLive]} />
              <Text style={[styles.headerBadgeText, styles.headerBadgeTextLive]}>LIVE</Text>
            </View>
          )}
        </View>

        {/* ────────────────────────────────────────────
            Section 1: NOW PLAYING
        ──────────────────────────────────────────── */}
        <Card style={styles.sectionCard}>
          <SectionHeader
            title="NOW PLAYING"
            open={showNowPlaying}
            onToggle={() => setShowNowPlaying((v) => !v)}
            badge={playbackState === 'playing' ? 'LIVE' : playbackState === 'paused' ? 'PAUSED' : undefined}
          />

          {showNowPlaying && (
            <View style={styles.sectionBody}>
              {/* Drone visualization */}
              <View style={styles.droneGridWrap}>
                <DroneGrid drones={connectedDrones} />
              </View>

              {/* Scene info */}
              <View style={styles.sceneRow}>
                <View style={styles.sceneTag}>
                  <Text style={styles.sceneTagLabel}>SCENE</Text>
                  <Text style={styles.sceneTagName}>{currentScene}</Text>
                </View>
                <View style={styles.timePair}>
                  <Text style={styles.timeElapsed}>
                    {String(Math.floor(currentTimeSec / 60)).padStart(2, '0')}:
                    {String(Math.floor(currentTimeSec % 60)).padStart(2, '0')}
                  </Text>
                  <Text style={styles.timeSep}> / </Text>
                  <Text style={styles.timeTotal}>
                    {String(Math.floor(totalDurationSec / 60)).padStart(2, '0')}:
                    {String(Math.floor(totalDurationSec % 60)).padStart(2, '0')}
                  </Text>
                </View>
              </View>

              {/* Timeline */}
              <TimelineEditor
                currentTimeSec={currentTimeSec}
                totalDurationSec={totalDurationSec}
                scenes={MOCK_SCENES}
                droneIds={connectedDrones.map((d) => d.id)}
                onSeek={setCurrentTimeSec}
              />

              {/* Playback controls */}
              <PlaybackControls
                state={playbackState}
                onPlay={handlePlay}
                onPause={handlePause}
                onStop={handleStop}
              />
            </View>
          )}
        </Card>

        {/* ────────────────────────────────────────────
            Section 2: AUTO-CHOREOGRAPH
        ──────────────────────────────────────────── */}
        <Card style={styles.sectionCard}>
          <SectionHeader
            title="AUTO-CHOREOGRAPH"
            open={showChoreograph}
            onToggle={() => setShowChoreograph((v) => !v)}
          />

          {showChoreograph && (
            <View style={styles.sectionBody}>
              {/* Style chips */}
              <RowLabel label="STYLE" />
              <View style={styles.chipRow}>
                {STYLE_OPTIONS.map((style) => (
                  <Pressable
                    key={style}
                    style={[styles.chip, choreoStyle === style && styles.chipActive]}
                    onPress={() => setChoreoStyle(style)}
                  >
                    <Text style={styles.chipIcon}>{STYLE_ICONS[style]}</Text>
                    <Text style={[styles.chipLabel, choreoStyle === style && styles.chipLabelActive]}>
                      {style.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Intensity */}
              <RowLabel label="INTENSITY" value={intensity < 25 ? 'SUBTLE' : intensity < 50 ? 'MODERATE' : intensity < 75 ? 'DYNAMIC' : 'EXTREME'} />
              <SimpleSlider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={intensity}
                onValueChange={setIntensity}
                minimumTrackTintColor={Colors.accent.blue}
                maximumTrackTintColor={Colors.border}
                thumbTintColor={Colors.accent.blue}
              />

              {/* Duration */}
              <RowLabel label="DURATION" />
              <View style={styles.segmented}>
                {DURATION_OPTIONS.map((d) => (
                  <Pressable
                    key={d}
                    style={[styles.segment, choreoDuration === d && styles.segmentActive]}
                    onPress={() => setChoreoduration(d)}
                  >
                    <Text style={[styles.segmentLabel, choreoDuration === d && styles.segmentLabelActive]}>
                      {d >= 60 ? `${d / 60}m` : `${d}s`}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* BPM */}
              <View style={styles.bpmRow}>
                <View style={styles.bpmDisplay}>
                  <Text style={styles.bpmValue}>{bpm}</Text>
                  <Text style={styles.bpmLabel}>BPM</Text>
                </View>
                <GlowButton label="TAP BPM" variant="ghost" onPress={handleTapBpm} />
              </View>

              <GlowButton
                label="GENERATE CHOREOGRAPHY"
                variant="primary"
                onPress={handleGenerate}
                style={styles.mt}
              />
            </View>
          )}
        </Card>

        {/* ────────────────────────────────────────────
            Section 3: SHOW PRESETS
        ──────────────────────────────────────────── */}
        <Card style={styles.sectionCard}>
          <SectionHeader
            title="SHOW PRESETS"
            open={showPresets}
            onToggle={() => setShowPresets((v) => !v)}
          />

          {showPresets && (
            <View style={styles.sectionBody}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
                <View style={styles.presetRow}>
                  {SHOW_PRESETS.map((preset) => (
                    <PresetCard
                      key={preset.id}
                      preset={preset}
                      selected={selectedPreset === preset.id}
                      onSelect={setSelectedPreset}
                    />
                  ))}
                </View>
              </ScrollView>

              {needMoreDrones && selectedPresetObj && (
                <View style={styles.warningBanner}>
                  <Text style={styles.warningIcon}>⚠</Text>
                  <Text style={styles.warningText}>
                    Requires {selectedPresetObj.minDrones} drones — only {connectedDrones.length} connected
                  </Text>
                </View>
              )}

              <GlowButton
                label="LOAD PRESET"
                variant={selectedPreset ? 'primary' : 'ghost'}
                disabled={!selectedPreset || needMoreDrones}
                onPress={() => {}}
                style={styles.mt}
              />
            </View>
          )}
        </Card>

        {/* ────────────────────────────────────────────
            Section 4: SAVED SHOWS
        ──────────────────────────────────────────── */}
        <Card style={styles.sectionCard}>
          <SectionHeader
            title="SAVED SHOWS"
            open={showSaved}
            onToggle={() => setShowSaved((v) => !v)}
            badge={String(SAVED_SHOWS.length)}
          />

          {showSaved && (
            <View style={styles.sectionBody}>
              {SAVED_SHOWS.map((show) => (
                <View key={show.id} style={styles.savedShowRow}>
                  <View style={styles.savedShowInfo}>
                    <Text style={styles.savedShowName}>{show.name}</Text>
                    <View style={styles.savedShowMeta}>
                      <Text style={styles.savedShowMetaText}>
                        {Math.floor(show.durationSec / 60)}m {show.durationSec % 60}s
                      </Text>
                      <View style={styles.metaDot} />
                      <Text style={styles.savedShowMetaText}>{show.sceneCount} scenes</Text>
                      {show.lastPlayed && (
                        <>
                          <View style={styles.metaDot} />
                          <Text style={styles.savedShowMetaText}>{show.lastPlayed}</Text>
                        </>
                      )}
                    </View>
                  </View>
                  <View style={styles.savedShowActions}>
                    <Pressable style={styles.iconBtn} onPress={() => {}}>
                      <Text style={styles.iconBtnText}>▶</Text>
                    </Pressable>
                    <Pressable style={[styles.iconBtn, styles.iconBtnDanger]} onPress={() => {}}>
                      <Text style={[styles.iconBtnText, styles.iconBtnTextDanger]}>✕</Text>
                    </Pressable>
                  </View>
                </View>
              ))}

              {SAVED_SHOWS.length === 0 && (
                <Text style={styles.emptyListText}>No saved shows yet. Generate a choreography to get started.</Text>
              )}
            </View>
          )}
        </Card>

        {/* ────────────────────────────────────────────
            Section 5: SPECTATOR MODE
        ──────────────────────────────────────────── */}
        <Card style={styles.sectionCard}>
          <SectionHeader
            title="SPECTATOR MODE"
            open={showSpectator}
            onToggle={() => setShowSpectator((v) => !v)}
            badge={broadcasting ? 'LIVE' : undefined}
          />

          {showSpectator && (
            <View style={styles.sectionBody}>
              {!broadcasting ? (
                <GlowButton
                  label="START BROADCAST"
                  variant="primary"
                  onPress={() => setBroadcasting(true)}
                />
              ) : (
                <>
                  {/* Share code */}
                  <View style={styles.shareCodeSection}>
                    <Text style={styles.fieldLabel}>SHARE CODE</Text>
                    <View style={styles.shareCodeBox}>
                      <Text style={styles.shareCodeText}>{shareCode}</Text>
                    </View>
                    <Text style={styles.shareHint}>Share this code with your audience</Text>
                  </View>

                  {/* Spectator count */}
                  <View style={styles.spectatorCountRow}>
                    <Text style={styles.fieldLabel}>SPECTATORS</Text>
                    <View style={styles.spectatorCountBadge}>
                      <Text style={styles.spectatorCountText}>{spectatorCount}</Text>
                    </View>
                  </View>

                  {/* QR placeholder */}
                  <View style={styles.qrPlaceholder}>
                    <Text style={styles.qrIcon}>▦</Text>
                    <Text style={styles.qrLabel}>Share this code with your audience</Text>
                    <Text style={styles.qrCode}>{shareCode}</Text>
                  </View>

                  <View style={styles.rowActions}>
                    <GlowButton
                      label="OPEN SPECTATOR VIEW"
                      variant="ghost"
                      onPress={() => setSpectatorViewOpen(true)}
                      style={styles.flex1}
                    />
                  </View>

                  <GlowButton
                    label="STOP BROADCAST"
                    variant="danger"
                    onPress={() => setBroadcasting(false)}
                    style={styles.mt}
                  />
                </>
              )}
            </View>
          )}
        </Card>
      </ScrollView>

      {/* Spectator overlay */}
      {spectatorViewOpen && (
        <SpectatorView
          showName="Festival Opening"
          shareCode={shareCode}
          spectatorCount={spectatorCount}
          progressPct={progressPct}
          elapsedSec={currentTimeSec}
          totalSec={totalDurationSec}
          drones={spectatorDrones}
          isLive={broadcasting}
        />
      )}
      {spectatorViewOpen && (
        <Pressable style={styles.closeSpectator} onPress={() => setSpectatorViewOpen(false)}>
          <Text style={styles.closeSpectatorText}>✕ CLOSE</Text>
        </Pressable>
      )}
    </>
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
  headerBadgeLive: {
    borderColor: Colors.accent.danger,
  },
  headerBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent.success,
  },
  headerBadgeDotLive: {
    backgroundColor: Colors.accent.danger,
  },
  headerBadgeText: {
    color: Colors.accent.success,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  headerBadgeTextLive: {
    color: Colors.accent.danger,
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

  // Drone grid
  droneGridWrap: {
    backgroundColor: Colors.bg.surface,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginTop: Layout.spacing.xs,
  },

  // Scene row
  sceneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sceneTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    backgroundColor: Colors.bg.surface,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.accent.blue + '60',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
  },
  sceneTagLabel: {
    color: Colors.text.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  sceneTagName: {
    color: Colors.accent.blue,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: MONO,
  },
  timePair: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeElapsed: {
    color: Colors.accent.cyan,
    fontSize: 16,
    fontWeight: '800',
    fontFamily: MONO,
    letterSpacing: 1,
  },
  timeSep: {
    color: Colors.text.muted,
    fontSize: 14,
    fontWeight: '400',
  },
  timeTotal: {
    color: Colors.text.muted,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: MONO,
    letterSpacing: 1,
  },

  // Playback controls
  playbackControls: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    justifyContent: 'center',
    marginTop: Layout.spacing.xs,
  },
  controlBtn: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bg.elevated,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Layout.spacing.xl,
    paddingVertical: Layout.spacing.sm,
    minWidth: 80,
  },
  controlBtnPrimary: {
    backgroundColor: Colors.accent.blue,
    borderColor: Colors.accent.blue,
    shadowColor: Colors.accent.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
    minWidth: 120,
  },
  controlIcon: {
    color: Colors.text.secondary,
    fontSize: 18,
  },
  controlIconPrimary: {
    color: '#fff',
  },
  controlLabel: {
    color: Colors.text.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  controlLabelPrimary: {
    color: '#fff',
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
    fontFamily: MONO,
  },

  // Slider
  slider: { height: 36, marginHorizontal: -4 },

  // Style chips
  chipRow: {
    flexDirection: 'row',
    gap: Layout.spacing.xs,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs + 2,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg.surface,
  },
  chipActive: {
    borderColor: Colors.accent.blue,
    backgroundColor: Colors.accent.blue + '20',
  },
  chipIcon: { fontSize: 13 },
  chipLabel: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  chipLabelActive: {
    color: Colors.accent.blue,
  },

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
    fontFamily: MONO,
  },
  bpmLabel: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },

  // Presets
  presetScroll: { marginHorizontal: -Layout.spacing.xs },
  presetRow: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.xs,
    paddingVertical: Layout.spacing.xs,
  },

  // Warning
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    backgroundColor: Colors.accent.warning + '18',
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.accent.warning + '50',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
  },
  warningIcon: {
    color: Colors.accent.warning,
    fontSize: 14,
  },
  warningText: {
    color: Colors.accent.warning,
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },

  // Saved shows
  savedShowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bg.surface,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Layout.spacing.md,
  },
  savedShowInfo: { flex: 1, gap: 4 },
  savedShowName: {
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  savedShowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  savedShowMetaText: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '600',
    fontFamily: MONO,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.text.muted,
  },
  savedShowActions: {
    flexDirection: 'row',
    gap: Layout.spacing.xs,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.accent.blue + '60',
    backgroundColor: Colors.accent.blue + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnDanger: {
    borderColor: Colors.accent.danger + '60',
    backgroundColor: Colors.accent.danger + '15',
  },
  iconBtnText: {
    color: Colors.accent.blue,
    fontSize: 13,
    fontWeight: '700',
  },
  iconBtnTextDanger: {
    color: Colors.accent.danger,
  },
  emptyListText: {
    color: Colors.text.muted,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    paddingVertical: Layout.spacing.sm,
  },

  // Spectator
  shareCodeSection: {
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  shareCodeBox: {
    backgroundColor: Colors.accent.blue + '15',
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.accent.blue + '50',
    paddingHorizontal: Layout.spacing.xl,
    paddingVertical: Layout.spacing.md,
  },
  shareCodeText: {
    color: Colors.accent.blue,
    fontSize: 28,
    fontWeight: '800',
    fontFamily: MONO,
    letterSpacing: 8,
    textAlign: 'center',
  },
  shareHint: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '500',
    opacity: 0.6,
  },
  spectatorCountRow: {
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
  spectatorCountBadge: {
    backgroundColor: Colors.accent.cyan + '20',
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.accent.cyan + '60',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: 4,
  },
  spectatorCountText: {
    color: Colors.accent.cyan,
    fontSize: 18,
    fontWeight: '800',
    fontFamily: MONO,
  },
  qrPlaceholder: {
    alignItems: 'center',
    gap: Layout.spacing.xs,
    backgroundColor: Colors.bg.surface,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    paddingVertical: Layout.spacing.lg,
  },
  qrIcon: {
    color: Colors.text.muted,
    fontSize: 48,
  },
  qrLabel: {
    color: Colors.text.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  qrCode: {
    color: Colors.text.secondary,
    fontSize: 14,
    fontWeight: '800',
    fontFamily: MONO,
    letterSpacing: 4,
    marginTop: 4,
  },

  // Row actions
  rowActions: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  flex1: { flex: 1 },

  // Misc
  mt: { marginTop: Layout.spacing.xs },

  // Close spectator
  closeSpectator: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 999,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
  },
  closeSpectatorText: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
