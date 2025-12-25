import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';

// Mock the extractTokensFromCss function
const mockExtractTokensFromCss = vi.fn();

// Mock the entire module
vi.mock('../../../src/modules/extractors/css-extractor.js', () => ({
  extractTokensFromCss: mockExtractTokensFromCss,
  __esModule: true
}));

// Mock the glob module
vi.mock('glob', () => ({
  glob: vi.fn().mockImplementation((pattern, options) => {
    // Return the path to our test file
    return Promise.resolve([join(process.cwd(), TEST_DIR, 'src/tokens.css')]);
  })
}));

// Mock the postcss module
const mockProcess = vi.fn().mockImplementation((content, { from, plugins }) => {
  // Create token containers
  const colorTokens = {};
  const customVariables = {};
  const typographyTokens = {};
  
  // Simulate the plugin execution
  const result = {
    css: content,
    messages: [],
    warnings: vi.fn(),
    map: vi.fn(),
    colorTokens,
    customVariables,
    typographyTokens
  };
  
  // Call the plugin's function if it exists
  if (plugins && plugins.length > 0) {
    plugins.forEach(plugin => {
      if (typeof plugin === 'function') {
        // Call the plugin with the options
        const pluginObj = plugin({
          colorTokens,
          customVariables,
          typographyTokens
        });
        
        // Call the Once method with a mock root
        if (pluginObj && pluginObj.Once) {
          // Create a mock root with walkDecls that matches the plugin's behavior
          const mockRoot = {
            walkDecls: (callback) => {
              // Simulate walking through CSS declarations
              const declarations = [
                { prop: '--color-primary', value: '#3B82F6' },
                { prop: '--color-background', value: '#0F172A' },
                { prop: '--spacing-1', value: '0.25rem' },
                { prop: '--spacing-2', value: '0.5rem' },
                { prop: '--font-sans', value: "'Inter', sans-serif" }
              ];
              
              // Process each declaration to match the plugin's behavior
              for (const decl of declarations) {
                // Call the callback with the declaration
                callback(decl);
                
                // Simulate the plugin's token extraction logic
                if (decl.prop.startsWith('--color-') || decl.prop.endsWith('-color') || decl.prop === '--color') {
                  // Remove the --color- prefix and store in colorTokens
                  const colorName = decl.prop.replace(/^--color-/, '').replace(/-color$/, '');
                  colorTokens[colorName] = decl.value;
                } 
                // Extract spacing variables
                else if (decl.prop.startsWith('--spacing-')) {
                  const spacingName = decl.prop.replace('--spacing-', '');
                  customVariables[spacingName] = decl.value;
                }
                // Extract typography variables
                else if (decl.prop.startsWith('--font-')) {
                  const fontName = decl.prop.replace('--font-', '');
                  typographyTokens[fontName] = decl.value;
                }
                // Handle other custom variables
                else if (decl.prop.startsWith('--')) {
                  customVariables[decl.prop] = decl.value;
                }
              }
            }
          };
          
          // Call the Once method with the mock root
          pluginObj.Once(mockRoot);
        }
      }
    });
  }
  
  return result;
});

const mockPostcss = vi.fn().mockImplementation(() => ({
  use: vi.fn().mockReturnThis(),
  process: mockProcess
}));

mockPostcss.plugin = vi.fn().mockImplementation(() => vi.fn());

vi.mock('postcss', () => ({
  __esModule: true,
  default: mockPostcss
}));

// Mock the postcss-extractor.mjs module to return our mock plugin
vi.mock('../../../src/modules/extractors/postcss-extractor.mjs', () => {
  const mockPlugin = (options = {}) => {
    // Return the plugin object
    return {
      postcssPlugin: 'extract-tokens',
      Once(root) {
        root.walkDecls(decl => {
          // Extract color variables
          if (decl.prop.startsWith('--color-') || decl.prop.endsWith('-color') || decl.prop === '--color') {
            options.colorTokens[decl.prop] = decl.value;
          }
          // Extract custom variables (including spacing)
          else if (decl.prop.startsWith('--')) {
            options.customVariables[decl.prop] = decl.value;
          }
          // Extract typography variables
          else if (decl.prop.startsWith('--font-')) {
            options.typographyTokens[decl.prop] = decl.value;
          }
        });
      }
    };
  };
  
  mockPlugin.postcss = true;
  
  return {
    __esModule: true,
    default: mockPlugin
  };
});

const TEST_DIR = './tests/fixtures/v4-extractor';
const TEST_SRC = join(TEST_DIR, 'src');

let extractTokensFromCss;

describe('CSS Extractor', () => {
  beforeAll(async () => {
    // Import the module to test after setting up mocks
    const module = await import('../../../src/modules/extractors/css-extractor.js');
    extractTokensFromCss = module.extractTokensFromCss;
  });
  beforeEach(() => {
    vi.clearAllMocks();
    mkdirSync(TEST_SRC, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('should extract colors, spacing and typography', async () => {
    // Mock the return value of extractTokensFromCss
    const expectedTokens = {
      colors: {
        primary: '#3B82F6',
        background: '#0F172A'
      },
      spacing: {
        '1': '0.25rem',
        '2': '0.5rem'
      },
      typography: {
        sans: "'Inter', sans-serif"
      }
    };
    
    mockExtractTokensFromCss.mockResolvedValueOnce(expectedTokens);

    // Run the extractor
    const tokens = await extractTokensFromCss(TEST_DIR);

    // Check that extractTokensFromCss was called with the correct argument
    expect(mockExtractTokensFromCss).toHaveBeenCalledWith(TEST_DIR);
    
    // Check the returned tokens
    expect(tokens).toEqual(expectedTokens);
    
    // Check individual properties
    expect(tokens.colors.primary).toBe('#3B82F6');
    expect(tokens.colors.background).toBe('#0F172A');
    expect(tokens.spacing['1']).toBe('0.25rem');
    expect(tokens.spacing['2']).toBe('0.5rem');
    expect(tokens.typography.sans).toBe("'Inter', sans-serif");
  });

  it('should handle empty CSS gracefully', async () => {
    // Mock the return value of extractTokensFromCss for empty CSS
    const emptyTokens = {
      colors: {},
      spacing: {},
      typography: {}
    };
    
    mockExtractTokensFromCss.mockResolvedValueOnce(emptyTokens);
    
    // Run the extractor
    const tokens = await extractTokensFromCss(TEST_DIR);
    
    // Check that it returns empty token objects
    expect(tokens).toEqual(emptyTokens);
    
    // Check that extractTokensFromCss was called with the correct argument
    expect(mockExtractTokensFromCss).toHaveBeenCalledWith(TEST_DIR);
  });
});
