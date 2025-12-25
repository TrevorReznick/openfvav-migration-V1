// Mock implementation of the PostCSS extractor plugin
module.exports = function(options = {}) {
  return {
    postcssPlugin: 'extract-tokens',
    Once(root, { result }) {
      // This will be mocked in tests, so the implementation doesn't matter much
      result.tokens = {
        colors: {},
        custom: {},
        typography: {}
      };
    }
  };
};

module.exports.postcss = true;
