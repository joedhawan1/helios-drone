import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SatelliteProvider } from '../src/context/SatelliteContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SatelliteProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }} />
      </SatelliteProvider>
    </SafeAreaProvider>
  );
}
