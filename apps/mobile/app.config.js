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

const extraPlugins = ['expo-secure-store'];
if (!isExpoGo && googleMapsApiKey) {
  extraPlugins.push([
    'react-native-maps',
    {
      androidGoogleMapsApiKey: googleMapsApiKey,
    },
  ]);
}

module.exports = {
  ...mobileConfig,
  sdkVersion: '58.0.0',
  plugins: [
    ...(mobileConfig.plugins || []),
    ...extraPlugins,
  ],
};
