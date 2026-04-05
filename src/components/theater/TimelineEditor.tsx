import React, { useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

export interface TimelineScene {
  id: string;
  name: string;
  startSec: number;
  durationSec: number;
  color: string;
}

export interface TimelineKeyframe {
  droneId: string;
  timeSec: number;
}

interface TimelineEditorProps {
  currentTimeSec: number;
  totalDurationSec: number;
  scenes: TimelineScene[];
  keyframes?: TimelineKeyframe[];
  droneIds?: string[];
  onSeek?: (timeSec: number) => void;
  onZoomChange?: (zoom: number) => void;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 100);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
}

const TRACK_HEIGHT = 28;
const RULER_HEIGHT = 20;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 8;

export function TimelineEditor({
  currentTimeSec,
  totalDurationSec,
  scenes,
  keyframes = [],
  droneIds = [],
  onSeek,
  onZoomChange,
}: TimelineEditorProps) {
  const [zoom, setZoom] = useState(1);
  const scrollRef = useRef<ScrollView>(null);
  const trackWidth = useRef(0);

  const pxPerSec = 60 * zoom;
  const totalWidth = Math.max(300, totalDurationSec * pxPerSec);
  const playheadX = currentTimeSec * pxPerSec;

  function handleZoom(delta: number) {
    const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta));
    setZoom(next);
    onZoomChange?.(next);
  }

  function handleTrackPress(x: number) {
    if (totalWidth <= 0) return;
    const sec = Math.max(0, Math.min(totalDurationSec, x / pxPerSec));
    onSeek?.(sec);
  }

  // Build ruler ticks every N seconds based on zoom
  const tickInterval = zoom >= 4 ? 5 : zoom >= 2 ? 10 : zoom >= 1 ? 15 : 30;
  const ticks: number[] = [];
  for (let t = 0; t <= totalDurationSec; t += tickInterval) {
    ticks.push(t);
  }

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.header}>
        <Text style={styles.timeDisplay}>{formatTime(currentTimeSec)}</Text>
        <View style={styles.zoomControls}>
          <Pressable style={styles.zoomBtn} onPress={() => handleZoom(-0.5)}>
            <Text style={styles.zoomBtnText}>−</Text>
          </Pressable>
          <Text style={styles.zoomLabel}>{zoom.toFixed(1)}x</Text>
          <Pressable style={styles.zoomBtn} onPress={() => handleZoom(0.5)}>
            <Text style={styles.zoomBtnText}>+</Text>
          </Pressable>
        </View>
      </View>

      {/* Scrollable timeline */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        onLayout={(e) => { trackWidth.current = e.nativeEvent.layout.width; }}
      >
        <View style={{ width: totalWidth }}>
          {/* Ruler */}
          <View style={[styles.ruler, { width: totalWidth }]}>
            {ticks.map((t) => (
              <View key={t} style={[styles.tick, { left: t * pxPerSec }]}>
                <View style={styles.tickLine} />
                <Text style={styles.tickLabel}>{formatTime(t)}</Text>
              </View>
            ))}
          </View>

          {/* Scene track */}
          <Pressable
            style={[styles.sceneTrack, { width: totalWidth }]}
            onPress={(e) => handleTrackPress(e.nativeEvent.locationX)}
          >
            {scenes.map((scene) => (
              <View
                key={scene.id}
                style={[
                  styles.sceneBlock,
                  {
                    left: scene.startSec * pxPerSec,
                    width: Math.max(4, scene.durationSec * pxPerSec - 2),
                    backgroundColor: scene.color + '33',
                    borderColor: scene.color,
                  },
                ]}
              >
                <Text style={[styles.sceneName, { color: scene.color }]} numberOfLines={1}>
                  {scene.name}
                </Text>
              </View>
            ))}

            {/* Playhead */}
            <View style={[styles.playhead, { left: playheadX }]} pointerEvents="none">
              <View style={styles.playheadHead} />
              <View style={styles.playheadLine} />
            </View>
          </Pressable>

          {/* Drone keyframe tracks */}
          {droneIds.map((droneId) => {
            const droneKfs = keyframes.filter((kf) => kf.droneId === droneId);
            return (
              <View key={droneId} style={[styles.droneTrack, { width: totalWidth }]}>
                <Text style={styles.droneTrackLabel}>{droneId}</Text>
                {droneKfs.map((kf, i) => (
                  <View
                    key={i}
                    style={[styles.keyframeDot, { left: kf.timeSec * pxPerSec - 4 }]}
                  />
                ))}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const MONO = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bg.surface,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  timeDisplay: {
    color: Colors.accent.cyan,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: MONO,
    letterSpacing: 1,
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  zoomBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBtnText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  zoomLabel: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: MONO,
    minWidth: 32,
    textAlign: 'center',
  },
  scroll: { flex: 1 },
  ruler: {
    height: RULER_HEIGHT,
    backgroundColor: Colors.bg.primary,
    position: 'relative',
  },
  tick: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
  },
  tickLine: {
    width: 1,
    height: 6,
    backgroundColor: Colors.border,
  },
  tickLabel: {
    color: Colors.text.muted,
    fontSize: 7,
    fontFamily: MONO,
    marginTop: 1,
  },
  sceneTrack: {
    height: TRACK_HEIGHT + 8,
    backgroundColor: Colors.bg.elevated,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  sceneBlock: {
    position: 'absolute',
    top: 4,
    height: TRACK_HEIGHT,
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 4,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sceneName: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  playhead: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    alignItems: 'center',
  },
  playheadHead: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: Colors.accent.cyan,
    marginTop: -2,
  },
  playheadLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: Colors.accent.cyan,
    opacity: 0.8,
  },
  droneTrack: {
    height: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg.primary,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  droneTrackLabel: {
    color: Colors.text.muted,
    fontSize: 8,
    fontWeight: '700',
    fontFamily: MONO,
    paddingHorizontal: 4,
    letterSpacing: 0.5,
    position: 'absolute',
    left: 0,
    zIndex: 1,
  },
  keyframeDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent.blue,
    borderWidth: 1.5,
    borderColor: '#fff',
    top: 6,
    shadowColor: Colors.accent.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
});
