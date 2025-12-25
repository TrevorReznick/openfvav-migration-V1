import postcss from 'postcss';

/**
 * PostCSS plugin for token extraction
 * @type {import('postcss').Plugin}
 */
const plugin = (options = {}) => {
  const { colorTokens = {}, customVariables = {}, typographyTokens = {} } = options;
  
  return {
    postcssPlugin: 'extract-tokens',
    Once(root) {
      root.walkDecls(decl => {
        // Extract color variables
        if (decl.prop.startsWith('--color-') || decl.prop.endsWith('-color') || decl.prop === '--color') {
          colorTokens[decl.prop] = decl.value;
        }
        // Extract typography variables
        else if (decl.prop.startsWith('--font-')) {
          typographyTokens[decl.prop] = decl.value;
        }
        // Extract custom variables (including spacing)
        else if (decl.prop.startsWith('--')) {
          customVariables[decl.prop] = decl.value;
        }
      });
    }
  };
};

// For backward compatibility
plugin.postcss = true;

export default plugin;
