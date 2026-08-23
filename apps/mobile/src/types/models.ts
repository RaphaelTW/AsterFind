export type LanguageCode = 'pt-BR' | 'en' | 'es' | 'ru' | 'de' | 'it' | 'zh' | 'ja' | 'hi';

export type GeoAddress = {
  street?: string | null;
  streetNumber?: string | null;
  district?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  country?: string | null;
  formattedAddress?: string | null;
};

export type DeviceSnapshot = {
  deviceId: string;
  name: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  batteryLevel: number;
  charging: boolean;
  networkConnected: boolean;
  timestamp: number;
  shareExpiresAt?: number;
  address?: GeoAddress;
};

export type PublisherChannel = {
  id: string;
  label: string;
  kind: 'contact-share' | 'paired-device';
  expiresAt: number;
  createdAt: number;
  canReceiveRing: boolean;
};

export type RemoteChannel = {
  id: string;
  label: string;
  kind: 'contact' | 'requested-contact' | 'owned-device';
  expiresAt: number;
  createdAt: number;
  canRing: boolean;
};

export type ShareDuration = '1h' | '8h' | '1d' | '7d' | 'forever';

export type AppSettings = {
  language: LanguageCode;
  autoCheckUpdates: boolean;
  useSystemTheme: boolean;
};
