const path = require('path');

const envPath = path.resolve(__dirname, '..', '..', '.env');
try {
  process.loadEnvFile(envPath);
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

const mobileConfig = require('./app.json').expo;
const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || '';

module.exports = {
  ...mobileConfig,
  plugins: [
    ...(mobileConfig.plugins || []),
    'expo-secure-store',
    [
      'react-native-maps',
      {
        androidGoogleMapsApiKey: googleMapsApiKey,
      },
    ],
  ],
};
