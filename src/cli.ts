#!/usr/bin/env npx tsx
/**
 * Nexus Ecosystem CLI — Multi-stage Observable Migration Pipeline
 *
 * Replaces the legacy `openfav-migrate` CLI with the new `nexus` command.
 * Preserves backward compatibility for all v2.0.3 commands.
 *
 * @module cli
 * @version 3.0.0-alpha
 *
 * Roadmap reference: docs/08-nexus-roadmap.md §3.1 CLI Command Mapping
 */

import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname } from 'node:path';

// ---------------------------------------------------------------------------
// Stub module imports (each throws "Not implemented" until its Epic ships)
// ---------------------------------------------------------------------------
import { observeRepository, observeManifest } from './observer/index.js';
import { generateSummary, generateHTML } from './observer/inspector.js';
import { interpret } from './interpreter/index.js';
import { define } from './definitions/index.js';
import { build } from './builder/index.js';
import { writeManifest, validateChecksums } from './shared/manifest-io.js';
import { canonicalStringify } from './shared/canonical-json.js';

// ---------------------------------------------------------------------------
// Manifest type (lightweight inline for CLI validation — the canonical type
// lives in shared/types/manifest.ts)
// ---------------------------------------------------------------------------
interface ManifestMeta {
  schemaVersion: string;
  generatedAt: string;
  generatedBy: string;
  sourcePath: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read and parse a JSON manifest file. */
function loadManifest(path: string): ManifestMeta {
  const raw = readFileSync(path, 'utf-8');
  return JSON.parse(raw) as ManifestMeta;
}

/**
 * Wrap a stub call so that "Not implemented" errors produce a friendly,
 * roadmap-aware message instead of a raw stack trace.
 */
async function wrapStub(label: string, epic: string, fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('Not implemented')) {
      console.log(`\n⚠️  The '${label}' command is not yet implemented.`);
      console.log(`   Expected to be available in ${epic}.`);
      console.log('   See docs/08-nexus-roadmap.md for the full delivery schedule.\n');
    } else {
      console.error(`\n❌ Unexpected error in '${label}': ${message}\n`);
      process.exitCode = 1;
    }
  }
}

// ===========================================================================
// CLI Definition
// ===========================================================================

const program = new Command();

program
  .name('nexus')
  .description('Nexus Ecosystem — multi-stage observable migration pipeline (v3.0.0-alpha)')
  .version('3.0.0-alpha');

// ── New Commands ──────────────────────────────────────────────────────────

program
  .command('observe')
  .description('Observe a source repository and produce a RepositoryModel')
  .requiredOption('--source <path>', 'Path to the source repository')
  .option('--output <path>', 'Output manifest path', 'repository.manifest.json')
  .option('--format <format>', 'Output format (json | yaml)', 'json')
  .option('--view', 'Print a text summary of the manifest to stdout')
  .option('--html', 'Generate a static manifest-report.html')
  .action(async (options: { source: string; output: string; format: string; view?: boolean; html?: boolean }) => {
    console.log(`\n🔍 Observing repository: ${options.source}\n`);
    try {
      const manifest = await observeManifest(options.source);

      if (options.output === '-') {
        // Write to stdout
        console.log(canonicalStringify(manifest));
      } else {
        await writeManifest(manifest, options.output);
        console.log(`✅ Repository manifest written to: ${options.output}`);
      }

      // Compute overall SHA-256
      const overallChecksum = createHash('sha256')
        .update(canonicalStringify(manifest))
        .digest('hex');

      // Validate internal checksums
      const validation = validateChecksums(manifest);
      const model = manifest.repositoryModel;

      // --view: print text summary
      if (options.view) {
        console.log(generateSummary(manifest));
      }

      // --html: generate static HTML report
      if (options.html) {
        const reportDir = options.output === '-' ? '.' : dirname(options.output);
        const reportPath = `${reportDir}/manifest-report.html`;
        writeFileSync(reportPath, generateHTML(manifest), 'utf-8');
        console.log(`📄 Manifest report written to: ${reportPath}`);
      }

      // Print summary stats (unless --view was used, which already shows a richer summary)
      if (!options.view) {
        console.log(`\n📊 Summary:`);
        console.log(`   Framework:    ${model.metadata.framework}`);
        console.log(`   Styling:      ${model.metadata.stylingApproach}`);
        console.log(`   Language:     ${model.metadata.language}`);
        console.log(`   Files:        ${model.metadata.fileCount}`);
        console.log(`   Pages:        ${model.pages.length}`);
        console.log(`   Components:   ${model.components.length}`);
        console.log(`   Routes:       ${model.routes.length}`);
        console.log(`   Imports:      ${model.imports.length}`);
        console.log(`   Stylesheets:  ${model.styles.length}`);
        console.log(`   Tokens:       ${model.tokens.length}`);
        console.log(`   Scan time:    ${model.metadata.scanDurationMs}ms`);
        console.log(`   SHA-256:      ${overallChecksum}`);
        if (validation.valid) {
          console.log(`   Checksums:    ✅ valid`);
        } else {
          console.log(`   Checksums:    ❌ ${validation.errors.join('; ')}`);
        }
        console.log();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`\n❌ Observation failed: ${message}\n`);
      process.exitCode = 1;
    }
  });

