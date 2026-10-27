import { Platform, Vibration } from 'react-native';

export type TactileFeedbackType = 'light' | 'success' | 'warning' | 'error';

/**
 * Native cross-platform tactile feedback utility.
 * Safe on both iOS and Android without adding third-party native dependencies.
 */
export function triggerTactileFeedback(type: TactileFeedbackType = 'light'): void {
  try {
    if (Platform.OS === 'ios') {
      switch (type) {
        case 'light':
          Vibration.vibrate(10);
          break;
        case 'success':
          Vibration.vibrate([0, 20, 50, 20]);
          break;
        case 'warning':
        case 'error':
          Vibration.vibrate([0, 40, 60, 40]);
          break;
      }
    } else {
      switch (type) {
        case 'light':
          Vibration.vibrate(12);
          break;
        case 'success':
          Vibration.vibrate([0, 25, 40, 25]);
          break;
        case 'warning':
        case 'error':
          Vibration.vibrate([0, 50, 50, 50]);
          break;
      }
    }
  } catch {
    // Graceful no-op on devices/environments without vibration hardware
  }
}
