const mobileConfig = require('./app.json').expo;

function readDotEnvValue(name) {
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.resolve(__dirname, '..', '..', '.env');

    if (!fs.existsSync(envPath)) {
      return undefined;
    }

    const line = fs
      .readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .find((entry) => entry.startsWith(`${name}=`));

    if (!line) {
      return undefined;
    }

    return line
      .slice(name.length + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '');
  } catch {
    return undefined;
  }
}

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || readDotEnvValue('GOOGLE_MAPS_API_KEY') || '';

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
