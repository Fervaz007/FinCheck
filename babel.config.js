module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Lets the generated drizzle migrations import the raw .sql files as strings.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
