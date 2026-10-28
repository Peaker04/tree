const path = require('path');

const envPath = path.resolve(__dirname, '..', '..', '.env');
try {
  process.loadEnvFile(envPath);
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

const mobileConfig = require('./app.json').expo;
const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || '';
const isExpoGo = process.env.EXPO_GO === '1' || process.argv.includes('--go');

// When building a distribution IPA (CI_STRIP_DEV_CLIENT=1), exclude expo-dev-client.
// expo-dev-client adds aps-environment + dev-menu entitlements that cause instant crash
// on unsigned / sideloaded builds (free Apple ID).  It is only needed for local dev.
const isDistributionBuild = process.env.CI_STRIP_DEV_CLIENT === '1';

const extraPlugins = ['expo-secure-store'];
if (!isExpoGo && googleMapsApiKey) {
  extraPlugins.push([
    'react-native-maps',
    {
      androidGoogleMapsApiKey: googleMapsApiKey,
    },
  ]);
}

// Filter expo-dev-client out of plugins when building a distribution IPA
const basePlugins = isDistributionBuild
  ? (mobileConfig.plugins || []).filter((p) => {
      const name = Array.isArray(p) ? p[0] : p;
      return name !== 'expo-dev-client';
    })
  : mobileConfig.plugins || [];

module.exports = {
  ...mobileConfig,
  sdkVersion: '57.0.0',
  plugins: [...basePlugins, ...extraPlugins],
};
