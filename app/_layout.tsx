import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DroneProvider } from '../src/context/DroneContext';
import { FleetProvider } from '../src/context/FleetContext';
import { MissionProvider } from '../src/context/MissionContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DroneProvider>
        <FleetProvider>
          <MissionProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }} />
          </MissionProvider>
        </FleetProvider>
      </DroneProvider>
    </SafeAreaProvider>
  );
}
