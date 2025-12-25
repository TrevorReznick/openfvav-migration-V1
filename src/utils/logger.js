import chalk from 'chalk';

export class Logger {
  constructor(verbose = false) {
    this.verbose = verbose;
  }

  info(msg) {
    console.log(chalk.blue(`ℹ️  ${msg}`));
  }

  success(msg) {
    console.log(chalk.green(`✅ ${msg}`));
  }

  warning(msg) {
    console.log(chalk.yellow(`⚠️  ${msg}`));
  }

  error(msg, error = null) {
    console.log(chalk.red(`❌ ${msg}`));
    if (error && this.verbose) {
      console.log(chalk.gray(error.stack));
    }
  }

  debug(msg) {
    if (this.verbose) {
      console.log(chalk.gray(`🐛 ${msg}`));
    }
  }

  report(report) {
    console.log(chalk.cyan('\n📊 Migration Report:'));
    console.log(chalk.gray(`  Changes: ${report.changes || 0}`));
    console.log(chalk.gray(`  Warnings: ${report.warnings?.length || 0}`));
  }
}
