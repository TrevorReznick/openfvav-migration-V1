#!/bin/bash
# commit-organizer.sh

echo "🎯 Organizing commits by change type..."

# 1. Core Fixes
echo "🔧 Commit 1: Core Pipeline Fixes"
git add src/injectors/injector-engine.js
git add src/modules/extractors/css-extractor.js
git commit -m "fix: improve token extraction and injection logic

- Fix injector-engine.js to properly handle @inject tags with/without --
- Fix css-extractor.js typography value sanitization (remove extra quotes)
- Add better error handling and debug logging
- Ensure consistent token extraction from CSS files"

# 2. Tests
echo "🧪 Commit 2: Test Infrastructure"
git add tests/unit/injectors/injector-engine.test.js
git add tests/integration/full-pipeline.test.js
git add tests/unit/cli.test.js
git add tests/unit/template-generator.test.js
git add tests/integration/commands.test.js
git commit -m "test: add comprehensive test coverage

- Add new unit tests for injector-engine (quote handling)
- Update integration tests with proper fixture setup
- Add CLI command tests
- Add template generator tests
- Fix test assertions for updated pipeline behavior"

# 3. Features
echo "🚀 Commit 3: New Features & Commands"
git add src/cli.js
git add src/commands/seed-templates.js
git add src/core/template-generator.js
git add src/pipeline/
git commit -m "feat: add template generation and seeding system

- Add seed-templates command for initial template creation
- Add template-generator.js for auto-generating V6 templates
- Add new pipeline architecture with migration-engine.js
- Add interactive CLI options for better UX
- Support automatic @inject tag seeding"

# 4. Documentation
echo "📚 Commit 4: Documentation"
git add docs/05-hydratation-flow
git add docs/06-Architerure-1.md
git add docs/07-context_roadmap.md
git commit -m "docs: add architecture and workflow documentation

- Add hydration flow documentation
- Add system architecture overview
- Add context and roadmap planning
- Document migration pipeline v2.0.3 changes"

# 5. Configuration
echo "⚙️  Commit 5: Project Configuration"
git add .gitignore
git add package.json
git add migration.config.test.json
git commit -m "chore: update project configuration and dependencies

- Update .gitignore to exclude test projects and temp files
- Update package.json with new scripts and dependencies
- Add test configuration file for CI/CD
- Improve project structure for better maintenance"

echo "✅ All commits organized!"
echo ""
echo "📊 Summary:"
git log --oneline -5
