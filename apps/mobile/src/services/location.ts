import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import * as Network from 'expo-network';
import * as Crypto from 'expo-crypto';
import type { DeviceSnapshot, GeoAddress } from '@/types/models';

type AddressCacheEntry = { latitude:number; longitude:number; address:GeoAddress; at:number };
const addressCache = new Map<string, AddressCacheEntry>();

function approxDistanceMeters(lat1:number, lon1:number, lat2:number, lon2:number) {
  const dy = (lat2 - lat1) * 111_320;
  const dx = (lon2 - lon1) * 111_320 * Math.cos(((lat1 + lat2) / 2) * Math.PI / 180);
  return Math.sqrt(dx * dx + dy * dy);
}

export async function reverseGeocodeCached(cacheKey:string, latitude:number, longitude:number): Promise<GeoAddress | undefined> {
  const cached = addressCache.get(cacheKey);
  if (cached && Date.now() - cached.at < 5 * 60 * 1000 && approxDistanceMeters(cached.latitude, cached.longitude, latitude, longitude) < 25) {
    return cached.address;
  }
  try {
    const result = await Location.reverseGeocodeAsync({ latitude, longitude });
    const address = result[0] as GeoAddress | undefined;
    if (address) addressCache.set(cacheKey, { latitude, longitude, address, at: Date.now() });
    return address;
  } catch {
    return cached?.address;
  }
}

export async function requestLocationPermissions(background = false) {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') return false;
  if (background) {
    const bg = await Location.requestBackgroundPermissionsAsync();
    return bg.status === 'granted';
  }
  return true;
}

export async function getCurrentSnapshot(name = 'Este telefone'): Promise<DeviceSnapshot> {
  const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
  const [batteryLevel, batteryState, network] = await Promise.all([
    Battery.getBatteryLevelAsync(),
    Battery.getBatteryStateAsync(),
    Network.getNetworkStateAsync()
  ]);
  const address = await reverseGeocodeCached('own', loc.coords.latitude, loc.coords.longitude);
  return {
    deviceId: Crypto.randomUUID(),
    name,
    latitude: loc.coords.latitude,
    longitude: loc.coords.longitude,
    accuracy: loc.coords.accuracy,
    batteryLevel: Math.max(0, Math.min(1, batteryLevel)),
    charging: batteryState === Battery.BatteryState.CHARGING || batteryState === Battery.BatteryState.FULL,
    networkConnected: network.isConnected !== false,
    timestamp: loc.timestamp || Date.now(),
    address
  };
}

export function formatAddress(address?: GeoAddress) {
  if (!address) return '';
  if (address.formattedAddress) return address.formattedAddress;
  const street = [address.street, address.streetNumber].filter(Boolean).join(', ');
  return [street, address.district, address.city, address.region, address.postalCode, address.country].filter(Boolean).join(' - ');
}
