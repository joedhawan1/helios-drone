import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Schedule } from '../types/drone';

const STORAGE_KEY = 'helios_schedules_v1';

export async function loadSchedules(): Promise<Schedule[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveSchedules(schedules: Schedule[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
}

export async function upsertSchedule(schedule: Schedule): Promise<Schedule[]> {
  const schedules = await loadSchedules();
  const idx = schedules.findIndex((s) => s.id === schedule.id);
  if (idx >= 0) {
    schedules[idx] = schedule;
  } else {
    schedules.push(schedule);
  }
  await saveSchedules(schedules);
  return schedules;
}

export async function removeSchedule(id: string): Promise<Schedule[]> {
  const schedules = (await loadSchedules()).filter((s) => s.id !== id);
  await saveSchedules(schedules);
  return schedules;
}

export function getUpcoming(schedules: Schedule[]): Schedule[] {
  const now = Date.now();
  const in24h = now + 24 * 60 * 60 * 1000;
  return schedules
    .filter((s) => s.enabled && s.dateTime >= now && s.dateTime <= in24h)
    .sort((a, b) => a.dateTime - b.dateTime);
}
