import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'AsterFind',
  slug: 'asterfind',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'asterfind',
  userInterfaceStyle: 'automatic',
  icon: './assets/icon.png',
  android: {
    package: 'com.raphaeltw.asterfind',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0B0B0C'
    },
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'FOREGROUND_SERVICE',
      'FOREGROUND_SERVICE_LOCATION',
      'VIBRATE',
      'INTERNET',
      'ACCESS_NETWORK_STATE'
    ]
  },
  ios: {
    bundleIdentifier: 'com.raphaeltw.asterfind',
    supportsTablet: true,
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'O AsterFind usa sua localização para mostrar seus próprios aparelhos e compartilhamentos autorizados.',
      NSLocationAlwaysAndWhenInUseUsageDescription: 'O AsterFind usa localização em segundo plano somente quando você ativa o rastreamento ou um compartilhamento.',
      UIBackgroundModes: ['location']
    }
  },
  plugins: [
    '@maplibre/maplibre-react-native',
    ['expo-splash-screen', {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#0B0B0C'
    }],
    ['expo-location', {
      isAndroidBackgroundLocationEnabled: true,
      isAndroidForegroundServiceEnabled: true,
      isIosBackgroundLocationEnabled: true
    }],
    ['expo-secure-store', { configureAndroidBackup: true }]
  ],
  extra: {
    relayUrl: process.env.EXPO_PUBLIC_RELAY_URL ?? '',
    githubRepo: 'RaphaelTW/asterfind',
    developerUrl: 'https://github.com/RaphaelTW',
    pixKey: process.env.EXPO_PUBLIC_PIX_KEY ?? 'CONFIGURE_SUA_CHAVE_PIX'
  }
};

export default config;
