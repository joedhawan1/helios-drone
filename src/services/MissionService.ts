import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Mission, MissionWaypoint, GpsCoordinates } from '../types/drone';
import { formatCommandId } from '../utils/formatters';
import { fleetService } from './FleetService';

const STORAGE_KEY = 'missions';

let recording = false;
let activeWaypoints: MissionWaypoint[] = [];

export function startRecording(): void {
  recording = true;
  activeWaypoints = [];
}

export function stopRecording(name: string): Mission {
  recording = false;
  const mission: Mission = {
    id: formatCommandId(),
    name,
    waypoints: [...activeWaypoints],
    droneIds: fleetService.getAllDroneInfo().map((d) => d.id),
    createdAt: new Date().toISOString(),
  };
  activeWaypoints = [];
  return mission;
}

export function isRecording(): boolean {
  return recording;
}

export function getActiveWaypoints(): MissionWaypoint[] {
  return activeWaypoints;
}

export function addWaypoint(
  location: GpsCoordinates,
  brightness: number,
  duration: number,
  delayAfter: number,
): MissionWaypoint {
  const wp: MissionWaypoint = {
    id: formatCommandId(),
    latitude: location.latitude,
    longitude: location.longitude,
    altitude: location.altitude ?? undefined,
    illuminateDuration: duration,
    brightness,
    delayAfter,
  };
  activeWaypoints.push(wp);
  return wp;
}

export async function playMission(mission: Mission): Promise<void> {
  for (const wp of mission.waypoints) {
    const coords: GpsCoordinates = {
      latitude: wp.latitude,
      longitude: wp.longitude,
      altitude: wp.altitude ?? null,
      accuracy: null,
    };
    await fleetService.illuminateAll(coords, null, wp.brightness);
    if (wp.delayAfter > 0) {
      await new Promise((r) => setTimeout(r, wp.delayAfter));
    }
  }
}

export async function saveMission(mission: Mission): Promise<void> {
  const missions = await loadMissions();
  const idx = missions.findIndex((m) => m.id === mission.id);
  if (idx >= 0) {
    missions[idx] = mission;
  } else {
    missions.push(mission);
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(missions));
}

export async function loadMissions(): Promise<Mission[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function deleteMission(id: string): Promise<Mission[]> {
  const missions = (await loadMissions()).filter((m) => m.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(missions));
  return missions;
}
