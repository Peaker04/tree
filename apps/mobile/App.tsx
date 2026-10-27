import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MobileApp from './src/screens/MobileApp';

export default function App() {
  return (
    <SafeAreaProvider>
      <MobileApp />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
