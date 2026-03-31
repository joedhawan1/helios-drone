import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fleetService } from '../services/FleetService';
import { fetchWeather as fetchWeatherApi } from '../services/WeatherService';
import {
  loadSchedules,
  upsertSchedule,
  removeSchedule as removeScheduleStorage,
} from '../services/ScheduleService';
import type {
  FleetDrone,
  FleetContextValue,
  DroneSettings,
  GpsCoordinates,
  Schedule,
  WeatherData,
} from '../types/drone';
import { formatCommandId } from '../utils/formatters';
import { telemetryService } from '../services/TelemetryService';

const FLEET_KEY = 'helios_fleet_v1';
const WEATHER_API_KEY = 'helios_weather_api_key';

const FleetContext = createContext<FleetContextValue | null>(null);

export function FleetProvider({ children }: { children: React.ReactNode }) {
  const [fleet, setFleet] = useState<FleetDrone[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const apiKeyRef = useRef('demo');

  // Load persisted fleet and schedules on mount
  useEffect(() => {
    AsyncStorage.getItem(FLEET_KEY).then((raw) => {
      if (raw) {
        try {
          const saved = JSON.parse(raw) as FleetDrone[];
          saved.forEach((d) => {
            fleetService.addDrone(d.id, d.label, d.settings);
          });
          setFleet(saved.map((d) => ({
            ...d,
            connectionStatus: 'disconnected',
            illuminationStatus: 'idle',
          })));
        } catch {}
      }
    });
    AsyncStorage.getItem(WEATHER_API_KEY).then((key) => {
      if (key) apiKeyRef.current = key;
    });
    loadSchedules().then(setSchedules);
  }, []);

  // Subscribe to fleet status updates
  useEffect(() => {
    const unsub = fleetService.on('fleet:updated', () => {
      const statuses = fleetService.getStatuses();
      const infos = fleetService.getAllDroneInfo();
      setFleet(
        infos.map((info) => {
          const status = statuses.find((s) => s.id === info.id);
          return {
            id: info.id,
            label: info.label,
            settings: info.settings,
            connectionStatus: status?.connectionStatus ?? 'disconnected',
            illuminationStatus: status?.illuminationStatus ?? 'idle',
          };
        }),
      );
    });
    return unsub;
  }, []);

  const persistFleet = useCallback((drones: FleetDrone[]) => {
    AsyncStorage.setItem(FLEET_KEY, JSON.stringify(drones.map((d) => ({
      id: d.id, label: d.label, settings: d.settings,
    }))));
  }, []);

  const addDrone = useCallback((label: string, settings: DroneSettings) => {
    const id = formatCommandId();
    fleetService.addDrone(id, label, settings);
    setFleet((prev) => {
      const next = [...prev, {
        id, label, settings,
        connectionStatus: 'disconnected' as const,
        illuminationStatus: 'idle' as const,
      }];
      persistFleet(next);
      return next;
    });
  }, [persistFleet]);

  const removeDrone = useCallback((id: string) => {
    fleetService.removeDrone(id);
    setFleet((prev) => {
      const next = prev.filter((d) => d.id !== id);
      persistFleet(next);
      return next;
    });
  }, [persistFleet]);

  const connectFleet = useCallback(async () => {
    await fleetService.connectAll();
  }, []);

  const disconnectFleet = useCallback(() => {
    fleetService.disconnectAll();
  }, []);

  const illuminateFleet = useCallback(async (coords: GpsCoordinates, photoUri: string | null) => {
    const brightness = weather?.brightnessRecommendation;
    const infos = fleetService.getAllDroneInfo();
    const commandIds = infos.map((d) => {
      const cmdId = formatCommandId();
      telemetryService.recordCommand(d.id, d.label, cmdId);
      return cmdId;
    });
    try {
      await fleetService.illuminateAll(coords, photoUri, brightness);
      commandIds.forEach((cmdId) => {
        telemetryService.recordResponse(cmdId, 'success');
      });
    } catch {
      commandIds.forEach((cmdId) => {
        telemetryService.recordResponse(cmdId, 'error');
      });
    }
  }, [weather]);

  const fetchWeatherCb = useCallback(async (coords: GpsCoordinates) => {
    setWeatherLoading(true);
    try {
      const data = await fetchWeatherApi(coords, apiKeyRef.current);
      setWeather(data);
    } catch {
      // silently fail
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  const createSchedule = useCallback(async (schedule: Omit<Schedule, 'id'>) => {
    const full: Schedule = { ...schedule, id: formatCommandId() };
    const updated = await upsertSchedule(full);
    setSchedules(updated);
  }, []);

  const updateSchedule = useCallback(async (schedule: Schedule) => {
    const updated = await upsertSchedule(schedule);
    setSchedules(updated);
  }, []);

  const deleteSchedule = useCallback(async (id: string) => {
    const updated = await removeScheduleStorage(id);
    setSchedules(updated);
  }, []);

  return (
    <FleetContext.Provider
      value={{
        fleet,
        schedules,
        weather,
        weatherLoading,
        addDrone,
        removeDrone,
        connectFleet,
        disconnectFleet,
        illuminateFleet,
        fetchWeather: fetchWeatherCb,
        createSchedule,
        updateSchedule,
        deleteSchedule,
      }}
    >
      {children}
    </FleetContext.Provider>
  );
}

export function useFleetContext(): FleetContextValue {
  const ctx = useContext(FleetContext);
  if (!ctx) throw new Error('useFleetContext must be used within FleetProvider');
  return ctx;
}
