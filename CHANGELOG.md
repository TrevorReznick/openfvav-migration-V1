# Changelog

## [3.0.0-alpha] — 2026-07-29

### Nexus Ecosystem — Foundation + Repository Determinism

This release marks the evolution from v2.0.3 monolithic migration tool into the Nexus multi-stage ecosystem.

---

### Epic 0 — Decoupling (Foundation)

#### Added
- **Shared Type System**: 4 domain type modules with full Zod validation schemas
  - `RepositoryModel` — technology-independent repository snapshot (10 node types)
  - `KnowledgeModel` — semantic interpretation model (7 sub-types)
  - `ApplicationDefinition` / `PageDefinition` / `WidgetDefinition` — build specs
  - `RepositoryManifest` — universal interchange format with per-section SHA-256 checksums
- **TypeScript Infrastructure**: strict mode, ES2022, NodeNext modules, `tsx` runner
- **Subsystem Directories**: `src/observer/`, `src/interpreter/`, `src/definitions/`, `src/builder/`
- **Nexus CLI v3.0.0-alpha**: 11 commands (`observe`, `interpret`, `define`, `build`, `explore`, `manifest`, `init` + legacy wrappers)
- **CSS Observer Migration**: `css-extractor.js` → `css-observer.ts` with `StyleNode[]` + `TokenNode[]` output

#### Changed
- Renamed `repository-model.ts` → `repository.ts`, `knowledge-model.ts` → `knowledge.ts`
- `RepositoryManifest`: `version` → `schemaVersion` (string), `checksum` → `checksums` (per-section)
- `ApplicationDefinition`: added `architecture`, `framework`, `stylingStrategy`, `navigation`, `theming`, `authentication`
- Added 8 supporting interfaces: `NavigationDefinition`, `ThemeDefinition`, `AuthDefinition`, `WidgetProp`, etc.

#### Preserved
- All v2.0.3 `.js` files untouched (zero modifications)
- Legacy `openfav-migrate` pipeline fully functional
- 21 existing tests pass with zero logic changes

---

### Epic 1 — Repository Determinism

#### Added
- **5 Observer Modules**: `framework-detector.ts`, `page-observer.ts`, `component-observer.ts`, `import-observer.ts`, `route-observer.ts`
- **Cross-Reference Enrichment**: `reference-linker.ts` connects ComponentNode.usedBy, PageNode.childComponents, StyleNode.associatedComponent
- **Canonical JSON**: `canonical-json.ts` — deterministic serialization (sorted keys, sorted arrays by id, zero variance)
- **Manifest I/O**: `manifest-io.ts` — SHA-256 checksum generation, atomic writes (tmp→rename), checksum validation
- **Observer Inspector**: `--view` (text summary) and `--html` (self-contained dark-mode HTML report)
- **3 Golden Repositories**:
  - `fixtures/tiny-app/` — Astro (3 pages, 5 components, 34 tokens)
  - `fixtures/openfav-reference/` — React (2 pages, 2 components, 59 tokens)
  - `fixtures/opennexus-reference/` — Next.js App Router (3 pages, 3 components, 24 tokens)
- Each golden repo includes `expected.manifest.json` for regression testing

#### Proven
- **Repository Determinism**: same commit + same config → identical SHA-256 across 5 consecutive runs
- **Order Independence**: filesystem order irrelevant — all glob results sorted before processing
- **ID Stability**: hash-based IDs (`sha256(path).slice(0,8)`) instead of sequential counters

#### Tests
- 53 tests across 13 test files (21 original v2.0.3 + 32 new)
- Determinism tests: 5-run SHA-256 identity verified on all 3 golden repos
- Golden regression tests: observe → compare against `expected.manifest.json`
- Canonical JSON unit tests: 19 tests (key ordering, array sorting, nested objects)

---

### Architecture Decision

Two-track system formalized:
- **Track A** (Nexus Runtime → OpenNexus → Experience): "Rendere comprensibile la conoscenza"
- **Track B** (Nexus Builder → Source Observer → Repository Manifest): "Comprendere repository"
- **Shared Contract**: `RepositoryManifest` + Kernel types only

---

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
