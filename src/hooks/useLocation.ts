import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import type { GpsCoordinates } from '../types/drone';

interface UseLocationResult {
  coords: GpsCoordinates | null;
  error: string | null;
  loading: boolean;
  requestLocation: () => Promise<GpsCoordinates | null>;
}

export function useLocation(): UseLocationResult {
  const [coords, setCoords] = useState<GpsCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestLocation = useCallback(async (): Promise<GpsCoordinates | null> => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        return null;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const result: GpsCoordinates = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        altitude: loc.coords.altitude,
        accuracy: loc.coords.accuracy,
      };
      setCoords(result);
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Location unavailable';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { coords, error, loading, requestLocation };
}
