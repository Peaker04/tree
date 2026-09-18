const mobileConfig = require('./apps/mobile/app.json').expo;

module.exports = {
  ...mobileConfig,
  icon: './apps/mobile/assets/icon.png',
  android: {
    ...mobileConfig.android,
    adaptiveIcon: {
      ...mobileConfig.android.adaptiveIcon,
      foregroundImage: './apps/mobile/assets/android-icon-foreground.png',
      backgroundImage: './apps/mobile/assets/android-icon-background.png',
      monochromeImage: './apps/mobile/assets/android-icon-monochrome.png',
    },
  },
  web: {
    ...mobileConfig.web,
    favicon: './apps/mobile/assets/favicon.png',
  },
};
