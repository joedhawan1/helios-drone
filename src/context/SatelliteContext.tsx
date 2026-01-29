import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { satelliteService } from '../services/SatelliteService';
import {
  ConnectionStatus,
  GpsCoordinates,
  IlluminateCommand,
  IlluminationStatus,
  SatelliteContextValue,
  SatelliteSettings,
  DEFAULT_SETTINGS,
} from '../types/satellite';
import { formatCommandId } from '../utils/formatters';

const SETTINGS_KEY = 'satellite_settings_v1';

const SatelliteContext = createContext<SatelliteContextValue | null>(null);

export function SatelliteProvider({ children }: { children: React.ReactNode }) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [illuminationStatus, setIlluminationStatus] = useState<IlluminationStatus>('idle');
  const [settings, setSettings] = useState<SatelliteSettings>(DEFAULT_SETTINGS);
  const [lastCommand, setLastCommand] = useState<IlluminateCommand | null>(null);

  // Keep a ref to current settings so event handlers always see fresh values
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Load persisted settings on mount
  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY).then((raw) => {
      if (raw) {
        try {
          setSettings(JSON.parse(raw) as SatelliteSettings);
        } catch {
          // ignore corrupt data
        }
      }
    });
  }, []);

  // Subscribe to satellite service events
  useEffect(() => {
    const unsubs = [
      satelliteService.on('status:connecting', () => setConnectionStatus('connecting')),
      satelliteService.on('status:connected', () => setConnectionStatus('connected')),
      satelliteService.on('status:disconnected', () => {
        setConnectionStatus('disconnected');
        setIlluminationStatus('idle');
      }),
      satelliteService.on('status:error', () => setConnectionStatus('error')),
      satelliteService.on('illuminate:sending', () => setIlluminationStatus('sending')),
      satelliteService.on('illuminate:acknowledged', () =>
        setIlluminationStatus('acknowledged'),
      ),
      satelliteService.on('illuminate:active', () => setIlluminationStatus('active')),
      satelliteService.on('illuminate:error', () => setIlluminationStatus('error')),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const connect = useCallback(async () => {
    try {
      await satelliteService.connect(settingsRef.current);
    } catch {
      setConnectionStatus('error');
    }
  }, []);

  const disconnect = useCallback(() => {
    satelliteService.disconnect();
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
        await satelliteService.illuminate(cmd, settingsRef.current);
      } catch {
        setIlluminationStatus('error');
      }
    },
    [],
  );

  const updateSettings = useCallback(async (newSettings: SatelliteSettings) => {
    setSettings(newSettings);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  }, []);

  return (
    <SatelliteContext.Provider
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
    </SatelliteContext.Provider>
  );
}

export function useSatelliteContext(): SatelliteContextValue {
  const ctx = useContext(SatelliteContext);
  if (!ctx) throw new Error('useSatelliteContext must be used within SatelliteProvider');
  return ctx;
}