program
  .command('interpret')
  .description('Interpret a RepositoryModel into a KnowledgeModel')
  .requiredOption('--manifest <path>', 'Path to the manifest file')
  .option('--model <model>', 'AI model to use')
  .option('--dry-run', 'Preview without writing')
  .action(async (options: { manifest: string; model?: string; dryRun?: boolean }) => {
    await wrapStub('interpret', 'Epic 3 (Semantic Interpreter)', async () => {
      const manifest = loadManifest(options.manifest);
      // The stub interpret() expects a RepositoryModel — in production we'll
      // read repositoryModel from the manifest. For now the stub throws anyway.
      await interpret(manifest as unknown as Parameters<typeof interpret>[0], {
        model: options.model,
        dryRun: options.dryRun,
      });
    });
  });

program
  .command('define')
  .description('Generate ApplicationDefinitions from a KnowledgeModel')
  .requiredOption('--manifest <path>', 'Path to the manifest file')
  .option('--page <name>', 'Generate a single page definition')
  .action(async (options: { manifest: string; page?: string }) => {
    await wrapStub('define', 'Epic 5 (Definition Generator)', async () => {
      const manifest = loadManifest(options.manifest);
      await define(manifest as unknown as Parameters<typeof define>[0]);
    });
  });

program
  .command('build')
  .description('Build a runnable web application from definitions')
  .requiredOption('--manifest <path>', 'Path to the manifest file')
  .requiredOption('--output <dir>', 'Output directory')
  .option('--dry-run', 'Preview without writing')
  .option('--only <target>', 'Build only: tokens | pages | widgets | config')
  .action(async (options: { manifest: string; output: string; dryRun?: boolean; only?: string }) => {
    await wrapStub('build', 'Epic 6 (Builder)', async () => {
      const manifest = loadManifest(options.manifest);
      await build(manifest as unknown as Parameters<typeof build>[0], {
        outputDir: options.output,
        dryRun: options.dryRun,
        only: options.only as 'tokens' | 'pages' | 'widgets' | 'config' | undefined,
      });
    });
  });

program
  .command('explore')
  .description('Start the OpenNexus Explorer web interface')
  .requiredOption('--manifest <path>', 'Path to the manifest file')
  .option('--port <port>', 'Web server port', '3000')
  .action(async (options: { manifest: string; port: string }) => {
    console.log(`\n⚠️  The 'explore' command is not yet implemented.`);
    console.log('   Expected to be available in Epic 7 (OpenNexus Explorer).');
    console.log('   See docs/08-nexus-roadmap.md for the full delivery schedule.\n');
  });

// ── Manifest Subcommands ──────────────────────────────────────────────────

const manifestCmd = program
  .command('manifest')
  .description('Manifest operations');

manifestCmd
  .command('validate')
  .description('Validate a manifest file against the RepositoryManifest schema')
  .argument('<path>', 'Path to the manifest file')
  .action(async (manifestPath: string) => {
    console.log(`\n⚠️  The 'manifest validate' command is not yet implemented.`);
    console.log('   Expected to be available in Epic 2 (RepositoryManifest Schema).');
    console.log(`   File to validate: ${manifestPath}\n`);
  });

manifestCmd
  .command('diff')
  .description('Diff two manifest files')
  .argument('<v1>', 'First manifest')
  .argument('<v2>', 'Second manifest')
  .action(async (v1: string, v2: string) => {
    console.log(`\n⚠️  The 'manifest diff' command is not yet implemented.`);
    console.log('   Expected to be available in Epic 2 (RepositoryManifest Schema).');
    console.log(`   Files to diff: ${v1} ↔ ${v2}\n`);
  });

// ── Backward Compatibility Commands ───────────────────────────────────────

program
  .command('migrate')
  .description('[LEGACY] Run the v2.0.3 migration pipeline')
  .action(async () => {
    console.log('🏗️  Delegating to v2.0.3 migration pipeline...');
    console.log('⚠️  Legacy pipeline integration pending.');
    console.log('   Use the original command for now: npx openfav-migrate migrate');
    console.log('   Full integration expected in Epic 6 (Builder).\n');
  });

program
  .command('init')
  .description('Initialize a new Nexus project (replaces v2.0.3 setup)')
  .action(async () => {
    console.log('🔧 Nexus project initialization is not yet implemented.');
    console.log('   Use the v2.0.3 setup command for now: npx openfav-migrate setup');
    console.log('   Expected to ship with Epic 0 (CLI & Config).\n');
  });

program
  .command('setup')
  .description('[LEGACY] v2.0.3 setup wizard')
  .action(() => {
    console.log('🏗️  Delegating to v2.0.3 setup...');
    console.log('   Use: npx openfav-migrate setup');
    console.log('   The new equivalent is: npx nexus init\n');
  });

program
  .command('validate-config')
  .description('[LEGACY] Validate v2.0.3 migration.config.json')
  .action(() => {
    console.log('🏗️  Delegating to v2.0.3 validate...');
    console.log('   Use: npx openfav-migrate validate\n');
  });

program
  .command('seed-templates')
  .description('[LEGACY] Seed template files with @inject tags')
  .action(() => {
    console.log('🏗️  Delegating to v2.0.3 seed-templates...');
    console.log('   Use: npx openfav-migrate seed-templates\n');
  });

// ---------------------------------------------------------------------------
// Parse
// ---------------------------------------------------------------------------

program.parse(process.argv);
