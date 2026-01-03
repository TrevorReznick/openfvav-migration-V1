# Changelog

## [v2.0.3] - $(date +%Y-%m-%d)

### 🚀 Features
- **Template Generation System**: Added automatic template generation for V6 projects
- **Seed Command**: New `seed-templates` command for initial template setup
- **Two-pass Migration**: Improved pipeline with analyze → generate → hydrate flow
- **Smart Injector**: Enhanced injector supports `@inject:key` and `@inject:--key` formats

### 🐛 Fixes
- **Fixed @inject tag handling**: Resolved 14 warnings in hydration process
- **Fixed quote escaping**: Corrected double quote issue in typography values
- **Improved token extraction**: Better CSS variable parsing and normalization
- **Enhanced error handling**: Better logging and debugging capabilities

### 🧪 Tests
- **Comprehensive test coverage**: 16/16 tests passing
- **Integration tests**: Full pipeline validation
- **Unit tests**: Core components thoroughly tested
- **Fixture updates**: Proper test setup with real CSS examples

### 📚 Documentation
- **Architecture docs**: Added system architecture overview
- **Hydration flow**: Documented complete migration workflow
- **Roadmap**: Added project context and future plans

### ⚙️ Configuration
- **Updated package.json**: New scripts and dependencies
- **Improved .gitignore**: Better project structure
- **Test config**: Added configuration for CI/CD

### 🔧 Technical Improvements
- **Code coverage**: 43.66% overall coverage
- **Modular architecture**: Separated concerns in pipeline components
- **Better logging**: Verbose and debug modes for troubleshooting

---

**Migration Success Criteria:**
- ✅ Extracts tokens from V4 CSS files
- ✅ Generates proper V6 templates with @inject tags
- ✅ Hydrates values with 0 warnings
- ✅ Supports dark/light theme configurations
- ✅ Compatible with Tailwind + shadcn/ui setups

**Breaking Changes:** None  
**Migration Required:** No  
**Dependencies Updated:** Minor updates only
