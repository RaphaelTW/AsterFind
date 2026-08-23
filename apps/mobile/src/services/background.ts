import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import * as Network from 'expo-network';
import * as Device from 'expo-device';
import { APP } from '@/config/app';
import { listPublishers, getSecret, getSettings } from '@/storage/localStore';
import { encryptJson, decryptJson } from '@/utils/crypto';
import { putState, getCommand } from './relay';
import { startLoudRing } from '@/native/LoudRing';
import type { DeviceSnapshot } from '@/types/models';
import { t } from '@/i18n/translations';

export const LOCATION_TASK = 'asterfind-background-location';
const commandSeen = new Map<string, number>();

TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error || !data || !APP.relayUrl) return;
  const locations = (data as any).locations as Location.LocationObject[];
  const loc = locations?.[locations.length - 1];
  if (!loc) return;
  const [publishers, battery, batteryState, network, settings] = await Promise.all([
    listPublishers(), Battery.getBatteryLevelAsync(), Battery.getBatteryStateAsync(), Network.getNetworkStateAsync(), getSettings()
  ]);
  const now = Date.now();
  const activePublishers = publishers.filter(x => x.expiresAt > now);
  if (!activePublishers.length) {
    if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) await Location.stopLocationUpdatesAsync(LOCATION_TASK).catch(() => {});
    return;
  }
  for (const ch of activePublishers) {
    const [publisherToken, key] = await Promise.all([getSecret(ch.id, 'publisher'), getSecret(ch.id, 'key')]);
    if (!publisherToken || !key) continue;
    const snapshot: DeviceSnapshot = {
      deviceId: Device.modelId || Device.modelName || 'device',
      name: ch.label || Device.deviceName || Device.modelName || t(settings.language,'deviceGeneric'),
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      accuracy: loc.coords.accuracy,
      batteryLevel: Math.max(0, Math.min(1, battery)),
      charging: batteryState === Battery.BatteryState.CHARGING || batteryState === Battery.BatteryState.FULL,
      networkConnected: network.isConnected !== false,
      timestamp: loc.timestamp || now,
      shareExpiresAt: ch.expiresAt
    };
    try {
      await putState(ch.id, publisherToken, encryptJson(snapshot, key));
      if (ch.canReceiveRing) {
        const after = commandSeen.get(ch.id) || 0;
        const cmd = await getCommand(ch.id, publisherToken, after);
        if (cmd?.ciphertext) {
          const decoded = decryptJson<{type:string;timestamp:number}>(cmd.ciphertext, key);
          commandSeen.set(ch.id, cmd.updatedAt);
          if (decoded.type === 'ring' && Date.now() - decoded.timestamp < 5 * 60 * 1000) await startLoudRing();
        }
      }
    } catch {}
  }
});

export async function ensureBackgroundTracking() {
  const [publishers, settings] = await Promise.all([listPublishers(), getSettings()]);
  const hasActive = publishers.some(x => x.expiresAt > Date.now());
  const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
  if (!hasActive) {
    if (started) await Location.stopLocationUpdatesAsync(LOCATION_TASK);
    return;
  }
  if (started) return;
  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.Highest,
    distanceInterval: APP.backgroundDistanceMeters,
    timeInterval: APP.backgroundIntervalMs,
    foregroundService: {
      notificationTitle: t(settings.language,'backgroundNotificationTitle'),
      notificationBody: t(settings.language,'backgroundNotificationBody'),
      killServiceOnDestroy: false
    },
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true
  });
}
