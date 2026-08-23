import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { AppSettings, PublisherChannel, RemoteChannel } from '@/types/models';

const KEYS = {
  settings: '@asterfind/settings',
  publishers: '@asterfind/publishers',
  remotes: '@asterfind/remotes',
  updateCheckedAt: '@asterfind/update-checked-at',
};

const secretKey = (channelId: string, part: string) => `asterfind:${channelId}:${part}`;

export async function getSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(KEYS.settings);
  if (!raw) return { language: 'pt-BR', autoCheckUpdates: true, useSystemTheme: true };
  return JSON.parse(raw);
}

export async function saveSettings(settings: AppSettings) {
  await AsyncStorage.setItem(KEYS.settings, JSON.stringify(settings));
}

export async function listPublishers(): Promise<PublisherChannel[]> {
  return JSON.parse((await AsyncStorage.getItem(KEYS.publishers)) || '[]');
}

export async function savePublishers(items: PublisherChannel[]) {
  await AsyncStorage.setItem(KEYS.publishers, JSON.stringify(items));
}

export async function listRemotes(): Promise<RemoteChannel[]> {
  return JSON.parse((await AsyncStorage.getItem(KEYS.remotes)) || '[]');
}

export async function saveRemotes(items: RemoteChannel[]) {
  await AsyncStorage.setItem(KEYS.remotes, JSON.stringify(items));
}

export async function setSecret(channelId: string, part: 'publisher' | 'viewer' | 'command' | 'key', value: string) {
  await SecureStore.setItemAsync(secretKey(channelId, part), value);
}

export async function getSecret(channelId: string, part: 'publisher' | 'viewer' | 'command' | 'key') {
  return SecureStore.getItemAsync(secretKey(channelId, part));
}

export async function deleteChannelSecrets(channelId: string) {
  await Promise.all(['publisher', 'viewer', 'command', 'key'].map(p => SecureStore.deleteItemAsync(secretKey(channelId, p))));
}

export async function getLastUpdateCheck() {
  return Number((await AsyncStorage.getItem(KEYS.updateCheckedAt)) || 0);
}

export async function setLastUpdateCheck(ts: number) {
  await AsyncStorage.setItem(KEYS.updateCheckedAt, String(ts));
}
