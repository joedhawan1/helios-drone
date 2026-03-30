import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { droneService } from '../services/DroneService';
import {
  ConnectionStatus,
  GpsCoordinates,
  IlluminateCommand,
  IlluminationStatus,
  DroneContextValue,
  DroneSettings,
  DEFAULT_SETTINGS,
} from '../types/drone';
import { formatCommandId } from '../utils/formatters';

const SETTINGS_KEY = 'drone_settings_v1';

const DroneContext = createContext<DroneContextValue | null>(null);

export function DroneProvider({ children }: { children: React.ReactNode }) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [illuminationStatus, setIlluminationStatus] = useState<IlluminationStatus>('idle');
  const [settings, setSettings] = useState<DroneSettings>(DEFAULT_SETTINGS);
  const [lastCommand, setLastCommand] = useState<IlluminateCommand | null>(null);

  // Keep a ref to current settings so event handlers always see fresh values
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Load persisted settings on mount
  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY).then((raw) => {
      if (raw) {
        try {
          setSettings(JSON.parse(raw) as DroneSettings);
        } catch {
          // ignore corrupt data
        }
      }
    });
  }, []);

  // Subscribe to drone service events
  useEffect(() => {
    const unsubs = [
      droneService.on('status:connecting', () => setConnectionStatus('connecting')),
      droneService.on('status:connected', () => setConnectionStatus('connected')),
      droneService.on('status:disconnected', () => {
        setConnectionStatus('disconnected');
        setIlluminationStatus('idle');
      }),
      droneService.on('status:error', () => setConnectionStatus('error')),
      droneService.on('illuminate:sending', () => setIlluminationStatus('sending')),
      droneService.on('illuminate:acknowledged', () =>
        setIlluminationStatus('acknowledged'),
      ),
      droneService.on('illuminate:active', () => setIlluminationStatus('active')),
      droneService.on('illuminate:error', () => setIlluminationStatus('error')),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const connect = useCallback(async () => {
    try {
      await droneService.connect(settingsRef.current);
    } catch {
      setConnectionStatus('error');
    }
  }, []);

  const disconnect = useCallback(() => {
    droneService.disconnect();
  }, []);

  const illuminate = useCallback(
    async (coords: GpsCoordinates, photoUri: string | null) => {
      const cmd: IlluminateCommand = {
        coordinates: coords,
        timestamp: Date.now(),
        photoUri,
        commandId: formatCommandId(),
      };
      setLastCommand(cmd);
      try {
        await droneService.illuminate(cmd, settingsRef.current);
      } catch {
        setIlluminationStatus('error');
      }
    },
    [],
  );

  const updateSettings = useCallback(async (newSettings: DroneSettings) => {
    setSettings(newSettings);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  }, []);

  return (
    <DroneContext.Provider
      value={{
        connectionStatus,
        illuminationStatus,
        settings,
        lastCommand,
        connect,
        disconnect,
        illuminate,
        updateSettings,
      }}
    >
      {children}
    </DroneContext.Provider>
  );
}

export function useDroneContext(): DroneContextValue {
  const ctx = useContext(DroneContext);
  if (!ctx) throw new Error('useDroneContext must be used within DroneProvider');
  return ctx;
}
