import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

export const APP = {
  name: 'AsterFind',
  version: Constants.expoConfig?.version ?? '1.0.0',
  githubRepo: extra.githubRepo || 'RaphaelTW/asterfind',
  developerUrl: extra.developerUrl || 'https://github.com/RaphaelTW',
  pixKey: extra.pixKey || 'CONFIGURE_SUA_CHAVE_PIX',
  relayUrl: (extra.relayUrl || '').replace(/\/$/, ''),
  activeThresholdMs: 2 * 60 * 1000,
  offlineThresholdMs: 5 * 60 * 1000,
  backgroundDistanceMeters: 8,
  backgroundIntervalMs: 10_000,
};

export const MAP_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors'
    }
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }]
} as const;
