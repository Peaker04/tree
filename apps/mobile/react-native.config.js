// react-native.config.js
//
// When CI_STRIP_DEV_CLIENT=1, exclude expo-dev-client from native autolinking
// entirely so it is not added to the Podfile / Gradle.
//
// expo-dev-client native pods add entitlements (aps-environment, dev-menu)
// and initialize push notification infrastructure at launch. These crash
// instantly on unsigned / sideloaded IPAs signed with a free Apple ID because
// the provisioning profile does not authorize those capabilities.
//
// This only affects CI distribution builds. Local development still autolinks
// expo-dev-client normally (CI_STRIP_DEV_CLIENT is not set).

const isDistributionBuild = process.env.CI_STRIP_DEV_CLIENT === '1';

module.exports = {
  dependencies: isDistributionBuild
    ? {
        'expo-dev-client': {
          platforms: {
            ios: null,
            android: null,
          },
        },
      }
    : {},
};
