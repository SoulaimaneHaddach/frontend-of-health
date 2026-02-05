const { withAndroidManifest, withInfoPlist, withProjectBuildGradle } = require('@expo/config-plugins');

function addAndroidMetaData(config, appId) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    try {
      // Ensure the manifest root has the tools namespace so tools:replace works
      manifest.manifest.$ = manifest.manifest.$ || {};
      manifest.manifest.$['xmlns:tools'] = manifest.manifest.$['xmlns:tools'] || 'http://schemas.android.com/tools';

      const mainApplication = manifest.manifest.application[0];
      mainApplication['meta-data'] = mainApplication['meta-data'] || [];
      // Avoid duplicate
      const exists = mainApplication['meta-data'].some((m) => {
        const attrs = m.$ || m;
        return attrs['android:name'] === 'com.google.android.gms.ads.APPLICATION_ID';
      });
      if (!exists) {
        // Include tools:replace so this meta-data overrides the library's empty entry
        mainApplication['meta-data'].push({
          $: {
            'android:name': 'com.google.android.gms.ads.APPLICATION_ID',
            'android:value': appId,
            'tools:replace': 'android:value',
          },
        });
      }
    } catch (e) {
      // If manifest shape unexpected, ignore — plugin will be best-effort
    }
    return config;
  });
}

function addIosInfoPlist(config, appId) {
  return withInfoPlist(config, (config) => {
    try {
      config.modResults = config.modResults || {};
      if (!config.modResults.GADApplicationIdentifier) {
        config.modResults.GADApplicationIdentifier = appId;
      }
    } catch (e) {}
    return config;
  });
}

module.exports = function withAdMobPlugin(config, props) {
  const appId = (props && props.appId) || 'ca-app-pub-1741941427300096~1571982751';
  config = addAndroidMetaData(config, appId);
  config = addIosInfoPlist(config, appId);
  return config;
};

module.exports.default = module.exports;
