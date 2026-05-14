const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable exports field resolution but force CJS builds by excluding the
// 'import' condition — otherwise zustand resolves to esm/middleware.mjs
// which uses import.meta (invalid outside ES modules).
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['browser', 'require', 'default'];

module.exports = config;
