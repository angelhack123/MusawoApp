// Extends app.json. Firebase's google-services.json enables push notifications on Android;
// it's added only when the file exists, so the app still builds before Firebase is set up.
const fs = require('fs');
const path = require('path');

const GOOGLE_SERVICES = './google-services.json';

module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    ...(fs.existsSync(path.join(__dirname, GOOGLE_SERVICES)) ? { googleServicesFile: GOOGLE_SERVICES } : {}),
  },
});
