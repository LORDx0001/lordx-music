import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.xalid.musicdemo',
  appName: 'LORDx Music',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    orientationLock: 'portrait'
  }
};

export default config;
