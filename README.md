# OpenFav Migration Pipeline

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

🚀 **Professional Design System Migration Tool** - Automated pipeline for migrating design tokens from OpenFav V3/V4 to V6 Core with intelligent extraction, transformation, and hydration.

## 📋 Overview

The OpenFav Migration Pipeline is a sophisticated Node.js application designed to automate the migration of design system tokens between different versions of the OpenFav design system. It provides a complete end-to-end solution for extracting tokens from legacy versions (V3/V4) and injecting them into modern V6 implementations with proper format conversion and validation.

### ✨ Key Features

- **🔍 Intelligent Token Extraction**: Automatically extracts color, spacing, and typography tokens from CSS/SCSS files
- **🎨 Color Format Conversion**: Converts HEX colors to HSL format for V6 compatibility
- **💧 Smart Token Hydration**: Injects tokens into target files using structured comments
- **🧪 Comprehensive Testing**: Full test suite with unit and integration tests (Vitest)
- **📊 Detailed Logging**: Color-coded logging system for better visibility
- **🔄 Dry-run Mode**: Safe testing without modifying files
- **⚡ High Performance**: Batch processing for large codebases

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/openfav/migration-pipeline.git
cd migration-pipeline

# Install dependencies
npm install

# Make the CLI globally available
npm link
```

### Basic Usage

```bash
# Run complete migration pipeline
openfav-migrate hydrate

# Run with dry-run to preview changes
openfav-migrate hydrate --dry-run

# Validate configuration
openfav-migrate validate

# Run tests to verify everything works
npm test
```

## 📁 Project Structure

```
migration-dev-V1/
├── 📁 src/                          # Source code
│   ├── 📁 core/                     # Core components
│   │   ├── config-loader.js        # Configuration management
│   │   └── token-engine.js         # Pipeline orchestrator
│   ├── 📁 injectors/               # Token injection
│   │   └── injector-engine.js      # Injection engine
│   ├── 📁 modules/                  # Functional modules
│   │   ├── 📁 extractors/          # Token extraction
│   │   │   └── css-extractor.js   # CSS/SCSS token extractor
│   │   └── 📁 hydrators/           # Token hydration
│   │       └── token-hydrator.js  # Token injection engine
│   ├── 📁 transformers/            # Token transformers
│   │   └── color-transformer.js   # Color format conversion
│   ├── 📁 utils/                   # Utilities
│   │   └── logger.js              # Logging system
│   └── index.js                   # Main entry point
├── 📁 tests/                       # Test suite
│   ├── 📁 fixtures/               # Test data
│   ├── 📁 integration/            # Integration tests
│   └── 📁 unit/                   # Unit tests
├── 📄 package.json               # Project configuration
├── 📄 CHANGELOG.md               # Version history
└── 📄 README.md                  # This file
```

## ⚙️ Configuration

The pipeline uses a configuration file to define source and target paths. Create a `migration.config.json` in your project root:

```json
{
  "version": "2.0",
  "paths": {
    "v4": "./path/to/your/v4/project",
    "v6": "./path/to/your/v6/project"
  },
  "options": {
    "dryRun": false,
    "verbose": true
  }
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `version` | string | "2.0" | Configuration version |
| `paths.v4` | string | - | Source path for V3/V4 tokens |
| `paths.v6` | string | - | Target path for V6 tokens |
| `options.dryRun` | boolean | false | Preview changes without modifying files |
| `options.verbose` | boolean | true | Enable detailed logging |

## 🛠️ Available Commands

### CLI Commands

```bash
# Setup migration configuration
openfav-migrate setup

# Validate configuration and paths
openfav-migrate validate

# Run complete hydration pipeline
openfav-migrate hydrate

# Run with dry-run mode
openfav-migrate hydrate --dry-run

# Run tests
npm test
```

### NPM Scripts

```bash
# Start the CLI
npm start

# Run test suite
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint
```

## 🔧 How It Works

### 1. Token Extraction

The pipeline extracts tokens from CSS/SCSS files using PostCSS:

- **Colors**: Variables matching `--color-*` pattern
- **Spacing**: Variables matching `--spacing-*` pattern  
- **Typography**: Variables matching `--font-*` pattern

```css
:root {
  --color-primary: #3B82F6;
  --color-secondary: #64748B;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --font-family-base: 'Inter', sans-serif;
}
```

### 2. Token Transformation

Extracted tokens are transformed for V6 compatibility:

- **Color Conversion**: HEX → HSL format
- **Name Normalization**: Standardized token naming
- **Validation**: Schema validation using Zod

### 3. Token Hydration

Transformed tokens are injected into target files using structured comments:

```typescript
// tokens.ts
export const colors = {
  // @inject:primary
  primary: 'placeholder',
};
```

## 🧪 Testing

The project includes a comprehensive test suite using Vitest:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Current Coverage

- **Core Modules**: 78-81%
- **Extractors/Hydrators**: In progress (0% → 85%+ target)
- **Overall**: 17% → 85%+ target

## 📈 Performance

- **Batch Processing**: Handles large codebases efficiently
- **Parallel Operations**: Concurrent token extraction and injection
- **Memory Optimization**: Streaming for large CSS files

## 🔒 Security

- **Input Validation**: All inputs validated using Zod schemas
- **Path Sanitization**: Secure file path handling
- **Error Handling**: Comprehensive error handling

## 🐛 Troubleshooting

### Common Issues

1. **Module Import Errors**
   ```bash
   # Ensure you're using Node.js >= 18.0.0
   node --version
   ```

2. **Configuration Issues**
   ```bash
   # Validate configuration
   openfav-migrate validate
   ```

### Debug Mode

Enable verbose logging for debugging:

```json
{
  "options": {
    "verbose": true,
    "dryRun": true
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

MIT License - see the LICENSE file for details.

## 🗺️ Roadmap

- [ ] Support for additional token types (shadows, animations)
- [ ] Web-based migration dashboard
- [ ] Integration with popular design systems

---

**Built with ❤️ for the design system community**
