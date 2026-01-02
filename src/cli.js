#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from './core/config-loader.js';
import { TokenEngine } from './core/token-engine.js';
import { MigrationEngine } from './pipeline/migration-engine.js';
import { runSeedTemplates } from './commands/seed-templates.js';
import { Logger } from './utils/logger.js';
import inquirer from 'inquirer';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { createTokenTemplates } from './core/template-generator.js';

const CONFIG_PATH = join(process.cwd(), 'migration.config.json');
const program = new Command();

// ============================================
// WIZARD DI CONFIGURAZIONE
// ============================================

async function runSetupWizard() {
  console.log(chalk.cyan('\n🚀 OpenFav Migration Wizard v2.0.2'));
  console.log(chalk.gray('Interactive setup for migration.config.json\n'));

  // Domande wizard
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'v4Path',
      message: 'Percorso progetto sorgente (V3/V4):',
      validate: input => existsSync(input) || 'Percorso non esiste',
    },
    {
      type: 'input',
      name: 'v6Path',
      message: 'Percorso progetto destinazione (V6):',
      default: process.cwd(),
      validate: input => existsSync(input) || 'Percorso non esiste',
    },
    {
      type: 'confirm',
      name: 'backup',
      message: 'Attivare backup automatico?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'dryRun',
      message: 'Modalità dry-run di default?',
      default: false,
    },
    {
      type: 'list',
      name: 'format',
      message: 'Formato output token:',
      choices: ['ts', 'js', 'json'],
      default: 'ts',
    },
  ]);

  // Crea configurazione
  const config = {
    version: "2.0.2",
    workspaceRoot: process.cwd(),
    paths: {
      v4: answers.v4Path,
      v6: answers.v6Path,
      v3: '', // Opzionale
    },
    options: {
      createBackup: answers.backup,
      dryRun: answers.dryRun,
      verbose: true,
      outputFormat: answers.format,
    },
    tokenMappings: {},
    componentMappings: {},
  };

  // Salva il file
  mkdirSync(dirname(CONFIG_PATH), { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  
  console.log(chalk.green(`\n✅ Configurazione creata: ${CONFIG_PATH}`));

  // Auto-generazione template token
  console.log(chalk.gray('\n📁 Creating token templates in destination project...'));
  try {
    await createTokenTemplates(config.paths.v6);
    console.log(chalk.green('✅ Token templates created successfully!'));
    console.log(chalk.yellow('\n📋 Next step: Run "npm run hydrate" to migrate tokens\n'));
  } catch (error) {
    console.log(chalk.yellow('⚠️  Could not create templates (files may already exist)'));
  }
}

// ============================================
// COMANDI PRINCIPALI
// ============================================

program
  .name('openfav-migrate')
  .description('OpenFav Migration Pipeline v2.0.3 (Hotfix)')
  .version('2.0.3');

// Comando: init / setup (wizard)
program
  .command('init')
  .alias('setup')
  .description('Create or override migration.config.json with wizard')
  .action(async () => {
    await runSetupWizard();
  });

// Comando: validate
program
  .command('validate')
  .description('Validate migration.config.json')
  .action(async () => {
    try {
      const config = loadConfig();
      console.log(chalk.green('\n✅ Configurazione valida!'));
      console.log(chalk.gray(`   V4: ${config.paths.v4}`));
      console.log(chalk.gray(`   V6: ${config.paths.v6}`));
    } catch (error) {
      console.error(chalk.red('\n❌ Configurazione non valida:'), error.message);
      process.exit(1);
    }
  });

// Comando: seed-templates (HOTFIX - smart template seeding)
program
  .command('seed-templates')
  .description('🌱 Analyze V4 tokens and add missing @inject tags to V6 templates')
  .action(async () => {
    try {
      const config = loadConfig();
      await runSeedTemplates(config);
    } catch (error) {
      console.error(chalk.red('\n❌ Template seeding failed:'), error.message);
      process.exit(1);
    }
  });

// Comando: migrate (HOTFIX - two-pass migration)
program
  .command('migrate')
  .description('🚀 Complete migration V4→V6 (templates + tokens)')
  .option('--from <version>', 'Source version (v3/v4)', 'v4')
  .option('--dry-run', 'Simulate without changes')
  .action(async (options) => {
    try {
      const config = loadConfig();
      const logger = new Logger(true);
      const engine = new MigrationEngine(config, logger);

      console.log(chalk.blue('\n🎯 OpenFav Migration Pipeline v2.0.3'));
      console.log(chalk.gray('Two-pass migration: templates → extract → hydrate\n'));

      const result = await engine.runFullMigration(options.from, 'v6', {
        dryRun: options.dryRun || false
      });

      console.log(chalk.green(`\n✅ Migration completed successfully!`));
      console.log(chalk.gray(`   Changes: ${result.changes}, Warnings: ${result.warnings.length}`));

      if (result.warnings.length > 0) {
        console.log(chalk.yellow('\n⚠️  Warnings:'));
        result.warnings.forEach(warning => console.log(chalk.gray(`   - ${warning}`)));
      }

    } catch (error) {
      console.error(chalk.red('\n❌ Migration failed:'), error.message);
      process.exit(1);
    }
  });

// Comando: hydrate (legacy - single-pass)
program
  .command('hydrate')
  .description('Migrate tokens from V4 to V6')
  .option('--from <version>', 'Source (v3/v4)', 'v4')
  .option('--dry-run', 'Simulate without changes')
  .action(async (options) => {
    try {
      const config = loadConfig();
      const logger = new Logger(true);
      const engine = new TokenEngine(config, logger);
      
      console.log(chalk.blue('\n🚀 Starting migration...\n'));
      const result = await engine.run(options.from, 'v6', { dryRun: options.dryRun || false });
      
      console.log(chalk.green(`\n✅ Completed! Changes: ${result.changes}, Warnings: ${result.warnings.length}`));
      
    } catch (error) {
      console.error(chalk.red('\n❌ Migration failed:'), error.message);
      process.exit(1);
    }
  });

program.parse();
