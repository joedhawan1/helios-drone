import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Linking,
  StyleSheet,
  Text,
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
import { Colors } from '../../src/constants/colors';
import { Layout } from '../../src/constants/layout';

export default function CameraScreen() {
  const { connectionStatus, illuminationStatus, connect, illuminate } = useDrone();
  const { coords, error: locationError, requestLocation } = useLocation();
  const { weather } = useFleetContext();
  const [permission, requestPermission] = useCameraPermissions();
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
      />

      {/* Flash overlay */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.flash, { opacity: flashOpacity }]}
        pointerEvents="none"
      />

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

          {/* Status */}
          <View style={styles.statusWrapper}>
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
  },
});
