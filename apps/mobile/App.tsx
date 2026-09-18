import { StatusBar } from 'expo-status-bar';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';
import MobileApp from './src/screens/MobileApp';

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <MobileApp />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
