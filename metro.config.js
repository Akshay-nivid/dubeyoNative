// Wrapper to work around Node.js v22 ESM loader issue on Windows
// This file uses require() to load the actual config
const path = require("path");
const fs = require("fs");

// Try to load metro.config.cjs using require
try {
  const configPath = path.join(__dirname, "metro.config.cjs");
  if (fs.existsSync(configPath)) {
    // Clear require cache to ensure fresh load
    delete require.cache[require.resolve(configPath)];
    module.exports = require(configPath);
  } else {
    throw new Error("metro.config.cjs not found");
  }
} catch (error) {
  console.error("Error loading metro.config.cjs:", error);
  // Fallback to inline config
  const { getDefaultConfig } = require("expo/metro-config");
  const { withNativeWind } = require("nativewind/metro");
  const config = getDefaultConfig(__dirname);
  const { transformer, resolver } = config;
  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
  };
  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
    sourceExts: [...resolver.sourceExts, "svg"],
  };
  module.exports = withNativeWind(config, { input: "./global.css" });
}
