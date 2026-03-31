import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HUDOverlay } from '../../src/components/camera/HUDOverlay';
import { CaptureButton } from '../../src/components/camera/CaptureButton';
import { GlowButton } from '../../src/components/ui/GlowButton';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { useDrone } from '../../src/hooks/useDrone';
import { useLocation } from '../../src/hooks/useLocation';
import { useFleetContext } from '../../src/context/FleetContext';
import { useMissionContext } from '../../src/context/MissionContext';
import { Colors } from '../../src/constants/colors';
import { Layout } from '../../src/constants/layout';

export default function CameraScreen() {
  const { connectionStatus, illuminationStatus, connect, illuminate } = useDrone();
  const { coords, error: locationError, requestLocation } = useLocation();
  const { weather } = useFleetContext();
  const { recording, startRecording, stopRecording, addWaypoint } = useMissionContext();
  const [permission, requestPermission] = useCameraPermissions();
  const [showStopRecording, setShowStopRecording] = useState(false);
  const [missionName, setMissionName] = useState('');
  const cameraRef = useRef<CameraView>(null);
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const [capturing, setCapturing] = useState(false);
  const insets = useSafeAreaInsets();

  const isConnected = connectionStatus === 'connected';
  const isConnecting = connectionStatus === 'connecting';
  const isBusy = illuminationStatus === 'sending' || illuminationStatus === 'acknowledged';

  const triggerFlash = () => {
    Animated.sequence([
      Animated.timing(flashOpacity, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.timing(flashOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  };

  const handleCapture = async () => {
    if (!isConnected || capturing) return;
    setCapturing(true);
    try {
      const [gps, photo] = await Promise.all([
        requestLocation(),
        cameraRef.current?.takePictureAsync({ quality: 0.5, skipProcessing: true }),
      ]);
      if (!gps) {
        Alert.alert('Location Required', 'Could not get GPS coordinates. Please try again.');
        return;
      }
      await illuminate(gps, photo?.uri ?? null);
      if (recording) {
        addWaypoint(gps, weather?.brightnessRecommendation ?? 100, 1000, 0);
      }
      triggerFlash();
    } catch (e) {
      Alert.alert('Error', 'Failed to send illumination command.');
    } finally {
      setCapturing(false);
    }
  };

  // Permission not yet determined
  if (!permission) {
    return <View style={styles.container} />;
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.permTitle}>Camera Access Required</Text>
        <Text style={styles.permBody}>
          This app needs camera access to photograph target locations for drone illumination.
        </Text>
        {permission.canAskAgain ? (
          <GlowButton label="Grant Permission" onPress={requestPermission} />
        ) : (
          <GlowButton
            label="Open Settings"
            onPress={() => Linking.openSettings()}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      <HUDOverlay
        connectionStatus={connectionStatus}
        illuminationStatus={illuminationStatus}
        coords={coords}
        locationError={locationError}
        weather={weather}
        recording={recording}
      />

      {/* Flash overlay */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.flash, { opacity: flashOpacity }]}
        pointerEvents="none"
      />

      {/* REC toggle */}
      {showStopRecording && (
        <View style={styles.recModal}>
          <Text style={styles.recModalTitle}>SAVE MISSION</Text>
          <TextInput
            style={styles.recInput}
            value={missionName}
            onChangeText={setMissionName}
            placeholder="Mission name"
            placeholderTextColor={Colors.text.muted}
          />
          <View style={styles.recActions}>
            <GlowButton label="CANCEL" variant="ghost" onPress={() => setShowStopRecording(false)} />
            <GlowButton
              label="SAVE"
              onPress={() => {
                if (missionName.trim()) {
                  stopRecording(missionName.trim());
                  setMissionName('');
                  setShowStopRecording(false);
                }
              }}
              disabled={!missionName.trim()}
            />
          </View>
        </View>
      )}

      {/* Bottom controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + Layout.spacing.md + 80 }]}>
        <View style={styles.controlsRow}>
          {/* Connect / Reconnect button */}
          <GlowButton
            label={isConnected ? 'CONNECTED' : isConnecting ? 'CONNECTING' : 'CONNECT'}
            variant={isConnected ? 'ghost' : 'primary'}
            onPress={connect}
            loading={isConnecting}
            disabled={isConnected}
            style={styles.connectBtn}
          />

          {/* Capture */}
          <CaptureButton
            onPress={handleCapture}
            disabled={!isConnected || isBusy}
            loading={capturing || isBusy}
          />

          {/* REC / Status */}
          <View style={styles.statusWrapper}>
            <GlowButton
              label={recording ? 'STOP REC' : 'REC'}
              variant={recording ? 'danger' : 'ghost'}
              onPress={() => {
                if (recording) {
                  setShowStopRecording(true);
                } else {
                  startRecording();
                }
              }}
            />
            <StatusBadge status={illuminationStatus} compact />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.xl,
    backgroundColor: Colors.bg.primary,
    gap: Layout.spacing.lg,
  },
  permTitle: {
    color: Colors.text.primary,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  permBody: {
    color: Colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  flash: {
    backgroundColor: '#fff',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.xl,
  },
  connectBtn: {
    flex: 1,
    marginRight: Layout.spacing.md,
  },
  statusWrapper: {
    flex: 1,
    alignItems: 'flex-end',
    gap: Layout.spacing.xs,
  },
  recModal: {
    position: 'absolute',
    bottom: 200,
    left: Layout.spacing.xl,
    right: Layout.spacing.xl,
    backgroundColor: Colors.bg.elevated,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Layout.spacing.md,
    zIndex: 10,
  },
  recModalTitle: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: Layout.spacing.sm,
  },
  recInput: {
    backgroundColor: Colors.bg.surface,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm + 2,
    color: Colors.text.primary,
    fontSize: 14,
    marginBottom: Layout.spacing.sm,
  },
  recActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Layout.spacing.sm,
  },
});
