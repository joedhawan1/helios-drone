import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Formation, FormationShape, FireMode, FormationSlot, GpsCoordinates } from '../types/drone';
import { formatCommandId } from '../utils/formatters';
import { fleetService } from './FleetService';

const STORAGE_KEY = 'formations';

export function createFormation(
  name: string,
  shape: FormationShape,
  fireMode: FireMode,
  droneIds: string[],
  delayBetweenMs: number,
  brightness: number,
): Formation {
  const slots: FormationSlot[] = droneIds.map((droneId, i) => ({
    position: i,
    droneId,
  }));
  return {
    id: formatCommandId(),
    name,
    shape,
    fireMode,
    slots,
    delayBetweenMs,
    brightness,
  };
}

function getRippleOrder(slots: FormationSlot[]): FormationSlot[] {
  if (slots.length === 0) return [];
  const mid = Math.floor(slots.length / 2);
  const ordered: FormationSlot[] = [slots[mid]];
  for (let offset = 1; offset <= mid; offset++) {
    if (mid - offset >= 0) ordered.push(slots[mid - offset]);
    if (mid + offset < slots.length) ordered.push(slots[mid + offset]);
  }
  return ordered;
}

export async function fireFormation(formation: Formation, coords: GpsCoordinates): Promise<void> {
  const { fireMode, slots, delayBetweenMs, brightness } = formation;

  const illuminateDrone = async (slot: FormationSlot) => {
    await fleetService.illuminateAll(coords, null, brightness);
  };

  if (fireMode === 'simultaneous') {
    await Promise.allSettled(slots.map(illuminateDrone));
  } else if (fireMode === 'sequential') {
    for (const slot of slots) {
      await illuminateDrone(slot);
      if (delayBetweenMs > 0) {
        await new Promise((r) => setTimeout(r, delayBetweenMs));
      }
    }
  } else if (fireMode === 'ripple') {
    const ordered = getRippleOrder(slots);
    for (const slot of ordered) {
      await illuminateDrone(slot);
      if (delayBetweenMs > 0) {
        await new Promise((r) => setTimeout(r, delayBetweenMs));
      }
    }
  }
}

export async function saveFormation(formation: Formation): Promise<void> {
  const formations = await loadFormations();
  const idx = formations.findIndex((f) => f.id === formation.id);
  if (idx >= 0) {
    formations[idx] = formation;
  } else {
    formations.push(formation);
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(formations));
}

export async function loadFormations(): Promise<Formation[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function deleteFormation(id: string): Promise<Formation[]> {
  const formations = (await loadFormations()).filter((f) => f.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(formations));
  return formations;
}
