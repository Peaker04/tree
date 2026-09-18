const { withGradleProperties } = require('expo/config-plugins');

const PROPERTY_KEY = 'android.overridePathCheck';

function upsertGradleProperty(properties, key, value) {
  const existingProperty = properties.find((property) => property.type === 'property' && property.key === key);

  if (existingProperty) {
    existingProperty.value = value;
    return properties;
  }

  properties.push({
    type: 'property',
    key,
    value,
  });

  return properties;
}

module.exports = function withAndroidPathCheck(config) {
  return withGradleProperties(config, (currentConfig) => {
    currentConfig.modResults = upsertGradleProperty(currentConfig.modResults, PROPERTY_KEY, 'true');
    return currentConfig;
  });
};
