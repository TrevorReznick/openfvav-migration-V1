#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';

// Moduli core
import { loadConfig } from './core/config-loader.js';
import { MigrationEngine } from './pipeline/migration-engine.js';
import { runSeedTemplates } from './commands/seed-templates.js';
import { createTokenTemplates } from './core/template-generator.js';
import { Logger } from './utils/logger.js';

const CONFIG_PATH = join(process.cwd(), 'migration.config.json');
const program = new Command();

program
  .name('openfav-migrate')
  .description('Professional Design System Migration Tool')
  .version('2.0.3');

// --- WIZARD ---
async function runSetupWizard() {
  console.log(chalk.cyan('\n🚀 OpenFav Migration Wizard v2.0.3'));

  const answers = await inquirer.prompt([
    { type: 'input', name: 'v4', message: 'Percorso Sorgente (V4):', validate: i => existsSync(i) || 'Path errato' },
    { type: 'input', name: 'v6', message: 'Percorso Destinazione (V6):', default: process.cwd() },
    { type: 'confirm', name: 'dryRun', message: 'Dry-run di default?', default: false },
    { type: 'list', name: 'format', message: 'Formato:', choices: ['ts', 'js'], default: 'ts' }
  ]);

  const config = {
    version: "2.0.3",
    paths: { v4: answers.v4, v6: answers.v6 },
    options: { dryRun: answers.dryRun, outputFormat: answers.format, verbose: true }
  };

  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  console.log(chalk.green('✅ Configurazione salvata.'));

  // Generazione automatica Template Spugna
  console.log(chalk.blue('📁 Inizializzazione template in V6...'));
  await createTokenTemplates(config.paths.v6);
}

// --- COMANDI ---
program.command('setup').alias('init').action(runSetupWizard);

program.command('validate').action(() => {
  const config = loadConfig();
  console.log(chalk.green(`✅ Config OK. SRC: ${config.paths.v4}`));
});

program.command('seed-templates').action(async () => {
  const config = loadConfig();
  await runSeedTemplates(config);
});

// IL COMANDO PRINCIPALE
program
  .command('migrate')
  .alias('hydrate')
  .option('--dry-run', 'Simula')
  .action(async (options) => {
    try {
      const config = loadConfig();
      const logger = new Logger(true);
      const engine = new MigrationEngine(config, logger);

      console.log(chalk.blue('\n🎯 Running OpenFav Migration v2.0.3...'));

      const result = await engine.runFullMigration('v4', 'v6', {
        dryRun: options.dryRun || config.options.dryRun
      });

      console.log(chalk.green(`\n✅ Successo! Modifiche: ${result.changes}, Avvisi: ${result.warnings.length}`));
    } catch (e) {
      console.error(chalk.red('❌ Errore:'), e.message);
    }
  });

program.parse();
