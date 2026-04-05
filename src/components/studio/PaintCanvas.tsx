import React, { useRef } from 'react';
import {
  PanResponder,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
}

interface PaintCanvasProps {
  strokes: Stroke[];
  onStrokeStart: (pt: Point) => void;
  onStrokeMove: (pt: Point) => void;
  onStrokeEnd: () => void;
  height?: number;
}

const CANVAS_HEIGHT = 300;
const DOT_SIZE = 4;
const LINE_W = 2;

function getPoint(evt: GestureResponderEvent): Point {
  return { x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY };
}

export function PaintCanvas({
  strokes,
  onStrokeStart,
  onStrokeMove,
  onStrokeEnd,
  height = CANVAS_HEIGHT,
}: PaintCanvasProps) {
  const canvasRef = useRef<View>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        onStrokeStart(getPoint(evt));
      },
      onPanResponderMove: (evt: GestureResponderEvent, _gs: PanResponderGestureState) => {
        onStrokeMove(getPoint(evt));
      },
      onPanResponderRelease: () => {
        onStrokeEnd();
      },
      onPanResponderTerminate: () => {
        onStrokeEnd();
      },
    })
  ).current;

  return (
    <View
      ref={canvasRef}
      style={[styles.canvas, { height }]}
      {...panResponder.panHandlers}
    >
      {/* Subtle grid */}
      {Array.from({ length: 6 }).map((_, row) =>
        Array.from({ length: 4 }).map((_, col) => (
          <View
            key={`${row}-${col}`}
            style={[
              styles.gridCell,
              {
                top: (row / 6) * height,
                left: (col / 4) * 100 + '%' as any,
                width: '25%',
                height: height / 6,
              },
            ]}
          />
        ))
      )}

      {strokes.map((stroke, si) =>
        stroke.points.map((pt, pi) => {
          const prev = stroke.points[pi - 1];
          const nodes = [];

          // Draw dot at each point
          nodes.push(
            <View
              key={`dot-${si}-${pi}`}
              style={[
                styles.dot,
                { left: pt.x - DOT_SIZE / 2, top: pt.y - DOT_SIZE / 2 },
              ]}
            />
          );

          // Draw connector line between consecutive points
          if (prev) {
            const dx = pt.x - prev.x;
            const dy = pt.y - prev.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            nodes.push(
              <View
                key={`line-${si}-${pi}`}
                style={[
                  styles.line,
                  {
                    width: length,
                    left: prev.x,
                    top: prev.y - LINE_W / 2,
                    transform: [{ rotate: `${angle}deg` }],
                  },
                ]}
              />
            );
          }

          return nodes;
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    backgroundColor: '#070B14',
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  gridCell: {
    position: 'absolute',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(30,41,59,0.5)',
  },
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 4,
  },
  line: {
    position: 'absolute',
    height: LINE_W,
    backgroundColor: 'rgba(255,255,255,0.7)',
    transformOrigin: 'left center' as any,
  },
});
