import { readFileSync, writeFileSync, existsSync } from 'fs';
import chalk from 'chalk';

/**
 * Inietta un valore in un file basandosi sul tag @inject:key
 */
export function injectValue(filePath, key, value, dryRun = false) {
  if (!existsSync(filePath)) {
    console.warn(chalk.yellow(`⚠️ File non trovato per iniezione: ${filePath}`));
    return false;
  }
  try {
    let content = readFileSync(filePath, 'utf-8');

    // Pattern migliorato per gestire meglio i casi limite
    const pattern = `(@inject:${key}[^\\n]*\\n[\\s\\S]*?)([\\w-]+\\s*:\\s*['"]?)([^;'",}]+)(['"]?\\s*[;,]?)`;
    const regex = new RegExp(pattern, 'g');

    // Verifica se il pattern esiste nel contenuto
    if (!regex.test(content)) {
      console.warn(chalk.yellow(`⚠️ Tag @inject:${key} non trovato in ${filePath}`));
      return false;
    }
    // Resetta l'ultimo indice della regex
    regex.lastIndex = 0;

    // Esegui la sostituzione
    const updatedContent = content.replace(regex, `$1$2${value}$4`);
    if (!dryRun) {
      writeFileSync(filePath, updatedContent, 'utf-8');
    }

    return true;
  } catch (error) {
    console.error(chalk.red(`❌ Errore durante l'iniezione in ${filePath}:`), error);
    return false;
  }
}
