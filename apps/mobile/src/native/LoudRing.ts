import { requireOptionalNativeModule } from 'expo';
import { Vibration } from 'react-native';

const Native = requireOptionalNativeModule<any>('AsterLoudRing');

export async function startLoudRing() {
  Vibration.vibrate([0, 800, 300, 800, 300, 1200], true);
  if (Native?.start) await Native.start();
}

export async function stopLoudRing() {
  Vibration.cancel();
  if (Native?.stop) await Native.stop();
}

export async function openDndAccessSettings() {
  if (Native?.openDndAccessSettings) await Native.openDndAccessSettings();
}
