const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// drizzle-kit's expo migrator imports the generated .sql migration files
// directly; Metro needs to know to bundle them as source, not assets.
config.resolver.sourceExts.push('sql');

module.exports = config;
