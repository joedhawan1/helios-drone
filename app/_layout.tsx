import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DroneProvider } from '../src/context/DroneContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DroneProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }} />
      </DroneProvider>
    </SafeAreaProvider>
  );
}
