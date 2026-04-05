import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DroneProvider } from '../src/context/DroneContext';
import { FleetProvider } from '../src/context/FleetContext';
import { MissionProvider } from '../src/context/MissionContext';
import { StudioProvider } from '../src/context/StudioContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DroneProvider>
        <FleetProvider>
          <StudioProvider>
            <MissionProvider>
              <StatusBar style="light" />
              <Stack screenOptions={{ headerShown: false }} />
            </MissionProvider>
          </StudioProvider>
        </FleetProvider>
      </DroneProvider>
    </SafeAreaProvider>
  );
}
