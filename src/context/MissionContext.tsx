import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { Mission, MissionWaypoint, GpsCoordinates } from '../types/drone';
import * as MissionService from '../services/MissionService';

type PlaybackStatus = 'idle' | 'playing' | 'paused';

interface MissionContextValue {
  recording: boolean;
  activeWaypoints: MissionWaypoint[];
  missions: Mission[];
  playbackStatus: PlaybackStatus;
  startRecording: () => void;
  stopRecording: (name: string) => Promise<void>;
  addWaypoint: (location: GpsCoordinates, brightness: number, duration: number, delayAfter: number) => void;
  playMission: (mission: Mission) => Promise<void>;
  deleteMission: (id: string) => Promise<void>;
}

const MissionContext = createContext<MissionContextValue | null>(null);

export function MissionProvider({ children }: { children: React.ReactNode }) {
  const [recording, setRecording] = useState(false);
  const [activeWaypoints, setActiveWaypoints] = useState<MissionWaypoint[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>('idle');

  useEffect(() => {
    MissionService.loadMissions().then(setMissions);
  }, []);

  const startRecording = useCallback(() => {
    MissionService.startRecording();
    setRecording(true);
    setActiveWaypoints([]);
  }, []);

  const stopRecording = useCallback(async (name: string) => {
    const mission = MissionService.stopRecording(name);
    await MissionService.saveMission(mission);
    setRecording(false);
    setActiveWaypoints([]);
    const updated = await MissionService.loadMissions();
    setMissions(updated);
  }, []);

  const addWaypoint = useCallback((location: GpsCoordinates, brightness: number, duration: number, delayAfter: number) => {
    const wp = MissionService.addWaypoint(location, brightness, duration, delayAfter);
    setActiveWaypoints((prev) => [...prev, wp]);
  }, []);

  const playMission = useCallback(async (mission: Mission) => {
    setPlaybackStatus('playing');
    try {
      await MissionService.playMission(mission);
      const updated: Mission = { ...mission, lastRunAt: new Date().toISOString() };
      await MissionService.saveMission(updated);
      const all = await MissionService.loadMissions();
      setMissions(all);
    } finally {
      setPlaybackStatus('idle');
    }
  }, []);

  const deleteMission = useCallback(async (id: string) => {
    const updated = await MissionService.deleteMission(id);
    setMissions(updated);
  }, []);

  return (
    <MissionContext.Provider
      value={{
        recording,
        activeWaypoints,
        missions,
        playbackStatus,
        startRecording,
        stopRecording,
        addWaypoint,
        playMission,
        deleteMission,
      }}
    >
      {children}
    </MissionContext.Provider>
  );
}

export function useMissionContext(): MissionContextValue {
  const ctx = useContext(MissionContext);
  if (!ctx) throw new Error('useMissionContext must be used within MissionProvider');
  return ctx;
}
